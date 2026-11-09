/* =====================================================================
   PLAYABLE CV — engine
   You normally don't need to touch this file: edit js/data.js instead.
   Zone names/colours live in ZONE_DEFS below if you want to re-theme.
   ===================================================================== */
(() => {
'use strict';

const CV = Object.assign(
  { name: 'Your Name', title: 'Game Developer', links: [], about: {}, skills: [], experience: [],
    projects: [], education: [], achievements: [], contact: {} },
  window.CV || {}
);

/* ---------------- constants ---------------- */
const PIX = '"Press Start 2P", monospace';
const GROUND = 300;          // y of the floor in world units
const VIEW_H = 360;          // world units visible vertically (min)
const PHYS = { grav: 1500, run: 215, acc: 1900, fric: 2100, jump: 545, djump: 470, maxFall: 900 };
const CAT_COLORS = ['#ff3cac', '#2de2e6', '#ffb000', '#7cff4f', '#9d7bff', '#ffd23f', '#ff6b6b'];
const ZONE_DEFS = [
  { id: 'about',        short: 'About',      name: 'Player Select',  color: '#2de2e6', has: () => true },
  { id: 'skills',       short: 'Skills',     name: 'Skill Caverns',  color: '#ff3cac', has: () => CV.skills.length > 0 },
  { id: 'experience',   short: 'Experience', name: 'Quest Log City', color: '#ffb000', has: () => CV.experience.length > 0 },
  { id: 'projects',     short: 'Projects',   name: 'The Arcade',     color: '#7cff4f', has: () => CV.projects.length > 0 },
  { id: 'education',    short: 'Education',  name: 'Academy Peaks',  color: '#9d7bff', has: () => CV.education.length > 0 },
  { id: 'achievements', short: 'Awards',     name: 'Trophy Hall',    color: '#ffd23f', has: () => CV.achievements.length > 0 },
  { id: 'contact',      short: 'Contact',    name: 'Final Castle',   color: '#ff6b6b', has: () => true },
];

/* ---------------- dom ---------------- */
const $ = s => document.querySelector(s);
const canvas = $('#game'), ctx = canvas.getContext('2d');
const hudEl = $('#hud'), mapEl = $('#map'), bannerEl = $('#banner'), toastEl = $('#toast');
const modalEl = $('#modal'), panelEl = modalEl.querySelector('.panel'), panelBody = $('#panelBody');
const titleEl = $('#title'), endEl = $('#end'), cvEl = $('#cv');

/* ---------------- helpers ---------------- */
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const overlap = (a, b, m = 0) =>
  a.x < b.x + b.w + m && a.x + a.w > b.x - m && a.y < b.y + b.h + m && a.y + a.h > b.y - m;
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = u => { u = String(u || '').trim(); return /^(javascript|data|vbscript):/i.test(u) ? '' : u; };
const initials = s => String(s || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const rgbCache = new Map();
function rgbOf(c) {
  if (Array.isArray(c)) return c;
  if (rgbCache.has(c)) return rgbCache.get(c);
  let h = c.replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&');
  const n = parseInt(h, 16), v = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  rgbCache.set(c, v); return v;
}
const rgba = (c, a) => { const [r, g, b] = rgbOf(c); return `rgba(${r | 0},${g | 0},${b | 0},${a})`; };
const mix = (a, b, t) => { const A = rgbOf(a), B = rgbOf(b); return [lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)]; };
function rng(seed) {
  return () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function ytId(v) {
  v = String(v || '').trim(); if (!v) return '';
  const m = v.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{6,})/); return m ? m[1] : v;
}
const store = {
  get(k, d) { try { const v = localStorage.getItem('playcv:' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('playcv:' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
};
const isTouch = () => document.body.classList.contains('touch');

/* ---------------- audio (tiny synth, no files) ---------------- */
const sfx = (() => {
  let ac = null, muted = store.get('muted', false);
  function ensure() {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* no audio */ } }
    if (ac && ac.state === 'suspended') ac.resume();
  }
  function tone(f, d, type = 'square', vol = 0.05, slide = 0, delay = 0) {
    if (muted || !ac) return;
    const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), t + d);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + 0.03);
  }
  return {
    ensure, get muted() { return muted; },
    toggle() { muted = !muted; store.set('muted', muted); return muted; },
    jump()    { tone(330, 0.12, 'square', 0.04, 320); },
    djump()   { tone(520, 0.13, 'square', 0.04, 420); },
    collect() { tone(880, 0.08, 'square', 0.04); tone(1320, 0.14, 'square', 0.04, 0, 0.07); },
    open()    { tone(660, 0.07, 'triangle', 0.08); tone(990, 0.1, 'triangle', 0.08, 0, 0.06); },
    close()   { tone(560, 0.08, 'triangle', 0.06, -220); },
    stomp()   { tone(220, 0.15, 'sawtooth', 0.05, -160); },
    bump()    { tone(120, 0.14, 'square', 0.05, -50); },
    travel()  { tone(260, 0.3, 'sine', 0.08, 900); },
    win()     { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.2, 'square', 0.04, 0, i * 0.12)); }
  };
})();

/* =====================================================================
   WORLD
   ===================================================================== */
const world = { w: 0, platforms: [], items: [], bugs: [], zones: [], deco: [], spawn: { x: 90, y: 200 } };
let buildZone = null;
const addPlat = (x, y, w, h = 8, oneWay = true, extra = {}) => {
  const p = { x, y, w, h, oneWay, color: buildZone.color, ...extra }; world.platforms.push(p); return p;
};
const addItem = o => {
  o.id = o.id || `${o.kind}-${world.items.length}`; o.seed = world.items.length * 97 + 13; o.zone = buildZone;
  world.items.push(o); return o;
};
const addBug = (minX, maxX) => world.bugs.push({
  x: (minX + maxX) / 2 - 11, y: GROUND - 14, w: 22, h: 14, minX, maxX: maxX - 22,
  vx: (world.bugs.length % 2 ? -1 : 1) * 46, alive: true, dead: 0, phase: world.bugs.length * 1.7
});

const builders = {
  about(z, x0) {
    world.spawn = { x: x0 + 90, y: GROUND - 34 };
    world.deco.push({ kind: 'hero', x: x0 + 440, zone: z });
    world.deco.push({ kind: 'hint', x: x0 + 250, y: 214, text: 'move', zone: z });
    addItem({ kind: 'terminal', open: 'about', label: 'PROFILE', x: x0 + 418, y: GROUND - 56, w: 44, h: 56 });
    addPlat(x0 + 650, 240, 84); addPlat(x0 + 780, 184, 84); addPlat(x0 + 910, 240, 84);
    world.deco.push({ kind: 'hint', x: x0 + 822, y: 140, text: 'jump', zone: z });
    return 1090;
  },
  skills(z, x0) {
    addItem({ kind: 'terminal', open: 'skills', label: 'SKILL TREE', x: x0 + 230, y: GROUND - 56, w: 44, h: 56 });
    world.deco.push({ kind: 'hint', x: x0 + 520, y: 112, text: 'crystals', zone: z });
    let i = 0;
    CV.skills.forEach((cat, ci) => (cat.items || []).forEach(sk => {
      const cx = x0 + 360 + i * 84, tier = [0, 1, 2, 1][i % 4];
      let cy;
      if (tier === 0) cy = GROUND - 48;
      else { const py = tier === 1 ? 238 : 180; addPlat(cx - 36, py, 72); cy = py - 48; }
      addItem({ kind: 'crystal', x: cx - 11, y: cy, w: 22, h: 30, skill: sk, cat: cat.category,
        color: CAT_COLORS[ci % CAT_COLORS.length], label: sk.name });
      i++;
    }));
    return 360 + i * 84 + 170;
  },
  experience(z, x0) {
    const n = CV.experience.length;
    CV.experience.forEach((job, i) => {
      const bx = x0 + 240 + i * 300, bw = 190, bh = [140, 162, 150][i % 3];
      addPlat(bx, GROUND - bh, bw, 8);
      addItem({ kind: 'door', open: 'job', job, label: job.company, x: bx + bw / 2 - 22, y: GROUND - 66, w: 44, h: 66, bx, bw, bh });
      if (i < n - 1) addBug(bx + bw + 12, bx + 300 - 12);
    });
    return 240 + n * 300 + 50;
  },
  projects(z, x0) {
    const n = CV.projects.length;
    CV.projects.forEach((p, i) => {
      const cx = x0 + 250 + i * 240;
      addItem({ kind: 'cabinet', open: 'project', project: p, label: p.title, x: cx, y: GROUND - 104, w: 60, h: 104 });
      if (i < n - 1) { addPlat(cx + 60 + 45, 214, 90); addBug(cx + 60 + 16, cx + 240 - 16); }
    });
    return 250 + n * 240 + 100;
  },
  education(z, x0) {
    const n = CV.education.length;
    CV.education.forEach((ed, i) => {
      const bx = x0 + 240 + i * 300, bw = 130, bh = [176, 196][i % 2];
      addItem({ kind: 'tower', open: 'edu', edu: ed, label: ed.school, x: bx + bw / 2 - 20, y: GROUND - 60, w: 40, h: 60, bx, bw, bh });
      addPlat(bx + bw + 40, 230, 70);
    });
    return 240 + n * 300 + 40;
  },
  achievements(z, x0) {
    CV.achievements.forEach((a, i) => {
      const px = x0 + 250 + i * 190, ph = [40, 64, 88][i % 3];
      addPlat(px, GROUND - ph, 56, ph, false, { kind: 'pedestal', year: a.year });
      addItem({ kind: 'trophy', open: 'award', award: a, label: a.title, x: px + 14, y: GROUND - ph - 34, w: 28, h: 34 });
    });
    return 250 + CV.achievements.length * 190 + 110;
  },
  contact(z, x0) {
    addItem({ kind: 'mailbox', open: 'contact', label: 'CONTACT', x: x0 + 240, y: GROUND - 62, w: 40, h: 62 });
    world.deco.push({ kind: 'castle', x: x0 + 400, zone: z });
    world.flag = addItem({ kind: 'flag', x: x0 + 740, y: GROUND - 160, w: 30, h: 160, label: 'FINISH' });
    return 880;
  }
};

