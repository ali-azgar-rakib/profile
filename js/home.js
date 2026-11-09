/* Resume homepage — rendered from js/data.js (same data as the game). */
(() => {
'use strict';
const CV = Object.assign({ links: [], about: {}, skills: [], experience: [], projects: [], education: [], achievements: [], contact: {}, roles: [] }, window.CV || {});
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = u => { u = String(u || '').trim(); return /^(javascript|data|vbscript):/i.test(u) ? '' : u; };
const initials = s => String(s || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const CAT = ['#2de2e6', '#ff3cac', '#ffb000', '#7cff4f', '#9d7bff', '#ff6b6b'];
const LV = ['', 'Novice', 'Skilled', 'Proficient', 'Advanced', 'Expert'];
const PROJ_C = ['#7cff4f', '#2de2e6', '#ff3cac', '#ffb000', '#9d7bff'];
const nameParts = String(CV.name).trim().split(/\s+/);
const first = nameParts.slice(0, -1).join(' ') || CV.name, last = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
const tags = list => (list && list.length ? `<ul class="tags">${list.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : '');
const extLink = (u, label) => `<a href="${esc(safeUrl(u))}" target="_blank" rel="noopener">${esc(label)}</a>`;
const WORLDS = [
  { id: 'about', n: 'About', c: '#2de2e6', on: true },
  { id: 'skills', n: 'Skills', c: '#ff3cac', on: CV.skills.length > 0 },
  { id: 'experience', n: 'Experience', c: '#ffb000', on: CV.experience.length > 0 },
  { id: 'projects', n: 'Work', c: '#7cff4f', on: CV.projects.length > 0 },
  { id: 'education', n: 'Education', c: '#9d7bff', on: CV.education.length > 0 },
  { id: 'achievements', n: 'Awards', c: '#ffd23f', on: CV.achievements.length > 0 },
  { id: 'contact', n: 'Contact', c: '#ff6b6b', on: true }
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
  ${head(`WORLD ${wno('about')} · ABOUT`, 'Player <em>profile</em>', '#2de2e6', `In the game this is the <b>Profile terminal</b>. <a href="play.html">PLAY ▸</a>`)}
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
  ${head(`WORLD ${wno('skills')} · SKILLS`, 'Skill <em>tree</em>', '#ff3cac', `${skillCount} abilities. In the game, each one is a crystal to collect.`)}
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
  ${head(`WORLD ${wno('experience')} · EXPERIENCE`, 'Quest <em>log</em>', '#ffb000', 'Newest first. In the game, each role is a building you can walk into.')}
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
  ${head(`WORLD ${wno('projects')} · WORK`, 'The <em>arcade</em>', '#7cff4f', 'Games and systems I have built. Each one is an arcade cabinet in the game.')}
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
  ${head(`WORLD ${wno('education')} · EDUCATION`, 'Academy', '#9d7bff')}
  ${CV.education.map(e => `<article class="edu rv">
    <div><span class="per">${esc(e.period || '')}</span><h3>${esc(e.degree)}</h3><p>${esc(e.school)}${e.location ? ' · ' + esc(e.location) : ''}</p>
    ${(e.details || []).filter(d => !e.gpa || !/cgpa/i.test(d)).map(d => `<p>${esc(d)}</p>`).join('')}</div>
    ${e.gpa ? `<div class="ring" data-p="${(e.gpa / (e.gpaMax || 4)) * 100}"><div><b>${(+e.gpa).toFixed(2)}</b><span>CGPA / ${(+(e.gpaMax || 4)).toFixed(2)}</span></div></div>` : ''}
  </article>`).join('')}
</section>`;

const achievements = !CV.achievements.length ? '' : `
<section class="world wrap" id="achievements">
  ${head(`WORLD ${wno('achievements')} · AWARDS`, 'Trophy <em>hall</em>', '#ffd23f')}
  <div class="perks">${CV.achievements.map(x => `<li><b>${esc(x.year || '★')}</b><span><strong>${esc(x.title)}</strong>${x.detail ? ' — ' + esc(x.detail) : ''}</span></li>`).join('')}</div>
</section>`;

const tel = String(CV.phone || '').replace(/[^+\d]/g, '');
const contact = `
<section class="world wrap" id="contact">
  <div class="contact rv">
    <p class="eyebrow" style="color:#ff6b6b;margin:0"><span class="dot" style="background:#ff6b6b;box-shadow:0 0 10px #ff6b6b"></span>FINAL WORLD · CONTACT</p>
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
const PAL = { H: '#3b2468', P: '#ff3cac', S: '#ffcf9e', E: '#0b0820', J: '#2de2e6', K: '#179ca0', T: '#f3eefe', L: '#4b3fa8', B: '#1b1240' };
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

/* ---------- synthwave background ---------- */
const bg = $('#bg'), g = bg.getContext('2d');
let W, H, dpr;
const stars = Array.from({ length: 150 }, () => ({ x: Math.random(), y: Math.random() * 0.75, s: Math.random() < 0.12 ? 2 : 1, tw: 0.5 + Math.random() * 2.5, p: Math.random() * 6 }));
function size() { dpr = Math.min(devicePixelRatio || 1, 1.5); W = innerWidth; H = innerHeight; bg.width = W * dpr; bg.height = H * dpr; }
size(); addEventListener('resize', size);
function drawBg(now) {
  const t = now / 1000, sc = scrollY;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const hz = H * 0.66; // horizon
  const sky = g.createLinearGradient(0, 0, 0, hz);
  sky.addColorStop(0, '#05031a'); sky.addColorStop(0.6, '#140a35'); sky.addColorStop(1, '#3a1050');
  g.fillStyle = sky; g.fillRect(0, 0, W, hz + 1);
  stars.forEach(s => { g.fillStyle = `rgba(255,255,255,${0.25 + 0.6 * Math.abs(Math.sin(t * s.tw + s.p))})`; g.fillRect(s.x * W, (s.y * hz - sc * 0.05 * s.s) % hz, s.s, s.s); });
  // sun
  const R = Math.min(W, H) * 0.2, cx = W * 0.78, cy = hz - R * 0.25 + Math.min(sc * 0.15, R);
  const halo = g.createRadialGradient(cx, cy, R * 0.5, cx, cy, R * 2.4); halo.addColorStop(0, 'rgba(255,60,172,.28)'); halo.addColorStop(1, 'rgba(255,60,172,0)');
  g.fillStyle = halo; g.fillRect(0, 0, W, hz);
  g.save(); g.beginPath(); g.rect(0, 0, W, hz); g.clip();
  const sg = g.createLinearGradient(0, cy - R, 0, cy + R); sg.addColorStop(0, '#ffe66d'); sg.addColorStop(0.5, '#ff8a5b'); sg.addColorStop(1, '#ff3cac');
  g.fillStyle = sg; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
  g.fillStyle = sky; for (let i = 0; i < 8; i++) g.fillRect(cx - R, cy + R * 0.05 + i * (R * 0.07 + i * R * 0.02), R * 2, 1 + i * 1.3);
  g.restore();
  // mountains silhouette
  g.fillStyle = '#120a2c'; g.beginPath(); g.moveTo(0, hz);
  for (let x = 0; x <= W; x += 40) g.lineTo(x, hz - 18 - Math.abs(Math.sin(x * 0.011) * 46 + Math.sin(x * 0.037) * 16));
  g.lineTo(W, hz); g.fill();
  // floor + perspective grid
  g.fillStyle = '#0a0618'; g.fillRect(0, hz, W, H - hz);
  g.strokeStyle = 'rgba(255,60,172,.55)'; g.lineWidth = 1;
  const off = reduce ? 0 : (t * 0.6) % 1;
  for (let i = 0; i < 18; i++) { const z = (i + off) / 18, y = hz + (H - hz) * Math.pow(z, 2.2); g.globalAlpha = 0.15 + z * 0.75; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  g.globalAlpha = 0.5;
  for (let i = -24; i <= 24; i++) { const x0 = W / 2 + i * 28, x1 = W / 2 + i * 260; g.beginPath(); g.moveTo(x0, hz); g.lineTo(x1, H); g.stroke(); }
  g.globalAlpha = 1;
  g.fillStyle = '#ff3cac'; g.fillRect(0, hz - 1, W, 2);
  // fade for reading below the hero
  const fade = Math.min(0.72, sc / (H * 1.2));
  if (fade > 0) { g.fillStyle = `rgba(10,7,22,${fade})`; g.fillRect(0, 0, W, H); }
  if (!reduce) requestAnimationFrame(drawBg);
}
requestAnimationFrame(drawBg);
if (reduce) addEventListener('scroll', () => requestAnimationFrame(drawBg), { passive: true });
})();

