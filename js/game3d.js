/* =====================================================================
   3D PLAYABLE CV — open-world village tag-shooter (Three.js)
   Content comes from js/data.js. Every character carries an item that
   stands for one part of the CV; tag them with the blaster to read it.
   ===================================================================== */
import * as THREE from './vendor/three.module.min.js';

const CV = Object.assign({ name: 'Your Name', title: '', roles: [], links: [], about: {}, skills: [], experience: [],
  projects: [], education: [], achievements: [], contact: {} }, window.CV || {});

/* ---------------- helpers ---------------- */
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = u => { u = String(u || '').trim(); return /^(javascript|data|vbscript):/i.test(u) ? '' : u; };
const initials = s => String(s || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
function rng(seed) { return () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const R = rng(20251109);
const store = {
  get(k, d) { try { const v = localStorage.getItem('playcv3d:' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('playcv3d:' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
};
const isTouch = (window.matchMedia && matchMedia('(pointer: coarse)').matches) || ('ontouchstart' in window && navigator.maxTouchPoints > 0);
if (isTouch) document.body.classList.add('touch');
const ACCENT = { about: '#6fa3a0', skills: '#c99a45', job: '#b0573a', edu: '#9a8fb0', contact: '#c4705a', project: '#7e9a5c', award: '#d1b25a' };

/* ---------------- audio (synthesised, no files) ---------------- */
const audio = (() => {
  let ac = null, master = null, rainGain = null, muted = store.get('muted', false);
  function noiseBuf(sec) { const n = ac.sampleRate * sec, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return b; }
  function ensure() {
    if (!ac) {
      try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
      master = ac.createGain(); master.gain.value = muted ? 0 : 0.9; master.connect(ac.destination);
      const src = ac.createBufferSource(), f = ac.createBiquadFilter(); src.buffer = noiseBuf(2); src.loop = true;
      f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 0.5; rainGain = ac.createGain(); rainGain.gain.value = 0;
      src.connect(f).connect(rainGain).connect(master); src.start();
    }
    if (ac.state === 'suspended') ac.resume();
  }
  function tone(f, d, type = 'square', vol = 0.05, slide = 0, delay = 0) {
    if (!ac) return; const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), t + d);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g).connect(master); o.start(t); o.stop(t + d + 0.05);
  }
  function noise(d, freq, vol, type = 'lowpass') {
    if (!ac) return; const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), t = ac.currentTime;
    s.buffer = noiseBuf(d); f.type = type; f.frequency.value = freq; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f).connect(g).connect(master); s.start();
  }
  return {
    ensure, get muted() { return muted; },
    toggle() { muted = !muted; store.set('muted', muted); if (master) master.gain.value = muted ? 0 : 0.9; return muted; },
    shot() { tone(980, 0.12, 'square', 0.035, -640); noise(0.08, 3000, 0.06, 'highpass'); },
    hit() { [784, 988, 1319].forEach((f, i) => tone(f, 0.16, 'triangle', 0.07, 0, i * 0.07)); },
    miss() { noise(0.06, 900, 0.05); },
    jump() { tone(300, 0.1, 'sine', 0.04, 200); },
    splash() { noise(0.35, 700, 0.12); },
    thunder() { noise(2.2, 160, 0.35); },
    win() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.06, 0, i * 0.13)); },
    setRain(v) { if (rainGain) rainGain.gain.setTargetAtTime(v * 0.16, ac.currentTime, 0.6); }
  };
})();

/* =====================================================================
   WORLD SHAPE
   ===================================================================== */
const SIZE = 320, HALF = 150, WATER_Y = -0.8, RIVER_W = 7;
const riverZ = x => 55 + 20 * Math.sin(x / 45) + 8 * Math.sin(x / 17 + 1);
function rawH(x, z) { return 2.4 * Math.sin(x * 0.035) * Math.cos(z * 0.03) + 1.3 * Math.sin(x * 0.09 + z * 0.07) + 0.6 * Math.sin(z * 0.17 + 2); }
function groundH(x, z) {
  const d = Math.hypot(x, z);
  let h = rawH(x, z) * smooth(16, 42, d) + 0.25;
  h += smooth(118, 152, d) * 9;
  const rd = Math.abs(z - riverZ(x)), r = 1 - smooth(RIVER_W * 0.45, RIVER_W + 1.5, rd);
  return lerp(h, -2.3, r);
}
const BRIDGE = (() => { const zc = riverZ(0); const y = Math.max(groundH(0, zc - 11), groundH(0, zc + 11), 0) + 0.35; return { x0: -1.8, x1: 1.8, z0: zc - 11, z1: zc + 11, y }; })();
function floorAt(x, z) {
  let h = groundH(x, z);
  if (x > BRIDGE.x0 && x < BRIDGE.x1 && z > BRIDGE.z0 && z < BRIDGE.z1) h = Math.max(h, BRIDGE.y);
  return h;
}
const pathDist = (x, z) => {
  const ring = Math.abs(Math.hypot(x, z) - 11);
  const north = z > 0 && z < BRIDGE.z1 + 12 ? Math.abs(x - 1.6 * Math.sin(z / 7)) : 99;
  return Math.min(ring, north);
};

/* =====================================================================
   RENDERER / SCENE
   ===================================================================== */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: !isTouch, powerPreference: 'high-performance' });
} catch (e) {
  $('#title').innerHTML = `<div class="screen-inner"><h1>3D isn't available</h1><p class="tagline">This browser couldn't start WebGL. You can still read everything on the resume page.</p><div class="btnrow"><a class="big" href="index.html" style="text-decoration:none">📄 OPEN RESUME</a></div></div>`;
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isTouch ? 1.25 : 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.domElement.id = 'view'; renderer.domElement.tabIndex = 0;
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.08, 800);
camera.rotation.order = 'YXZ';
scene.add(camera);
scene.fog = new THREE.Fog(0xcfe0ea, 60, 380);

const CLEAR = { top: new THREE.Color(0x4f8fd0), bottom: new THREE.Color(0xd4e6ef), fog: new THREE.Color(0xcfe0ea) };
const RAINY = { top: new THREE.Color(0x3b4650), bottom: new THREE.Color(0x7d8a90), fog: new THREE.Color(0x7d8a90) };
const skyU = { top: { value: CLEAR.top.clone() }, bottom: { value: CLEAR.bottom.clone() } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(650, 24, 16), new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying vec3 vP; void main(){ float h = clamp(vP.y * 1.5 + 0.08, 0.0, 1.0); gl_FragColor = vec4(mix(bottom, top, pow(h, 0.75)), 1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'
}));
scene.add(sky);

const hemi = new THREE.HemisphereLight(0xe2efff, 0x5d6b3c, 1.0); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0d6, 2.3);
sun.castShadow = true; sun.shadow.mapSize.set(isTouch ? 1024 : 2048, isTouch ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 220 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.05;
scene.add(sun, sun.target);
const SUN_OFF = new THREE.Vector3(45, 75, 20);

/* materials */
const matCache = new Map();
function mat(color, extra) {
  const key = color + (extra ? JSON.stringify(extra) : '');
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial(Object.assign({ color, flatShading: true, roughness: 0.9 }, extra || {})));
  return matCache.get(key);
}
function box(w, h, d, color, x, y, z, parent, extra) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof color === 'object' ? color : mat(color, extra));
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; if (parent) parent.add(m); return m;
}

/* =====================================================================
   TERRAIN, WATER, BRIDGE
   ===================================================================== */
const blockers = [];            // meshes that stop tag darts
function buildTerrain() {
  const seg = isTouch ? 110 : 150;
  const g = new THREE.PlaneGeometry(SIZE, SIZE, seg, seg); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, cols = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), h = groundH(x, z); p.setY(i, h);
    const v = (Math.sin(x * 0.31) * Math.cos(z * 0.27) + Math.sin(x * 0.07 + z * 0.11)) * 0.5;
    if (h < WATER_Y + 0.45) c.setHex(h < WATER_Y - 0.4 ? 0x8a7d5c : 0xc9b88a);
    else if (pathDist(x, z) < 1.5 && Math.hypot(x, z) < 90) c.setHex(0x9c7d55);
    else if (h > 5) c.setHSL(0.24, 0.25, 0.36 + v * 0.04);
    else c.setHSL(0.26 + v * 0.025, 0.46, 0.36 + v * 0.05);
    cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3)); g.computeVertexNormals();
  const terrain = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }));
  terrain.receiveShadow = true; scene.add(terrain); blockers.push(terrain);
}

let waterTex;
function buildWater() {
  const N = 128, data = new Uint8Array(N * N * 4);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const u = i / N, v = j / N, a = 2 * Math.PI * (3 * u + 2 * v), b = 2 * Math.PI * (5 * u - 3 * v), c2 = 2 * Math.PI * (u - 4 * v);
    let dx = 3 * Math.cos(a) + 2.5 * Math.cos(b) + 0.6 * Math.cos(c2), dy = 2 * Math.cos(a) - 1.5 * Math.cos(b) - 2.4 * Math.cos(c2);
    const k = 0.12, nx = -dx * k, ny = -dy * k, l = Math.hypot(nx, ny, 1), o = (j * N + i) * 4;
    data[o] = (nx / l * 0.5 + 0.5) * 255; data[o + 1] = (ny / l * 0.5 + 0.5) * 255; data[o + 2] = (1 / l * 0.5 + 0.5) * 255; data[o + 3] = 255;
  }
  waterTex = new THREE.DataTexture(data, N, N); waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping; waterTex.repeat.set(50, 50); waterTex.needsUpdate = true;
  const water = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), new THREE.MeshStandardMaterial({
    color: 0x3d82ad, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.86, normalMap: waterTex, normalScale: new THREE.Vector2(0.5, 0.5) }));
  water.rotation.x = -Math.PI / 2; water.position.y = WATER_Y; water.receiveShadow = true; scene.add(water);
}

function buildBridge() {
  const g = new THREE.Group(), wood = 0x8a6440, dark = 0x5e4229;
  for (let z = BRIDGE.z0; z < BRIDGE.z1; z += 0.62) box(3.6, 0.16, 0.55, (Math.round(z * 3) % 2) ? wood : 0x7d5a39, 0, BRIDGE.y - 0.08, z + 0.3, g);
  [-1.75, 1.75].forEach(x => {
    box(0.14, 0.14, BRIDGE.z1 - BRIDGE.z0, dark, x, BRIDGE.y + 0.9, (BRIDGE.z0 + BRIDGE.z1) / 2, g);
    for (let z = BRIDGE.z0; z <= BRIDGE.z1; z += 2.75) { const ph = BRIDGE.y + 1 - Math.min(groundH(x, z), BRIDGE.y) + 1.4; box(0.18, ph, 0.18, dark, x, BRIDGE.y + 1 - ph / 2, z, g); }
  });
  scene.add(g); g.traverse(m => { if (m.isMesh) blockers.push(m); });
}