function buildWorld() {
  let x = 0;
  ZONE_DEFS.filter(d => d.has()).forEach((def, i) => {
    const z = { ...def, index: i, x0: x };
    buildZone = z;
    world.zones.push(z);
    world.deco.push({ kind: 'gate', x: x + 28, zone: z });
    z.x1 = x + builders[def.id](z, x);
    x = z.x1;
  });
  world.w = x;
}

/* parallax skyline + stars */
const layers = [
  { p: 0.16, col: '#1c1344', minH: 70, maxH: 165, wMin: 40, wMax: 96, items: [] },
  { p: 0.4,  col: '#130c30', minH: 40, maxH: 120, wMin: 30, wMax: 72, items: [] },
];
const stars = [];
function buildBackdrop() {
  layers.forEach((L, li) => {
    const r = rng(42 + li * 9); let lx = -300; const end = world.w * L.p + 4000;
    while (lx < end) {
      const w = L.wMin + r() * (L.wMax - L.wMin), h = L.minH + r() * (L.maxH - L.minH);
      L.items.push({ x: lx, w, h, seed: r() * 1000, antenna: r() < 0.22 });
      lx += w + r() * 16;
    }
  });
  const r = rng(7);
  for (let i = 0; i < 140; i++) stars.push({ x: r() * 4000, y: r(), s: r() < 0.15 ? 2 : 1, a: 0.4 + r() * 0.6, tw: 0.5 + r() * 2.5, p: r() * 6 });
}

function zoneAt(x) {
  for (const z of world.zones) if (x < z.x1) return z;
  return world.zones[world.zones.length - 1];
}
function zoneColorAt(x) {
  const zs = world.zones;
  for (let i = 0; i < zs.length; i++) {
    const z = zs[i];
    if (x < z.x1 || i === zs.length - 1) {
      const nx = zs[i + 1];
      if (nx && x > z.x1 - 260) return mix(z.color, nx.color, (x - (z.x1 - 260)) / 260);
      return rgbOf(z.color);
    }
  }
  return rgbOf('#2de2e6');
}

/* =====================================================================
   STATE
   ===================================================================== */
const P = { x: 0, y: 0, w: 18, h: 34, vx: 0, vy: 0, face: 1, onGround: true, onOneWay: false,
  jumps: 0, coyote: 0, buffer: 0, inv: 0, drop: 0, stun: 0, anim: 0 };
const cam = { x: 0, y: 0 };
const particles = [];
const held = new Set();
let pressedJump = false, pressedAct = false;
let dpr = 1, S = 1, viewW = 640, viewH = 360, time = 0, playTime = 0;
let state = 'title';            // title | play | end
let modalOpen = false, cvOpen = false, lastFocus = null;
let nearItem = null, hintShown = false, curZone = null, bugsFixed = 0, bumpedOnce = false, fireworkT = 0;
const seenZones = new Set(), found = new Set();
const totals = { skills: 0, found: 0, bugs: 0 };

function resetPlayer(x, y) {
  Object.assign(P, { x, y: y ?? GROUND - P.h, vx: 0, vy: 0, onGround: true, jumps: 0, coyote: 0, buffer: 0, inv: 0, drop: 0, stun: 0 });
}

/* =====================================================================
   PARTICLES
   ===================================================================== */
function burst(x, y, color, n = 10, speed = 140, life = 0.6, size = 3, grav = 300) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = speed * (0.4 + Math.random() * 0.6);
    particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: life * (0.6 + Math.random() * 0.4), max: life, color, size, grav });
  }
}
function dust(x, y, n = 6) {
  for (let i = 0; i < n; i++) particles.push({ x: x + (Math.random() - 0.5) * 14, y: y - 2, vx: (Math.random() - 0.5) * 90, vy: -Math.random() * 50,
    life: 0.35, max: 0.35, color: '#d8d0ff', size: 2, grav: 100 });
}
function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt; if (p.life <= 0) { particles.splice(i, 1); continue; }
    p.vy += p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt;
  }
}

/* =====================================================================
   UPDATE
   ===================================================================== */
function update(dt) {
  const L = held.has('left'), R = held.has('right');
  const dir = P.stun > 0 ? 0 : (R ? 1 : 0) - (L ? 1 : 0);
  if (dir) {
    P.vx += dir * PHYS.acc * dt;
    if (Math.abs(P.vx) > PHYS.run) P.vx = Math.sign(P.vx) * Math.max(PHYS.run, Math.abs(P.vx) - PHYS.fric * dt);
    P.face = dir;
  } else {
    const f = PHYS.fric * dt * (P.onGround ? 1 : 0.45);
    P.vx = Math.abs(P.vx) <= f ? 0 : P.vx - Math.sign(P.vx) * f;
  }

  P.coyote -= dt; P.buffer -= dt; P.inv -= dt; P.drop -= dt; P.stun -= dt;
  if (pressedJump) P.buffer = 0.13;
  if (P.buffer > 0) {
    if (held.has('down') && P.onGround && P.onOneWay) { P.drop = 0.22; P.buffer = 0; P.onGround = false; }
    else if (P.onGround || P.coyote > 0) {
      P.vy = -PHYS.jump; P.onGround = false; P.coyote = 0; P.jumps = 1; P.buffer = 0;
      sfx.jump(); dust(P.x + P.w / 2, P.y + P.h, 5);
    } else if (P.jumps < 2) {
      P.vy = -PHYS.djump; P.jumps = 2; P.buffer = 0; sfx.djump();
      burst(P.x + P.w / 2, P.y + P.h, '#2de2e6', 10, 110, 0.4, 2, 0);
    }
  }
  if (!held.has('jump') && P.vy < -160) P.vy += PHYS.grav * dt * 1.4;   // short hop on release
  P.vy = Math.min(P.vy + PHYS.grav * dt, PHYS.maxFall);

  // --- horizontal
  P.x += P.vx * dt;
  for (const p of world.platforms) {
    if (p.oneWay || !overlap(P, p)) continue;
    P.x = (P.x + P.w / 2 < p.x + p.w / 2) ? p.x - P.w : p.x + p.w; P.vx = 0;
  }
  P.x = clamp(P.x, 0, world.w - P.w);

  // --- vertical
  const prevBottom = P.y + P.h, prevTop = P.y, fallSpeed = P.vy, was = P.onGround;
  P.y += P.vy * dt;
  P.onGround = false; P.onOneWay = false;
  if (P.y + P.h >= GROUND) { P.y = GROUND - P.h; P.vy = 0; P.onGround = true; }
  for (const p of world.platforms) {
    if (P.x + P.w <= p.x || P.x >= p.x + p.w) continue;
    if (p.oneWay) {
      if (P.vy >= 0 && P.drop <= 0 && prevBottom <= p.y + 0.5 && P.y + P.h >= p.y) {
        P.y = p.y - P.h; P.vy = 0; P.onGround = true; P.onOneWay = true;
      }
    } else if (P.y + P.h > p.y && P.y < p.y + p.h) {
      if (prevBottom <= p.y + 0.5) { P.y = p.y - P.h; P.vy = 0; P.onGround = true; }
      else if (prevTop >= p.y + p.h - 0.5) { P.y = p.y + p.h; P.vy = 0; }
    }
  }
  if (P.onGround) { if (!was && fallSpeed > 300) dust(P.x + P.w / 2, P.y + P.h, 7); P.jumps = 0; }
  else if (was && P.jumps === 0) P.coyote = 0.09;
  P.anim += Math.abs(P.vx) * dt * 0.055;

  // --- items
  let near = null, best = 1e9;
  for (const it of world.items) {
    if (it.kind === 'crystal') { if (!it.got && overlap(P, it, 2)) collect(it); continue; }
    if (it.kind === 'flag') { if (overlap(P, it)) finish(); continue; }
    if (it.open && overlap(P, it, 10)) {
      const d = Math.abs(it.x + it.w / 2 - (P.x + P.w / 2));
      if (d < best) { best = d; near = it; }
    }
  }
  nearItem = near;
  if (near && !hintShown) { hintShown = true; toast(isTouch() ? 'TAP  E  TO OPEN' : 'PRESS  E  TO OPEN', near.zone.color); }
  if (pressedAct && near) openItem(near);

  // --- bugs
  for (const b of world.bugs) {
    if (!b.alive || !overlap(P, b)) continue;
    if (P.vy > 0 && P.y + P.h - b.y < 14) {
      b.alive = false; bugsFixed++; P.vy = -400; P.jumps = 1; sfx.stomp();
      burst(b.x + 11, b.y + 7, '#ff4d6d', 14, 160, 0.5, 3, 300);
      toast(`BUG FIXED!  ${bugsFixed}/${totals.bugs}`, '#ff4d6d'); updateCounters();
    } else if (P.inv <= 0) {
      P.vx = (P.x + P.w / 2 < b.x + 11 ? -1 : 1) * 320; P.vy = -260; P.inv = 1; P.stun = 0.25; sfx.bump();
      if (!bumpedOnce) { bumpedOnce = true; toast('OUCH! JUMP ON BUGS TO FIX THEM', '#ff4d6d'); }
    }
  }

  // --- camera
  const target = P.x + P.w / 2 - viewW / 2 + P.face * viewW * 0.12;
  cam.x += (target - cam.x) * Math.min(1, dt * 5);
  cam.x = clamp(cam.x, 0, Math.max(0, world.w - viewW));

  // --- zone tracking
  const z = zoneAt(P.x + P.w / 2);
  if (z !== curZone) {
    curZone = z;
    if (!seenZones.has(z.id)) { seenZones.add(z.id); showBanner(z); }
    updateMap();
  }
}

