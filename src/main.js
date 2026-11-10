import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createBooth } from './booth.js';
import { createAnnotations } from './annotations.js';
import { createMaterials, applyFinish } from './materials.js';
import { buildTextures } from './textures.js';
import { createConferenceRoom } from './room.js';
import { mountUI } from './ui.js';
import {
  CAMERA,
  PRESET_LIST,
  VIEWS,
  computeLayout,
  decodeConfig,
  defaultConfig,
  encodeConfig,
} from './layout.js';
import './style.css';

const query = new URLSearchParams(location.search);
if (query.get('chrome') === '0') document.body.classList.add('bare');

const viewport = document.querySelector('#viewport');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xe4d9c8);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputColorSpace = THREE.SRGBColorSpace;
viewport.appendChild(renderer.domElement);

const labels = new CSS2DRenderer();
labels.setSize(window.innerWidth, window.innerHeight);
labels.domElement.style.position = 'absolute';
labels.domElement.style.inset = '0';
labels.domElement.style.pointerEvents = 'none';
viewport.appendChild(labels.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#e4d9c8');
scene.fog = new THREE.Fog('#e4d9c8', 16, 32);

const camera = new THREE.PerspectiveCamera(
  CAMERA.fov,
  1,
  CAMERA.near,
  CAMERA.far,
);

let viewReady = false;

function fit() {
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;
  if (!width || !height) return;
  const nextAspect = width / height;
  // A phone URL bar changes the height a little. Only a real rotation, or
  // hiding the chrome, should pull a preset camera back to its framed pose.
  const rel = Math.abs(nextAspect - camera.aspect) / Math.max(camera.aspect, 0.2);
  camera.aspect = nextAspect;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  labels.setSize(width, height);
  if (viewReady && rel > 0.18 && currentView !== 'free') goView(currentView, true);
}

if (window.matchMedia('(max-width: 900px)').matches) {
  document.querySelector('#panel-more').open = false;
}

new ResizeObserver(fit).observe(viewport);
fit();
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxDistance = 16;
controls.minDistance = 1.2;
controls.maxPolarAngle = Math.PI / 2 - 0.04;
controls.screenSpacePanning = true;
controls.target.set(0, 1.05, 0);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;
pmrem.dispose();

const hemi = new THREE.HemisphereLight('#f7f1e6', '#d9cbb8', 0.85);
scene.add(hemi);
const key = new THREE.DirectionalLight('#fff6ec', 1.45);
key.position.set(3.2, 5.5, 4.4);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.near = 0.4;
key.shadow.camera.far = 18;
key.shadow.camera.left = -6;
key.shadow.camera.right = 6;
key.shadow.camera.top = 6;
key.shadow.camera.bottom = -6;
key.shadow.bias = -0.00035;
key.shadow.normalBias = 0.025;
key.target.position.set(0, 1, 0);
scene.add(key, key.target);
const fill = new THREE.DirectionalLight('#f3eadc', 0.55);
fill.position.set(-4.2, 4.2, 2.2);
scene.add(fill);
const spot = new THREE.SpotLight('#fff6e8', 6, 14, 0.85, 0.65, 1);
spot.position.set(0.2, 5.2, 2.4);
spot.target.position.set(0, 1.3, 0);
scene.add(spot, spot.target);

scene.add(createConferenceRoom(renderer.capabilities.getMaxAnisotropy()));

const grid = new THREE.GridHelper(10, 10, 0x8d7d68, 0xd2c6b4);
grid.position.y = 0.001;
grid.visible = false;
scene.add(grid);

const mats = createMaterials();
let headerTexture = null;
let partnerTexture = null;
let userTexture = null;
let dogsTexture = null;
let booth = null;
let anim = null;
let currentView = 'hero';

function readState() {
  const fromHash = decodeConfig(location.hash.replace(/^#/, ''));
  let next = fromHash || defaultConfig();
  if (!fromHash && query.get('preset')) {
    const preset = PRESET_LIST.find((item) => item.id === query.get('preset'));
    if (preset) next = { ...preset.config };
  }
  if (query.get('dims') === '1') next.dims = true;
  if (query.get('markup') === '1') next.markup = true;
  return next;
}

let state = readState();

function discard(root) {
  const textures = root.userData.textures;
  root.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.userData.disposeMat) {
      const mat = obj.userData.disposeMat;
      if (mat.userData?.ownsMap && mat.map) mat.map.dispose();
      mat.dispose();
    }
    if (obj.element?.parentNode) obj.element.remove();
  });
  textures?.dispose();
  scene.remove(root);
}