/* =====================================================================
   VILLAGE: HOUSES, LAMPS, FENCES
   ===================================================================== */
const houses = [], circles = [];
const winMat = new THREE.MeshStandardMaterial({ color: 0x2b3a46, emissive: 0xffc46b, emissiveIntensity: 0, roughness: 0.4 });
const lampMat = new THREE.MeshStandardMaterial({ color: 0xffe2a6, emissive: 0xffc46b, emissiveIntensity: 0.4 });
function makeHouse(x, z, rot, w, d, wall, roof) {
  const g = new THREE.Group(), h = 3.4;
  g.position.set(x, groundH(x, z) - 0.2, z); g.rotation.y = rot;
  box(w + 0.3, 0.5, d + 0.3, 0x7b7466, 0, 0.25, 0, g);                         // stone base
  box(w, h, d, wall, 0, 0.5 + h / 2, 0, g);
  [-1, 1].forEach(s => { box(0.22, h, 0.22, 0x6b4f35, s * (w / 2), 0.5 + h / 2, d / 2, g); box(0.22, h, 0.22, 0x6b4f35, s * (w / 2), 0.5 + h / 2, -d / 2, g); });
  const roofM = new THREE.Mesh(new THREE.ConeGeometry(1, 2.6, 4).rotateY(Math.PI / 4), mat(roof));
  roofM.scale.set((w + 0.9) / Math.SQRT2, 1, (d + 0.9) / Math.SQRT2); roofM.position.y = 0.5 + h + 1.3; roofM.castShadow = true; g.add(roofM);
  box(0.6, 1.6, 0.6, 0x6e6a62, w * 0.25, 0.5 + h + 1.8, -d * 0.15, g);         // chimney
  box(1.1, 2.0, 0.12, 0x5b3d26, 0, 1.5, d / 2 + 0.02, g);                       // door
  box(0.12, 0.12, 0.06, 0xd1b25a, 0.35, 1.5, d / 2 + 0.1, g);
  box(1.6, 0.12, 0.7, 0x6b4f35, 0, 2.7, d / 2 + 0.35, g);                      // awning
  [[-w * 0.3, d / 2 + 0.02, 0], [w * 0.3, d / 2 + 0.02, 0], [w / 2 + 0.02, 0, Math.PI / 2], [-w / 2 - 0.02, 0, Math.PI / 2]].forEach(([wx, wz, r], i) => {
    const wg = new THREE.Group(); wg.position.set(i < 2 ? wx : wx, 2.3, i < 2 ? wz : 0); wg.rotation.y = r; g.add(wg);
    if (i < 2 && Math.abs(wx) < 0.9) return;
    box(0.9, 0.9, 0.08, winMat, 0, 0, 0, wg); box(1.05, 0.12, 0.14, 0xe9e2d0, 0, -0.5, 0.02, wg); box(0.08, 0.9, 0.1, 0xe9e2d0, 0, 0, 0.02, wg);
  });
  scene.add(g); g.traverse(m => { if (m.isMesh) blockers.push(m); });
  houses.push({ x, z, rot, hw: w / 2 + 0.35, hd: d / 2 + 0.35 });
}
function buildVillage() {
  const walls = [0xe9dcc0, 0xd9c6a1, 0xd5dde0, 0xe8cdb8, 0xcbd6c2], roofs = [0x9c4a3a, 0x56708c, 0x7a5c3e, 0x5f7a4a];
  const angles = [0.25, 1.05, 2.05, 2.75, 3.55, 4.35, 5.15, 5.85];
  angles.forEach((a, i) => {
    const r = 20 + (i % 3) * 3.5, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (z > 0 && Math.abs(x) < 7) return;
    makeHouse(x, z, Math.atan2(-x, -z), 5.2 + (i % 2) * 1.2, 4.6 + (i % 3) * 0.6, walls[i % walls.length], roofs[i % roofs.length]);
  });
  // well in the square
  const wg = new THREE.Group(); wg.position.set(-7, groundH(-7, 4), 4);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, 0.9, 10, 1, true), mat(0x8f8a80, { side: THREE.DoubleSide })); ring.position.y = 0.45; ring.castShadow = true; wg.add(ring);
  box(0.12, 1.8, 0.12, 0x6b4f35, -0.95, 1.3, 0, wg); box(0.12, 1.8, 0.12, 0x6b4f35, 0.95, 1.3, 0, wg);
  const wr = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.9, 4).rotateY(Math.PI / 4), mat(0x9c4a3a)); wr.position.y = 2.6; wr.castShadow = true; wg.add(wr);
  scene.add(wg); circles.push({ x: -7, z: 4, r: 1.4 }); wg.traverse(m => { if (m.isMesh) blockers.push(m); });
  // lamp posts around the square
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2 + 0.2, x = Math.cos(a) * 13.5, z = Math.sin(a) * 13.5;
    const lg = new THREE.Group(); lg.position.set(x, groundH(x, z), z);
    box(0.16, 3.2, 0.16, 0x2f3533, 0, 1.6, 0, lg);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), lampMat); lamp.position.y = 3.35; lg.add(lamp);
    box(0.5, 0.08, 0.5, 0x2f3533, 0, 3.62, 0, lg);
    scene.add(lg); circles.push({ x, z, r: 0.3 });
  }
  // a few fences
  for (let i = -6; i <= 6; i++) { const x = -30 + i * 1.6, z = -26 + Math.sin(i) * 0.3; box(0.12, 1, 0.12, 0x8a6440, x, groundH(x, z) + 0.5, z); if (i < 6) box(1.6, 0.1, 0.06, 0x8a6440, x + 0.8, groundH(x, z) + 0.75, z); }
}

/* =====================================================================
   NATURE: TREES, ROCKS, GRASS, FLOWERS, CLOUDS
   ===================================================================== */
const landOK = (x, z, margin = 0) => {
  if (Math.hypot(x, z) > 146) return false;
  if (Math.abs(z - riverZ(x)) < RIVER_W + 2 + margin) return false;
  if (groundH(x, z) < WATER_Y + 0.4) return false;
  for (const h of houses) if (Math.hypot(x - h.x, z - h.z) < Math.max(h.hw, h.hd) + 1.5 + margin) return false;
  return true;
};
function buildNature() {
  const dummy = new THREE.Object3D(), c = new THREE.Color(), trees = [];
  let tries = 0;
  while (trees.length < (isTouch ? 170 : 240) && tries++ < 6000) {
    const x = (R() * 2 - 1) * 148, z = (R() * 2 - 1) * 148, d = Math.hypot(x, z);
    if (d < 32 || !landOK(x, z, 1)) continue;
    if (x > -6 && x < 6 && z > 0 && z < BRIDGE.z1 + 16) continue;
    if (trees.some(t => (t.x - x) ** 2 + (t.z - z) ** 2 < 12)) continue;
    trees.push({ x, z, s: 0.8 + R() * 0.75, pine: R() < 0.45 });
  }
  const trunkG = new THREE.CylinderGeometry(0.22, 0.34, 2.4, 6), pineG = new THREE.ConeGeometry(1.7, 4.2, 7), roundG = new THREE.IcosahedronGeometry(1.9, 0);
  const trunks = new THREE.InstancedMesh(trunkG, mat(0x6b4a2f), trees.length);
  const pines = new THREE.InstancedMesh(pineG, new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.95 }), trees.filter(t => t.pine).length);
  const rounds = new THREE.InstancedMesh(roundG, new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.95 }), trees.filter(t => !t.pine).length);
  let ip = 0, ir = 0;
  trees.forEach((t, i) => {
    const y = groundH(t.x, t.z);
    dummy.position.set(t.x, y + 1.15 * t.s, t.z); dummy.rotation.set(0, R() * 6, 0); dummy.scale.setScalar(t.s); dummy.updateMatrix(); trunks.setMatrixAt(i, dummy.matrix);
    if (t.pine) { dummy.position.y = y + (2.3 + 2.0) * t.s; dummy.updateMatrix(); pines.setMatrixAt(ip, dummy.matrix); c.setHSL(0.33 + R() * 0.04, 0.42, 0.24 + R() * 0.06); pines.setColorAt(ip++, c); }
    else { dummy.position.y = y + (2.3 + 1.4) * t.s; dummy.rotation.set(R(), R() * 6, R()); dummy.updateMatrix(); rounds.setMatrixAt(ir, dummy.matrix); c.setHSL(0.24 + R() * 0.07, 0.5, 0.33 + R() * 0.08); rounds.setColorAt(ir++, c); }
    circles.push({ x: t.x, z: t.z, r: 0.45 * t.s });
  });
  [trunks, pines, rounds].forEach(m => { m.castShadow = true; m.receiveShadow = true; scene.add(m); blockers.push(m); });

  const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ flatShading: true, roughness: 1 }), 70);
  for (let i = 0; i < 70; i++) {
    let x, z, k = 0; do { x = (R() * 2 - 1) * 140; z = (R() * 2 - 1) * 140; } while ((!landOK(x, z) || Math.hypot(x, z) < 18) && k++ < 50);
    const s = 0.4 + R() * 1.3; dummy.position.set(x, groundH(x, z) + s * 0.25, z); dummy.rotation.set(R() * 3, R() * 3, R() * 3); dummy.scale.set(s, s * 0.7, s); dummy.updateMatrix();
    rocks.setMatrixAt(i, dummy.matrix); c.setHSL(0.1, 0.05, 0.42 + R() * 0.15); rocks.setColorAt(i, c); if (s > 0.8) circles.push({ x, z, r: s * 0.9 });
  }
  rocks.castShadow = rocks.receiveShadow = true; scene.add(rocks); blockers.push(rocks);

  const GN = isTouch ? 1400 : 2600, grass = new THREE.InstancedMesh(new THREE.ConeGeometry(0.08, 0.6, 3), new THREE.MeshStandardMaterial({ flatShading: true }), GN);
  for (let i = 0; i < GN; i++) {
    let x, z, k = 0; do { x = (R() * 2 - 1) * 140; z = (R() * 2 - 1) * 140; } while ((!landOK(x, z) || pathDist(x, z) < 1.8) && k++ < 30);
    const s = 0.6 + R() * 0.9; dummy.position.set(x, groundH(x, z) + 0.25 * s, z); dummy.rotation.set((R() - 0.5) * 0.4, R() * 6, (R() - 0.5) * 0.4); dummy.scale.setScalar(s); dummy.updateMatrix();
    grass.setMatrixAt(i, dummy.matrix); c.setHSL(0.25 + R() * 0.06, 0.5, 0.3 + R() * 0.12); grass.setColorAt(i, c);
  }
  scene.add(grass);
  const FN = 420, flowers = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.11, 0), new THREE.MeshStandardMaterial({ flatShading: true }), FN), fc = [0xffffff, 0xf2d15b, 0xe58fb0, 0x9b8fe0, 0xe46b4f];
  for (let i = 0; i < FN; i++) {
    let x, z, k = 0; do { const cx = (R() * 2 - 1) * 120, cz = (R() * 2 - 1) * 120; x = cx + R() * 4; z = cz + R() * 4; } while (!landOK(x, z) && k++ < 30);
    dummy.position.set(x, groundH(x, z) + 0.3, z); dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(1); dummy.updateMatrix(); flowers.setMatrixAt(i, dummy.matrix); flowers.setColorAt(i, c.setHex(fc[i % fc.length]));
  }
  scene.add(flowers);
}
const clouds = [], cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.6, flatShading: true, roughness: 1, fog: false });
function buildClouds() {
  for (let i = 0; i < 18; i++) {
    const g = new THREE.Group(), n = 3 + Math.floor(R() * 4);
    for (let k = 0; k < n; k++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(4 + R() * 5, 0), cloudMat); m.position.set(k * 5 - n * 2.5, R() * 3, R() * 6); m.scale.y = 0.6; g.add(m); }
    g.position.set((R() * 2 - 1) * 260, 70 + R() * 35, (R() * 2 - 1) * 260); g.userData.v = 1.5 + R() * 2.5; scene.add(g); clouds.push(g);
  }
}