function updateBugs(dt) {
  for (const b of world.bugs) {
    if (!b.alive) { b.dead += dt; continue; }
    b.x += b.vx * dt; b.phase += dt * 12;
    if (b.x < b.minX) { b.x = b.minX; b.vx *= -1; }
    if (b.x > b.maxX) { b.x = b.maxX; b.vx *= -1; }
  }
}

function collect(it) {
  it.got = true; sfx.collect();
  burst(it.x + 11, it.y + 15, it.color, 16, 170, 0.7, 3, 220);
  const lvl = clamp(+it.skill.level || 0, 0, 5);
  toast(`+ ${it.label.toUpperCase()}  ${'★'.repeat(lvl)}${'☆'.repeat(5 - lvl)}`, it.color);
  updateCounters();
  const got = world.items.filter(i => i.kind === 'crystal' && i.got).length;
  if (got === totals.skills) setTimeout(() => toast('ALL SKILLS COLLECTED!  ◆◆◆', '#ffd23f'), 1500);
}

function travel(i) {
  const z = world.zones[i];
  if (!z || state !== 'play' || modalOpen) return;
  burst(P.x + P.w / 2, P.y + P.h / 2, '#ffffff', 16, 180, 0.5, 2, 0);
  resetPlayer(z.x0 + 72);
  cam.x = clamp(P.x - viewW * 0.35, 0, Math.max(0, world.w - viewW));
  burst(P.x + P.w / 2, P.y + P.h / 2, z.color, 22, 200, 0.7, 3, 0);
  sfx.travel();
  showBanner(z); seenZones.add(z.id);
}

/* =====================================================================
   DRAW
   ===================================================================== */
function font(size) { ctx.font = `${size}px ${PIX}`; }
function fitFont(text, maxW, size) {
  font(size); const w = ctx.measureText(text).width;
  if (w > maxW) { size = Math.max(4, size * maxW / w); font(size); }
  return size;
}
function glow(color, blur) { ctx.shadowColor = color; ctx.shadowBlur = blur * S * dpr; }
function noGlow() { ctx.shadowBlur = 0; }
function radial(x, y, r, color, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(color, a)); g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
function label(it, text, x, y, near) {
  const done = found.has(it.id);
  ctx.textAlign = 'center'; fitFont(text + (done ? ' ✓' : ''), 150, 7);
  ctx.fillStyle = '#000'; ctx.fillText(text + (done ? ' ✓' : ''), x + 1, y + 1);
  ctx.fillStyle = near ? '#fff' : rgba(it.zone.color, 0.9); ctx.fillText(text + (done ? ' ✓' : ''), x, y);
}

function drawSky(W, H) {
  const tint = zoneColorAt(cam.x + viewW / 2);
  const gy = (GROUND - cam.y) * S;
  const g = ctx.createLinearGradient(0, 0, 0, gy);
  g.addColorStop(0, '#05031a');
  g.addColorStop(0.55, rgba(mix('#170b3c', tint, 0.16), 1));
  g.addColorStop(1, rgba(mix('#4a1259', tint, 0.32), 1));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, gy + 2);

  for (const s of stars) {
    const sx = (((s.x - cam.x * S * 0.03) % W) + W) % W, sy = s.y * gy * 0.8;
    ctx.fillStyle = `rgba(255,255,255,${s.a * (0.35 + 0.65 * Math.abs(Math.sin(time * s.tw + s.p)))})`;
    ctx.fillRect(sx, sy, s.s * Math.max(1, S * 0.6), s.s * Math.max(1, S * 0.6));
  }

  // synthwave sun (stripes are painted with the sky gradient so they always match)
  const R = 74 * S, cx = W * 0.72, cy = gy - 30 * S;
  const halo = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 2.2);
  halo.addColorStop(0, 'rgba(255,60,172,.28)'); halo.addColorStop(1, 'rgba(255,60,172,0)');
  ctx.fillStyle = halo; ctx.fillRect(cx - R * 2.2, cy - R * 2.2, R * 4.4, R * 4.4);
  const sg = ctx.createLinearGradient(0, cy - R, 0, cy + R);
  sg.addColorStop(0, '#ffe66d'); sg.addColorStop(0.5, '#ff8a5b'); sg.addColorStop(1, rgba(mix('#ff3cac', tint, 0.3), 1));
  ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = g;
  for (let i = 0; i < 8; i++) {
    const yy = cy + R * 0.08 + i * (6 + i * 1.6) * S;
    ctx.fillRect(cx - R - 2, yy, R * 2 + 4, (1 + i * 0.75) * S);
  }
}

function drawSkyline() {
  const tint = zoneColorAt(cam.x + viewW / 2);
  layers.forEach((L, li) => {
    const off = cam.x * (1 - L.p), l0 = cam.x - off - 120, l1 = cam.x + viewW - off + 120;
    const vis = L.items.filter(b => b.x + b.w > l0 && b.x < l1);
    ctx.fillStyle = L.col;
    for (const b of vis) {
      const x = b.x + off;
      ctx.fillRect(x, GROUND - b.h, b.w, b.h);
      if (b.antenna) ctx.fillRect(x + b.w / 2 - 1, GROUND - b.h - 16, 2, 16);
    }
    ctx.fillStyle = rgba(tint, li ? 0.4 : 0.2);
    for (const b of vis) {
      const x = b.x + off, cols = Math.floor((b.w - 8) / 10), rows = Math.floor((b.h - 14) / 14);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (hash(b.seed + r * 13 + c * 7) > 0.74) ctx.fillRect(x + 6 + c * 10, GROUND - b.h + 10 + r * 14, 4, 6);
      }
    }
    if (li === 0) { // red aircraft lights on antennas
      ctx.fillStyle = `rgba(255,77,109,${0.4 + 0.6 * (Math.sin(time * 3) > 0.6 ? 1 : 0)})`;
      for (const b of vis) if (b.antenna) ctx.fillRect(b.x + off + b.w / 2 - 1.5, GROUND - b.h - 18, 3, 3);
    }
  });
}

function drawGround() {
  const bottom = cam.y + viewH + 2, x0v = cam.x - 4, x1v = cam.x + viewW + 4;
  for (const z of world.zones) {
    const a = Math.max(z.x0, x0v), b = Math.min(z.x1, x1v);
    if (b <= a) continue;
    ctx.fillStyle = '#0a0618'; ctx.fillRect(a, GROUND, b - a, bottom - GROUND);
    ctx.fillStyle = rgba(z.color, 0.16);
    for (let gx = Math.ceil(a / 40) * 40; gx < b; gx += 40) ctx.fillRect(gx, GROUND, 1, bottom - GROUND);
    [10, 24, 42, 66].forEach((d, i) => { ctx.fillStyle = rgba(z.color, 0.22 - i * 0.04); ctx.fillRect(a, GROUND + d, b - a, 1); });
    ctx.fillStyle = rgba(z.color, 0.25); ctx.fillRect(a, GROUND - 2, b - a, 6);
    ctx.fillStyle = z.color; ctx.fillRect(a, GROUND - 1, b - a, 2);
  }
}

function drawPlatform(p) {
  if (p.kind === 'pedestal') {
    ctx.fillStyle = '#1b1240'; ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = rgba(p.color, 0.25); ctx.fillRect(p.x + 5, p.y + 4, 3, p.h - 4); ctx.fillRect(p.x + p.w - 8, p.y + 4, 3, p.h - 4);
    ctx.fillStyle = p.color; ctx.fillRect(p.x - 3, p.y, p.w + 6, 4);
    if (p.year && p.h > 30) {
      ctx.fillStyle = rgba(p.color, 0.16); ctx.fillRect(p.x + 11, p.y + 13, p.w - 22, 13);
      ctx.textAlign = 'center'; ctx.fillStyle = p.color; fitFont(String(p.year), p.w - 26, 5); ctx.fillText(String(p.year), p.x + p.w / 2, p.y + 22);
    }
    return;
  }
  ctx.fillStyle = rgba(p.color, 0.12); ctx.fillRect(p.x, p.y + p.h, p.w, 10);
  ctx.fillStyle = '#170e33'; ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.w, 2);
  ctx.fillStyle = rgba(p.color, 0.4);
  for (let x = p.x + 6; x < p.x + p.w - 4; x += 16) ctx.fillRect(x, p.y + 4, 2, 2);
}

function drawGate(d) {
  const z = d.zone, x = d.x, c = z.color, h = 128, w = 150, top = GROUND - h;
  ctx.fillStyle = '#130b2c'; ctx.fillRect(x, top, 10, h); ctx.fillRect(x + w - 10, top, 10, h);
  ctx.fillStyle = rgba(c, 0.6); ctx.fillRect(x + 8, top, 2, h); ctx.fillRect(x + w - 10, top, 2, h);
  ctx.fillStyle = '#130b2c'; ctx.fillRect(x - 10, top - 32, w + 20, 32);
  ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.strokeRect(x - 10, top - 32, w + 20, 32);
  ctx.textAlign = 'center';
  font(6); ctx.fillStyle = rgba(c, 0.85); ctx.fillText(z.index === 0 ? 'START' : `WORLD ${z.index + 1}`, x + w / 2, top - 20);
  const flick = hash(Math.floor(time * 9) + z.index * 31) > 0.97 ? 0.35 : 1;
  glow(c, 6); ctx.fillStyle = `rgba(255,255,255,${flick})`; fitFont(z.name.toUpperCase(), w + 6, 8);
  ctx.fillText(z.name.toUpperCase(), x + w / 2, top - 7); noGlow();
}