function applyFlags() {
  const header = booth?.getObjectByName('header');
  if (header) header.visible = state.header !== false;
  const person = booth?.getObjectByName('person');
  if (person) person.visible = !!state.person;
  const dims = booth?.getObjectByName('dims');
  if (dims) dims.visible = !!state.dims;
  const markup = booth?.getObjectByName('markup');
  if (markup) markup.visible = !!state.markup;
  grid.visible = !!state.dims;
}

function rebuild() {
  if (booth) discard(booth);
  const layout = computeLayout(state);
  const tex = buildTextures(layout, renderer.capabilities.getMaxAnisotropy());
  tex.header = headerTexture;
  tex.sign = layout.sign?.design === 'user' ? userTexture : partnerTexture;
  tex.dogs = dogsTexture;
  booth = createBooth(state, layout, mats, tex);
  booth.add(createAnnotations(layout, state));
  scene.add(booth);
  applyFlags();
}

function syncHash() {
  const next = `#${encodeConfig({ ...state, view: currentView })}`;
  const url = `${location.pathname}${location.search}${next}`;
  if (`${location.pathname}${location.search}${location.hash}` !== url) {
    history.replaceState(null, '', url);
  }
}

// Corners of the person, the booth and the sign. A narrow canvas steps each
// preset back along its own viewing direction until these points fit.
// Wide canvases keep the authored pose, so the desktop pictures do not move.
const FRAME_POINTS = [
  [-2.3, 1.1, 0.53],
  [-2.12, 1.72, 0.53],
  [-1.9, 0.02, 0.53],
  [1.305, 0.07, 0.66],
  [1.972, 0.07, 0.66],
  [1.305, 2.07, 0.66],
  [1.972, 2.07, 0.66],
  [-1.125, 0, -0.375],
  [1.125, 0, -0.375],
  [-1.125, 2.25, -0.375],
  [1.125, 2.25, -0.375],
  [-1.125, 2.25, 0.375],
  [1.125, 2.25, 0.375],
  [-1.125, 0, 0.375],
  [1.125, 0, 0.375],
].map(([x, y, z]) => new THREE.Vector3(x, y, z));
const frameCam = new THREE.PerspectiveCamera(CAMERA.fov, 1, CAMERA.near, CAMERA.far);
const frameVec = new THREE.Vector3();

function frameSpan(position, target, up, fov, aspect) {
  frameCam.fov = fov;
  frameCam.aspect = aspect;
  frameCam.up.copy(up);
  frameCam.position.copy(position);
  frameCam.lookAt(target);
  frameCam.updateProjectionMatrix();
  frameCam.updateMatrixWorld();
  let span = 0;
  for (const point of FRAME_POINTS) {
    frameVec.copy(point).project(frameCam);
    span = Math.max(span, Math.abs(frameVec.x), Math.abs(frameVec.y));
  }
  return span;
}

// The plan camera stays under the ceiling and widens its lens instead of
// climbing through the roof.
function roomLimit(target, offset) {
  const dir = offset.clone().normalize();
  const min = new THREE.Vector3(-11.2, 0.45, -9.2);
  const max = new THREE.Vector3(11.2, 6.35, 11.2);
  let limit = Infinity;
  for (const axis of ['x', 'y', 'z']) {
    if (Math.abs(dir[axis]) < 1e-5) continue;
    const bound = dir[axis] > 0 ? max[axis] : min[axis];
    const reach = (bound - target[axis]) / dir[axis];
    if (reach > 0.2) limit = Math.min(limit, reach);
  }
  return limit;
}

