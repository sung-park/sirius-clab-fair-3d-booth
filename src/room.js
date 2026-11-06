import * as THREE from 'three';

/**
 * Large conference hall around the booth. Y-up, booth origin on the floor.
 * +Z is the visitor side. Wall boxes are closed meshes, so both faces show.
 * The ceiling sits above the plan camera (y = 5.6).
 */

const IVORY = '#e4d9c8';
const SKIRT = '#c9bba6';
const COLUMN = '#d5c9b6';

function carpetTexture(anisotropy) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#b39b82';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 5000; i += 1) {
    const light = Math.random() > 0.5;
    ctx.fillStyle = light ? 'rgba(255, 244, 228, 0.05)' : 'rgba(78, 58, 36, 0.06)';
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 1 + Math.random() * 2, 2 + Math.random() * 4);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 8);
  texture.anisotropy = anisotropy;
  return texture;
}

function box(w, h, d, color, x, y, z, roughness = 0.94) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 }),
  );
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  return mesh;
}

export function createConferenceRoom(anisotropy) {
  const room = new THREE.Group();
  room.name = 'room';

  const width = 24;
  const depth = 22;
  const ceilY = 6.8;
  const wallT = 0.2;
  const z0 = -10;
  const z1 = 12;
  const x0 = -width / 2;
  const x1 = width / 2;

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(width + 2, depth + 2),
    new THREE.MeshStandardMaterial({
      color: '#ffffff',
      map: carpetTexture(anisotropy),
      roughness: 0.96,
      metalness: 0,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.002;
  floor.receiveShadow = true;
  room.add(floor);

  room.add(box(width + wallT * 2, ceilY, wallT, IVORY, 0, ceilY / 2, z0 - wallT / 2));
  room.add(box(width + wallT * 2, ceilY, wallT, IVORY, 0, ceilY / 2, z1 + wallT / 2));
  room.add(box(wallT, ceilY, z1 - z0, IVORY, x0 - wallT / 2, ceilY / 2, (z0 + z1) / 2));
  room.add(box(wallT, ceilY, z1 - z0, IVORY, x1 + wallT / 2, ceilY / 2, (z0 + z1) / 2));
  room.add(box(width + wallT * 2, wallT, z1 - z0 + wallT * 2, '#efe6d8', 0, ceilY + wallT / 2, (z0 + z1) / 2, 0.9));

  const skirtH = 0.12;
  room.add(box(width, skirtH, 0.04, SKIRT, 0, skirtH / 2, z0 + 0.02, 0.8));
  room.add(box(width, skirtH, 0.04, SKIRT, 0, skirtH / 2, z1 - 0.02, 0.8));
  room.add(box(0.04, skirtH, z1 - z0, SKIRT, x0 + 0.02, skirtH / 2, (z0 + z1) / 2, 0.8));
  room.add(box(0.04, skirtH, z1 - z0, SKIRT, x1 - 0.02, skirtH / 2, (z0 + z1) / 2, 0.8));

  for (const x of [x0 + 0.45, x1 - 0.45]) {
    for (const z of [z0 + 0.45, z1 - 0.45]) {
      room.add(box(0.42, ceilY, 0.42, COLUMN, x, ceilY / 2, z, 0.88));
    }
  }

  const lampMat = new THREE.MeshStandardMaterial({
    color: '#fff8ee',
    emissive: '#fff4e4',
    emissiveIntensity: 0.85,
    roughness: 0.4,
  });
  for (const x of [-6, -2, 2, 6]) {
    for (const z of [-4, 0.4, 4.8]) {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.04, 0.7), lampMat);
      lamp.position.set(x, ceilY - 0.04, z);
      room.add(lamp);
    }
  }

  return room;
}