function drawHero(d) {
  const x = d.x, c = d.zone.color;
  ctx.textAlign = 'center';
  glow(c, 14); ctx.fillStyle = '#fff'; fitFont(String(CV.name).toUpperCase(), 560, 22);
  ctx.fillText(String(CV.name).toUpperCase(), x, 96); noGlow();
  ctx.fillStyle = c; fitFont(String(CV.title).toUpperCase(), 520, 9); ctx.fillText(String(CV.title).toUpperCase(), x, 124);
  if (CV.tagline) { ctx.fillStyle = 'rgba(255,255,255,.62)'; fitFont(CV.tagline, 520, 6); ctx.fillText(CV.tagline, x, 148); }
}

const HINTS = {
  move: ['← →  OR  A D  TO MOVE', '◀ ▶  TO MOVE'],
  jump: ['SPACE TO JUMP · AGAIN MID-AIR TO DOUBLE JUMP', '▲ TO JUMP · TAP AGAIN MID-AIR TO DOUBLE JUMP'],
  crystals: ['COLLECT THE SKILL CRYSTALS ◆', 'COLLECT THE SKILL CRYSTALS ◆'],
};
function drawHint(d) {
  const t = HINTS[d.text][isTouch() ? 1 : 0];
  ctx.textAlign = 'center'; fitFont(t, 300, 6);
  ctx.fillStyle = `rgba(255,255,255,${0.55 + 0.25 * Math.sin(time * 3)})`; ctx.fillText(t, d.x, d.y);
}

function drawCastle(d) {
  const x = d.x, c = d.zone.color, body = '#160e34';
  ctx.fillStyle = body;
  ctx.fillRect(x + 56, GROUND - 112, 148, 112);
  for (let k = 0; k < 148; k += 18) ctx.fillRect(x + 56 + k, GROUND - 124, 10, 12);
  [x, x + 204].forEach(tx => {
    ctx.fillStyle = body; ctx.fillRect(tx, GROUND - 172, 56, 172);
    for (let k = 0; k < 56; k += 16) ctx.fillRect(tx + k, GROUND - 184, 9, 12);
    ctx.fillStyle = rgba(c, 0.55 + 0.2 * Math.sin(time * 2 + tx)); ctx.fillRect(tx + 24, GROUND - 140, 8, 16); ctx.fillRect(tx + 24, GROUND - 90, 8, 16);
    ctx.fillStyle = rgba(c, 0.5); ctx.fillRect(tx, GROUND - 172, 2, 172); ctx.fillRect(tx + 54, GROUND - 172, 2, 172);
  });
  // gate
  const gx = x + 104, gw = 52, gt = GROUND - 70;
  ctx.fillStyle = '#05030d'; ctx.beginPath(); ctx.moveTo(gx, GROUND); ctx.lineTo(gx, gt + 26); ctx.arc(gx + gw / 2, gt + 26, gw / 2, Math.PI, 0); ctx.lineTo(gx + gw, GROUND); ctx.fill();
  ctx.fillStyle = rgba(c, 0.45); for (let k = 6; k < gw; k += 10) ctx.fillRect(gx + k, gt + 6, 2, 70 - 6);
  ctx.textAlign = 'center'; glow(c, 8); ctx.fillStyle = c; font(7);
  ctx.fillText('THANKS FOR', x + 130, GROUND - 98); ctx.fillText('PLAYING!', x + 130, GROUND - 86); noGlow();
}

function drawTerminal(it, near) {
  const { x, y } = it, c = it.zone.color;
  if (near) radial(x + 22, y + 20, 60, c, 0.25);
  ctx.fillStyle = '#0f0a24'; ctx.fillRect(x + 18, y + 38, 8, 14); ctx.fillRect(x + 8, y + 51, 28, 5);
  ctx.fillStyle = c; ctx.fillRect(x - 2, y - 2, 48, 42);
  ctx.fillStyle = '#160f33'; ctx.fillRect(x, y, 44, 38);
  ctx.fillStyle = rgba(c, near ? 0.35 : 0.16); ctx.fillRect(x + 4, y + 4, 36, 28);
  ctx.fillStyle = c;
  for (let i = 0; i < 3; i++) ctx.fillRect(x + 8, y + 9 + i * 6, 8 + ((it.seed * (i + 3)) % 20), 2);
  if (Math.floor(time * 2) % 2) ctx.fillRect(x + 8, y + 26, 5, 3);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; for (let i = 0; i < 28; i += 3) ctx.fillRect(x + 4, y + 4 + i, 36, 1);
  label(it, it.label, x + 22, y - 10, near);
}

function diamond(cx, cy) { ctx.beginPath(); ctx.moveTo(cx, cy - 14); ctx.lineTo(cx + 10, cy - 2); ctx.lineTo(cx, cy + 14); ctx.lineTo(cx - 10, cy - 2); ctx.closePath(); }
function drawCrystal(it) {
  const cx = it.x + 11, cy = it.y + 15 + Math.sin(time * 3 + it.seed) * 3, c = it.color;
  if (it.got) { ctx.strokeStyle = rgba(c, 0.25); ctx.lineWidth = 1; diamond(cx, cy); ctx.stroke(); return; }
  radial(cx, cy, 28, c, 0.45);
  ctx.fillStyle = c; diamond(cx, cy); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.moveTo(cx, cy - 14); ctx.lineTo(cx - 10, cy - 2); ctx.lineTo(cx, cy - 2); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.moveTo(cx, cy - 2); ctx.lineTo(cx + 10, cy - 2); ctx.lineTo(cx, cy + 14); ctx.fill();
  if ((time * 1.3 + it.seed) % 3 < 0.25) { ctx.fillStyle = '#fff'; ctx.fillRect(cx + 5, cy - 13, 1, 5); ctx.fillRect(cx + 3, cy - 11, 5, 1); }
  const d = Math.abs(cx - (P.x + P.w / 2));
  if (d < 130) {
    ctx.textAlign = 'center'; fitFont(it.label.toUpperCase(), 120, 6);
    ctx.fillStyle = `rgba(255,255,255,${1 - d / 130})`; ctx.fillText(it.label.toUpperCase(), cx, cy - 22);
  }
}

function drawBuilding(it, near) {
  const { bx, bw, bh } = it, c = it.zone.color, top = GROUND - bh;
  ctx.fillStyle = '#120b29'; ctx.fillRect(bx, top, bw, bh);
  ctx.fillStyle = rgba(c, 0.5); ctx.fillRect(bx, top, 2, bh); ctx.fillRect(bx + bw - 2, top, 2, bh);
  // neon sign
  ctx.fillStyle = '#07051a'; ctx.fillRect(bx + 10, top + 12, bw - 20, 28);
  ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.strokeRect(bx + 10, top + 12, bw - 20, 28);
  const flick = hash(Math.floor(time * 8) + it.seed) > 0.975 ? 0.3 : 1;
  ctx.textAlign = 'center'; glow(c, 8); ctx.fillStyle = rgba(c, flick);
  const name = String(it.label || '').toUpperCase();
  fitFont(name, bw - 34, 9); ctx.fillText(name, bx + bw / 2, top + 30); noGlow();
  ctx.fillStyle = 'rgba(255,255,255,.7)'; fitFont(String(it.job.period || ''), bw - 30, 5); ctx.fillText(String(it.job.period || ''), bx + bw / 2, top + 54);
  // windows
  for (let r = 0; top + 64 + r * 22 < GROUND - 78; r++) for (let k = 0; k < 6; k++) {
    const wx = bx + 16 + k * 28; if (wx + 14 > bx + bw - 12) break;
    const lit = hash(it.seed + r * 7 + k * 3) > 0.42;
    ctx.fillStyle = lit ? rgba(c, 0.45 + 0.15 * Math.sin(time * 1.5 + r + k)) : 'rgba(255,255,255,.05)';
    ctx.fillRect(wx, top + 64 + r * 22, 14, 10);
  }
  // door
  const { x, y, w, h } = it;
  ctx.fillStyle = c; ctx.fillRect(x - 3, y - 3, w + 6, h + 3);
  ctx.fillStyle = near ? rgba(c, 0.55) : '#05030d'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = near ? '#fff' : rgba(c, 0.7); ctx.fillRect(x + w / 2 - 1, y, 2, h); ctx.fillRect(x + w / 2 - 7, y + 36, 3, 4); ctx.fillRect(x + w / 2 + 4, y + 36, 3, 4);
  if (near) radial(x + w / 2, GROUND, 60, c, 0.35);
}

function drawCabinet(it, near) {
  const { x, y } = it, c = it.zone.color;
  if (near) radial(x + 30, y + 40, 80, c, 0.3);
  ctx.fillStyle = '#1a1036'; ctx.fillRect(x, y + 16, 60, 88);
  ctx.fillStyle = rgba(c, 0.6); ctx.fillRect(x, y + 16, 3, 88); ctx.fillRect(x + 57, y + 16, 3, 88);
  ctx.fillStyle = c; ctx.fillRect(x + 2, y, 56, 18);
  ctx.textAlign = 'center'; ctx.fillStyle = '#0b0820'; const t = String(it.label).toUpperCase(); fitFont(t, 48, 6); ctx.fillText(t, x + 30, y + 12);
  // screen: a tiny attract-mode pong
  const sx = x + 7, sy = y + 22, sw = 46, sh = 36, tt = time + it.seed;
  ctx.fillStyle = '#000'; ctx.fillRect(sx, sy, sw, sh);
  ctx.fillStyle = rgba(c, near ? 0.3 : 0.15); ctx.fillRect(sx, sy, sw, sh);
  ctx.fillStyle = c; font(8); ctx.fillText(initials(it.label), sx + sw / 2, sy + 13);
  const tri = (v, L) => Math.abs((v % (2 * L)) - L);
  const bxp = sx + 5 + tri(tt * 34, sw - 10), byp = sy + 18 + tri(tt * 23, sh - 21);
  ctx.fillStyle = '#fff'; ctx.fillRect(bxp - 1, byp - 1, 3, 3);
  ctx.fillRect(sx + 2, clamp(byp - 4, sy + 17, sy + sh - 9), 2, 8); ctx.fillRect(sx + sw - 4, clamp(byp - 4, sy + 17, sy + sh - 9), 2, 8);
  ctx.fillStyle = 'rgba(0,0,0,.3)'; for (let i = 0; i < sh; i += 3) ctx.fillRect(sx, sy + i, sw, 1);
  // controls
  ctx.fillStyle = '#2a1c52'; ctx.fillRect(x + 3, y + 62, 54, 10);
  ctx.fillStyle = '#ff4d6d'; ctx.fillRect(x + 14, y + 58, 4, 7);
  ctx.fillStyle = '#2de2e6'; ctx.fillRect(x + 33, y + 65, 4, 4);
  ctx.fillStyle = '#ffd23f'; ctx.fillRect(x + 41, y + 65, 4, 4);
  ctx.fillStyle = rgba(c, 0.3); ctx.fillRect(x + 24, y + 80, 12, 14);
  ctx.fillStyle = '#000'; ctx.fillRect(x + 29, y + 83, 2, 7);
  if (found.has(it.id)) { ctx.fillStyle = c; font(6); ctx.fillText('✓', x + 30, y + 112); }
}