function framedPose(view) {
  const target = new THREE.Vector3(view.target[0], view.target[1], view.target[2]);
  const offset = new THREE.Vector3(view.pos[0], view.pos[1], view.pos[2]).sub(target);
  const authored = Math.max(offset.length(), 0.001);
  const aspect = Math.max(camera.aspect || 1, 0.42);
  let fov = CAMERA.fov;
  if (aspect < 1.15) {
    const dir = offset.clone().normalize();
    const up = new THREE.Vector3(view.up[0], view.up[1], view.up[2]);
    const cap = Math.max(Math.min(roomLimit(target, offset) - 0.25, 15.5), authored);
    const at = (distance, lens) => frameSpan(target.clone().addScaledVector(dir, distance), target, up, lens, aspect);
    const fit = 0.92;
    if (at(authored, CAMERA.fov) > fit) {
      let lo = authored;
      let hi = cap;
      if (at(hi, CAMERA.fov) > fit) {
        const base = (CAMERA.fov * Math.PI) / 360;
        fov = THREE.MathUtils.clamp(
          THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(base) * (at(hi, CAMERA.fov) / fit))),
          CAMERA.fov,
          62,
        );
        offset.setLength(hi);
      } else {
        for (let i = 0; i < 14; i += 1) {
          const mid = (lo + hi) / 2;
          if (at(mid, CAMERA.fov) > fit) lo = mid;
          else hi = mid;
        }
        offset.setLength(hi);
      }
    }
  }
  return { position: target.clone().add(offset), target, fov };
}

function goView(name, immediate = false) {
  const view = VIEWS[name] || VIEWS.hero;
  currentView = VIEWS[name] ? name : 'hero';
  controls.enableRotate = view.rotate;
  controls.minPolarAngle = view.rotate ? 0.12 : 0;
  controls.maxPolarAngle = view.rotate ? Math.PI / 2 - 0.04 : Math.PI;
  camera.up.set(view.up[0], view.up[1], view.up[2]);
  const pose = framedPose(view);
  camera.fov = pose.fov;
  camera.updateProjectionMatrix();
  const toP = pose.position;
  const toT = pose.target;
  if (camera.aspect < 1.15) {
    const reach = roomLimit(toT, toP.clone().sub(toT));
    controls.maxDistance = Math.min(16, Math.max(reach - 0.2, 2.4));
  } else {
    controls.maxDistance = 16;
  }
  if (immediate) {
    anim = null;
    camera.position.copy(toP);
    controls.target.copy(toT);
    controls.update();
    return;
  }
  anim = {
    t: 0,
    fromP: camera.position.clone(),
    toP,
    fromT: controls.target.clone(),
    toT,
  };
}

function restoreCam(cam) {
  currentView = 'free';
  camera.up.set(cam.u[0], cam.u[1], cam.u[2]);
  camera.position.set(cam.p[0], cam.p[1], cam.p[2]);
  controls.target.set(cam.t[0], cam.t[1], cam.t[2]);
  controls.enableRotate = Math.abs(cam.u[1]) > 0.5;
  controls.update();
}

function toast(message) {
  const el = document.querySelector('#toast');
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { el.hidden = true; }, 2200);
}

function commit(kind) {
  if (kind === 'struct') rebuild();
  applyFinish(mats, state.finish);
  applyFlags();
  syncHash();
  ui.refresh(state, currentView);
}

const ui = mountUI({
  set(key, value) {
    state[key] = value;
    if (key === 'person' || key === 'dims' || key === 'markup' || key === 'header') commit('flag');
    else if (key === 'finish') commit('finish');
    else if (key === 'floor') commit('floor');
    else if (key === 'light') commit('light');
    else commit('struct');
  },
  setNote(value) {
    state.note = value;
    syncHash();
    ui.refresh(state, currentView);
  },
  applyPreset(id) {
    const preset = PRESET_LIST.find((item) => item.id === id);
    if (!preset) return;
    state = { ...preset.config, note: state.note, view: currentView, cam: state.cam };
    commit('struct');
  },
  view(name) {
    state.cam = null;
    goView(name);
    syncHash();
    ui.refresh(state, currentView);
  },
  async download(href, filename) {
    try {
      const response = await fetch(href);
      if (!response.ok) throw new Error(String(response.status));
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'sign.jpg';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      toast('입간판 이미지를 내려받았습니다.');
    } catch {
      toast('입간판 이미지를 내려받지 못했습니다.');
    }
  },
  async copyLink() {
    syncHash();
    const url = location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast('이 구성 링크를 복사했습니다.');
    } catch {
      toast(url);
    }
  },
});

controls.addEventListener('end', () => {
  if (anim) return;
  currentView = 'free';
  state.view = 'free';
  state.cam = {
    p: camera.position.toArray().map((n) => +n.toFixed(3)),
    t: controls.target.toArray().map((n) => +n.toFixed(3)),
    u: [+camera.up.x.toFixed(3), +camera.up.y.toFixed(3), +camera.up.z.toFixed(3)],
  };
  syncHash();
  ui.refresh(state, currentView);
});

