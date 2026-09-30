import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PROFILE, SECTIONS, TOTAL_VIEWS, MEDIA_BASE } from './content.js';

const $ = (s) => document.querySelector(s);
const body = document.body;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const PLAY_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.8v14.4a.8.8 0 0 0 1.2.7l11.4-7.2a.8.8 0 0 0 0-1.4L8.2 4.1A.8.8 0 0 0 7 4.8z"/></svg>';
const media = (p) => MEDIA_BASE + p;

// ------------------------------------------------------------------ static content
$('#hud-ig').href = PROFILE.instagram;
$('#hud-mail').href = `mailto:${PROFILE.email}`;
$('#contact-mail').href = `mailto:${PROFILE.email}`;
$('#contact-ig').href = PROFILE.instagram;
$('#contact-email').textContent = PROFILE.email;
$('#about-photo').src = PROFILE.photo;
$('#about-name').textContent = PROFILE.name;
$('#about-role').textContent = PROFILE.role;
$('#about-views').textContent = TOTAL_VIEWS;
$('#fallback-link').href = PROFILE.classicSite;
$('#contact-copy').addEventListener('click', async (e) => {
  try {
    await navigator.clipboard.writeText(PROFILE.email);
    e.currentTarget.textContent = 'Copied!';
  } catch {
    e.currentTarget.textContent = PROFILE.email;
  }
});

function showFallback() {
  $('#fallback').hidden = false;
  $('#loader').classList.add('done');
}

// ------------------------------------------------------------------ renderer / scene
const canvas = $('#scene');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
} catch (err) {
  showFallback();
  throw err;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.03, 120);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;
controls.rotateSpeed = 0.6;
controls.zoomSpeed = 0.7;
controls.minPolarAngle = 0.5;
controls.maxPolarAngle = 1.4;
controls.minAzimuthAngle = -0.1;
controls.maxAzimuthAngle = 1.55;
controls.minDistance = 4.5;

// The home view looks at the room corner from the front-right, like an isometric diorama.
// Portrait phones hide the 3D menu (the dock covers it) and center on the room alone.
const HOME_DIR = new THREE.Vector3(6.25, 4.6, 7.35).normalize();
const isPortrait = () => innerWidth / innerHeight < 0.8;
function homeTarget() {
  return isPortrait() ? new THREE.Vector3(0.55, 1.0, -0.65) : new THREE.Vector3(1.2, 1.1, -1.1);
}
function homeDistance() {
  // fit a box of the scene's on-screen size (half-width x half-height, meters) into the view
  const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const halfW = isPortrait() ? 2.45 : 3.5;
  return 1.12 * Math.max(2.35 / tan, halfW / (tan * camera.aspect));
}
function homePosition() {
  return homeTarget().addScaledVector(HOME_DIR, homeDistance());
}
const menuParts = [];
function applyLayout() {
  const show = !isPortrait();
  for (const o of menuParts) o.visible = show;
}
function syncMaxDistance() {
  controls.maxDistance = Math.max(17, homeDistance() * 1.25);
}
syncMaxDistance();

// ------------------------------------------------------------------ lights
const hemi = new THREE.HemisphereLight(0xffe6c9, 0x2a1c12, 1.25);
scene.add(hemi);

const key = new THREE.DirectionalLight(0xffd6a6, 2.3);
key.position.set(-2.5, 7, 5.5);
key.target.position.set(0.5, 0.8, -0.8);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 20 });
key.shadow.bias = -0.0004;
key.shadow.normalBias = 0.02;
scene.add(key, key.target);

const fill = new THREE.DirectionalLight(0xbfcaff, 0.45);
fill.position.set(7, 4, 6);
scene.add(fill);

const lampLight = new THREE.PointLight(0xffb466, 5, 0, 1.6);
lampLight.position.set(1.66, 1.58, -1.15);
lampLight.castShadow = true;
lampLight.shadow.mapSize.set(512, 512);
lampLight.shadow.bias = -0.002;
scene.add(lampLight);

const screenGlow = new THREE.PointLight(0x9fb4ff, 0.8, 3, 2);
screenGlow.position.set(0.05, 1.25, -1.45);
scene.add(screenGlow);