function drawTower(it, near) {
  const { bx, bw, bh } = it, c = it.zone.color, top = GROUND - bh;
  ctx.fillStyle = '#1d1245'; ctx.beginPath(); ctx.moveTo(bx - 10, top); ctx.lineTo(bx + bw / 2, top - 58); ctx.lineTo(bx + bw + 10, top); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.stroke();
  const fx = bx + bw / 2, fy = top - 58;
  ctx.fillStyle = '#d8d0ff'; ctx.fillRect(fx - 1, fy - 22, 2, 22);
  ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(fx + 1, fy - 22); ctx.lineTo(fx + 16, fy - 18 + Math.sin(time * 4) * 2); ctx.lineTo(fx + 1, fy - 13); ctx.fill();
  ctx.fillStyle = '#140d2e'; ctx.fillRect(bx, top, bw, bh);
  ctx.fillStyle = 'rgba(255,255,255,.035)';
  for (let r = 0; r < bh; r += 12) for (let k = (r / 12) % 2 ? 0 : 12; k < bw; k += 24) ctx.fillRect(bx + k, top + r, 20, 9);
  ctx.fillStyle = rgba(c, 0.5); ctx.fillRect(bx, top, 2, bh); ctx.fillRect(bx + bw - 2, top, 2, bh);
  const wy = top + 32;
  ctx.fillStyle = rgba(c, 0.3 + 0.1 * Math.sin(time * 2)); ctx.beginPath(); ctx.arc(fx, wy, 16, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = c; ctx.fillRect(fx - 1, wy - 16, 2, 32); ctx.fillRect(fx - 16, wy - 1, 32, 2);
  ctx.fillStyle = '#07051a'; ctx.fillRect(bx + 8, top + 58, bw - 16, 30);
  ctx.textAlign = 'center'; glow(c, 6); ctx.fillStyle = '#fff';
  const nm = String(it.label || '').toUpperCase(); fitFont(nm, bw - 22, 7); ctx.fillText(nm, fx, top + 72); noGlow();
  ctx.fillStyle = c; const pr = String(it.edu.period || ''); fitFont(pr, bw - 22, 5); ctx.fillText(pr, fx, top + 83);
  const { x, y, w, h } = it;
  ctx.fillStyle = near ? rgba(c, 0.55) : '#05030d';
  ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + w / 2); ctx.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); ctx.lineTo(x + w, y + h); ctx.fill();
  ctx.strokeStyle = c; ctx.stroke();
  if (near) radial(x + w / 2, GROUND, 60, c, 0.35);
}

function drawTrophy(it, near) {
  const x = it.x, y = it.y + Math.sin(time * 2 + it.seed) * 1.5, c = it.zone.color;
  radial(x + 14, y + 12, near ? 46 : 30, c, near ? 0.5 : 0.3);
  ctx.fillStyle = c;
  ctx.beginPath(); ctx.moveTo(x + 4, y + 2); ctx.lineTo(x + 24, y + 2); ctx.lineTo(x + 21, y + 15);
  ctx.quadraticCurveTo(x + 14, y + 22, x + 7, y + 15); ctx.closePath(); ctx.fill();
  ctx.fillRect(x, y + 4, 4, 2); ctx.fillRect(x, y + 4, 2, 8); ctx.fillRect(x, y + 11, 6, 2);
  ctx.fillRect(x + 24, y + 4, 4, 2); ctx.fillRect(x + 26, y + 4, 2, 8); ctx.fillRect(x + 22, y + 11, 6, 2);
  ctx.fillRect(x + 12, y + 20, 4, 7); ctx.fillRect(x + 8, y + 27, 12, 3);
  ctx.fillStyle = '#9a7400'; ctx.fillRect(x + 6, y + 30, 16, 4);
  ctx.fillStyle = 'rgba(255,255,255,.65)'; ctx.fillRect(x + 8, y + 5, 3, 7);
  if (near || found.has(it.id)) {
    ctx.textAlign = 'center'; const t = String(it.label).toUpperCase(); fitFont(t, 160, 6);
    ctx.fillStyle = near ? '#fff' : rgba(c, 0.7); ctx.fillText(t + (found.has(it.id) ? ' ✓' : ''), x + 14, y - (near ? 32 : 10));
  }
}

function drawMailbox(it, near) {
  const { x, y } = it, c = it.zone.color;
  if (near) radial(x + 20, y + 20, 60, c, 0.3);
  ctx.fillStyle = '#2a1c52'; ctx.fillRect(x + 17, y + 24, 6, 38);
  ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x, y + 26); ctx.lineTo(x, y + 10); ctx.arc(x + 10, y + 10, 10, Math.PI, 1.5 * Math.PI);
  ctx.lineTo(x + 30, y); ctx.arc(x + 30, y + 10, 10, 1.5 * Math.PI, 0); ctx.lineTo(x + 40, y + 26); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#0b0820'; ctx.fillRect(x + 8, y + 12, 22, 3);
  const fy = near ? y - 8 + Math.sin(time * 8) : y + 6;
  ctx.fillStyle = '#ffd23f'; ctx.fillRect(x + 40, fy, 3, 18); ctx.fillRect(x + 43, fy, 9, 6);
  if (near) { // little letter popping out
    const ly = y - 14 + Math.sin(time * 4) * 3;
    ctx.fillStyle = '#fff'; ctx.fillRect(x + 10, ly, 20, 13); ctx.fillStyle = c;
    ctx.beginPath(); ctx.moveTo(x + 10, ly); ctx.lineTo(x + 20, ly + 7); ctx.lineTo(x + 30, ly); ctx.lineTo(x + 30, ly + 2); ctx.lineTo(x + 20, ly + 9); ctx.lineTo(x + 10, ly + 2); ctx.fill();
  }
  label(it, it.label, x + 20, y - (near ? 22 : 10), near);
}

