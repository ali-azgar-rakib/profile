/* Resume homepage — rendered from js/data.js (the same data the 3D game uses). */
(() => {
'use strict';
const CV = Object.assign({ links: [], about: {}, skills: [], experience: [], projects: [], education: [], achievements: [], contact: {}, roles: [] }, window.CV || {});
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = u => { u = String(u || '').trim(); return /^(javascript|data|vbscript):/i.test(u) ? '' : u; };
const words = String(CV.name).trim().split(/\s+/);
const initials = ((words[0] || '?')[0] + (words.length > 1 ? words[words.length - 1][0] : '')).toUpperCase();
const roles = CV.roles && CV.roles.length ? CV.roles : [CV.title];
const skillCount = CV.skills.reduce((n, c) => n + (c.items || []).length, 0);
const ICON = {
  pin: '<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  mail: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6 8.5 7 8.5-7"/></svg>',
  link: '<svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
  in: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/></svg>',
  gh: '<svg viewBox="0 0 24 24"><path d="M9 19c-4 1.3-4-2-6-2.5M15 21v-3.5a3 3 0 0 0-.9-2.3c3-.3 6-1.5 6-6.5a5 5 0 0 0-1.4-3.5 4.6 4.6 0 0 0-.1-3.5s-1.1-.3-3.6 1.4a12.4 12.4 0 0 0-6.5 0C6 1.4 4.9 1.7 4.9 1.7a4.6 4.6 0 0 0-.1 3.5A5 5 0 0 0 3.4 8.7c0 5 3 6.2 6 6.5a3 3 0 0 0-.9 2.3V21"/></svg>'
};
const linkIcon = l => /linkedin/i.test(l.label + l.url) ? ICON.in : /github/i.test(l.label + l.url) ? ICON.gh : ICON.link;
const links = CV.links.filter(l => safeUrl(l.url));
const tags = list => (list && list.length ? `<ul class="tags">${list.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : '');
const section = (id, k, title, body) => `<section class="section" id="${id}"><div class="wrap sec-grid"><div class="sec-label"><p class="k">${k}</p><h2>${title}</h2></div><div class="sec-body">${body}</div></div></section>`;

/* ---------- hero ---------- */
$('#brandMark').textContent = initials;
$('#brandName').textContent = CV.name;
document.title = `${CV.name} — ${roles[roles.length - 1]}`;
const a = CV.about || {};
const edu0 = CV.education[0];
const factList = [
  a.years && [a.years, 'years of experience'],
  [String(CV.experience.length), CV.experience.length === 1 ? 'role' : 'roles'],
  [String(skillCount), 'core skills'],
  edu0 && edu0.gpa ? [(+edu0.gpa).toFixed(2), `CGPA, ${edu0.degree.replace(/^Diploma in /i, 'Diploma · ')}`] : null
].filter(Boolean);

const hero = `
<section class="hero" id="top">
  <div class="wrap">
    <div class="hero-grid">
      <div>
        <span class="status"><i></i>${esc(roles[0])}${a.years ? ` · ${esc(a.years)} years` : ''}</span>
        <h1>${esc(CV.name)}</h1>
        <p class="role">${esc(roles[roles.length - 1])}${CV.location ? ` <span style="color:var(--muted);font-weight:500">in ${esc(CV.location.split(',').pop().trim())}</span>` : ''}</p>
        <p class="lead">${esc(a.summary || CV.tagline)}</p>
        <div class="actions">
          <a class="btn btn-primary" href="#contact">Get in touch</a>
          <a class="btn btn-play" href="play.html"><span aria-hidden="true">▶</span> Play my CV in 3D</a>
          <button class="btn" type="button" id="printBtn">Save as PDF</button>
          ${CV.resumePdf ? `<a class="btn" href="${esc(safeUrl(CV.resumePdf))}" download>Download CV</a>` : ''}
        </div>
        <ul class="meta">
          ${CV.location ? `<li>${ICON.pin}${esc(CV.location)}</li>` : ''}
          ${CV.email ? `<li>${ICON.mail}<a href="mailto:${esc(CV.email)}">${esc(CV.email)}</a></li>` : ''}
          ${links.map(l => `<li>${linkIcon(l)}<a href="${esc(safeUrl(l.url))}" target="_blank" rel="noopener">${esc(l.label)}</a></li>`).join('')}
        </ul>
      </div>
      <a class="preview" href="play.html" aria-label="Play the 3D version of this CV">
        <div class="shot"><img src="assets/game-preview.jpg" alt="Screenshot of the 3D village game" width="1200" height="675"><span class="playdot" aria-hidden="true"></span></div>
        <div class="cap"><b>This CV is also a 3D game</b><span>Explore a village and tag the villagers and animals to read each part of my CV. Works on desktop and phones.</span></div>
      </a>
    </div>
    <div class="facts">${factList.map(([n, l]) => `<div><b>${esc(n)}</b><span>${esc(l)}</span></div>`).join('')}</div>
  </div>
</section>`;

/* ---------- sections ---------- */
const about = section('about', 'Profile', 'About me', `<div class="about">${a.summary ? `<p>${esc(a.summary)}</p>` : ''}${a.summary2 ? `<p>${esc(a.summary2)}</p>` : ''}</div>`);

const skills = !CV.skills.length ? '' : section('skills', 'Toolkit', 'Skills', `<div class="skillgroups">${CV.skills.map((c, i) =>
  `<div class="sg${i === 0 ? ' core' : ''}"><h3>${esc(c.category)}</h3><ul class="chips">${(c.items || []).map(s => `<li>${esc(s.name)}</li>`).join('')}</ul></div>`).join('')}</div>`);

const experience = !CV.experience.length ? '' : section('experience', 'Career', 'Experience', `<div class="jobs">${CV.experience.map(j => `
  <article class="job${j.current ? ' now' : ''}">
    <div class="job-top">
      <div><h3>${esc(j.role)}${j.current ? '<span class="badge">Current</span>' : ''}</h3>
      <p class="co">${esc(j.company)}${j.location ? ` <span>· ${esc(j.location)}</span>` : ''}</p></div>
      <span class="when">${esc(j.period || '')}${j.duration ? ` · ${esc(j.duration)}` : ''}</span>
    </div>
    ${j.points && j.points.length ? `<ul>${j.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
    ${tags(j.tech)}
  </article>`).join('')}</div>`);

const projects = !CV.projects.length ? '' : section('projects', 'Selected work', 'Projects', `<div class="projects">${CV.projects.map(p => `
  <article class="proj">${p.image ? `<img src="${esc(safeUrl(p.image))}" alt="${esc(p.title)} screenshot" loading="lazy">` : ''}
    <div class="pb"><p class="meta2">${esc([p.year, p.role, p.genre].filter(Boolean).join(' · '))}</p><h3>${esc(p.title)}</h3>
    ${p.description ? `<p>${esc(p.description)}</p>` : ''}${tags(p.tech)}
    ${(p.links || []).some(l => safeUrl(l.url)) || p.video ? `<div class="links">${(p.links || []).filter(l => safeUrl(l.url)).map(l => `<a href="${esc(safeUrl(l.url))}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join('')}${p.video ? `<a href="${esc(/^https?:/.test(p.video) ? p.video : 'https://youtu.be/' + p.video)}" target="_blank" rel="noopener">Watch video ↗</a>` : ''}</div>` : ''}</div>
  </article>`).join('')}</div>`);

const education = !CV.education.length ? '' : section('education', 'Study', 'Education', CV.education.map(e => `
  <article class="edu"><div><h3>${esc(e.degree)}</h3><p class="school">${esc(e.school)}${e.location ? ' · ' + esc(e.location) : ''}</p><span class="when">${esc(e.period || '')}</span>
    ${(e.details || []).filter(d => !e.gpa || !/cgpa/i.test(d)).map(d => `<p class="school">${esc(d)}</p>`).join('')}</div>
    ${e.gpa ? `<div class="gpa"><b>${(+e.gpa).toFixed(2)}</b><span>CGPA out of ${(+(e.gpaMax || 4)).toFixed(2)}</span></div>` : ''}
  </article>`).join('<div style="height:12px"></div>'));

const achievements = !CV.achievements.length ? '' : section('achievements', 'Highlights', 'Achievements',
  `<ul class="awards">${CV.achievements.map(x => `<li><b>${esc(x.title)}</b>${x.year ? ` <span>· ${esc(x.year)}</span>` : ''}${x.detail ? `<br><span>${esc(x.detail)}</span>` : ''}</li>`).join('')}</ul>`);

const c = CV.contact || {};
const contact = section('contact', 'Say hello', 'Contact', `
  <p class="contact-lead">${esc(c.heading && c.heading !== 'Contact' ? c.heading : "Let's build something together.")}</p>
  <p class="contact-sub">${esc(c.message || 'I am open to Unreal Engine and gameplay programming roles. The quickest way to reach me is email.')}</p>
  <div class="channels">
    ${CV.email ? `<div class="ch"><span class="ic">${ICON.mail}</span><div><small>Email</small><strong><a href="mailto:${esc(CV.email)}" style="color:inherit;text-decoration:none">${esc(CV.email)}</a></strong></div><button class="copy" type="button" data-copy="${esc(CV.email)}">Copy</button></div>` : ''}
    ${links.map(l => `<a class="ch" href="${esc(safeUrl(l.url))}" target="_blank" rel="noopener"><span class="ic">${linkIcon(l)}</span><div><small>${esc(l.label)}</small><strong>${esc(safeUrl(l.url).replace(/^https?:\/\/(www\.)?/, ''))}</strong></div></a>`).join('')}
    ${CV.location ? `<div class="ch"><span class="ic">${ICON.pin}</span><div><small>Based in</small><strong>${esc(CV.location)}</strong></div></div>` : ''}
  </div>`);

const characters = 2 + CV.skills.length + CV.experience.length + CV.projects.length + CV.education.length + CV.achievements.length;
const band = `
<div class="wrap" style="padding-block:8px 0">
  <div class="gameband">
    <img src="assets/game-preview.jpg" alt="The 3D village from the CV game" loading="lazy" width="1200" height="675">
    <div class="gb">
      <h2>Prefer to explore? Play this CV.</h2>
      <p>The same information as this page, built as a small 3D game in the browser.</p>
      <ul><li>Walk around a village with a river, forest and changing weather</li><li>${characters} characters each carry one part of my CV</li><li>Tag them with the blaster to read it. Nobody gets hurt.</li></ul>
      <a class="btn btn-play" href="play.html"><span aria-hidden="true">▶</span> Start the game</a>
    </div>
  </div>
</div>
<div class="wrap"><footer><span>© ${new Date().getFullYear()} ${esc(CV.name)}</span><span><a href="#top">Back to top ↑</a></span></footer></div>`;

$('#main').innerHTML = hero + about + skills + experience + projects + education + achievements + contact + band;

/* hide nav links for sections that don't exist */
document.querySelectorAll('.nav a').forEach(l => { if (!document.querySelector(l.getAttribute('href'))) l.remove(); });

/* ---------- interactions ---------- */
$('#printBtn').addEventListener('click', () => window.print());
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1800); }
document.addEventListener('click', e => {
  const b = e.target.closest('[data-copy]'); if (!b) return;
  const v = b.dataset.copy;
  const done = () => { toast('Copied ' + v); b.textContent = 'Copied'; setTimeout(() => (b.textContent = 'Copy'), 1500); };
  const fallback = () => { const r = document.createRange(); r.selectNodeContents(b.parentElement.querySelector('strong')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast('Selected. Press Ctrl+C to copy'); };
  if (navigator.clipboard) navigator.clipboard.writeText(v).then(done, fallback); else fallback();
});

/* highlight the current section in the nav */
const navLinks = [...document.querySelectorAll('.nav a')];
function spy() {
  let cur = '';
  navLinks.forEach(l => { const s = document.querySelector(l.getAttribute('href')); if (s && s.getBoundingClientRect().top < 140) cur = l.getAttribute('href'); });
  navLinks.forEach(l => l.classList.toggle('on', l.getAttribute('href') === cur));
}
addEventListener('scroll', spy, { passive: true }); spy();

/* Konami code opens the game */
const K = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']; let kp = 0;
addEventListener('keydown', e => { kp = (e.key === K[kp] || e.key.toLowerCase() === K[kp]) ? kp + 1 : (e.key === K[0] ? 1 : 0); if (kp === K.length) { toast('Cheat code accepted'); setTimeout(() => (location.href = 'play.html'), 700); } });
})();