/* =====================================================================
   RAIN
   ===================================================================== */
const RAIN_N = isTouch ? 1500 : 3200, RAIN_BOX = 36;
const rainPos = new Float32Array(RAIN_N * 6);
const rainGeo = new THREE.BufferGeometry(); rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rainLines = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0xc4d2dc, transparent: true, opacity: 0, depthWrite: false }));
rainLines.frustumCulled = false; scene.add(rainLines);
for (let i = 0; i < RAIN_N; i++) { const x = (R() * 2 - 1) * RAIN_BOX, y = R() * 30, z = (R() * 2 - 1) * RAIN_BOX; rainPos.set([x, y, z, x + 0.08, y + 0.75, z], i * 6); }

/* =====================================================================
   CHARACTERS
   ===================================================================== */
function labelTexture(text, bg = '#f1e9d2', fg = '#2b2420', accent = '#b0573a') {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256; const g = cv.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 512, 256);
  g.strokeStyle = accent; g.lineWidth = 14; g.strokeRect(14, 14, 484, 228);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  const words = String(text).toUpperCase().split(' '); const lines = []; let cur = '';
  words.forEach(w => { const t = cur ? cur + ' ' + w : w; if (t.length > 12 && cur) { lines.push(cur); cur = w; } else cur = t; }); if (cur) lines.push(cur);
  const fs = Math.min(92, Math.floor(200 / lines.length)); g.font = `700 ${fs}px "Chakra Petch", "Barlow", sans-serif`;
  lines.slice(0, 3).forEach((l, i) => { let s = fs; while (g.measureText(l).width > 440 && s > 30) { s -= 4; g.font = `700 ${s}px "Chakra Petch", sans-serif`; } g.fillText(l, 256, 128 + (i - (Math.min(3, lines.length) - 1) / 2) * fs * 1.05); });
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function plaque(w, h, tex, frame = 0x6b4f35) {
  const g = new THREE.Group();
  const face = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05), [mat(frame), mat(frame), mat(frame), mat(frame), face, face]);
  m.castShadow = true; g.add(m); return g;
}
function makeItem(kind, text, accent) {
  const g = new THREE.Group(), tex = labelTexture(text, '#f1e9d2', '#2b2420', accent);
  if (kind === 'sign') {
    box(0.06, 0.9, 0.06, 0x6b4f35, 0, 0.1, 0, g); const p = plaque(0.9, 0.5, tex); p.position.y = 0.7; g.add(p);
  } else if (kind === 'book') {
    const cover = mat(0x5b4a8a), face = new THREE.MeshStandardMaterial({ map: tex });
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.42, 0.12), [cover, cover, mat(0xf1e9d2), mat(0xf1e9d2), face, cover]); m.castShadow = true; g.add(m);
  } else if (kind === 'case') {
    const body = mat(0x6b4a2f), face = new THREE.MeshStandardMaterial({ map: tex });
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.42, 0.18), [body, body, body, body, face, face]); m.castShadow = true; g.add(m);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 6, 12, Math.PI), mat(0x2f2620)); handle.position.y = 0.21; g.add(handle);
  } else if (kind === 'envelope') {
    const paper = mat(0xf4efe3), face = new THREE.MeshStandardMaterial({ map: tex });
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.42, 0.03), [paper, paper, paper, paper, face, paper]); g.add(m);
    const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 10), mat(0xb0303a)); seal.rotation.x = Math.PI / 2; seal.position.set(0, -0.14, -0.03); g.add(seal);
  } else { // crate
    const wood = mat(0x9a7448), face = new THREE.MeshStandardMaterial({ map: tex });
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.42, 0.42), [wood, wood, wood, wood, face, face]); m.castShadow = true; g.add(m);
  }
  return g;
}