window.addEventListener('keydown', (event) => {
  if (event.target.matches('textarea, input')) return;
  const views = { 1: 'hero', 2: 'front', 3: 'side', 4: 'top', 5: 'visitor' };
  if (views[event.key]) {
    state.cam = null;
    goView(views[event.key]);
    syncHash();
    ui.refresh(state, currentView);
  } else if (event.key === 'd' || event.key === 'D' || event.key === 'ㅇ') {
    state.dims = !state.dims;
    commit('flag');
  } else if (event.key === 'm' || event.key === 'M' || event.key === 'ㅡ') {
    state.markup = !state.markup;
    commit('flag');
  } else if (event.key === 'h' || event.key === 'H') {
    document.body.classList.toggle('bare');
    fit();
  }
});

document.querySelector('#close-drawing').addEventListener('click', () => {
  document.querySelector('#lightbox').hidden = true;
});
document.querySelector('#lightbox').addEventListener('click', (event) => {
  if (event.target.id === 'lightbox') event.currentTarget.hidden = true;
});
document.querySelector('#open-drawing').addEventListener('click', () => {
  document.querySelector('#lightbox').hidden = false;
});

window.addEventListener('hashchange', () => {
  const next = decodeConfig(location.hash.replace(/^#/, ''));
  if (!next) return;
  state = next;
  rebuild();
  applyFinish(mats, state.finish);
  if (state.view === 'free' && state.cam) restoreCam(state.cam);
  else goView(state.view || 'hero', true);
  ui.refresh(state, currentView);
});

const clock = new THREE.Clock();
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (anim) {
    anim.t = Math.min(1, anim.t + dt / 0.7);
    const k = 1 - (1 - anim.t) ** 3;
    camera.position.lerpVectors(anim.fromP, anim.toP, k);
    controls.target.lerpVectors(anim.fromT, anim.toT, k);
    if (anim.t >= 1) {
      anim = null;
      controls.update();
    }
  } else {
    controls.update();
  }
  renderer.render(scene, camera);
  labels.render(scene, camera);
}

async function boot() {
  try {
    await Promise.race([
      document.fonts.load('600 42px Pretendard'),
      new Promise((resolve) => { setTimeout(resolve, 1800); }),
    ]);
  } catch {
    // Fall back to the system Korean font if Pretendard does not arrive.
  }
  const loader = new THREE.TextureLoader();
  const anisotropy = renderer.capabilities.getMaxAnisotropy();
  try {
    const texture = await loader.loadAsync(`${import.meta.env.BASE_URL}brand/header.png`);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = anisotropy;
    headerTexture = texture;
  } catch {
    toast('상단 배너 이미지를 불러오지 못했습니다.');
  }
  try {
    const texture = await loader.loadAsync(`${import.meta.env.BASE_URL}brand/partner-voices.jpg`);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = anisotropy;
    partnerTexture = texture;
  } catch {
    toast('경영진 보고 포스터 이미지를 불러오지 못했습니다.');
  }
  try {
    const texture = await loader.loadAsync(`${import.meta.env.BASE_URL}brand/user-voices.jpg`);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = anisotropy;
    userTexture = texture;
  } catch {
    toast('Fair행사 포스터 이미지를 불러오지 못했습니다.');
  }
  try {
    const texture = await loader.loadAsync(`${import.meta.env.BASE_URL}brand/tracker-dogs.png`);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = anisotropy;
    // Mipmaps soften the headline. Sample the photo directly so the type stays sharp.
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    const aspect = texture.image.width / texture.image.height;
    if (aspect > 1) {
      const repeatX = 1 / aspect;
      texture.repeat.set(repeatX, 1);
      texture.offset.set((1 - repeatX) / 2, 0);
    } else if (aspect < 1) {
      const repeatY = aspect;
      texture.repeat.set(1, repeatY);
      texture.offset.set(0, (1 - repeatY) / 2);
    }
    dogsTexture = texture;
  } catch {
    toast('반려견 사진을 불러오지 못했습니다.');
  }
  document.querySelector('#drawing-img').src = `${import.meta.env.BASE_URL}brand/drawing.png`;
  rebuild();
  applyFinish(mats, state.finish);
  if (query.get('view')) goView(query.get('view'), true);
  else if (state.view === 'free' && state.cam) restoreCam(state.cam);
  else goView(state.view || 'hero', true);
  ui.refresh(state, currentView);
  document.body.classList.add('ready');
  viewReady = true;
  frame();
}

boot();