// ------------------------------------------------------------------ interactive targets
const TARGETS = {
  Monitor: { label: 'My work', action: () => go('work') },
  Laptop: { label: 'About me', action: () => go('about') },
  Poster: { label: 'Contact me', action: () => go('contact') },
  Menu_Work: { label: 'My work', action: () => go('work'), menu: true },
  Menu_About: { label: 'About me', action: () => go('about'), menu: true },
  Menu_Contact: { label: 'Contact me', action: () => go('contact'), menu: true },
  Menu_Name: { label: 'Caden Padua', action: () => go('home'), menu: true },
  Controller: { label: 'Play my edits on the monitor', action: () => nextReel() },
  Lamp: { label: 'Toggle the lamp', action: () => toggleLamp() },
  Chair: { label: 'Spin the chair', action: () => spinChair() },
  Plant: { label: 'Say hi to the plant', action: () => wigglePlant() },
};
const pickables = [];
const targetMats = {};
const ACCENT = new THREE.Color(0xffb45e);
const GLOW = new THREE.Color(0x4a2a0c);

let room, chair, plant, leaves, monitorScreen, lcd, shadeMat, bulbMat, wallpaperTex;
const menuBase = new THREE.Color(0xf4ead8);

function setupRoom(root) {
  room = root;
  scene.add(room);
  room.traverse((o) => {
    if (!o.isMesh) return;
    const name = o.material.name || '';
    o.castShadow = true;
    o.receiveShadow = true;
    if (name === 'Screen_Wallpaper') {
      const map = o.material.map || o.material.emissiveMap;
      map.colorSpace = THREE.SRGBColorSpace;
      wallpaperTex = map;
      o.material = new THREE.MeshBasicMaterial({ map, toneMapped: false, color: 0xededed });
      o.castShadow = false;
    } else if (name === 'Chair_Holes') {
      o.material.alphaTest = 0.5;
      o.material.transparent = false;
      o.material.side = THREE.DoubleSide;
    } else if (name.startsWith('Grass')) {
      const t = o.material.map;
      t.magFilter = t.minFilter = THREE.NearestFilter;
      t.generateMipmaps = false;
      t.needsUpdate = true;
    } else if (name === 'Lamp_Shade') {
      o.material.side = THREE.DoubleSide;
      o.castShadow = false;
      shadeMat = o.material;
      shadeMat.userData.base = shadeMat.color.clone();
    } else if (name === 'Lamp_Bulb') {
      o.castShadow = false;
      bulbMat = o.material;
    } else if (name.startsWith('Menu')) {
      o.castShadow = o.receiveShadow = false;
    } else if (name === 'Carpet') {
      o.castShadow = false;
    }
  });

  monitorScreen = room.getObjectByName('Monitor_Screen');
  monitorScreen.material = monitorScreen.material.clone();
  lcd = room.getObjectByName('Controller_LCD');
  chair = room.getObjectByName('Chair');
  plant = room.getObjectByName('Plant');
  leaves = room.getObjectByName('Plant_Leaves');

  for (const [k, t] of Object.entries(TARGETS)) {
    const obj = room.getObjectByName(k);
    if (!obj) continue;
    targetMats[k] = [];
    obj.traverse((o) => {
      if (!o.isMesh) return;
      if (!o.material.isMeshBasicMaterial) {
        o.material = o.material.clone();
        o.material.userData.emissive0 = o.material.emissive.clone();
        o.material.userData.color0 = o.material.color.clone();
        targetMats[k].push(o.material);
      }
      if (!t.menu) {
        o.userData.target = k;
        pickables.push(o);
      }
    });
    if (t.menu) {
      // text is thin: click a padded invisible box instead
      obj.updateWorldMatrix(true, true);
      const box = new THREE.Box3().setFromObject(obj);
      const size = box.getSize(new THREE.Vector3()).addScalar(0.06);
      const hit = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), new THREE.MeshBasicMaterial({ visible: false }));
      box.getCenter(hit.position);
      hit.userData.target = k;
      hit.userData.menu = true;
      menuParts.push(obj);
      scene.add(hit);
      pickables.push(hit);
    }
  }
  lcd.material = lcd.material.clone();
  // the Lamp target cloned its materials above, so point at the live ones
  shadeMat = room.getObjectByName('Lamp_Shade').material;
  shadeMat.userData.base = shadeMat.color.clone();
  bulbMat = room.getObjectByName('Lamp_Bulb').material;
}

