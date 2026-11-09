/* Resume homepage — rendered from js/data.js (same data as the game). */
(() => {
'use strict';
const CV = Object.assign({ links: [], about: {}, skills: [], experience: [], projects: [], education: [], achievements: [], contact: {}, roles: [] }, window.CV || {});
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = u => { u = String(u || '').trim(); return /^(javascript|data|vbscript):/i.test(u) ? '' : u; };
const initials = s => String(s || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const CAT = ['#6fa3a0', '#b0573a', '#c99a45', '#7e9a5c', '#9a8fb0', '#c4705a'];
const LV = ['', 'Novice', 'Skilled', 'Proficient', 'Advanced', 'Expert'];
const PROJ_C = ['#7e9a5c', '#6fa3a0', '#b0573a', '#c99a45', '#9a8fb0'];
const nameParts = String(CV.name).trim().split(/\s+/);
const first = nameParts.slice(0, -1).join(' ') || CV.name, last = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
const tags = list => (list && list.length ? `<ul class="tags">${list.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : '');
const extLink = (u, label) => `<a href="${esc(safeUrl(u))}" target="_blank" rel="noopener">${esc(label)}</a>`;
const WORLDS = [
  { id: 'about', n: 'About', c: '#6fa3a0', on: true },
  { id: 'skills', n: 'Skills', c: '#b0573a', on: CV.skills.length > 0 },
  { id: 'experience', n: 'Experience', c: '#c99a45', on: CV.experience.length > 0 },
  { id: 'projects', n: 'Work', c: '#7e9a5c', on: CV.projects.length > 0 },
  { id: 'education', n: 'Education', c: '#9a8fb0', on: CV.education.length > 0 },
  { id: 'achievements', n: 'Awards', c: '#d1b25a', on: CV.achievements.length > 0 },
  { id: 'contact', n: 'Contact', c: '#c4705a', on: true }
].filter(w => w.on);
const wno = id => WORLDS.findIndex(w => w.id === id) + 1;
const statBars = st => (st && st.length ? `<div class="bars">${st.map((x, i) => `<div class="bar" style="--c:${CAT[i % CAT.length]}"><span>${esc(x.label)}</span><span class="tr"><i data-v="${Math.max(0, Math.min(10, +x.value || 0)) * 10}"></i></span><b>${esc(x.value)}</b></div>`).join('')}</div>` : '');
const skillCount = CV.skills.reduce((n, c) => n + (c.items || []).length, 0);

/* ---------- brand ---------- */
$('#brandMark').textContent = (first[0] + (last ? last[0] : '')).toUpperCase();
$('#brandName').textContent = CV.name;
document.title = `${CV.name} — ${CV.roles[0] || CV.title}`;

/* ---------- sections ---------- */
const a = CV.about || {};
const hero = `
<section class="hero wrap" id="top">
  <div class="hero-grid">
    <div class="rv">
      <p class="eyebrow"><span class="dot"></span>PLAYER 1 · ${esc(CV.title.toUpperCase())}</p>
      <h1><span>${esc(first)}</span>${last ? `<span class="outline">${esc(last)}</span>` : ''}</h1>
      <p class="typer" aria-label="${esc(CV.roles.join(', ') || CV.title)}"><span id="typed">${esc(CV.roles[0] || CV.title)}</span><span class="caret"></span></p>
      <p class="lead">${esc(a.summary || CV.tagline)}</p>
      <div class="cta">
        <a class="btn primary" href="play.html">▶ Play my CV as a game</a>
        <a class="btn" href="#contact">Hire me</a>
        <button class="btn" type="button" id="printBtn">Save as PDF</button>
        ${CV.resumePdf ? `<a class="btn" href="${esc(safeUrl(CV.resumePdf))}" download>Download CV</a>` : ''}
      </div>
      <div class="facts">
        ${CV.location ? `<span><b>LOC</b>${esc(CV.location)}</span>` : ''}
        ${CV.email ? `<a href="mailto:${esc(CV.email)}"><b>MAIL</b>${esc(CV.email)}</a>` : ''}
        ${CV.links.filter(l => safeUrl(l.url)).map(l => `<a href="${esc(safeUrl(l.url))}" target="_blank" rel="noopener"><b>${esc(l.label.slice(0, 2).toUpperCase())}</b>${esc(l.label)}</a>`).join('')}
      </div>
    </div>
    <aside class="card rv" aria-label="Player card">
      <div class="card-head"><span>PLAYER SELECT</span><span class="lvl">${a.level ? 'LVL ' + esc(a.level) : esc(CV.location ? CV.location.split(',').pop().trim().toUpperCase() : '')}</span></div>
      <div class="stage" id="stage" title="Click me">
        <span class="tip">CLICK TO JUMP</span>
        <canvas id="hero" width="96" height="144" style="width:120px;height:180px" aria-label="Pixel-art character"></canvas>
        <span class="pad"></span>
      </div>
      <div class="plate">
        <div><h3>${esc(last || first)}</h3><p>CLASS: ${esc((CV.roles[0] || CV.title).toUpperCase())}</p></div>
        <div class="yrs"><b>${esc(a.years || '')}</b>YEARS EXP</div>
      </div>
      ${statBars(a.stats) || `<ul class="chips">${CV.skills.map((c, ci) => (c.items || []).map(x => `<li style="--c:${CAT[ci % CAT.length]}">${esc(x.name)}</li>`).join('')).join('')}</ul>`}
      <a class="btn cyan" href="play.html">▶ PRESS START</a>
    </aside>
  </div>
  <div class="strip rv">
    <div><b data-count="${esc(a.years || '')}">${esc(a.years || '—')}</b><span>YEARS OF<br>EXPERIENCE</span></div>
    <div><b data-count="${CV.experience.length}">${CV.experience.length}</b><span>ROLES<br>HELD</span></div>
    <div><b data-count="${skillCount}">${skillCount}</b><span>CORE<br>SKILLS</span></div>
    ${CV.education[0] && CV.education[0].gpa ? `<div><b data-count="${CV.education[0].gpa.toFixed(2)}">${CV.education[0].gpa.toFixed(2)}</b><span>CGPA · DIPLOMA<br>IN COMP. ENGINEERING</span></div>`
      : `<div><b>${CV.projects.length}</b><span>PROJECTS</span></div>`}
  </div>
</section>`;

const head = (k, title, color, side = '') =>
  `<div class="sec-head rv" style="--c:${color}"><div><p class="k">${k}</p><h2>${title}</h2></div>${side ? `<p class="side">${side}</p>` : ''}</div>`;

const about = `
<section class="world wrap" id="about">
  ${head(`WORLD ${wno('about')} · ABOUT`, 'Player <em>profile</em>', '#6fa3a0', `In the game this is the <b>Profile terminal</b>. <a href="play.html">PLAY ▸</a>`)}
  <div class="about">
    <div class="rv">
      ${a.summary ? `<p>${esc(a.summary)}</p>` : ''}
      ${a.summary2 ? `<p>${esc(a.summary2)}</p>` : ''}
      ${a.perks && a.perks.length ? `<ul class="perks">${a.perks.map((p, i) => `<li><b>PERK ${i + 1}</b><span>${esc(p)}</span></li>`).join('')}</ul>` : ''}
    </div>
    <div class="loadout rv">
      <h3>${a.stats && a.stats.length ? 'BASE STATS / 10' : 'LOADOUT'}</h3>
      ${statBars(a.stats) || `<dl class="kit">${CV.skills.map((c, ci) => `<dt style="--c:${CAT[ci % CAT.length]}">${esc(c.category)}</dt><dd>${(c.items || []).map(x => esc(x.name)).join(' · ')}</dd>`).join('')}</dl>`}
    </div>
  </div>
</section>`;

const skills = !CV.skills.length ? '' : `
<section class="world wrap" id="skills">
  ${head(`WORLD ${wno('skills')} · SKILLS`, 'Skill <em>tree</em>', '#b0573a', `${skillCount} abilities. In the game, each one is a crystal to collect.`)}
  <div class="tabs rv" role="group" aria-label="Filter skills">
    <button type="button" aria-pressed="true" data-cat="*">All</button>
    ${CV.skills.map((c, i) => `<button type="button" aria-pressed="false" data-cat="${i}" style="--c:${CAT[i % CAT.length]}">${esc(c.category)}</button>`).join('')}
  </div>
  <div class="skills">
    ${CV.skills.map((c, ci) => (c.items || []).map(s => {
      const lv = Math.max(0, Math.min(5, +s.level || 0));
      return `<div class="skill rv" data-cat="${ci}" style="--c:${CAT[ci % CAT.length]}"><span class="gem"></span><span class="cat">${esc(c.category.toUpperCase())}</span>
        <h3>${esc(s.name)}</h3>${lv ? `<div class="row"><span class="pips">${[1, 2, 3, 4, 5].map(n => `<i class="${n <= lv ? 'on' : ''}"></i>`).join('')}</span><span class="lv">${LV[lv].toUpperCase()}</span></div>` : ''}</div>`;
    }).join('')).join('')}
  </div>
</section>`;

const experience = !CV.experience.length ? '' : `
<section class="world wrap" id="experience">
  ${head(`WORLD ${wno('experience')} · EXPERIENCE`, 'Quest <em>log</em>', '#c99a45', 'Newest first. In the game, each role is a building you can walk into.')}
  <div class="timeline">
    ${CV.experience.map(j => `<article class="job rv${j.current ? ' now' : ''}">
      <div class="when"><b>${esc(j.period)}</b><span>${esc(j.duration || '')}</span></div>
      <span class="node"></span>
      <div class="jcard">
        <p class="mobile-when">${esc(j.period)}${j.duration ? ' · ' + esc(j.duration) : ''}</p>
        <div class="jtop"><div><h3>${esc(j.role)}</h3><p class="co">${esc(j.company)}${j.location ? ` <small>· ${esc(j.location)}</small>` : ''}</p></div>
        ${j.current ? '<span class="badge">ACTIVE QUEST</span>' : ''}</div>
        ${j.points && j.points.length ? `<ul>${j.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
        ${tags(j.tech)}
      </div></article>`).join('')}
  </div>
</section>`;

const projects = !CV.projects.length ? '' : `
<section class="world wrap" id="projects">
  ${head(`WORLD ${wno('projects')} · WORK`, 'The <em>arcade</em>', '#7e9a5c', 'Games and systems I have built. Each one is an arcade cabinet in the game.')}
  <div class="projects">
    ${CV.projects.map((p, i) => { const c = PROJ_C[i % PROJ_C.length]; return `<article class="proj rv" style="--c:${c}">
      <div class="cover">${p.image ? `<img src="${esc(safeUrl(p.image))}" alt="${esc(p.title)} screenshot" loading="lazy">` : `<span class="ini">${esc(initials(p.title))}</span>`}
        ${p.genre ? `<span class="genre">${esc(p.genre.toUpperCase())}</span>` : ''}</div>
      <div class="pbody">
        <span class="meta">${esc([p.year, p.role].filter(Boolean).join(' · ').toUpperCase())}</span>
        <h3>${esc(p.title)}</h3>
        ${p.company ? `<p class="at">${esc(p.company)}</p>` : ''}
        <p>${esc(p.description)}</p>
        ${tags(p.tech)}
        ${(p.links || []).some(l => safeUrl(l.url)) || p.video ? `<div class="plinks">${(p.links || []).filter(l => safeUrl(l.url)).map(l => extLink(l.url, l.label + ' ↗')).join('')}${p.video ? extLink(/^https?:/.test(p.video) ? p.video : 'https://youtu.be/' + p.video, 'Watch video ↗') : ''}</div>` : ''}
      </div></article>`; }).join('')}
  </div>
</section>`;

const education = !CV.education.length ? '' : `
<section class="world wrap" id="education">
  ${head(`WORLD ${wno('education')} · EDUCATION`, 'Academy', '#9a8fb0')}
  ${CV.education.map(e => `<article class="edu rv">
    <div><span class="per">${esc(e.period || '')}</span><h3>${esc(e.degree)}</h3><p>${esc(e.school)}${e.location ? ' · ' + esc(e.location) : ''}</p>
    ${(e.details || []).filter(d => !e.gpa || !/cgpa/i.test(d)).map(d => `<p>${esc(d)}</p>`).join('')}</div>
    ${e.gpa ? `<div class="ring" data-p="${(e.gpa / (e.gpaMax || 4)) * 100}"><div><b>${(+e.gpa).toFixed(2)}</b><span>CGPA / ${(+(e.gpaMax || 4)).toFixed(2)}</span></div></div>` : ''}
  </article>`).join('')}
</section>`;

const achievements = !CV.achievements.length ? '' : `
<section class="world wrap" id="achievements">
  ${head(`WORLD ${wno('achievements')} · AWARDS`, 'Trophy <em>hall</em>', '#d1b25a')}
  <div class="perks">${CV.achievements.map(x => `<li><b>${esc(x.year || '★')}</b><span><strong>${esc(x.title)}</strong>${x.detail ? ' — ' + esc(x.detail) : ''}</span></li>`).join('')}</div>
</section>`;

const tel = String(CV.phone || '').replace(/[^+\d]/g, '');
const contact = `
<section class="world wrap" id="contact">
  <div class="contact rv">
    <p class="eyebrow" style="color:#c4705a;margin:0"><span class="dot" style="background:#c4705a"></span>FINAL WORLD · CONTACT</p>
    <h2>${esc(CV.contact.heading || "Let's work together")}</h2>
    ${CV.contact.message ? `<p class="msg">${esc(CV.contact.message)}</p>` : ''}
    <div class="channels">
      ${CV.email ? `<div class="ch"><span class="ic">@</span><div><small>EMAIL</small><strong><a href="mailto:${esc(CV.email)}" style="color:inherit;text-decoration:none">${esc(CV.email)}</a></strong></div><button type="button" data-copy="${esc(CV.email)}">COPY</button></div>` : ''}
      ${CV.phone ? `<div class="ch"><span class="ic">☎</span><div><small>PHONE</small><strong><a href="tel:${esc(tel)}" style="color:inherit;text-decoration:none">${esc(CV.phone)}</a></strong></div><button type="button" data-copy="${esc(CV.phone)}">COPY</button></div>` : ''}
      ${CV.links.filter(l => safeUrl(l.url)).map(l => `<a class="ch" href="${esc(safeUrl(l.url))}" target="_blank" rel="noopener"><span class="ic">${esc(l.label.slice(0, 2).toUpperCase())}</span><div><small>${esc(l.label.toUpperCase())}</small><strong>${esc(safeUrl(l.url).replace(/^https?:\/\/(www\.)?/, ''))}</strong></div></a>`).join('')}
      ${CV.location ? `<div class="ch"><span class="ic">◉</span><div><small>BASED IN</small><strong>${esc(CV.location)}</strong></div></div>` : ''}
    </div>
  </div>
  <div class="gameband rv">
    <div>
      <h2>▶ This resume is also a game.</h2>
      <p>Run, double-jump and squash bugs through every world above. Same info, more fun. Works on phones too.</p>
      <div class="worlds">${WORLDS.map(w => `<span style="--c:${w.c}">${w.n.toUpperCase()}</span>`).join('')}</div>
    </div>
    <a class="btn primary" href="play.html">▶ Press start</a>
  </div>
  <footer><span>© ${new Date().getFullYear()} ${esc(CV.name)}</span><span>Tip: try the Konami code <kbd>↑↑↓↓←→←→BA</kbd></span></footer>
</section>`;

document.querySelectorAll('.links a').forEach(l => { const id = l.getAttribute('href').slice(1); if (!WORLDS.some(w => w.id === id)) l.remove(); });
$('#app').innerHTML = hero + about + skills + experience + projects + education + achievements + contact;

/* ---------- interactions ---------- */
$('#printBtn').addEventListener('click', () => window.print());

let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1800); }
document.addEventListener('click', e => {
  const b = e.target.closest('[data-copy]'); if (!b) return;
  const v = b.dataset.copy;
  const done = () => { toast('COPIED: ' + v); b.textContent = 'COPIED'; setTimeout(() => (b.textContent = 'COPY'), 1500); };
  if (navigator.clipboard) navigator.clipboard.writeText(v).then(done, () => fallback());
  else fallback();
  function fallback() { const r = document.createRange(); r.selectNodeContents(b.previousElementSibling.querySelector('strong')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast('SELECTED — PRESS CTRL+C'); }
});

// skill filter
document.querySelectorAll('.tabs button').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.tabs button').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
  const c = btn.dataset.cat;
  document.querySelectorAll('.skill').forEach(s => s.classList.toggle('off', c !== '*' && s.dataset.cat !== c));
}));

// typed roles
const roles = CV.roles.length ? CV.roles : [CV.title];
let printing = false;
if (!reduce && roles.length > 1) {
  const el = $('#typed'); let ri = 0, ci = roles[0].length, del = true, wait = 1800;
  (function tick() {
    if (printing) return setTimeout(tick, 400);
    const r = roles[ri];
    if (wait > 0) { wait -= 60; return setTimeout(tick, 60); }
    if (del) { ci--; el.textContent = r.slice(0, ci); if (ci <= 0) { del = false; ri = (ri + 1) % roles.length; } setTimeout(tick, 28); }
    else { const n = roles[ri]; ci++; el.textContent = n.slice(0, ci); if (ci >= n.length) { del = true; wait = 1800; } setTimeout(tick, 55); }
  })();
}

// bars, rings, counters, reveal
function activate(el) {
  el.querySelectorAll('.tr i').forEach(i => (i.style.width = i.dataset.v + '%'));
  el.querySelectorAll('.ring').forEach(r => animateNum(0, +r.dataset.p, 1000, v => r.style.setProperty('--p', v)));
  el.querySelectorAll('[data-count]').forEach(b => {
    const raw = b.dataset.count, m = raw.match(/^([\d.]+)(.*)$/); if (!m || reduce) return;
    const target = parseFloat(m[1]), dec = (m[1].split('.')[1] || '').length;
    animateNum(0, target, 1200, v => (b.textContent = v.toFixed(dec) + m[2]));
  });
}
function animateNum(from, to, ms, set) {
  if (reduce) return set(to);
  const t0 = performance.now();
  (function step(t) { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); set(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); })(t0);
}
const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(en => {
  if (!en.isIntersecting) return; en.target.classList.remove('hide'); activate(en.target); io.unobserve(en.target);
}), { threshold: 0.12 }) : null;
document.querySelectorAll('.rv, .loadout, .edu, .strip').forEach(el => {
  const r = el.getBoundingClientRect();
  if (!io || r.top < innerHeight * 0.92) { activate(el); return; }
  if (!reduce && el.classList.contains('rv')) el.classList.add('hide');
  io.observe(el);
});
window.addEventListener('beforeprint', () => {
  document.querySelectorAll('.rv.hide').forEach(el => { el.classList.remove('hide'); activate(el); });
  printing = true; $('#typed').textContent = roles.join(' · ');
});
window.addEventListener('afterprint', () => { printing = false; });

// scroll progress + scrollspy
const xp = $('#xpBar'), navLinks = [...document.querySelectorAll('.links a')];
function onScroll() {
  const h = document.documentElement, p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
  xp.style.width = (p * 100).toFixed(1) + '%';
  let cur = '';
  navLinks.forEach(l => { const s = document.querySelector(l.getAttribute('href')); if (s && s.getBoundingClientRect().top < 140) cur = l.getAttribute('href'); });
  navLinks.forEach(l => l.classList.toggle('on', l.getAttribute('href') === cur));
}
addEventListener('scroll', onScroll, { passive: true }); onScroll();

// Konami code → game
const K = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']; let kp = 0;
addEventListener('keydown', e => { kp = (e.key === K[kp] || e.key.toLowerCase() === K[kp]) ? kp + 1 : (e.key === K[0] ? 1 : 0); if (kp === K.length) { toast('CHEAT CODE ACCEPTED'); setTimeout(() => (location.href = 'play.html'), 700); } });

/* ---------- hero pixel character (same sprite as the game) ---------- */
const PAL = { H: '#2e2623', P: '#b0573a', S: '#d9b48f', E: '#101414', J: '#6f8a86', K: '#4d6360', T: '#d9d3c3', L: '#3d4746', B: '#1a1f1f' };
const BODY = ['..HHHH..', '.HHHHHH.', 'PHSSSSHP', 'PSESSESP', '.SSSSSS.', '..JJJJ..', '.JJTTJJ.', 'SJJTTJJS', 'SJKTTKJS', '.JJJJJJ.'];
const LEGS = { idle: ['.LL..LL.', '.BB..BB.'], jump: ['.LL..LL.', 'BB....BB'] };
const hc = $('#hero'), hx = hc.getContext('2d'), stage = $('#stage');
let jumpT = -1, t0 = performance.now();
function drawHero(now) {
  const t = (now - t0) / 1000; hx.clearRect(0, 0, 96, 144);
  let y = 0, legs = LEGS.idle;
  if (jumpT >= 0) { const k = (now - jumpT) / 520; if (k >= 1) jumpT = -1; else { y = -Math.sin(k * Math.PI) * 40; legs = LEGS.jump; } }
  else if (!reduce) y = Math.round(Math.sin(t * 2.4)) * 1;
  const blink = (t % 3.7) < 0.12, rows = BODY.concat(legs), px = 12;
  hc.style.transform = `translateY(${y}px)`;
  rows.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === '.') return; if (blink && ch === 'E') ch = 'S';
    hx.fillStyle = PAL[ch]; hx.fillRect(c * px, r * px, px, px);
  }));
  requestAnimationFrame(drawHero);
}
hc.width = 96; hc.height = 144; hc.style.width = '96px'; hc.style.height = '144px';
requestAnimationFrame(drawHero);
stage.addEventListener('click', () => { if (jumpT < 0) jumpT = performance.now(); });