function makeHuman(o) {
  const g = new THREE.Group(), legs = [], arms = [];
  [-0.11, 0.11].forEach(x => { const l = new THREE.Group(); l.position.set(x, 0.86, 0); box(0.18, 0.84, 0.2, o.pants, 0, -0.42, 0, l); box(0.2, 0.1, 0.28, 0x2c2622, 0, -0.84, 0.04, l); g.add(l); legs.push(l); });
  box(0.54, 0.68, 0.32, o.shirt, 0, 1.2, 0, g); box(0.56, 0.08, 0.34, o.belt || 0x3a2e26, 0, 0.88, 0, g);
  const head = new THREE.Group(); head.position.set(0, 1.72, 0); g.add(head);
  box(0.36, 0.36, 0.34, o.skin, 0, 0, 0, head);
  box(0.06, 0.06, 0.02, 0x1d1a18, -0.08, 0.02, 0.175, head); box(0.06, 0.06, 0.02, 0x1d1a18, 0.08, 0.02, 0.175, head);
  box(0.38, 0.12, 0.36, o.hair, 0, 0.2, 0, head); box(0.38, 0.22, 0.08, o.hair, 0, 0.06, -0.15, head);
  if (o.hat) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.04, 12), mat(o.hat)); b.position.y = 0.26; head.add(b); const t = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.22, 12), mat(o.hat)); t.position.y = 0.38; head.add(t); }
  [-0.35, 0.35].forEach((x, i) => { const a = new THREE.Group(); a.position.set(x, 1.48, 0); box(0.15, 0.6, 0.17, o.shirt, 0, -0.28, 0, a); box(0.13, 0.13, 0.15, o.skin, 0, -0.62, 0, a); g.add(a); arms.push(a); });
  arms[1].rotation.x = -1.15; arms[0].rotation.x = -0.9; arms[0].rotation.z = -0.35; arms[1].rotation.z = 0.35;
  const anchor = new THREE.Group(); anchor.position.set(0, 1.28, 0.5); g.add(anchor);
  return { group: g, legs, arms, head, anchor, height: 2.05, itemScale: 1, holdArms: true };
}
function makeQuad(o) {
  const g = new THREE.Group(), legs = [], by = o.legH + o.bodyH / 2;
  if (o.fluffy) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), mat(o.col)); b.scale.set(o.bodyW / 1.6, o.bodyH / 1.6, o.bodyL / 1.6); b.position.y = by; b.castShadow = true; g.add(b); }
  else box(o.bodyW, o.bodyH, o.bodyL, o.col, 0, by, 0, g);
  if (o.belly) box(o.bodyW * 0.8, 0.06, o.bodyL * 0.7, o.belly, 0, by - o.bodyH / 2, 0, g);
  [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([sx, sz]) => { const l = new THREE.Group(); l.position.set(sx * o.bodyW * 0.32, o.legH, sz * o.bodyL * 0.36); box(o.legW, o.legH, o.legW, o.legCol || o.col, 0, -o.legH / 2, 0, l); g.add(l); legs.push(l); });
  const head = new THREE.Group(); head.position.set(0, by + o.bodyH * 0.45 + o.neck, o.bodyL / 2 + o.headS * 0.2); g.add(head);
  if (o.neck > 0.1) box(o.headS * 0.5, o.neck + 0.1, o.headS * 0.5, o.col, 0, by + o.bodyH * 0.3 + o.neck / 2, o.bodyL / 2 - 0.05, g);
  box(o.headS, o.headS * 0.85, o.headS, o.headCol || o.col, 0, 0, 0, head);
  box(o.headS * 0.5, o.headS * 0.42, o.snout, o.snoutCol || o.headCol || o.col, 0, -o.headS * 0.14, o.headS / 2 + o.snout / 2, head);
  box(o.headS * 0.16, o.headS * 0.12, 0.03, 0x1d1a18, 0, -o.headS * 0.02, o.headS / 2 + o.snout, head);
  [-1, 1].forEach(s => box(o.headS * 0.14, o.headS * 0.14, 0.02, 0x1d1a18, s * o.headS * 0.26, o.headS * 0.12, o.headS / 2 + 0.005, head));
  if (o.ears === 'point') [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.ConeGeometry(o.headS * 0.2, o.headS * 0.45, 4), mat(o.earCol || o.col)); e.position.set(s * o.headS * 0.3, o.headS * 0.6, -0.02); e.castShadow = true; head.add(e); });
  if (o.ears === 'flop') [-1, 1].forEach(s => box(o.headS * 0.14, o.headS * 0.5, o.headS * 0.32, o.earCol || o.col, s * o.headS * 0.55, 0.0, -0.02, head));
  if (o.ears === 'side') [-1, 1].forEach(s => box(o.headS * 0.4, o.headS * 0.14, o.headS * 0.2, o.earCol || o.col, s * o.headS * 0.62, o.headS * 0.25, -0.05, head));
  if (o.antlers) [-1, 1].forEach(s => { box(0.05, 0.5, 0.05, 0xd9c7a1, s * 0.16, o.headS * 0.7, -0.05, head).rotation.z = s * -0.35; box(0.05, 0.25, 0.05, 0xd9c7a1, s * 0.3, o.headS * 0.95, 0.04, head).rotation.z = s * 0.4; });
  const tail = new THREE.Group(); tail.position.set(0, by + o.bodyH * 0.25, -o.bodyL / 2); g.add(tail);
  if (o.tail === 'bush') { const t = box(o.bodyW * 0.45, o.bodyW * 0.45, o.bodyL * 0.55, o.col, 0, -0.05, -o.bodyL * 0.25, tail); t.rotation.x = 0.5; box(o.bodyW * 0.46, o.bodyW * 0.46, o.bodyL * 0.16, 0xf4efe3, 0, -0.22, -o.bodyL * 0.48, tail); }
  if (o.tail === 'thin') { const t = box(0.06, 0.06, o.bodyL * 0.6, o.col, 0, 0.15, -o.bodyL * 0.25, tail); t.rotation.x = -0.9; }
  if (o.tail === 'puff') box(0.18, 0.18, 0.14, o.tailCol || o.col, 0, 0, -0.04, tail);
  const anchor = new THREE.Group(); anchor.position.set(0, -o.headS * 0.25, o.headS / 2 + o.snout + 0.06); head.add(anchor);
  return { group: g, legs, head, tail, anchor, height: by + o.bodyH / 2 + o.neck + o.headS * (o.antlers ? 1.6 : 1), itemScale: o.itemScale || 0.7 };
}
function makeOwl() {
  const g = new THREE.Group();
  const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.9, 8), mat(0x6b4a2f)); stump.position.y = 0.45; stump.castShadow = true; g.add(stump);
  const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), mat(0x8a6a4a)); body.scale.set(1, 1.25, 0.9); body.position.y = 1.5; body.castShadow = true; g.add(body);
  const belly = new THREE.Mesh(new THREE.IcosahedronGeometry(0.36, 1), mat(0xd9c7a1)); belly.scale.set(1, 1.2, 0.6); belly.position.set(0, 1.42, 0.22); g.add(belly);
  const head = new THREE.Group(); head.position.y = 2.15; g.add(head);
  const hm = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), mat(0x8a6a4a)); hm.scale.set(1.1, 0.9, 0.95); hm.castShadow = true; head.add(hm);
  [-1, 1].forEach(s => {
    const e = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.05, 12), mat(0xf4efe3)); e.rotation.x = Math.PI / 2; e.position.set(s * 0.17, 0.02, 0.36); head.add(e);
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 10), mat(0x1d1a18)); p.rotation.x = Math.PI / 2; p.position.set(s * 0.17, 0.02, 0.38); head.add(p);
    const t = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.28, 4), mat(0x6b4f35)); t.position.set(s * 0.26, 0.4, 0); t.rotation.z = -s * 0.3; head.add(t);
    box(0.12, 0.6, 0.4, 0x6e5238, s * 0.5, 1.5, -0.02, g);
  });
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 4), mat(0xd1b25a)); beak.rotation.x = Math.PI / 2 + 0.3; beak.position.set(0, -0.1, 0.42); head.add(beak);
  const anchor = new THREE.Group(); anchor.position.set(0, 1.25, 0.62); g.add(anchor);
  return { group: g, legs: [], head, anchor, height: 2.7, itemScale: 0.9, fixed: true };
}
const SPECIES = {
  deer:  () => makeQuad({ bodyL: 1.3, bodyH: 0.6, bodyW: 0.5, legH: 0.85, legW: 0.11, col: 0x9a6a3f, belly: 0xe2cfae, neck: 0.45, headS: 0.36, snout: 0.22, snoutCol: 0x7d5532, ears: 'side', antlers: true, tail: 'puff', tailCol: 0xf4efe3, speed: 2.0 }),
  fox:   () => makeQuad({ bodyL: 0.9, bodyH: 0.36, bodyW: 0.34, legH: 0.38, legW: 0.09, col: 0xd46a2a, legCol: 0x3a2a22, belly: 0xf4efe3, neck: 0.12, headS: 0.32, snout: 0.22, snoutCol: 0xf4efe3, ears: 'point', earCol: 0x3a2a22, tail: 'bush', speed: 2.4, itemScale: 0.55 }),
  sheep: () => makeQuad({ bodyL: 1.0, bodyH: 0.62, bodyW: 0.7, legH: 0.42, legW: 0.11, col: 0xf1ede3, legCol: 0x2c2724, headCol: 0x2c2724, neck: 0.05, headS: 0.32, snout: 0.16, ears: 'side', fluffy: true, tail: 'puff', speed: 1.0, itemScale: 0.6 }),
  cat:   () => makeQuad({ bodyL: 0.7, bodyH: 0.3, bodyW: 0.28, legH: 0.3, legW: 0.08, col: 0x7b7a80, belly: 0xd9d6d0, neck: 0.06, headS: 0.3, snout: 0.08, ears: 'point', tail: 'thin', speed: 1.5, itemScale: 0.5 }),
  dog:   () => makeQuad({ bodyL: 0.95, bodyH: 0.42, bodyW: 0.38, legH: 0.45, legW: 0.1, col: 0xc89a5a, belly: 0xf1e3c8, neck: 0.12, headS: 0.36, snout: 0.2, snoutCol: 0xe7d2a8, ears: 'flop', earCol: 0x8a6440, tail: 'thin', speed: 2.2, itemScale: 0.6 }),
  bear:  () => makeQuad({ bodyL: 1.4, bodyH: 0.85, bodyW: 0.9, legH: 0.5, legW: 0.22, col: 0x5e4229, neck: 0.1, headS: 0.5, snout: 0.22, snoutCol: 0x8a6440, ears: 'side', tail: 'puff', speed: 1.1, itemScale: 0.8 }),
  owl:   makeOwl,
};
const PEOPLE = [
  { shirt: 0x6fa3a0, pants: 0x3d4a5c, skin: 0xd9a77f, hair: 0x2e2623 },
  { shirt: 0xb0573a, pants: 0x3a3a3a, skin: 0xc28e66, hair: 0x1d1a18, hat: 0x5b4a3a },
  { shirt: 0xc99a45, pants: 0x4a3e2e, skin: 0xe2b896, hair: 0x6b4a2f },
  { shirt: 0x5b7a9a, pants: 0x2f3a2c, skin: 0xa8734f, hair: 0x2e2623, hat: 0x7a5c3e },
  { shirt: 0x7e9a5c, pants: 0x3d3a4a, skin: 0xd9a77f, hair: 0x4a3426 },
];

/* which character carries which part of the CV */
const npcs = [];
const npcHitMeshes = [];
function findSpot(x, z) {
  for (let r = 0; r < 60; r += 2) for (let a = 0; a < 6.28; a += 0.6) { const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (landOK(px, pz, 1) && !circles.some(c => Math.hypot(c.x - px, c.z - pz) < c.r + 1.2)) return [px, pz]; }
  return [x, z];
}
function addNPC(def) {
  const model = def.species === 'human' ? makeHuman(def.look) : SPECIES[def.species]();
  const [x, z] = findSpot(def.x, def.z);
  model.group.position.set(x, floorAt(x, z), z); model.group.rotation.y = R() * 6.28;
  const item = makeItem(def.item, def.label, def.accent); item.scale.setScalar(model.itemScale || 1);
  if (def.species === 'human') item.rotation.x = 0; model.anchor.add(item);
  scene.add(model.group);
  const marker = new THREE.Sprite(new THREE.SpriteMaterial({ map: markerTex(), fog: false, depthWrite: false, transparent: true }));
  marker.scale.set(0.8, 0.8, 1); marker.position.y = model.height + 0.7; model.group.add(marker);
  const n = Object.assign({}, def, model, { x, z, home: new THREE.Vector2(x, z), target: null, wait: R() * 3, speed: (def.speed || (def.species === 'human' ? 1.3 : 1.6)), found: false, react: 0, vy: 0, hop: 0, spin: 0, phase: R() * 6, marker });
  model.group.traverse(m => { if (m.isMesh) { m.userData.npc = n; npcHitMeshes.push(m); } });
  npcs.push(n);
}
let _markerTex = null;
function markerTex() {
  if (_markerTex) return _markerTex;
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(66, 68, 50, 0, 7); g.fill();
  g.fillStyle = '#d1b25a'; g.beginPath(); g.arc(64, 64, 50, 0, 7); g.fill(); g.lineWidth = 8; g.strokeStyle = '#fff'; g.stroke();
  g.fillStyle = '#2b2420'; g.font = '700 74px "Chakra Petch", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 64, 68);
  _markerTex = new THREE.CanvasTexture(c); _markerTex.colorSpace = THREE.SRGBColorSpace; return _markerTex;
}
function nameTex(text, color) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 96; const g = c.getContext('2d');
  g.font = '600 46px "Chakra Petch", sans-serif'; const w = Math.min(500, g.measureText(text).width + 60);
  g.fillStyle = 'rgba(13,17,18,.78)'; g.fillRect(256 - w / 2, 10, w, 76); g.fillStyle = color; g.fillRect(256 - w / 2, 80, w, 6);
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 256, 48, 480);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const shortCo = s => String(s).replace(/\b(Bangladesh|Ltd\.?|Limited|Inc\.?|Mobile App)\b/gi, '').replace(/\s+/g, ' ').trim();
function buildNPCs() {
  const first = String(CV.name).split(' ')[0] || 'Hello';
  addNPC({ kind: 'about', species: 'human', look: PEOPLE[0], item: 'sign', label: 'About ' + first, accent: ACCENT.about, x: 5, z: 6, title: 'The village guide', speed: 0.9 });
  const animals = ['deer', 'fox', 'sheep', 'cat', 'bear', 'dog'];
  const meadow = [[-58, -34], [64, -30], [-72, 6], [52, 14], [-30, -74], [30, -84]];
  CV.skills.forEach((cat, i) => addNPC({ kind: 'skills', cat, catIndex: i, species: animals[i % animals.length], item: 'crate', label: cat.category, accent: ACCENT.skills,
    x: meadow[i % meadow.length][0], z: meadow[i % meadow.length][1], title: `A ${animals[i % animals.length]} carrying “${cat.category}”` }));
  const spots = [[-15, -6], [15, -4], [-9, -17], [10, -18], [-18, 10], [18, 12]];
  CV.experience.forEach((job, i) => addNPC({ kind: 'job', job, species: 'human', look: PEOPLE[(i + 1) % PEOPLE.length], item: 'case', label: shortCo(job.company), accent: ACCENT.job,
    x: spots[i % spots.length][0], z: spots[i % spots.length][1], title: `A villager with a “${shortCo(job.company)}” case` }));
  CV.projects.forEach((p, i) => addNPC({ kind: 'project', project: p, species: ['dog', 'cat', 'fox'][i % 3], item: 'crate', label: p.title, accent: ACCENT.project, x: -40 + i * 26, z: -50, title: `Carrying “${p.title}”` }));
  CV.education.forEach((ed, i) => addNPC({ kind: 'edu', edu: ed, species: 'owl', item: 'book', label: ed.degree.split(' ')[0] || 'Diploma', accent: ACCENT.edu,
    x: -24 + i * 30, z: riverZ(-24 + i * 30) + 22, title: 'A wise owl with a book' }));
  CV.achievements.forEach((a, i) => addNPC({ kind: 'award', award: a, species: 'bear', item: 'sign', label: a.title, accent: ACCENT.award, x: 70 - i * 20, z: 70, title: `Carrying “${a.title}”` }));
  addNPC({ kind: 'contact', species: 'dog', item: 'envelope', label: 'Contact', accent: ACCENT.contact, x: 9, z: BRIDGE.z0 - 8, title: 'A dog delivering a letter' });
}