function drawFlag(it) {
  const x = it.x + 12, top = it.y, c = it.zone.color;
  ctx.fillStyle = '#2a1c52'; ctx.fillRect(x - 8, GROUND - 10, 20, 10);
  ctx.fillStyle = '#d8d0ff'; ctx.fillRect(x, top, 4, it.h);
  ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(x + 2, top - 2, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = state === 'end' ? '#7cff4f' : c;
  ctx.beginPath(); ctx.moveTo(x + 4, top + 6);
  for (let i = 0; i <= 10; i++) ctx.lineTo(x + 4 + i * 5, top + 6 + Math.sin(time * 5 - i * 0.6) * 3 * (i / 10));
  for (let i = 10; i >= 0; i--) ctx.lineTo(x + 4 + i * 5, top + 34 + Math.sin(time * 5 - i * 0.6) * 3 * (i / 10));
  ctx.fill();
  ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; font(8); ctx.fillText('★', x + 28, top + 24);
  font(6); ctx.fillStyle = rgba(c, 0.9); ctx.fillText('FINISH', x + 2, GROUND + 18);
}

function drawBug(b) {
  const x = b.x, y = b.y, f = b.vx > 0 ? 1 : -1;
  if (!b.alive) {
    if (b.dead > 0.6) return;
    ctx.globalAlpha = 1 - b.dead / 0.6; ctx.fillStyle = '#ff4d6d'; ctx.fillRect(x, y + 10, 22, 4); ctx.globalAlpha = 1; return;
  }
  const leg = Math.sin(b.phase) * 2;
  ctx.fillStyle = '#2a0f1f';
  for (let i = 0; i < 3; i++) ctx.fillRect(x + 4 + i * 6, y + 10, 2, 4 + (i % 2 ? leg : -leg));
  ctx.fillStyle = '#ff4d6d'; ctx.beginPath(); ctx.ellipse(x + 11, y + 7, 10, 6.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7a1030'; ctx.fillRect(x + 10, y + 1, 2, 12); ctx.fillRect(x + 5, y + 5, 3, 3); ctx.fillRect(x + 14, y + 7, 3, 3);
  ctx.fillStyle = '#2a0f1f'; ctx.beginPath(); ctx.arc(x + 11 + f * 10, y + 7, 4.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillRect(x + 11 + f * 11, y + 5, 2, 2);
  ctx.fillStyle = '#2a0f1f'; ctx.fillRect(x + 11 + f * 12, y, 1, 4); ctx.fillRect(x + 11 + f * 15, y - 1, 1, 4);
}

/* player sprite: 8x12 pixels, 3 world units each */
const PAL = { H: '#3b2468', P: '#ff3cac', S: '#ffcf9e', E: '#0b0820', J: '#2de2e6', K: '#179ca0', T: '#f3eefe', L: '#4b3fa8', B: '#1b1240' };
const BODY = ['..HHHH..', '.HHHHHH.', 'PHSSSSHP', 'PSESSESP', '.SSSSSS.', '..JJJJ..', '.JJTTJJ.', 'SJJTTJJS', 'SJKTTKJS', '.JJJJJJ.'];
const LEGS = { idle: ['.LL..LL.', '.BB..BB.'], a: ['.LL.LL..', '.BB.BB..'], b: ['..LL.LL.', '..BB.BB.'], jump: ['.LL..LL.', 'BB....BB'] };
function drawPlayer() {
  if (P.inv > 0 && Math.floor(time * 16) % 2) return;
  const moving = Math.abs(P.vx) > 20;
  const legs = !P.onGround ? LEGS.jump : moving ? (Math.floor(P.anim) % 2 ? LEGS.a : LEGS.b) : LEGS.idle;
  const blink = (time % 3.7) < 0.12;
  const rows = BODY.concat(legs);
  const ox = Math.round((P.x - 3) * 3) / 3, oy = Math.round((P.y + P.h - 36) * 3) / 3;
  const bob = P.onGround && moving && Math.floor(P.anim) % 2 ? -1 : 0;
  ctx.save(); ctx.translate(ox + (P.face < 0 ? 24 : 0), oy + bob); if (P.face < 0) ctx.scale(-1, 1);
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(3, 36 - bob, 18, 2);
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]; let c = 0;
    while (c < 8) {
      let ch = row[c]; if (ch === '.') { c++; continue; }
      if (blink && ch === 'E') ch = 'S';
      let e = c + 1; while (e < 8 && (row[e] === ch || (blink && ch === 'S' && row[e] === 'E'))) e++;
      ctx.fillStyle = PAL[ch]; ctx.fillRect(c * 3, r * 3, (e - c) * 3 + 0.05, 3.05); c = e;
    }
  }
  ctx.restore();
}

function drawPrompt(it) {
  const cx = it.x + it.w / 2;
  let y = it.y - 30;
  if (it.kind === 'trophy') y = it.y - 14;
  if (it.kind === 'mailbox') y = it.y - 40;
  if (it.kind === 'tower') y = it.y - 8;
  y += Math.sin(time * 6) * 2;
  const t = isTouch() ? 'TAP E' : 'PRESS E';
  font(6); const w = ctx.measureText(t).width + 12;
  ctx.fillStyle = '#000'; ctx.fillRect(cx - w / 2 + 2, y - 10, w, 15);
  ctx.fillStyle = '#fff'; ctx.fillRect(cx - w / 2, y - 12, w, 15);
  ctx.fillStyle = '#0b0820'; ctx.textAlign = 'center'; ctx.fillText(t, cx, y - 2);
}

function draw() {
  const W = canvas.width / dpr, H = canvas.height / dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.textBaseline = 'alphabetic';
  drawSky(W, H);
  ctx.setTransform(dpr * S, 0, 0, dpr * S, -cam.x * dpr * S, -cam.y * dpr * S);
  drawSkyline();
  const v0 = cam.x - 320, v1 = cam.x + viewW + 320;
  for (const d of world.deco) {
    if (d.x < v0 || d.x > v1) continue;
    if (d.kind === 'gate') drawGate(d);
    else if (d.kind === 'hero') drawHero(d);
    else if (d.kind === 'hint') drawHint(d);
    else if (d.kind === 'castle') drawCastle(d);
  }
  const visItems = world.items.filter(it => (it.bx ?? it.x) < v1 && (it.bx ?? it.x) > v0);
  for (const it of visItems) {
    if (it.kind === 'door') drawBuilding(it, it === nearItem);
    else if (it.kind === 'tower') drawTower(it, it === nearItem);
  }
  drawGround();
  for (const p of world.platforms) if (p.x < v1 && p.x + p.w > v0) drawPlatform(p);
  for (const it of visItems) {
    const near = it === nearItem;
    switch (it.kind) {
      case 'terminal': drawTerminal(it, near); break;
      case 'crystal': drawCrystal(it); break;
      case 'cabinet': drawCabinet(it, near); break;
      case 'trophy': drawTrophy(it, near); break;
      case 'mailbox': drawMailbox(it, near); break;
      case 'flag': drawFlag(it); break;
    }
  }
  for (const b of world.bugs) if (b.x > v0 && b.x < v1) drawBug(b);
  drawPlayer();
  for (const p of particles) {
    ctx.globalAlpha = clamp(p.life / p.max, 0, 1); ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;
  if (nearItem && state === 'play' && !modalOpen) drawPrompt(nearItem);
}

/* =====================================================================
   UI: HUD, toasts, panels
   ===================================================================== */
let toastTimer;
function toast(msg, color = '#fff') {
  toastEl.textContent = msg; toastEl.style.setProperty('--c', color);
  toastEl.classList.add('show'); clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1900);
}
function showBanner(z) {
  bannerEl.innerHTML = `<small>${z.index === 0 ? 'START' : 'WORLD ' + (z.index + 1)} · ${esc(z.short.toUpperCase())}</small><strong>${esc(z.name.toUpperCase())}</strong>`;
  bannerEl.style.setProperty('--c', z.color);
  bannerEl.classList.remove('show'); void bannerEl.offsetWidth; bannerEl.classList.add('show');
}
function buildMap() {
  mapEl.innerHTML = world.zones.map((z, i) =>
    `<button type="button" style="--c:${z.color};--w:${Math.round(z.x1 - z.x0)}" data-i="${i}" title="${esc(z.short)} · key ${i + 1}">${esc(z.short)}</button>`
  ).join('') + '<i id="mapDot"></i>';
  mapEl.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    b.blur(); travel(+b.dataset.i); canvas.focus();
  });
}
function updateMap() {
  [...mapEl.querySelectorAll('button')].forEach((b, i) => {
    const z = world.zones[i];
    b.classList.toggle('seen', seenZones.has(z.id));
    b.classList.toggle('here', z === curZone);
  });
}
function updateCounters() {
  const got = world.items.filter(i => i.kind === 'crystal' && i.got).length;
  $('#ctrSkills').innerHTML = `<i style="--c:#ff3cac">◆</i> ${got}/${totals.skills}`;
  $('#ctrFound').innerHTML = `<i style="--c:#ffd23f">★</i> ${found.size}/${totals.found}`;
  $('#ctrBugs').innerHTML = `<i style="--c:#ff4d6d">✖</i> ${bugsFixed}/${totals.bugs}`;
  $('#ctrSkills').hidden = !totals.skills; $('#ctrBugs').hidden = !totals.bugs;
}