function highlight(k, on) {
  const t = TARGETS[k];
  for (const m of targetMats[k] || []) {
    if (t.menu) {
      m.color.copy(on ? ACCENT : m.userData.color0);
      m.emissive.copy(on ? ACCENT : m.userData.emissive0);
    } else {
      m.emissive.copy(on ? GLOW : m.userData.emissive0);
    }
  }
}

// ------------------------------------------------------------------ pointer: hover + click
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const tooltip = $('#tooltip');
let hoverKey = null;
let downAt = null;

function pick(e) {
  if (!room) return null;
  ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.intersectObjects(pickables, false).find((h) => !(h.object.userData.menu && isPortrait()));
  return hit ? hit.object.userData.target : null;
}
function setHover(k, e) {
  if (k !== hoverKey) {
    if (hoverKey) highlight(hoverKey, false);
    hoverKey = k;
    if (k) highlight(k, true);
    body.classList.toggle('pointer', !!k);
    tooltip.classList.toggle('on', !!k);
    if (k) tooltip.textContent = TARGETS[k].label;
  }
  if (k && e) {
    tooltip.style.left = `${e.clientX}px`;
    tooltip.style.top = `${e.clientY}px`;
  }
}
canvas.addEventListener('pointerdown', (e) => { downAt = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse' || state.focus || tween) return setHover(null);
  if (e.buttons) return;
  setHover(pick(e), e);
});
canvas.addEventListener('pointerleave', () => setHover(null));
canvas.addEventListener('pointerup', (e) => {
  if (!downAt) return;
  const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6;
  downAt = null;
  if (moved) { body.classList.add('moved'); return; }
  if (tween) return;
  if (state.focus) { go('home'); return; }
  const k = pick(e);
  if (k) { setHover(null); TARGETS[k].action(); }
});

// ------------------------------------------------------------------ camera tweening
let tween = null;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
function flyTo(pos, target, dur = 1.5, done) {
  controls.enabled = false;
  tween = {
    p0: camera.position.clone(), t0: controls.target.clone(), p1: pos.clone(), t1: target.clone(),
    start: performance.now(), dur: reduceMotion ? 1 : dur * 1000, done,
  };
}
function stepTween(now) {
  if (!tween) return;
  const t = Math.min(1, (now - tween.start) / tween.dur);
  const k = ease(t);
  camera.position.lerpVectors(tween.p0, tween.p1, k);
  controls.target.lerpVectors(tween.t0, tween.t1, k);
  // arc upward a little mid-flight so the camera doesn't skim furniture
  camera.position.y += Math.sin(k * Math.PI) * 0.35 * tween.p0.distanceTo(tween.p1) / 10;
  camera.lookAt(controls.target);
  if (t >= 1) {
    const done = tween.done;
    tween = null;
    done && done();
  }
}

// ------------------------------------------------------------------ focus views (monitor / laptop / poster)
const FOCUS = {
  work: { mesh: 'Monitor_Screen', fill: 0.92, minW: 700, el: $('#screen-work') },
  about: { mesh: 'Laptop_Screen', fill: 0.92, minW: 540, el: $('#screen-about') },
  contact: { mesh: 'Poster_Print', fill: 0.84, minW: 250, el: $('#screen-contact') },
};
const state = { focus: null };