/* =====================================================================
   PLAYER, GUN, EFFECTS
   ===================================================================== */
const player = { pos: new THREE.Vector3(0, 0, -6), vel: new THREE.Vector3(), yaw: Math.PI, pitch: -0.05, onGround: true, bob: 0, wading: false, shots: 0, hits: 0 };
const EYE = 1.65;
const gun = new THREE.Group();
(function buildGun() {
  const body = mat(0x2f3533), trim = mat(0xb0573a);
  box(0.11, 0.13, 0.42, body, 0, 0, 0, gun).castShadow = false;
  box(0.07, 0.17, 0.1, trim, 0, -0.13, 0.08, gun).castShadow = false;
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.32, 10), mat(0x4a514e)); barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.03, -0.32); gun.add(barrel);
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.05, 10), new THREE.MeshStandardMaterial({ color: 0xd1b25a, emissive: 0xd1b25a, emissiveIntensity: 0.6 })); tip.rotation.x = Math.PI / 2; tip.position.set(0, 0.03, -0.49); gun.add(tip);
  box(0.03, 0.04, 0.12, mat(0xd1b25a), 0, 0.09, -0.05, gun);
  gun.scale.setScalar(0.42);
  camera.add(gun);
  // draw the blaster on top of the world so grass and walls never poke through it
  let ro = 10; gun.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.depthTest = false; m.material.depthWrite = false; m.castShadow = false; } });
  [gun.children[1], gun.children[0], gun.children[4], gun.children[2], gun.children[3]].forEach(m => { if (m) m.renderOrder = ro++; });
})();
const muzzleFlash = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xffe2a0, transparent: true, opacity: 0, depthTest: false }));
muzzleFlash.scale.set(0.18, 0.18, 1); muzzleFlash.position.set(0, 0.03, -0.56); gun.add(muzzleFlash);
let recoil = 0;

const tracers = [];
function tracer(from, to) {
  const g = new THREE.BufferGeometry().setFromPoints([from, to]);
  const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0.9 }));
  scene.add(l); tracers.push({ l, t: 0.14 });
}
const sparks = [];
const sparkGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
function burst(p, colors, n = 14, sp = 4) {
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(sparkGeo, new THREE.MeshBasicMaterial({ color: colors[i % colors.length], transparent: true }));
    m.position.copy(p); scene.add(m);
    sparks.push({ m, v: new THREE.Vector3((R() - 0.5) * sp, R() * sp + 1, (R() - 0.5) * sp), t: 0.9 + R() * 0.4 });
  }
}

/* =====================================================================
   WEATHER
   ===================================================================== */
const weather = { rain: 0, target: 0, timer: 40, flash: 0, nextFlash: 6 };
const _c = new THREE.Color();
function updateWeather(dt) {
  weather.timer -= dt;
  if (weather.timer <= 0) {
    weather.target = weather.target ? 0 : 1;
    weather.timer = weather.target ? 35 + R() * 20 : 70 + R() * 40;
    if (state === 'play') toast(weather.target ? '🌧  It\'s starting to rain…' : '☀  The rain is clearing up', '#6fa3a0');
  }
  weather.rain += clamp(weather.target - weather.rain, -dt * 0.22, dt * 0.22);
  const r = weather.rain;
  weather.flash = Math.max(0, weather.flash - dt * 3);
  if (r > 0.7) { weather.nextFlash -= dt; if (weather.nextFlash <= 0) { weather.flash = 1; weather.nextFlash = 7 + R() * 10; setTimeout(() => audio.thunder(), 500 + R() * 900); } }
  skyU.top.value.copy(CLEAR.top).lerp(RAINY.top, r); skyU.bottom.value.copy(CLEAR.bottom).lerp(RAINY.bottom, r);
  _c.copy(CLEAR.fog).lerp(RAINY.fog, r); scene.fog.color.copy(_c); scene.fog.near = lerp(60, 18, r); scene.fog.far = lerp(380, 140, r);
  sun.intensity = lerp(2.3, 0.35, r); hemi.intensity = lerp(1.0, 0.55, r) + weather.flash * 2.2;
  cloudMat.color.setRGB(lerp(1, 0.45, r), lerp(1, 0.48, r), lerp(1, 0.52, r)); cloudMat.emissiveIntensity = lerp(0.6, 0.12, r);
  rainLines.material.opacity = 0.5 * r; rainLines.visible = r > 0.02;
  winMat.emissiveIntensity = r * 1.4; lampMat.emissiveIntensity = 0.4 + r * 2.2;
  $('#flashOverlay').style.opacity = (weather.flash * 0.25).toFixed(3);
  audio.setRain(r);
  const wl = r > 0.5 ? '🌧 Rain' : '☀ Clear';
  if (ctrWeather.textContent !== wl) ctrWeather.textContent = wl;
}
function updateRain(dt) {
  if (!rainLines.visible) return;
  const cx = player.pos.x, cy = player.pos.y, cz = player.pos.z, sp = 26 * dt;
  for (let i = 0; i < RAIN_N; i++) {
    const o = i * 6;
    let x = rainPos[o], y = rainPos[o + 1] - sp, z = rainPos[o + 2];
    if (x - cx > RAIN_BOX) x -= RAIN_BOX * 2; else if (cx - x > RAIN_BOX) x += RAIN_BOX * 2;
    if (z - cz > RAIN_BOX) z -= RAIN_BOX * 2; else if (cz - z > RAIN_BOX) z += RAIN_BOX * 2;
    if (y < cy - 8) y += 34;
    rainPos[o] = x; rainPos[o + 1] = y; rainPos[o + 2] = z; rainPos[o + 3] = x + 0.08; rainPos[o + 4] = y + 0.75; rainPos[o + 5] = z;
  }
  rainGeo.attributes.position.needsUpdate = true;
}

/* =====================================================================
   INPUT
   ===================================================================== */
const keys = new Set();
let state = 'loading';         // loading | title | play | paused | panel | end
let locked = false, everLocked = false, dragLook = false, jumpPressed = false, fireQueued = false;
const joy = { x: 0, y: 0, id: null, ox: 0, oy: 0 }, look = { id: null, x: 0, y: 0 };
const KEYMAP = { KeyW: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r', ShiftLeft: 'run', ShiftRight: 'run' };
addEventListener('keydown', e => {
  if (e.code === 'Escape' && state === 'panel') { closePanel(false); return; }
  if (state === 'title' && (e.code === 'Enter' || e.code === 'Space') && !e.target.closest?.('a,button')) { e.preventDefault(); startGame(); return; }
  if (state !== 'play') return;
  if (e.code === 'KeyM') { toggleSound(); return; }
  if (e.code === 'KeyH') { openPanel(panelHelp(), '#6fa3a0'); return; }
  if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) jumpPressed = true; return; }
  if (e.code === 'KeyF' || e.code === 'Enter') { fireQueued = true; return; }
  const k = KEYMAP[e.code]; if (k) { e.preventDefault(); keys.add(k); }
});
addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) keys.delete(k); });
addEventListener('blur', () => keys.clear());

const canvas = renderer.domElement;
document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === canvas; if (locked) everLocked = true;
  if (!locked && state === 'play' && !isTouch && !dragLook) pause();
});
function lockFailed() { if (everLocked) { if (state === 'play') pause(); } else { dragLook = true; if (state === 'paused') resume(); } }
document.addEventListener('pointerlockerror', lockFailed);
function requestLock() {
  if (isTouch || dragLook) return;
  try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(lockFailed); } catch (e) { lockFailed(); }
  if (!everLocked) setTimeout(() => { if (!locked && !everLocked) { dragLook = true; if (state === 'paused') resume(); } }, 700);
}
let mdown = null;
canvas.addEventListener('mousedown', e => {
  if (state !== 'play' || isTouch) return;
  if (locked) { if (e.button === 0) fireQueued = true; return; }
  if (!dragLook) { requestLock(); return; }
  mdown = { x: e.clientX, y: e.clientY, moved: 0 };
});
addEventListener('mousemove', e => {
  if (state !== 'play' || isTouch) return;
  if (locked) { player.yaw -= e.movementX * 0.0022; player.pitch = clamp(player.pitch - e.movementY * 0.0022, -1.45, 1.45); return; }
  if (dragLook && mdown) { const dx = e.clientX - mdown.x, dy = e.clientY - mdown.y; mdown.moved += Math.abs(dx) + Math.abs(dy); mdown.x = e.clientX; mdown.y = e.clientY; player.yaw -= dx * 0.005; player.pitch = clamp(player.pitch - dy * 0.005, -1.45, 1.45); }
});
addEventListener('mouseup', () => { if (dragLook && mdown) { if (mdown.moved < 6) fireQueued = true; mdown = null; } });