/* ---------- panel templates ---------- */
const tags = list => (list && list.length ? `<ul class="tags">${list.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : '');
const bullets = arr => (!arr ? '' : typeof arr === 'string' ? `<p>${esc(arr)}</p>` : arr.length ? `<ul>${arr.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '');
const pips = (lvl, c) => `<span class="pips">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= lvl ? 'on' : ''}"></i>`).join('')}</span>`;
function linkBtns(links, ghost = false) {
  return (links || []).filter(l => l && safeUrl(l.url)).map((l, i) => {
    const u = safeUrl(l.url), ext = /^https?:/i.test(u);
    return `<a class="btn${ghost || i ? ' ghost' : ''}" href="${esc(u)}"${ext ? ' target="_blank" rel="noopener"' : ''}>${esc(l.label || 'Link')}${ext ? ' ↗' : ''}</a>`;
  }).join('');
}
const panels = {
  about() {
    const a = CV.about || {};
    return `<div class="ph"><div class="avatar">${CV.avatar ? `<img src="${esc(safeUrl(CV.avatar))}" alt="${esc(CV.name)}">` : esc(initials(CV.name))}</div>
      <div><p class="kicker">PLAYER 1${a.level ? ' · LVL ' + esc(a.level) : ''}</p><h2 id="panelTitle">${esc(CV.name)}</h2>
      <p class="sub">${esc(CV.title)}${CV.location ? ' · ' + esc(CV.location) : ''}</p></div></div>
      ${a.summary ? `<p>${esc(a.summary)}</p>` : ''}${a.summary2 ? `<p>${esc(a.summary2)}</p>` : ''}
      ${a.stats && a.stats.length ? `<h3>BASE STATS</h3>${a.stats.map(s => `<div class="stat"><span>${esc(s.label)}</span><div class="bar"><i style="--v:${clamp(+s.value || 0, 0, 10) * 10}%"></i></div><b>${esc(s.value)}</b></div>`).join('')}` : ''}
      ${a.perks && a.perks.length ? `<h3>PERKS</h3>${bullets(a.perks)}` : ''}
      <div class="btnrow">${CV.email ? `<a class="btn" href="mailto:${esc(CV.email)}">✉ Email</a>` : ''}${linkBtns(CV.links, true)}</div>`;
  },
  skills() {
    const got = world.items.filter(i => i.kind === 'crystal' && i.got);
    return `<p class="kicker">SKILL TREE</p><h2 id="panelTitle">Abilities</h2>
      <p class="sub">${got.length}/${totals.skills} crystals collected. Walk right to grab the rest ◆</p>
      <div class="skillgrid">${CV.skills.map((c, ci) => `<div class="skillcat" style="--c:${CAT_COLORS[ci % CAT_COLORS.length]}"><h4>${esc(c.category)}</h4>
        ${(c.items || []).map(s => `<div class="skill${got.some(g => g.skill === s) ? ' got' : ''}"><span class="nm">${esc(s.name)}</span>${pips(clamp(+s.level || 0, 0, 5))}</div>`).join('')}</div>`).join('')}</div>`;
  },
  job(it) {
    const j = it.job;
    return `<p class="kicker">QUEST${j.period ? ' · ' + esc(j.period) : ''}</p><h2 id="panelTitle">${esc(j.role)}</h2>
      <p class="sub">${esc(j.company)}${j.location ? ' · ' + esc(j.location) : ''}</p>
      ${j.summary ? `<p>${esc(j.summary)}</p>` : ''}${bullets(j.points)}${tags(j.tech)}
      ${j.links ? `<div class="btnrow">${linkBtns(j.links)}</div>` : ''}`;
  },
  project(it) {
    const p = it.project, vid = ytId(p.video);
    const media = vid
      ? `<div class="media"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(vid)}" title="${esc(p.title)} video" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`
      : p.image ? `<div class="media"><img src="${esc(safeUrl(p.image))}" alt="${esc(p.title)} screenshot" loading="lazy"></div>`
      : `<div class="media"><div class="cover" style="--c:${it.zone.color}">${esc(p.title)}</div></div>`;
    return `${media}<p class="kicker">${esc([p.year, p.role].filter(Boolean).join(' · ') || 'PROJECT')}</p>
      <h2 id="panelTitle">${esc(p.title)}</h2>${p.genre ? `<p class="sub">${esc(p.genre)}</p>` : ''}
      ${p.description ? `<p>${esc(p.description)}</p>` : ''}${bullets(p.highlights)}${tags(p.tech)}
      <div class="btnrow">${linkBtns(p.links)}</div>`;
  },
  edu(it) {
    const e = it.edu;
    return `<p class="kicker">${esc(e.period || 'EDUCATION')}</p><h2 id="panelTitle">${esc(e.degree)}</h2>
      <p class="sub">${esc(e.school)}${e.location ? ' · ' + esc(e.location) : ''}</p>${bullets(e.details)}`;
  },
  award(it) {
    const a = it.award;
    return `<div class="unlock"><span>🏆</span><div><p class="kicker">ACHIEVEMENT UNLOCKED${a.year ? ' · ' + esc(a.year) : ''}</p><h2 id="panelTitle">${esc(a.title)}</h2></div></div>
      ${a.detail ? `<p>${esc(a.detail)}</p>` : ''}${a.link ? `<div class="btnrow">${linkBtns([{ label: 'Details', url: a.link }])}</div>` : ''}`;
  },
  contact() {
    const c = CV.contact || {};
    return `<p class="kicker">FINAL LEVEL</p><h2 id="panelTitle">${esc(c.heading || "Let's make something fun")}</h2>
      ${c.message ? `<p>${esc(c.message)}</p>` : ''}
      <div class="btnrow">${CV.email ? `<a class="btn" href="mailto:${esc(CV.email)}">✉ ${esc(CV.email)}</a>` : ''}
      ${CV.phone ? `<a class="btn ghost" href="tel:${esc(String(CV.phone).replace(/[^+\d]/g, ''))}">☎ ${esc(CV.phone)}</a>` : ''}
      ${CV.resumePdf ? `<a class="btn ghost" href="${esc(safeUrl(CV.resumePdf))}" download>⬇ Download CV (PDF)</a>` : ''}
      <button type="button" class="btn ghost" data-cv>📄 Resume page</button></div>
      ${CV.links.some(l => safeUrl(l.url)) ? `<h3>FIND ME ONLINE</h3><div class="btnrow" style="margin-top:0">${linkBtns(CV.links, true)}</div>` : ''}`;
  },
  help() {
    const rows = [
      ['← → / A D', 'Move'], ['Space / W / ↑', 'Jump — press again mid-air to double jump'], ['↓ + Space', 'Drop through a platform'],
      ['E / Enter', 'Open whatever you are standing at'], [`1 – ${world.zones.length}`, 'Fast travel (or click the map at the top)'],
      ['M', 'Sound on / off'], ['Esc', 'Close a window']
    ];
    return `<p class="kicker">HOW TO PLAY</p><h2 id="panelTitle">Controls</h2>
      <div class="controls-list">${rows.map(([k, v]) => `<kbd>${esc(k)}</kbd><span>${esc(v)}</span>`).join('')}</div>
      <p>Each world is a section of the CV. Stand at a terminal, door, arcade cabinet, tower or trophy and press E to read it. On a phone, use the on-screen buttons.</p>
      <p>Short on time? <button type="button" class="linkbtn" data-cv>Open the resume page</button>.</p>`;
  }
};

function openPanel(html, color) {
  lastFocus = document.activeElement;
  panelBody.innerHTML = html; panelEl.style.setProperty('--accent', color || '#2de2e6');
  panelEl.scrollTop = 0;
  modalEl.hidden = false; modalOpen = true; held.clear();
  sfx.open();
  setTimeout(() => modalEl.querySelector('.x').focus({ preventScroll: true }), 30);
}
function closePanel() {
  if (!modalOpen) return;
  modalEl.hidden = true; modalOpen = false; panelBody.innerHTML = ''; sfx.close();
  (state === 'play' ? canvas : lastFocus || canvas).focus({ preventScroll: true });
}
function openItem(it) {
  if (!found.has(it.id)) { found.add(it.id); updateCounters(); }
  openPanel(panels[it.open](it), it.zone.color);
}
modalEl.addEventListener('click', e => {
  if (e.target.closest('[data-close]')) closePanel();
  else if (e.target.closest('[data-cv]')) { closePanel(); openCV(); }
});

