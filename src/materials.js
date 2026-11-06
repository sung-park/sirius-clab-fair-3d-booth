import * as THREE from 'three';

function standard(color, roughness, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

const FINISH = {
  white: {
    body: '#f3f0ea',
    door: '#f7f4ef',
    end: '#e3dcd2',
    kick: '#262421',
    counter: '#fbfaf7',
    interior: '#d4cdc3',
    shelf: '#ebe6de',
  },
  gray: {
    body: '#d5dae0',
    door: '#e5e9ed',
    end: '#c3c9d0',
    kick: '#2a2f34',
    counter: '#f4f6f8',
    interior: '#c5ccd2',
    shelf: '#e1e6ea',
  },
  green: {
    body: '#143f36',
    door: '#184e43',
    end: '#0e2e28',
    kick: '#071512',
    counter: '#f4f1ea',
    interior: '#0d2822',
    shelf: '#1a4a3e',
  },
};

export function createMaterials() {
  return {
    body: standard('#f3f0ea', 0.62),
    door: standard('#f7f4ef', 0.5),
    end: standard('#e3dcd2', 0.7),
    kick: standard('#262421', 0.82),
    metal: standard('#c5cacf', 0.28, 0.88),
    counter: new THREE.MeshPhysicalMaterial({
      color: '#fbfaf7',
      roughness: 0.16,
      metalness: 0.02,
      clearcoat: 0.42,
      clearcoatRoughness: 0.35,
    }),
    bezel: standard('#161616', 0.4, 0.16),
    tray: standard('#1a1c1b', 0.4, 0.14),
    device: standard('#f7f7f4', 0.3, 0.08),
    deviceAlt: standard('#d7dbdf', 0.38, 0.12),
    band: standard('#23262b', 0.55, 0.16),
    bandAlt: standard('#8e949b', 0.48, 0.22),
    person: standard('#b7aa9c', 0.9),
    paper: standard('#f3efe6', 0.72),
    spine: standard('#115945', 0.55),
    interior: standard('#d4cdc3', 0.82),
    shelf: standard('#ebe6de', 0.66),
    glass: new THREE.MeshPhysicalMaterial({
      color: '#ffffff',
      roughness: 0.05,
      metalness: 0,
      transparent: true,
      opacity: 0.07,
      depthWrite: false,
    }),
    led: new THREE.MeshBasicMaterial({ color: '#3ddea0' }),
    ledOff: new THREE.MeshBasicMaterial({ color: '#aeb4b8' }),
    footprint: new THREE.LineBasicMaterial({ color: 0xb7b0a4 }),
  };
}

export function applyFinish(mats, finish) {
  const palette = FINISH[finish] || FINISH.white;
  mats.body.color.set(palette.body);
  mats.door.color.set(palette.door);
  mats.end.color.set(palette.end);
  mats.kick.color.set(palette.kick);
  mats.counter.color.set(palette.counter);
  mats.interior.color.set(palette.interior);
  mats.shelf.color.set(palette.shelf);
}
