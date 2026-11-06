import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createBooth } from './booth.js';
import { createAnnotations } from './annotations.js';
import { createMaterials, applyFinish } from './materials.js';
import { buildTextures, buildFloors } from './textures.js';
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
renderer.setClearColor(0xd5cec3);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.94;
renderer.outputColorSpace = THREE.SRGBColorSpace;
viewport.appendChild(renderer.domElement);

const labels = new CSS2DRenderer();
labels.setSize(window.innerWidth, window.innerHeight);
labels.domElement.style.position = 'absolute';
labels.domElement.style.inset = '0';
labels.domElement.style.pointerEvents = 'none';
viewport.appendChild(labels.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#d5cec3');
scene.fog = new THREE.Fog('#d5cec3', 12, 19);

const camera = new THREE.PerspectiveCamera(
  CAMERA.fov,
  window.innerWidth / window.innerHeight,
  CAMERA.near,
  CAMERA.far,
);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxDistance = 12;
controls.minDistance = 1.2;
controls.maxPolarAngle = Math.PI / 2 - 0.04;
controls.screenSpacePanning = true;
controls.target.set(0, 1.05, 0);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.72;
pmrem.dispose();

const hemi = new THREE.HemisphereLight('#f6f3ec', '#c8bfb2', 0.45);
scene.add(hemi);
const key = new THREE.DirectionalLight('#fff7ee', 2.6);
key.position.set(3.4, 6.6, 3.6);
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
const fill = new THREE.DirectionalLight('#e4edf8', 0.7);
fill.position.set(-3.6, 3.4, 2.4);
scene.add(fill);
const spot = new THREE.SpotLight('#fff4e4', 8, 9, 0.62, 0.55, 1);
spot.position.set(0.1, 3.8, 2.2);
spot.target.position.set(0, 1.45, 0);
scene.add(spot, spot.target);

const floorMat = new THREE.MeshStandardMaterial({ color: '#e4dfd6', roughness: 0.48, metalness: 0 });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(22, 22), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.002;
floor.receiveShadow = true;
scene.add(floor);

const backWall = new THREE.Mesh(
  new THREE.PlaneGeometry(16, 6.5),
  new THREE.MeshStandardMaterial({ color: '#cfc6ba', roughness: 0.96 }),
);
backWall.position.set(0, 3.1, -3.6);
backWall.receiveShadow = true;
scene.add(backWall);

const grid = new THREE.GridHelper(10, 10, 0xc9c2b6, 0xddd6cc);
grid.position.y = 0.001;
grid.visible = false;
scene.add(grid);

const mats = createMaterials();
const floors = buildFloors(renderer.capabilities.getMaxAnisotropy());
let headerTexture = null;
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

function applyLight(mode) {
  const spotMode = mode === 'spot';
  hemi.intensity = spotMode ? 0.16 : 0.45;
  key.intensity = spotMode ? 1.35 : 2.6;
  fill.intensity = spotMode ? 0.18 : 0.7;
  spot.intensity = spotMode ? 28 : 8;
  scene.environmentIntensity = spotMode ? 0.32 : 0.72;
  renderer.toneMappingExposure = spotMode ? 0.96 : 1;
}

function applyFloor(kind) {
  if (kind === 'wood') {
    floorMat.color.set('#ffffff');
    floorMat.map = floors.wood;
    floorMat.roughness = 0.64;
  } else if (kind === 'carpet') {
    floorMat.color.set('#ffffff');
    floorMat.map = floors.carpet;
    floorMat.roughness = 0.96;
  } else {
    floorMat.color.set('#e4dfd6');
    floorMat.map = null;
    floorMat.roughness = 0.48;
  }
  floorMat.needsUpdate = true;
}

function discard(root) {
  const textures = root.userData.textures;
  root.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.userData.disposeMat) obj.userData.disposeMat.dispose();
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

function goView(name, immediate = false) {
  const view = VIEWS[name] || VIEWS.hero;
  currentView = VIEWS[name] ? name : 'hero';
  controls.enableRotate = view.rotate;
  controls.minPolarAngle = view.rotate ? 0.12 : 0;
  controls.maxPolarAngle = view.rotate ? Math.PI / 2 - 0.04 : Math.PI;
  camera.up.set(view.up[0], view.up[1], view.up[2]);
  const toP = new THREE.Vector3(view.pos[0], view.pos[1], view.pos[2]);
  const toT = new THREE.Vector3(view.target[0], view.target[1], view.target[2]);
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
  applyFloor(state.floor);
  applyLight(state.light);
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

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labels.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('hashchange', () => {
  const next = decodeConfig(location.hash.replace(/^#/, ''));
  if (!next) return;
  state = next;
  rebuild();
  applyFinish(mats, state.finish);
  applyFloor(state.floor);
  applyLight(state.light);
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
  try {
    const texture = await new THREE.TextureLoader().loadAsync(`${import.meta.env.BASE_URL}brand/header.png`);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    headerTexture = texture;
  } catch {
    toast('상단 배너 이미지를 불러오지 못했습니다.');
  }
  document.querySelector('#drawing-img').src = `${import.meta.env.BASE_URL}brand/drawing.png`;
  rebuild();
  applyFinish(mats, state.finish);
  applyFloor(state.floor);
  applyLight(state.light);
  if (query.get('view')) goView(query.get('view'), true);
  else if (state.view === 'free' && state.cam) restoreCam(state.cam);
  else goView(state.view || 'hero', true);
  ui.refresh(state, currentView);
  document.body.classList.add('ready');
  frame();
}

boot();