function screenFrame(meshName) {
  const mesh = room.getObjectByName(meshName);
  mesh.updateWorldMatrix(true, false);
  const pos = mesh.geometry.attributes.position;
  const pts = [];
  for (let i = 0; i < pos.count; i++) pts.push(new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld));
  const c = pts.reduce((a, p) => a.add(p), new THREE.Vector3()).divideScalar(pts.length);
  const n = new THREE.Vector3().fromBufferAttribute(mesh.geometry.attributes.normal, 0).transformDirection(mesh.matrixWorld);
  const up = new THREE.Vector3(0, 1, 0).addScaledVector(n, -n.y).normalize();
  const right = new THREE.Vector3().crossVectors(n.clone().negate(), up).normalize();
  let w = 0, h = 0;
  for (const p of pts) {
    const d = p.clone().sub(c);
    w = Math.max(w, Math.abs(d.dot(right)) * 2);
    h = Math.max(h, Math.abs(d.dot(up)) * 2);
  }
  return { c, n, up, right, w, h };
}
function focusCamera(k) {
  const f = screenFrame(FOCUS[k].mesh);
  const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const fillK = FOCUS[k].fill;
  const d = Math.max(f.h / 2 / tan / fillK, f.w / 2 / (tan * camera.aspect) / fillK);
  return { pos: f.c.clone().addScaledVector(f.n, d), target: f.c.clone(), frame: f };
}
function placeOverlay(k) {
  const { el, minW } = FOCUS[k];
  const f = screenFrame(FOCUS[k].mesh);
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) =>
    f.c.clone().addScaledVector(f.right, (sx * f.w) / 2).addScaledVector(f.up, (sy * f.h) / 2).project(camera));
  const xs = corners.map((p) => (p.x * 0.5 + 0.5) * innerWidth);
  const ys = corners.map((p) => (-p.y * 0.5 + 0.5) * innerHeight);
  let r = { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
  const full = r.w < minW;
  if (full) {
    // small screens: open the page as a floating panel instead of pinning it to the object
    const top = 64, pad = 12;
    const maxW = k === 'contact' ? 440 : 1100;
    const w = Math.min(innerWidth - pad * 2, maxW);
    const h = k === 'contact' ? Math.min(innerHeight - top - pad, w * 1.75) : innerHeight - top - pad;
    r = { x: (innerWidth - w) / 2, y: top, w, h };
  }
  el.classList.toggle('full', full);
  Object.assign(el.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` });
}

function go(k, { keyboard = false } = {}) {
  if (!room || tween) return;
  if (k === state.focus) return;
  hideOverlays();
  setHover(null);
  if (k === 'home') {
    state.focus = null;
    body.classList.remove('focused');
    $('#back').hidden = true;
    flyTo(homePosition(), homeTarget(), 1.5, () => { controls.enabled = true; });
    return;
  }
  state.focus = k;
  body.classList.add('focused');
  const v = focusCamera(k);
  flyTo(v.pos, v.target, 1.6, () => {
    const el = FOCUS[k].el;
    placeOverlay(k);
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add('on'));
    $('#back').hidden = false;
    if (keyboard) {
      const first = el.querySelector('button, a');
      first && first.focus({ preventScroll: true });
    }
  });
}
function hideOverlays() {
  for (const { el } of Object.values(FOCUS)) {
    el.classList.remove('on');
    el.hidden = true;
  }
  closePlayer();
}
// e.detail === 0 means the button was activated from the keyboard
document.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', (e) => go(b.dataset.go, { keyboard: e.detail === 0 })));
$('#back').addEventListener('click', () => go('home'));
addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!$('#work-player').hidden) closePlayer();
    else if (state.focus) go('home');
  }
});

// ------------------------------------------------------------------ "My work" window
const tabs = $('#work-tabs');
const grid = $('#work-grid');
const player = $('#work-player');
const stage = $('#player-stage');
let tabIndex = 0;
let playing = null;

SECTIONS.forEach((s, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.role = 'tab';
  b.textContent = s.title;
  b.addEventListener('click', () => showSection(i));
  tabs.append(b);
});
function showSection(i) {
  tabIndex = i;
  closePlayer();
  const s = SECTIONS[i];
  [...tabs.children].forEach((b, j) => b.setAttribute('aria-selected', String(i === j)));
  $('#work-blurb').textContent = s.blurb;
  grid.className = s.kind === 'youtube' ? 'grid wide' : 'grid';
  grid.replaceChildren(...s.items.map((it, j) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'card';
    b.setAttribute('aria-label', `Play ${it.title}`);
    const src = s.kind === 'youtube' ? media(`thumbs/${it.yt}.jpg`) : media(`posters/${it.file}.jpg`);
    b.innerHTML = `<span class="thumb"><img loading="lazy" alt=""><span class="play">${PLAY_SVG}</span></span><span class="card-meta"><strong></strong><span></span></span>`;
    b.querySelector('img').src = src;
    b.querySelector('strong').textContent = it.title;
    b.querySelector('.card-meta span').textContent = it.meta;
    b.addEventListener('click', () => openPlayer(j));
    return b;
  }));
  grid.parentElement.scrollTop = 0;
}
function openPlayer(j) {
  const s = SECTIONS[tabIndex];
  const n = s.items.length;
  j = ((j % n) + n) % n;
  const it = s.items[j];
  playing = j;
  stopReel();
  $('#player-title').textContent = it.title;
  $('#player-meta').textContent = it.meta;
  if (s.kind === 'youtube') {
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${it.yt}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
    f.title = it.title;
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    stage.replaceChildren(f);
  } else {
    const v = document.createElement('video');
    v.src = media(`media/${it.file}.mp4`);
    v.poster = media(`posters/${it.file}.jpg`);
    v.controls = true;
    v.playsInline = true;
    v.autoplay = true;
    stage.replaceChildren(v);
  }
  player.hidden = false;
}
function closePlayer() {
  stage.replaceChildren();
  player.hidden = true;
  playing = null;
}
$('#player-close').addEventListener('click', closePlayer);
$('#player-prev').addEventListener('click', () => openPlayer(playing - 1));
$('#player-next').addEventListener('click', () => openPlayer(playing + 1));
showSection(0);

// ------------------------------------------------------------------ fun bits
const anims = [];
function animate(dur, fn, done) {
  const start = performance.now();
  anims.push((now) => {
    const t = Math.min(1, (now - start) / (dur * 1000));
    fn(t);
    if (t >= 1) { done && done(); return false; }
    return true;
  });
}
let chairSpinning = false;
function spinChair() {
  if (chairSpinning) return;
  chairSpinning = true;
  const y0 = chair.rotation.y;
  animate(1.4, (t) => { chair.rotation.y = y0 + ease(t) * Math.PI * 2; }, () => { chairSpinning = false; });
}
function wigglePlant() {
  const s0 = plant.scale.clone();
  animate(0.9, (t) => {
    const k = Math.sin(t * Math.PI * 4) * (1 - t) * 0.12;
    plant.scale.set(s0.x * (1 - k * 0.5), s0.y * (1 + k), s0.z * (1 - k * 0.5));
  });
}
let lampOn = true;
let lampK = 1;
function toggleLamp() { lampOn = !lampOn; }
function stepLamp(dt) {
  lampK += ((lampOn ? 1 : 0) - lampK) * Math.min(1, dt * 8);
  lampLight.intensity = 5 * lampK;
  hemi.intensity = 0.45 + 0.8 * lampK;
  key.intensity = 0.5 + 1.8 * lampK;
  screenGlow.intensity = 0.8 + 1.6 * (1 - lampK);
  if (shadeMat) {
    shadeMat.emissiveIntensity = 0.1 + 0.9 * lampK;
    shadeMat.color.copy(shadeMat.userData.base).multiplyScalar(0.35 + 0.65 * lampK);
  }
  if (bulbMat) bulbMat.emissiveIntensity = 0.1 + 0.9 * lampK;
}

// Stream-deck controller: plays my vertical edits (muted) on the monitor, one per click.
const reelItems = SECTIONS.filter((s) => s.kind === 'vertical').flatMap((s) => s.items);
const reel = { idx: -1, video: null, canvas: null, ctx: null, tex: null, mat: null };
function nextReel() {
  if (lcd) {
    const m = lcd.material;
    animate(0.5, (t) => { m.emissiveIntensity = 0.6 + 3 * (1 - t); });
  }
  reel.idx += 1;
  if (reel.idx >= reelItems.length) { stopReel(); return; }
  if (!reel.canvas) {
    reel.canvas = document.createElement('canvas');
    reel.canvas.width = 1024;
    reel.canvas.height = 600;
    reel.ctx = reel.canvas.getContext('2d');
    reel.tex = new THREE.CanvasTexture(reel.canvas);
    reel.tex.colorSpace = THREE.SRGBColorSpace;
    reel.tex.flipY = false;
    reel.mat = new THREE.MeshBasicMaterial({ map: reel.tex, toneMapped: false });
    reel.video = document.createElement('video');
    reel.video.crossOrigin = 'anonymous';
    reel.video.muted = true;
    reel.video.loop = true;
    reel.video.playsInline = true;
  }
  const it = reelItems[reel.idx];
  reel.video.src = media(`media/${it.file}.mp4`);
  reel.video.play().catch(() => {});
  reel.title = it.title;
  monitorScreen.material = reel.mat;
  tooltip.textContent = `Now playing: ${it.title} (click again for the next edit)`;
  TARGETS.Controller.label = 'Next edit';
}
function stopReel() {
  if (!reel.video) return;
  reel.video.pause();
  reel.idx = -1;
  monitorScreen.material = monitorScreen.userData.baseMat;
  TARGETS.Controller.label = 'Play my edits on the monitor';
}
function drawReel() {
  const { ctx, video } = reel;
  const W = 1024, H = 600;
  if (wallpaperTex && wallpaperTex.image) ctx.drawImage(wallpaperTex.image, 0, 0, W, H);
  ctx.fillStyle = 'rgba(12, 14, 30, 0.45)';
  ctx.fillRect(0, 0, W, H);
  const vh = H * 0.9, vw = vh * 9 / 16, x = W * 0.62 - vw / 2, y = (H - vh) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, vw, vh, 18);
  ctx.clip();
  if (video.readyState >= 2) ctx.drawImage(video, x, y, vw, vh);
  else { ctx.fillStyle = '#000'; ctx.fillRect(x, y, vw, vh); }
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.font = '600 22px -apple-system, system-ui, sans-serif';
  ctx.fillText('NOW PLAYING', 56, 250);
  ctx.font = '700 34px -apple-system, system-ui, sans-serif';
  wrapText(ctx, reel.title, 56, 296, x - 90, 40);
  ctx.font = '500 20px -apple-system, system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.75)';
  ctx.fillText(`Edit ${reel.idx + 1} of ${reelItems.length}`, 56, 420);
  reel.tex.needsUpdate = true;
}
function wrapText(ctx, text, x, y, maxW, lh) {
  let line = '';
  for (const word of text.split(' ')) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, y); line = word; y += lh; }
    else line = test;
  }
  ctx.fillText(line, x, y);
}

// ------------------------------------------------------------------ load + loop
const loaderPct = $('#loader-pct');
const loader = new GLTFLoader();
loader.load('assets/room.glb?v=4', (gltf) => {
  setupRoom(gltf.scene);
  menuParts.push(room.getObjectByName('Menu_Role'));
  applyLayout();
  monitorScreen.userData.baseMat = monitorScreen.material;
  $('#loader').classList.add('done');
  // intro: drift in from further out
  const target = homeTarget();
  camera.position.copy(target).addScaledVector(HOME_DIR.clone().add(new THREE.Vector3(0.25, 0.35, -0.1)).normalize(), homeDistance() * 1.6);
  controls.target.copy(target);
  camera.lookAt(target);
  flyTo(homePosition(), target, 2.4, () => { controls.enabled = true; });
}, (e) => {
  if (e.total) loaderPct.textContent = ` ${Math.round((e.loaded / e.total) * 100)}%`;
}, (err) => {
  console.error(err);
  showFallback();
});

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  stepTween(now);
  if (!tween && !state.focus) controls.update();
  for (let i = anims.length - 1; i >= 0; i--) if (!anims[i](now)) anims.splice(i, 1);
  stepLamp(dt);
  if (leaves && !reduceMotion) leaves.rotation.z = Math.sin(now / 1400) * 0.025;
  if (reel.idx >= 0 && reel.ctx) drawReel();
  if (state.focus && !tween) placeOverlay(state.focus);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  syncMaxDistance();
  const wasPortrait = menuParts.length && !menuParts[0].visible;
  applyLayout();
  if (room && !state.focus && !tween && wasPortrait !== isPortrait()) {
    camera.position.copy(homePosition());
    controls.target.copy(homeTarget());
  }
  if (state.focus && !tween) {
    const v = focusCamera(state.focus);
    camera.position.copy(v.pos);
    controls.target.copy(v.target);
    camera.lookAt(v.target);
  }
});