/* ---------- classic CV (recruiter mode + print) ---------- */
function renderCV() {
  const sec = (t, body) => `<section><h2>${t}</h2>${body}</section>`;
  const contacts = [
    CV.location && esc(CV.location),
    CV.email && `<a href="mailto:${esc(CV.email)}">${esc(CV.email)}</a>`,
    ...CV.links.filter(l => safeUrl(l.url)).map(l => `<a href="${esc(safeUrl(l.url))}" target="_blank" rel="noopener">${esc(l.label)}</a>`)
  ].filter(Boolean);
  const here = /^https?:/.test(location.href) ? location.href.split('#')[0] : '';
  cvEl.innerHTML = `
    <div class="cv-bar"><button type="button" class="btn" id="cvBack">▶ Play the game</button>
      <div class="btnrow"><button type="button" class="btn ghost" id="cvPrint">🖨 Print / Save PDF</button>
      ${CV.resumePdf ? `<a class="btn ghost" href="${esc(safeUrl(CV.resumePdf))}" download>⬇ PDF</a>` : ''}</div></div>
    <article class="cv-page">
      <header class="cv-head"><div><h1>${esc(CV.name)}</h1><p class="cv-title">${esc(CV.title)}</p>${CV.tagline ? `<p class="cv-tag">${esc(CV.tagline)}</p>` : ''}</div>
        <ul class="cv-contact">${contacts.map(c => `<li>${c}</li>`).join('')}</ul></header>
      ${CV.about && CV.about.summary ? sec('Profile', `<p>${esc(CV.about.summary)}</p>`) : ''}
      ${CV.experience.length ? sec('Experience', CV.experience.map(j => `<div class="cv-item"><div class="cv-row"><h3>${esc(j.role)} <em>· ${esc(j.company)}</em></h3><span>${esc(j.period || '')}</span></div>
        ${j.location ? `<p class="cv-sub">${esc(j.location)}</p>` : ''}${bullets(j.points)}${j.tech && j.tech.length ? `<p class="cv-tags">${j.tech.map(esc).join(' · ')}</p>` : ''}</div>`).join('')) : ''}
      ${CV.projects.length ? sec('Selected Projects', CV.projects.map(p => `<div class="cv-item"><div class="cv-row"><h3>${esc(p.title)}${p.role ? ` <em>· ${esc(p.role)}</em>` : ''}</h3><span>${esc(p.year || '')}</span></div>
        ${p.description ? `<p>${esc(p.description)}</p>` : ''}${p.tech && p.tech.length ? `<p class="cv-tags">${p.tech.map(esc).join(' · ')}</p>` : ''}
        ${(p.links || []).some(l => safeUrl(l.url)) ? `<p class="cv-links">${p.links.filter(l => safeUrl(l.url)).map(l => `<a href="${esc(safeUrl(l.url))}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}</p>` : ''}</div>`).join('')) : ''}
      ${CV.skills.length ? sec('Skills', `<dl class="cv-skills">${CV.skills.map(c => `<dt>${esc(c.category)}</dt><dd>${(c.items || []).map(s => esc(s.name)).join(', ')}</dd>`).join('')}</dl>`) : ''}
      ${CV.education.length ? sec('Education', CV.education.map(e => `<div class="cv-item"><div class="cv-row"><h3>${esc(e.degree)}</h3><span>${esc(e.period || '')}</span></div>
        <p class="cv-sub">${esc(e.school)}${e.location ? ' · ' + esc(e.location) : ''}</p>${bullets(e.details)}</div>`).join('')) : ''}
      ${CV.achievements.length ? sec('Achievements', `<ul class="cv-awards">${CV.achievements.map(a => `<li><b>${esc(a.title)}</b>${a.detail ? ' — ' + esc(a.detail) : ''}${a.year ? ` <span>(${esc(a.year)})</span>` : ''}</li>`).join('')}</ul>`) : ''}
      ${here ? `<p class="cv-foot">Interactive version: <a href="${esc(here)}">${esc(here)}</a></p>` : ''}
    </article>`;
  $('#cvBack').addEventListener('click', () => { closeCV(); if (state === 'title') startGame(); });
  $('#cvPrint').addEventListener('click', () => window.print());
}
function openCV() {
  location.href = 'index.html';
}
function closeCV() {
  cvEl.hidden = true; cvOpen = false;
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignore */ }
  if (state === 'play') canvas.focus({ preventScroll: true });
}
let cvWasHidden = true;
window.addEventListener('beforeprint', () => { cvWasHidden = cvEl.hidden; if (cvWasHidden) { renderCV(); cvEl.hidden = false; } });
window.addEventListener('afterprint', () => { if (cvWasHidden && !cvOpen) cvEl.hidden = true; });

/* ---------- title / end screens ---------- */
function renderTitle() {
  titleEl.innerHTML = `<div class="screen-inner">
    <p class="eyebrow">A PLAYABLE RÉSUMÉ</p>
    <h1>${esc(CV.name)}</h1>
    <p class="role">${esc(CV.title)}</p>
    ${CV.tagline ? `<p class="tagline">${esc(CV.tagline)}</p>` : '<p class="tagline"></p>'}
    <div class="btnrow">
      <button type="button" class="big" id="btnStart">▶ PRESS START</button>
      <button type="button" class="ghostbig" id="btnQuick">📄 RESUME PAGE<br><small style="font-size:7px;color:var(--muted)">NO TIME TO PLAY? READ IT HERE</small></button>
    </div>
    <div class="keys">
      <span><kbd>←</kbd><kbd>→</kbd> move</span><span><kbd>SPACE</kbd> jump ×2</span><span><kbd>E</kbd> open</span><span><kbd>1</kbd>–<kbd>${world.zones.length}</kbd> fast travel</span>
    </div></div>`;
  $('#btnStart').addEventListener('click', startGame);
  $('#btnQuick').addEventListener('click', openCV);
}

let startZone = 0;
function startGame() {
  sfx.ensure();
  titleEl.hidden = true; hudEl.hidden = false; state = 'play';
  document.body.classList.add('playing');
  const z = world.zones[startZone] || world.zones[0];
  resetPlayer(startZone ? z.x0 + 72 : world.spawn.x);
  cam.x = clamp(P.x - viewW * 0.35, 0, Math.max(0, world.w - viewW));
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  canvas.focus({ preventScroll: true });
  if (isTouch() && innerHeight > innerWidth) setTimeout(() => toast('TIP: ROTATE YOUR PHONE FOR A WIDER VIEW', '#2de2e6'), 2800);
}

function finish() {
  if (state !== 'play') return;
  state = 'end'; document.body.classList.remove('playing'); held.clear(); sfx.win();
  const got = world.items.filter(i => i.kind === 'crystal' && i.got).length;
  const t = Math.floor(playTime), mm = String(Math.floor(t / 60)).padStart(2, '0'), ss = String(t % 60).padStart(2, '0');
  const score = got * 100 + found.size * 250 + bugsFixed * 150 + Math.max(0, 600 - t) * 5;
  const allDone = got === totals.skills && found.size === totals.found;
  endEl.innerHTML = `<div class="screen-inner">
    <p class="eyebrow">${allDone ? '100% COMPLETE' : 'LEVEL CLEAR'}</p>
    <h1>THANKS FOR PLAYING!</h1>
    <p class="score">SCORE ${String(score).padStart(6, '0')}</p>
    <div class="stats">
      <div><b>${mm}:${ss}</b><span>TIME</span></div>
      ${totals.skills ? `<div><b>${got}/${totals.skills}</b><span>SKILLS</span></div>` : ''}
      <div><b>${found.size}/${totals.found}</b><span>DISCOVERED</span></div>
      ${totals.bugs ? `<div><b>${bugsFixed}/${totals.bugs}</b><span>BUGS FIXED</span></div>` : ''}
    </div>
    <p class="tagline" style="margin:0 auto 26px">${allDone ? 'You found everything. Now imagine what I could build for your team.' : 'Some secrets are still out there — or skip straight to saying hi.'}</p>
    <div class="btnrow">
      <button type="button" class="big" id="endContact">✉ CONTACT ME</button>
      <button type="button" class="ghostbig" id="endCV">📄 RESUME PAGE</button>
      <button type="button" class="ghostbig" id="endBack">↺ KEEP EXPLORING</button>
    </div></div>`;
  endEl.hidden = false;
  $('#endContact').addEventListener('click', () => openPanel(panels.contact(), '#ff6b6b'));
  $('#endCV').addEventListener('click', openCV);
  $('#endBack').addEventListener('click', () => {
    endEl.hidden = true; state = 'play'; document.body.classList.add('playing');
    resetPlayer(world.flag.x - 80); canvas.focus({ preventScroll: true });
  });
  setTimeout(() => $('#endContact').focus({ preventScroll: true }), 50);
}

/* =====================================================================
   INPUT
   ===================================================================== */
const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowDown: 'down', KeyS: 'down',
  Space: 'jump', ArrowUp: 'jump', KeyW: 'jump', KeyZ: 'jump', KeyK: 'jump', KeyE: 'act', Enter: 'act', KeyX: 'act', KeyJ: 'act'
};
window.addEventListener('keydown', e => {
  if (e.code === 'Escape') {
    if (modalOpen) { closePanel(); e.preventDefault(); } else if (cvOpen) closeCV();
    return;
  }
  if (modalOpen || cvOpen) return;
  if (state === 'title') {
    if ((e.code === 'Enter' || e.code === 'Space') && !e.target.closest?.('button,a')) { e.preventDefault(); startGame(); }
    return;
  }
  if (state !== 'play') return;
  if (e.target.closest?.('#map button, .hbtn') && (e.code === 'Enter' || e.code === 'Space')) return;
  if (e.code === 'KeyM') { toggleSound(); return; }
  if (e.code === 'KeyH' || e.key === '?') { openPanel(panels.help(), '#2de2e6'); return; }
  if (/^Digit[1-9]$/.test(e.code)) { travel(+e.code.slice(5) - 1); return; }
  const k = KEYMAP[e.code]; if (!k) return;
  e.preventDefault();
  if (!e.repeat) { if (k === 'jump') pressedJump = true; if (k === 'act') pressedAct = true; }
  held.add(k);
});
window.addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) held.delete(k); });
window.addEventListener('blur', () => held.clear());
document.addEventListener('visibilitychange', () => held.clear());

// touch buttons
document.querySelectorAll('#touch button').forEach(btn => {
  const k = btn.dataset.k;
  const down = e => {
    e.preventDefault(); sfx.ensure(); btn.classList.add('on'); held.add(k);
    if (k === 'jump') pressedJump = true; if (k === 'act') pressedAct = true;
    try { btn.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  };
  const up = e => { e.preventDefault(); btn.classList.remove('on'); held.delete(k); };
  btn.addEventListener('pointerdown', down);
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => btn.addEventListener(ev, up));
  btn.addEventListener('contextmenu', e => e.preventDefault());
});
function enableTouch() { document.body.classList.add('touch'); }
if (window.matchMedia && matchMedia('(pointer: coarse)').matches) enableTouch();
window.addEventListener('touchstart', enableTouch, { once: true, passive: true });

// HUD buttons
function toggleSound() {
  const m = sfx.toggle(); $('#btnSound').classList.toggle('off', m);
  toast(m ? 'SOUND OFF' : 'SOUND ON', '#2de2e6');
}
$('#btnSound').addEventListener('click', e => { sfx.ensure(); toggleSound(); e.currentTarget.blur(); canvas.focus(); });
$('#btnHelp').addEventListener('click', e => { e.currentTarget.blur(); openPanel(panels.help(), '#2de2e6'); });
$('#btnCV').addEventListener('click', e => { e.currentTarget.blur(); openCV(); });
canvas.addEventListener('pointerdown', () => { sfx.ensure(); canvas.focus({ preventScroll: true }); });

/* =====================================================================
   LOOP
   ===================================================================== */
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = window.innerWidth, H = window.innerHeight;
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  const portrait = H > W * 1.1;
  S = portrait ? W / 380 : Math.min(H / VIEW_H, W / 480);
  viewW = W / S; viewH = H / S;
  // portrait phones: keep the floor at ~64% of the screen so thumbs don't cover the action
  cam.y = viewH <= VIEW_H ? 0 : portrait ? GROUND - viewH * 0.64 : VIEW_H - viewH;
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000); last = now;
  if (!modalOpen) time += dt;
  if (state === 'play' && !modalOpen && !cvOpen) { update(dt); playTime += dt; }
  else if (state === 'title' && !cvOpen) {
    const span = Math.max(1, world.w - viewW);
    cam.x += 26 * dt; if (cam.x > span) cam.x = 0;
  } else if (state === 'end') {
    fireworkT -= dt;
    if (fireworkT <= 0) {
      fireworkT = 0.45;
      const colors = ['#ff3cac', '#2de2e6', '#ffd23f', '#7cff4f', '#9d7bff'];
      burst(cam.x + viewW * (0.2 + Math.random() * 0.6), 60 + Math.random() * 120, colors[Math.random() * colors.length | 0], 34, 160, 1.2, 2, 120);
    }
  }
  if (!modalOpen) { updateBugs(dt); updateParticles(dt); }
  draw();
  if (state === 'play') {
    const dot = document.getElementById('mapDot');
    if (dot) dot.style.left = `${(P.x + P.w / 2) / world.w * 100}%`;
  }
  pressedJump = pressedAct = false;
  requestAnimationFrame(frame);
}

/* =====================================================================
   BOOT
   ===================================================================== */
function boot() {
  buildWorld(); buildBackdrop();
  totals.skills = world.items.filter(i => i.kind === 'crystal').length;
  totals.found = world.items.filter(i => i.open).length;
  totals.bugs = world.bugs.length;
  document.title = `${CV.name} — ${CV.title} · Playable CV`;
  $('#hudName').textContent = CV.name; $('#hudTitle').textContent = CV.title;
  $('#btnSound').classList.toggle('off', sfx.muted);
  buildMap(); updateCounters(); renderTitle();
  resetPlayer(world.spawn.x);
  if (world.zones[1]) cam.x = world.zones[1].x0;   // title-screen attract mode starts past the intro text
  resize(); window.addEventListener('resize', resize);

  const h = location.hash.replace('#', '').toLowerCase();
  const zi = world.zones.findIndex(z => z.id === h || z.short.toLowerCase() === h);
  if (zi > 0) startZone = zi;
  requestAnimationFrame(t => { last = t; frame(t); });
}

const fontsReady = document.fonts && document.fonts.load ? Promise.race([
  Promise.all([document.fonts.load(`10px ${PIX}`), document.fonts.ready]),
  new Promise(r => setTimeout(r, 2500))
]) : Promise.resolve();
fontsReady.then(boot, boot);
})();