// touch: left joystick, right half looks, buttons fire/jump
const joyEl = $('#joy'), joyKnob = joyEl.querySelector('i');
joyEl.addEventListener('pointerdown', e => { e.preventDefault(); audio.ensure(); joy.id = e.pointerId; const r = joyEl.getBoundingClientRect(); joy.ox = r.left + r.width / 2; joy.oy = r.top + r.height / 2; joyEl.setPointerCapture(e.pointerId); moveJoy(e); });
joyEl.addEventListener('pointermove', e => { if (e.pointerId === joy.id) moveJoy(e); });
['pointerup', 'pointercancel'].forEach(t => joyEl.addEventListener(t, e => { if (e.pointerId === joy.id) { joy.id = null; joy.x = joy.y = 0; joyKnob.style.transform = ''; } }));
function moveJoy(e) { let dx = e.clientX - joy.ox, dy = e.clientY - joy.oy; const m = Math.hypot(dx, dy), max = 46; if (m > max) { dx *= max / m; dy *= max / m; } joy.x = dx / max; joy.y = dy / max; joyKnob.style.transform = `translate(${dx}px,${dy}px)`; }
canvas.addEventListener('pointerdown', e => { if (!isTouch || state !== 'play' || e.pointerType === 'mouse') return; look.id = e.pointerId; look.x = e.clientX; look.y = e.clientY; look.t = performance.now(); look.moved = 0; });
canvas.addEventListener('pointermove', e => { if (e.pointerId !== look.id) return; const dx = e.clientX - look.x, dy = e.clientY - look.y; look.moved += Math.abs(dx) + Math.abs(dy); look.x = e.clientX; look.y = e.clientY; player.yaw -= dx * 0.006; player.pitch = clamp(player.pitch - dy * 0.006, -1.4, 1.4); });
['pointerup', 'pointercancel'].forEach(t => canvas.addEventListener(t, e => { if (e.pointerId === look.id) { if (look.moved < 8 && performance.now() - look.t < 300) fireQueued = true; look.id = null; } }));
[['#tFire', () => { fireQueued = true; }], ['#tJump', () => { jumpPressed = true; }]].forEach(([s, fn]) => {
  const b = $(s); b.addEventListener('pointerdown', e => { e.preventDefault(); audio.ensure(); b.classList.add('on'); fn(); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => b.addEventListener(t, () => b.classList.remove('on')));
});

/* =====================================================================
   UPDATE
   ===================================================================== */
const ray = new THREE.Raycaster(); ray.far = 160;
const CENTER = new THREE.Vector2(0, 0);
const tmpV = new THREE.Vector3(), tmpV2 = new THREE.Vector3();
let shotCD = 0, aimNPC = null, aimTimer = 0;

function collide(p) {
  for (const h of houses) {
    const dx = p.x - h.x, dz = p.z - h.z, c = Math.cos(-h.rot), s = Math.sin(-h.rot);
    let lx = dx * c - dz * s, lz = dx * s + dz * c;
    if (Math.abs(lx) < h.hw + 0.35 && Math.abs(lz) < h.hd + 0.35) {
      const px = h.hw + 0.35 - Math.abs(lx), pz = h.hd + 0.35 - Math.abs(lz);
      if (px < pz) lx = Math.sign(lx) * (h.hw + 0.35); else lz = Math.sign(lz) * (h.hd + 0.35);
      const c2 = Math.cos(h.rot), s2 = Math.sin(h.rot);
      p.x = h.x + lx * c2 - lz * s2; p.z = h.z + lx * s2 + lz * c2;
    }
  }
  for (const c of circles) {
    const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), m = c.r + 0.35;
    if (d < m && d > 1e-4) { p.x = c.x + dx / d * m; p.z = c.z + dz / d * m; }
  }
  const d = Math.hypot(p.x, p.z); if (d > 146) { p.x *= 146 / d; p.z *= 146 / d; }
}

function updatePlayer(dt) {
  let mx = (keys.has('r') ? 1 : 0) - (keys.has('l') ? 1 : 0) + joy.x;
  let mz = (keys.has('f') ? 1 : 0) - (keys.has('b') ? 1 : 0) - joy.y;
  const ml = Math.hypot(mx, mz); if (ml > 1) { mx /= ml; mz /= ml; }
  const run = keys.has('run') || Math.hypot(joy.x, joy.y) > 0.95;
  const floor = floorAt(player.pos.x, player.pos.z);
  player.wading = floor < WATER_Y - 0.25;
  const speed = (run ? 10.5 : 6.2) * (player.wading ? 0.5 : 1);
  const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw), rx = Math.cos(player.yaw), rz = -Math.sin(player.yaw);
  const tx = (fx * mz + rx * mx) * speed, tz = (fz * mz + rz * mx) * speed;
  const k = Math.min(1, dt * (player.onGround ? 12 : 3));
  player.vel.x += (tx - player.vel.x) * k; player.vel.z += (tz - player.vel.z) * k;
  if (jumpPressed && player.onGround) { player.vel.y = player.wading ? 4 : 6.4; player.onGround = false; audio.jump(); }
  jumpPressed = false;
  player.vel.y -= 18 * dt;
  player.pos.x += player.vel.x * dt; player.pos.z += player.vel.z * dt; collide(player.pos);
  player.pos.y += player.vel.y * dt;
  const f2 = floorAt(player.pos.x, player.pos.z);
  if (player.pos.y <= f2) { if (!player.onGround && player.vel.y < -7 && f2 < WATER_Y - 0.25) audio.splash(); player.pos.y = f2; player.vel.y = 0; player.onGround = true; }
  else if (player.pos.y - f2 > 0.25) player.onGround = false;
  const moving = Math.hypot(player.vel.x, player.vel.z);
  player.bob += moving * dt * 1.6;
  const bobY = player.onGround ? Math.sin(player.bob * 2) * 0.05 * Math.min(1, moving / 6) : 0;
  camera.position.set(player.pos.x, player.pos.y + EYE + bobY, player.pos.z);
  camera.rotation.set(player.pitch, player.yaw, 0);
  gun.position.set(0.25 + Math.cos(player.bob) * 0.01 * Math.min(1, moving / 6), -0.21 + Math.abs(Math.sin(player.bob)) * 0.006 + recoil * 0.015, -0.62 + recoil * 0.05);
  gun.rotation.x = recoil * 0.25;
}

function fire() {
  if (shotCD > 0) return; shotCD = 0.2; recoil = 1; player.shots++;
  audio.shot(); muzzleFlash.material.opacity = 1;
  ray.setFromCamera(CENTER, camera);
  const hits = ray.intersectObjects(npcHitMeshes.concat(blockers), false);
  muzzleFlash.getWorldPosition(tmpV);
  const h = hits[0];
  const end = h ? h.point : tmpV2.copy(ray.ray.direction).multiplyScalar(150).add(ray.ray.origin);
  tracer(tmpV.clone(), end.clone());
  if (h && h.object.userData.npc) tagNPC(h.object.userData.npc, h.point);
  else if (h) { burst(h.point, [0xd9d0b8, 0x8a7d5c], 6, 2.5); audio.miss(); }
}

function tagNPC(n, point) {
  player.hits++; audio.hit();
  burst(point, ['#d1b25a', '#6fa3a0', '#b0573a', '#f4efe3', '#9a8fb0'].map(c => new THREE.Color(c)), 22, 5);
  n.react = 1.3; n.vy = 4.2; n.spin = Math.PI * 2;
  const xh = $('#crosshair'); xh.classList.add('hit'); setTimeout(() => xh.classList.remove('hit'), 160);
  const first = !n.found; n.found = true;
  if (first) {
    n.marker.material.map = nameTex(n.label + '  ✓', n.accent); n.marker.material.needsUpdate = true; n.marker.scale.set(2.6, 0.49, 1);
    updateCounters();
    toast(`Tagged: ${n.label}  (${foundCount()}/${npcs.length})`, n.accent);
  }
  setTimeout(() => { if (state === 'play') openNPC(n); }, 420);
}

function updateNPCs(dt, t) {
  for (const n of npcs) {
    const g = n.group;
    if (n.react > 0) {
      n.react -= dt; n.vy -= 14 * dt; n.hop = Math.max(0, n.hop + n.vy * dt); if (n.hop === 0) n.vy = 0;
      const s = Math.min(n.spin, dt * 9); n.spin -= s; g.rotation.y += s;
      g.position.y = floorAt(g.position.x, g.position.z) + n.hop;
      continue;
    }
    if (n.fixed) { n.head.rotation.y = Math.sin(t * 0.7 + n.phase) * 0.8; continue; }
    const dp = Math.hypot(player.pos.x - g.position.x, player.pos.z - g.position.z);
    let moving = false;
    if (n.species === 'human' && dp < 6 && state === 'play') {
      const want = Math.atan2(player.pos.x - g.position.x, player.pos.z - g.position.z);
      g.rotation.y += Math.atan2(Math.sin(want - g.rotation.y), Math.cos(want - g.rotation.y)) * Math.min(1, dt * 4);
    } else if (n.wait > 0) n.wait -= dt;
    else {
      if (!n.target) {
        for (let k = 0; k < 8; k++) { const a = R() * 6.28, r = 3 + R() * 11, x = n.home.x + Math.cos(a) * r, z = n.home.y + Math.sin(a) * r; if (landOK(x, z, 0.5)) { n.target = new THREE.Vector2(x, z); break; } }
        if (!n.target) { n.wait = 2; continue; }
      }
      const dx = n.target.x - g.position.x, dz = n.target.y - g.position.z, d = Math.hypot(dx, dz);
      if (d < 0.4) { n.target = null; n.wait = 1.5 + R() * 4; }
      else {
        const want = Math.atan2(dx, dz); g.rotation.y += Math.atan2(Math.sin(want - g.rotation.y), Math.cos(want - g.rotation.y)) * Math.min(1, dt * 5);
        const step = Math.min(d, n.speed * dt); g.position.x += Math.sin(g.rotation.y) * step; g.position.z += Math.cos(g.rotation.y) * step; moving = true;
      }
    }
    g.position.y = floorAt(g.position.x, g.position.z);
    n.phase += dt * (moving ? n.speed * 4.5 : 1.2);
    const sw = moving ? Math.sin(n.phase) * 0.55 : 0;
    if (n.legs.length === 2) { n.legs[0].rotation.x = sw; n.legs[1].rotation.x = -sw; n.arms[0].rotation.x = -0.9 + sw * 0.15; n.head.rotation.y = moving ? 0 : Math.sin(t * 0.8 + n.home.x) * 0.4; }
    else if (n.legs.length === 4) { n.legs[0].rotation.x = sw; n.legs[3].rotation.x = sw; n.legs[1].rotation.x = -sw; n.legs[2].rotation.x = -sw; n.head.rotation.x = moving ? Math.sin(n.phase * 2) * 0.05 : Math.sin(t + n.home.x) * 0.08; if (n.tail) n.tail.rotation.y = Math.sin(t * 3 + n.home.y) * 0.4; }
  }
  for (const n of npcs) { if (!n.found) n.marker.position.y = n.height + 0.7 + Math.sin(t * 2.5 + n.home.x) * 0.12; }
}