/* ---------- rainy ruins background ---------- */
const bg = $('#bg'), g = bg.getContext('2d');
let W, H, dpr;
function rr(seed) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
const R0 = rr(11);
const ruins = [0.1, 0.3, 0.55].map((p, li) => {
  const items = []; let x = -100;
  while (x < 3600) { const w = 24 + R0() * (90 - li * 20), h = 60 + R0() * (240 - li * 60); items.push({ x, w, h, k: R0(), pipe: R0() < 0.4, lamp: R0() < 0.16, s: R0() * 999 }); x += w + R0() * 40; }
  return { p, items, col: ['#253031', '#1a2223', '#111717'][li] };
});
const drops = Array.from({ length: 220 }, () => ({ x: Math.random(), y: Math.random(), l: 10 + Math.random() * 22, v: 0.9 + Math.random() * 0.6, a: 0.06 + Math.random() * 0.2 }));
const hsh = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
let flash = 0, nextFlash = 5, lastT = performance.now();
function size() { dpr = Math.min(devicePixelRatio || 1, 1.5); W = innerWidth; H = innerHeight; bg.width = W * dpr; bg.height = H * dpr; }
size(); addEventListener('resize', size);
function drawBg(now) {
  const t = now / 1000, dt = Math.min(0.05, (now - lastT) / 1000), sc = scrollY; lastT = now;
  flash = Math.max(0, flash - dt * 2.5); nextFlash -= dt;
  if (!reduce && nextFlash <= 0) { flash = 1; nextFlash = 10 + Math.random() * 16; }
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const hz = H * 0.78;
  const sky = g.createLinearGradient(0, 0, 0, hz);
  sky.addColorStop(0, '#0a0e0f'); sky.addColorStop(0.55, '#1a2324'); sky.addColorStop(1, '#36423f');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  // drifting cloud bands
  for (let i = 0; i < 5; i++) {
    const y = hz * (0.06 + i * 0.12), off = ((t * (5 + i * 2)) % (W + 700)) - 350;
    g.fillStyle = `rgba(${i % 2 ? '60,70,69' : '42,51,51'},${0.32 - i * 0.04})`;
    for (let k = -1; k < 3; k++) { g.beginPath(); g.ellipse(off + k * (W / 2 + 220), y, W * 0.34, 30, 0, 0, Math.PI * 2); g.fill(); }
  }
  if (flash > 0) { g.fillStyle = `rgba(205,214,210,${flash * 0.3})`; g.fillRect(0, 0, W, hz); }
  // ruin silhouettes in three depths
  ruins.forEach((L, li) => {
    const off = -(sc * L.p * 0.35) % 3600, base = hz + li * 26;
    const col = flash > 0 ? `rgb(${[37, 26, 17][li] + flash * 30},${[48, 34, 23][li] + flash * 30},${[49, 35, 23][li] + flash * 30})` : L.col;
    g.fillStyle = col; g.strokeStyle = col; g.lineWidth = 1.5;
    for (const b of L.items) {
      for (const rep of [0, 3600]) {
        const x = b.x + off + rep; if (x > W + 60 || x + b.w < -60) continue;
        const top = base - b.h;
        if (b.k < 0.3) { g.fillRect(x + b.w * 0.3, top - 40, b.w * 0.22, 40); g.fillRect(x, top + 30, b.w, b.h); }
        else if (b.k < 0.5) { g.fillRect(x, top + 18, b.w, b.h); g.beginPath(); g.ellipse(x + b.w / 2, top + 18, b.w / 2, 16, 0, Math.PI, 0); g.fill(); }
        else { g.fillRect(x, top, b.w, b.h + 40); for (let k = 0; k < b.w; k += 9) if (hsh(b.s + k) > 0.5) g.fillRect(x + k, top - 5 - hsh(b.s * 3 + k) * 9, 5, 9); }
        if (b.pipe) { g.fillRect(x - 26, top + b.h * 0.35, b.w + 52, 5); }
        if (hsh(b.s * 7) > 0.55) { g.beginPath(); g.moveTo(x + b.w, top + 12); g.quadraticCurveTo(x + b.w + 22, top + 42 + Math.sin(t + b.s) * 2, x + b.w + 44, top + 18); g.stroke(); }
      }
    }
    for (const b of L.items) {
      if (!b.lamp) continue;
      for (const rep of [0, 3600]) {
        const x = b.x + off + rep + b.w / 2, y = base - b.h + 26; if (x < -40 || x > W + 40) continue;
        const on = hsh(Math.floor(t * 4) + b.s) > 0.05, rg = g.createRadialGradient(x, y, 0, x, y, 34);
        rg.addColorStop(0, `rgba(217,164,65,${on ? 0.28 : 0.05})`); rg.addColorStop(1, 'rgba(217,164,65,0)');
        g.fillStyle = rg; g.fillRect(x - 34, y - 34, 68, 68);
        g.fillStyle = on ? 'rgba(233,190,104,.9)' : 'rgba(120,100,60,.5)'; g.fillRect(x - 1.5, y - 1.5, 3, 3);
      }
    }
    const fog = g.createLinearGradient(0, base - 200, 0, base + 40);
    fog.addColorStop(0, 'rgba(60,72,70,0)'); fog.addColorStop(1, `rgba(60,72,70,${0.4 - li * 0.08})`);
    g.fillStyle = fog; g.fillRect(0, base - 200, W, 240);
  });
  g.fillStyle = '#0f1414'; g.fillRect(0, hz + 52, W, H);
  // rain
  g.strokeStyle = 'rgb(190,205,200)'; g.lineWidth = 1;
  for (const d of drops) {
    const y = ((d.y * H + (reduce ? 0 : t * H * 1.3 * d.v)) % (H + 60)) - 30, x = ((d.x * (W + 200) - y * 0.18) % (W + 200) + W + 200) % (W + 200) - 100;
    g.globalAlpha = d.a; g.beginPath(); g.moveTo(x, y); g.lineTo(x - d.l * 0.09, y - d.l * 0.5); g.stroke();
  }
  g.globalAlpha = 1;
  const fade = Math.min(0.6, sc / (H * 1.4));
  if (fade > 0) { g.fillStyle = `rgba(13,17,18,${fade})`; g.fillRect(0, 0, W, H); }
  if (!reduce) requestAnimationFrame(drawBg);
}
requestAnimationFrame(drawBg);
if (reduce) addEventListener('scroll', () => requestAnimationFrame(drawBg), { passive: true });
})();