function updateEffects(dt) {
  for (let i = tracers.length - 1; i >= 0; i--) { const tr = tracers[i]; tr.t -= dt; tr.l.material.opacity = Math.max(0, tr.t / 0.14); if (tr.t <= 0) { scene.remove(tr.l); tr.l.geometry.dispose(); tr.l.material.dispose(); tracers.splice(i, 1); } }
  for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.t -= dt; s.v.y -= 9 * dt; s.m.position.addScaledVector(s.v, dt); s.m.rotation.x += dt * 8; s.m.material.opacity = clamp(s.t, 0, 1); if (s.t <= 0) { scene.remove(s.m); s.m.material.dispose(); sparks.splice(i, 1); } }
  muzzleFlash.material.opacity = Math.max(0, muzzleFlash.material.opacity - dt * 14);
  recoil = Math.max(0, recoil - dt * 7); shotCD -= dt;
}

function updateAim(dt) {
  aimTimer -= dt; if (aimTimer > 0) return; aimTimer = 0.08;
  ray.setFromCamera(CENTER, camera);
  const h = ray.intersectObjects(npcHitMeshes, false)[0];
  const n = h && h.distance < 70 ? h.object.userData.npc : null;
  if (n !== aimNPC) {
    aimNPC = n; const xh = $('#crosshair');
    xh.classList.toggle('aim', !!n);
    $('#aimTip').textContent = n ? (n.found ? `${n.label} ✓  shoot to read again` : `${n.title} · shoot to read`) : '';
  }
}

/* =====================================================================
   HUD: minimap, counters, toasts, banner
   ===================================================================== */
const mm = $('#minimap'), mx = mm.getContext('2d'), mmBase = document.createElement('canvas');
const ctrWeather = $('#ctrWeather');
const MS = 160 / 300;
const toMap = (x, z) => [80 + x * MS, 80 - z * MS];
function buildMinimapBase() {
  mmBase.width = mmBase.height = 160; const g = mmBase.getContext('2d');
  g.fillStyle = '#5f7f45'; g.fillRect(0, 0, 160, 160);
  g.fillStyle = '#7e9a5c'; g.beginPath(); g.arc(80, 80, 20, 0, 7); g.fill();
  g.strokeStyle = '#3d82ad'; g.lineWidth = RIVER_W * 2 * MS; g.lineCap = 'round'; g.beginPath();
  for (let x = -150; x <= 150; x += 3) { const [px, py] = toMap(x, riverZ(x)); x === -150 ? g.moveTo(px, py) : g.lineTo(px, py); } g.stroke();
  g.fillStyle = '#9c7d55'; const [bx, by] = toMap(0, (BRIDGE.z0 + BRIDGE.z1) / 2); g.fillRect(bx - 1.5, by - (BRIDGE.z1 - BRIDGE.z0) * MS / 2, 3, (BRIDGE.z1 - BRIDGE.z0) * MS);
  g.fillStyle = '#2f4a2a'; circles.forEach(c => { if (c.r > 0.3 && c.r < 0.8) { const [px, py] = toMap(c.x, c.z); g.fillRect(px - 0.8, py - 0.8, 1.6, 1.6); } });
  g.fillStyle = '#c4705a'; houses.forEach(h => { const [px, py] = toMap(h.x, h.z); g.save(); g.translate(px, py); g.rotate(-h.rot); g.fillRect(-h.hw * MS, -h.hd * MS, h.hw * 2 * MS, h.hd * 2 * MS); g.restore(); });
}
function drawMinimap(t) {
  mx.clearRect(0, 0, 160, 160); mx.save(); mx.beginPath(); mx.arc(80, 80, 80, 0, 7); mx.clip();
  mx.drawImage(mmBase, 0, 0);
  npcs.forEach(n => {
    const [px, py] = toMap(n.group.position.x, n.group.position.z);
    mx.fillStyle = n.found ? 'rgba(255,255,255,.55)' : '#d1b25a';
    const r = n.found ? 2.2 : 3.2 + Math.sin(t * 5) * 0.8;
    mx.beginPath(); mx.arc(px, py, r, 0, 7); mx.fill(); if (!n.found) { mx.strokeStyle = '#2b2420'; mx.lineWidth = 1; mx.stroke(); }
  });
  const [px, py] = toMap(player.pos.x, player.pos.z);
  mx.translate(px, py); mx.rotate(-player.yaw + Math.PI);
  mx.fillStyle = '#fff'; mx.strokeStyle = '#000'; mx.lineWidth = 1.2; mx.beginPath(); mx.moveTo(0, -7); mx.lineTo(5, 5); mx.lineTo(0, 2.5); mx.lineTo(-5, 5); mx.closePath(); mx.fill(); mx.stroke();
  mx.restore();
}
let hintT = 0;
function updateHint(dt) {
  hintT -= dt; if (hintT > 0) return; hintT = 0.3;
  let best = null, bd = 1e9;
  npcs.forEach(n => { if (n.found) return; const d = Math.hypot(n.group.position.x - player.pos.x, n.group.position.z - player.pos.z); if (d < bd) { bd = d; best = n; } });
  if (!best) { $('#nextHint').textContent = 'Everyone tagged ✓'; return; }
  const ang = Math.atan2(best.group.position.x - player.pos.x, best.group.position.z - player.pos.z);
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const i = ((Math.round(ang / (Math.PI / 4)) % 8) + 8) % 8;
  $('#nextHint').textContent = `Nearest ? ${Math.round(bd)} m ${dirs[i]}`;
}
const foundCount = () => npcs.filter(n => n.found).length;
function updateCounters() { $('#ctrFound').textContent = `★ ${foundCount()}/${npcs.length} found`; }
let toastT;
function toast(msg, color = '#fff') { const t = $('#toast'); t.textContent = msg; t.style.setProperty('--c', color); t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2400); }
function banner(small, big, color) { const b = $('#banner'); b.innerHTML = `<small>${esc(small)}</small><strong>${esc(big)}</strong>`; b.style.setProperty('--c', color); b.classList.remove('show'); void b.offsetWidth; b.classList.add('show'); }

/* =====================================================================
   PANELS (CV content)
   ===================================================================== */
const tags = list => (list && list.length ? `<ul class="tags">${list.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : '');
const bullets = arr => (!arr ? '' : typeof arr === 'string' ? `<p>${esc(arr)}</p>` : arr.length ? `<ul>${arr.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '');
function linkBtns(links, ghost) {
  return (links || []).filter(l => l && safeUrl(l.url)).map((l, i) => { const u = safeUrl(l.url), ext = /^https?:/i.test(u);
    return `<a class="btn${ghost || i ? ' ghost' : ''}" href="${esc(u)}"${ext ? ' target="_blank" rel="noopener"' : ''}>${esc(l.label || 'Link')}${ext ? ' ↗' : ''}</a>`; }).join('');
}
const pips = lv => `<span class="pips">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= lv ? 'on' : ''}"></i>`).join('')}</span>`;
function panelFor(n) {
  const a = CV.about || {};
  const intro = `<p class="kicker">${esc(n.title.toUpperCase())}</p>`;
  if (n.kind === 'about') return `${intro}<div class="ph" style="margin-top:12px"><div class="avatar">${CV.avatar ? `<img src="${esc(safeUrl(CV.avatar))}" alt="">` : esc(initials(CV.name))}</div>
      <div><h2 id="panelTitle">${esc(CV.name)}</h2><p class="sub">${esc((CV.roles && CV.roles.length ? CV.roles : [CV.title]).join(' · '))}${CV.location ? ' · ' + esc(CV.location) : ''}</p></div></div>
      ${a.summary ? `<p>${esc(a.summary)}</p>` : ''}${a.summary2 ? `<p>${esc(a.summary2)}</p>` : ''}
      ${a.stats && a.stats.length ? `<h3>STATS</h3>${a.stats.map(s => `<div class="stat"><span>${esc(s.label)}</span><div class="bar"><i style="--v:${clamp(+s.value || 0, 0, 10) * 10}%"></i></div><b>${esc(s.value)}</b></div>`).join('')}` : ''}
      ${a.perks && a.perks.length ? `<h3>HIGHLIGHTS</h3>${bullets(a.perks)}` : ''}
      <div class="btnrow">${CV.email ? `<a class="btn" href="mailto:${esc(CV.email)}">✉ Email</a>` : ''}${linkBtns(CV.links, true)}</div>`;
  if (n.kind === 'skills') {
    const c = n.cat;
    return `${intro}<h2 id="panelTitle">${esc(c.category)}</h2>
      <div class="skillgrid"><div class="skillcat" style="--c:${ACCENT.skills}"><h4>${esc(c.category.toUpperCase())}</h4>${(c.items || []).map(s => `<div class="skill"><span class="nm">${esc(s.name)}</span>${s.level ? pips(clamp(+s.level, 0, 5)) : ''}</div>`).join('')}</div></div>
      <h3>ALL SKILL SETS</h3><p class="sub">${CV.skills.map((k, i) => { const got = npcs.some(m => m.kind === 'skills' && m.catIndex === i && m.found); return `${got ? '✓' : '?'} ${esc(k.category)}`; }).join(' &nbsp;·&nbsp; ')}</p>`;
  }
  if (n.kind === 'job') { const j = n.job; return `${intro}<h2 id="panelTitle">${esc(j.role)}</h2><p class="sub">${esc(j.company)}${j.location ? ' · ' + esc(j.location) : ''} · ${esc(j.period || '')}${j.duration ? ' · ' + esc(j.duration) : ''}</p>${bullets(j.points)}${tags(j.tech)}`; }
  if (n.kind === 'edu') { const e = n.edu; return `${intro}<h2 id="panelTitle">${esc(e.degree)}</h2><p class="sub">${esc(e.school)}${e.location ? ' · ' + esc(e.location) : ''} · ${esc(e.period || '')}</p>${bullets(e.details)}`; }
  if (n.kind === 'project') { const p = n.project; return `${intro}<h2 id="panelTitle">${esc(p.title)}</h2>${p.genre ? `<p class="sub">${esc(p.genre)}</p>` : ''}<p>${esc(p.description || '')}</p>${tags(p.tech)}<div class="btnrow">${linkBtns(p.links)}</div>`; }
  if (n.kind === 'award') { const a2 = n.award; return `${intro}<h2 id="panelTitle">${esc(a2.title)}</h2>${a2.detail ? `<p>${esc(a2.detail)}</p>` : ''}`; }
  return panelContact(intro);
}
function panelContact(intro = '') {
  const c = CV.contact || {}, tel = String(CV.phone || '').replace(/[^+\d]/g, '');
  return `${intro || '<p class="kicker">CONTACT</p>'}<h2 id="panelTitle">${esc(c.heading && c.heading !== 'Contact' ? c.heading : 'Get in touch')}</h2>${c.message ? `<p>${esc(c.message)}</p>` : ''}
    <div class="btnrow">${CV.email ? `<a class="btn" href="mailto:${esc(CV.email)}">✉ ${esc(CV.email)}</a>` : ''}${CV.phone ? `<a class="btn ghost" href="tel:${esc(tel)}">☎ ${esc(CV.phone)}</a>` : ''}${CV.resumePdf ? `<a class="btn ghost" href="${esc(safeUrl(CV.resumePdf))}" download>⬇ CV (PDF)</a>` : ''}</div>
    ${CV.links.some(l => safeUrl(l.url)) ? `<h3>FIND ME ONLINE</h3><div class="btnrow" style="margin-top:0">${linkBtns(CV.links, true)}</div>` : ''}
    <div class="btnrow"><a class="btn ghost" href="index.html">📄 Full resume page</a></div>`;
}
function panelHelp() {
  const rows = isTouch
    ? [['Left stick', 'Walk (push all the way to run)'], ['Drag right side', 'Look around'], ['● button / tap', 'Shoot the tag blaster'], ['▲ button', 'Jump']]
    : [['W A S D', 'Walk'], ['Mouse', 'Look around'], ['Click', 'Shoot the tag blaster'], ['Shift', 'Run'], ['Space', 'Jump'], ['M', 'Sound on / off'], ['Esc', 'Release the mouse']];
  return `<p class="kicker">HOW TO PLAY</p><h2 id="panelTitle">Tag the village</h2>
    <p>Every villager and animal carries something: a sign, a case, a crate, a book or a letter. Each one is part of my CV. Tag them with the blaster to read it. The gold <b>?</b> markers and the map show who you haven't found yet. Nobody gets hurt; they just jump.</p>
    <div class="controls-list">${rows.map(([k, v]) => `<kbd>${esc(k)}</kbd><span>${esc(v)}</span>`).join('')}</div>
    <p>Weather changes on its own, so you might get caught in the rain. Short on time? <a href="index.html">Read the resume page</a>.</p>`;
}
const modal = $('#modal'), panelEl = modal.querySelector('.panel'), panelBody = $('#panelBody');
function openPanel(html, color) {
  panelBody.innerHTML = html; panelEl.style.setProperty('--accent', color || '#6fa3a0'); panelEl.scrollTop = 0;
  modal.hidden = false; state = 'panel'; keys.clear(); joy.x = joy.y = 0;
  if (document.pointerLockElement) document.exitPointerLock();
  document.body.classList.remove('playing'); $('#crosshair').hidden = true;
}
function openNPC(n) { openPanel(panelFor(n), n.accent); }
function closePanel(fromClick) {
  modal.hidden = true; panelBody.innerHTML = '';
  if (npcs.length && foundCount() === npcs.length && !endShown) { showEnd(); return; }
  if (isTouch || dragLook) { resume(); return; }
  if (fromClick) { resume(); requestLock(); } else pause();
}
modal.addEventListener('click', e => { if (e.target.closest('[data-close]')) closePanel(true); });

/* =====================================================================
   SCREENS
   ===================================================================== */
const titleEl = $('#title'), pauseEl = $('#pause'), endEl = $('#end');
function renderTitle(ready) {
  const keysHtml = isTouch
    ? `<span>Left stick: walk</span><span>Drag: look</span><span>● : shoot</span>`
    : `<span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> walk</span><span><kbd>MOUSE</kbd> look</span><span><kbd>CLICK</kbd> tag</span><span><kbd>SHIFT</kbd> run</span><span><kbd>SPACE</kbd> jump</span>`;
  titleEl.innerHTML = `<div class="screen-inner">
    <p class="eyebrow">A PLAYABLE CV · 3D</p>
    <h1>${esc(CV.name)}</h1>
    <p class="role">${esc((CV.roles && CV.roles.length ? CV.roles : [CV.title]).join(' · '))}</p>
    <p class="tagline">Explore the village. Every character is carrying part of my CV. Tag them with the blaster to read it.</p>
    <div class="btnrow">
      <button type="button" class="big" id="btnStart"${ready ? '' : ' disabled'}>${ready ? '▶ PRESS START' : 'BUILDING WORLD…'}</button>
      <a class="ghostbig" href="index.html" style="text-decoration:none">📄 RESUME PAGE</a>
    </div>
    <div class="keys">${keysHtml}</div>
    <p class="note">Works best in Chrome, Edge or Firefox. On phones, turn sideways.</p></div>`;
  if (ready) $('#btnStart').addEventListener('click', startGame);
}
let playTime = 0, endShown = false; const SPAWN = new THREE.Vector3();
function startGame() {
  if (state !== 'title') return;
  audio.ensure();
  titleEl.hidden = true; $('#hud3d').hidden = false; $('#crosshair').hidden = false;
  player.pos.copy(SPAWN); player.vel.set(0, 0, 0); player.yaw = Math.PI; player.pitch = -0.05;
  state = 'play'; document.body.classList.add('playing');
  requestLock(); canvas.focus();
  banner('WELCOME TO THE VILLAGE', `${npcs.length} characters to find`, '#d1b25a');
  setTimeout(() => { if (state === 'play') toast(isTouch ? 'Tap or press ● to tag a character' : 'Click to tag a character · H for help', '#d1b25a'); }, 2600);
}
function pause() {
  state = 'paused'; keys.clear(); document.body.classList.remove('playing'); $('#crosshair').hidden = true;
  pauseEl.innerHTML = `<div class="screen-inner"><p class="eyebrow">PAUSED</p><h1 style="font-size:clamp(28px,5vw,48px)">${foundCount()}/${npcs.length} found</h1>
    <div class="btnrow"><button type="button" class="big" id="btnResume">▶ CLICK TO PLAY</button><a class="ghostbig" href="index.html" style="text-decoration:none">📄 RESUME PAGE</a></div></div>`;
  pauseEl.hidden = false;
  $('#btnResume').addEventListener('click', () => { resume(); requestLock(); });
}
function resume() { pauseEl.hidden = true; endEl.hidden = true; state = 'play'; document.body.classList.add('playing'); $('#crosshair').hidden = false; canvas.focus(); }
function toggleSound() { const m = audio.toggle(); $('#btnSound').classList.toggle('off', m); toast(m ? 'Sound off' : 'Sound on', '#6fa3a0'); }
$('#btnSound').addEventListener('click', e => { audio.ensure(); toggleSound(); e.currentTarget.blur(); });
$('#btnHelp').addEventListener('click', e => { e.currentTarget.blur(); openPanel(panelHelp(), '#6fa3a0'); });
$('#btnSound').classList.toggle('off', audio.muted);

function showEnd() {
  endShown = true; state = 'end'; audio.win(); document.body.classList.remove('playing'); $('#crosshair').hidden = true;
  if (document.pointerLockElement) document.exitPointerLock();
  const t = Math.floor(playTime), acc = player.shots ? Math.round(player.hits / player.shots * 100) : 100;
  endEl.innerHTML = `<div class="screen-inner"><p class="eyebrow">VILLAGE COMPLETE</p><h1>You found everyone!</h1>
    <div class="stats"><div><b>${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}</b><span>TIME</span></div>
    <div><b>${npcs.length}/${npcs.length}</b><span>CHARACTERS</span></div><div><b>${player.shots}</b><span>SHOTS</span></div><div><b>${acc}%</b><span>ACCURACY</span></div></div>
    <p class="tagline" style="margin:0 auto 26px">Thanks for exploring. Let's talk about what I can build for your team.</p>
    <div class="btnrow"><button type="button" class="big" id="endContact">✉ CONTACT ME</button><a class="ghostbig" href="index.html" style="text-decoration:none">📄 RESUME PAGE</a><button type="button" class="ghostbig" id="endBack">↺ KEEP EXPLORING</button></div></div>`;
  endEl.hidden = false;
  $('#endContact').addEventListener('click', () => { endEl.hidden = true; openPanel(panelContact(), ACCENT.contact); });
  $('#endBack').addEventListener('click', () => { resume(); requestLock(); });
}

/* =====================================================================
   LOOP
   ===================================================================== */
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
const clock = new THREE.Clock();
let elapsed = 0;
function frame() {
  const dt = Math.min(0.05, clock.getDelta()); elapsed += dt;
  updateWeather(dt);
  if (state === 'play') {
    updatePlayer(dt); playTime += dt;
    if (fireQueued) fire();
    updateAim(dt); updateHint(dt);
  } else if (state === 'title' || state === 'loading') {
    const a = elapsed * 0.05;
    camera.position.set(Math.sin(a) * 42, 16 + Math.sin(elapsed * 0.2) * 2, Math.cos(a) * 42);
    camera.lookAt(0, 3, 8);
    player.pos.set(camera.position.x, camera.position.y - EYE, camera.position.z);
  }
  fireQueued = false;
  if (state !== 'panel') { updateNPCs(dt, elapsed); updateEffects(dt); }
  updateRain(dt);
  clouds.forEach(c => { c.position.x += c.userData.v * dt; if (c.position.x > 280) c.position.x = -280; });
  if (waterTex) waterTex.offset.set(elapsed * 0.01, elapsed * 0.006);
  sky.position.copy(camera.position);
  sun.position.copy(player.pos).add(SUN_OFF); sun.target.position.copy(player.pos);
  if (state !== 'title' && state !== 'loading') drawMinimap(elapsed);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

/* =====================================================================
   BOOT
   ===================================================================== */
$('#hudName').textContent = CV.name; $('#hudTitle').textContent = (CV.roles && CV.roles[1]) || CV.title;
document.title = `Play — ${CV.name}`;
renderTitle(false); state = 'title';
const fontsReady = document.fonts && document.fonts.load
  ? Promise.race([Promise.all([document.fonts.load('700 40px "Chakra Petch"'), document.fonts.ready]), new Promise(r => setTimeout(r, 1800))])
  : Promise.resolve();
fontsReady.catch(() => {}).then(() => requestAnimationFrame(() => {
  buildTerrain(); buildWater(); buildBridge(); buildVillage(); buildNature(); buildClouds(); buildNPCs(); buildMinimapBase();
  const s = findSpot(0, -6); SPAWN.set(s[0], floorAt(s[0], s[1]), s[1]); player.pos.copy(SPAWN);
  if (/[?&]debug/.test(location.search)) window.__cv3d = { player, npcs, camera, weather };
  updateCounters(); updateWeather(0);
  renderTitle(true); frame();
}));
