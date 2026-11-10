import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { SIGN, SPEC } from './layout.js';
import { buildStand } from './stand.js';

function rounded(w, h, d, radius = 0.004, segments = 3) {
  const limit = Math.min(w, h, d) / 2 - 0.0005;
  return new RoundedBoxGeometry(w, h, d, segments, Math.max(0.001, Math.min(radius, limit)));
}

export function createBooth(cfg, layout, mats, tex) {
  const root = new THREE.Group();
  root.name = 'booth';
  root.userData.layout = layout;
  root.userData.textures = tex;

  function add(geometry, material, x, y, z, opt = {}) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    if (opt.rot) mesh.rotation.set(opt.rot[0], opt.rot[1], opt.rot[2]);
    mesh.castShadow = opt.cast !== false;
    mesh.receiveShadow = opt.receive !== false;
    if (opt.name) mesh.name = opt.name;
    if (opt.disposeMat) mesh.userData.disposeMat = opt.disposeMat;
    (opt.parent || root).add(mesh);
    return mesh;
  }

  buildSpine(add, layout, mats);
  buildCabinet(add, cfg, layout, mats, tex);
  buildSeams(add, layout, mats);
  root.add(buildHeader(add, layout, mats, tex));
  if (layout.tv) root.add(buildScreen(add, layout.tv, mats, tex.tv));
  buildPrints(add, layout, mats, tex);
  if (layout.stand) root.add(buildStand(add, layout.stand));
  if (layout.totem) root.add(buildTotem(add, layout.totem, mats, tex));
  if (layout.sign) root.add(buildSign(add, layout.sign, mats, tex));
  root.add(buildPerson(add, cfg, layout, mats));
  root.add(buildFootprint(layout, mats));
  return root;
}

function buildSpine(add, layout, mats) {
  const wall = layout.wall;
  add(rounded(wall.w, wall.h, wall.d, 0.006, 4), mats.body, wall.x, wall.y, wall.z, { name: 'spine' });
}

function buildCabinet(add, cfg, layout, mats, tex) {
  const cab = layout.cabinet;
  const thickness = 0.016;
  const kickH = 0.072;
  const slabT = 0.022;
  const z0 = cab.backZ;
  const z1 = cab.frontZ - 0.006;
  const depth = Math.max(0.05, z1 - z0);
  const z = (z0 + z1) / 2;
  const sideH = cab.topY - slabT - 0.004;

  for (const sign of [-1, 1]) {
    add(
      rounded(thickness, sideH, depth, 0.002, 2),
      mats.end,
      sign * (cab.w / 2 - thickness / 2),
      sideH / 2,
      z,
    );
  }

  add(
    rounded(cab.w - thickness * 2, 0.014, Math.max(0.05, depth - 0.02), 0.002, 2),
    mats.shelf,
    0,
    kickH + 0.008,
    z + 0.004,
    { cast: false },
  );

  add(
    new THREE.BoxGeometry(cab.w - thickness * 2 - 0.01, Math.max(0.1, sideH - kickH - 0.04), 0.01),
    layout.flush ? mats.body : mats.interior,
    0,
    kickH + (sideH - kickH) / 2,
    layout.flush ? layout.zBack + 0.008 : cab.backZ + 0.01,
    { cast: false },
  );

  add(
    rounded(cab.w - 0.04, kickH, 0.06, 0.002, 2),
    mats.kick,
    0,
    kickH / 2,
    z1 - 0.04,
  );

  const slabBack = cab.backZ - (layout.flush ? 0 : 0.004);
  const slabFront = cab.frontZ + 0.012;
  const slabD = slabFront - slabBack;
  add(
    rounded(cab.w + 0.01, slabT, slabD, 0.003, 4),
    mats.counter,
    0,
    cab.topY - slabT / 2,
    slabBack + slabD / 2,
    { name: 'counter' },
  );

  if (cfg.cabinet === 'open') {
    add(
      rounded(cab.w - thickness * 2 - 0.04, 0.012, depth * 0.7, 0.002, 2),
      mats.shelf,
      0,
      0.46,
      z + 0.02,
    );
    addBooklets(add, mats, -0.62, 0.478, z);
    addBooklets(add, mats, 0.02, 0.478, z - 0.02);
    addBooklets(add, mats, 0.58, 0.478, z + 0.03);
    return;
  }

  const gap = 0.01;
  const doorW = (cab.w - gap * 4) / 3;
  const doorH = cab.topY - slabT - kickH - 0.016;
  const doorY = kickH + doorH / 2;
  const doorZ = cab.frontZ - 0.014;
  for (let index = 0; index < 3; index += 1) {
    const x = -cab.w / 2 + gap + doorW / 2 + index * (doorW + gap);
    const logo = cfg.cabinet === 'logo' && index === 1 && tex.door;
    let material = mats.door;
    let disposeMat = null;
    if (logo) {
      material = mats.door.clone();
      material.color.set('#ffffff');
      material.map = tex.door;
      material.roughness = 0.62;
      disposeMat = material;
    }
    add(rounded(doorW, doorH, 0.016, 0.003, 2), material, x, doorY, doorZ, { disposeMat });
    add(
      new THREE.BoxGeometry(0.008, 0.1, 0.008),
      mats.metal,
      x + doorW * 0.34,
      doorY + doorH * 0.22,
      doorZ + 0.012,
    );
  }
}

function addBooklets(add, mats, x, y, z) {
  for (let index = 0; index < 4; index += 1) {
    const yy = y + 0.008 + index * 0.014;
    add(new THREE.BoxGeometry(0.2, 0.012, 0.14), mats.paper, x, yy, z);
    add(new THREE.BoxGeometry(0.008, 0.012, 0.14), mats.spine, x - 0.096, yy, z, { cast: false });
  }
}

function buildSeams(add, layout, mats) {
  const y0 = SPEC.shelfH;
  const y1 = SPEC.height - SPEC.headerH;
  for (const x of layout.seams) {
    add(
      new THREE.BoxGeometry(0.007, y1 - y0, 0.004),
      mats.kick,
      x,
      (y0 + y1) / 2,
      layout.faceZ + 0.003,
      { cast: false, receive: false },
    );
  }
}

function buildHeader(add, layout, mats, tex) {
  const group = new THREE.Group();
  group.name = 'header';
  const header = layout.header;
  add(
    new THREE.BoxGeometry(header.w, header.h, 0.012),
    mats.bezel,
    header.x,
    header.y,
    header.z + 0.006,
    { parent: group },
  );
  if (tex.header) {
    const material = new THREE.MeshBasicMaterial({ map: tex.header });
    add(
      new THREE.PlaneGeometry(header.w - 0.004, header.h - 0.004),
      material,
      header.x,
      header.y,
      header.z + 0.013,
      { parent: group, cast: false, disposeMat: material },
    );
  }
  return group;
}

function buildScreen(add, block, mats, map) {
  const group = new THREE.Group();
  const centerZ = block.z + block.d / 2;
  add(rounded(block.w, block.h, block.d, 0.004, 3), mats.bezel, block.x, block.y, centerZ, { parent: group });
  if (map) {
    const material = new THREE.MeshBasicMaterial({ map, toneMapped: false });
    add(
      new THREE.PlaneGeometry(block.screenW, block.screenH),
      material,
      block.x,
      block.y,
      block.z + block.d + 0.001,
      { parent: group, cast: false, disposeMat: material },
    );
    add(
      new THREE.PlaneGeometry(block.screenW, block.screenH),
      mats.glass,
      block.x,
      block.y,
      block.z + block.d + 0.004,
      { parent: group, cast: false, receive: false },
    );
  }
  return group;
}

function buildPrints(add, layout, mats, tex) {
  const panels = [];
  if (layout.column) panels.push(...Object.values(layout.column.panels));
  if (layout.wings) panels.push(...Object.values(layout.wings));
  if (layout.posters) panels.push(...layout.posters);
  for (const panel of panels) {
    const map = tex[panel.key];
    if (!map) continue;
    if (panel.key === 'dogs') {
      const material = new THREE.MeshBasicMaterial({
        map,
        toneMapped: false,
        transparent: true,
        depthWrite: false,
      });
      add(
        new THREE.PlaneGeometry(panel.w, panel.h),
        material,
        panel.x,
        panel.y,
        panel.z + 0.004,
        { name: 'dog-photo-face', cast: false, receive: false, disposeMat: material },
      );
      continue;
    }
    const bezel = panel.key === 'plaque' ? mats.bezel.clone() : mats.bezel;
    if (panel.key === 'plaque') bezel.color.set('#001848');
    add(
      rounded(panel.w + 0.016, panel.h + 0.016, 0.016, 0.002, 2),
      bezel,
      panel.x,
      panel.y,
      panel.z + 0.008,
      panel.key === 'plaque' ? { disposeMat: bezel } : {},
    );
    const material = new THREE.MeshBasicMaterial({ map });
    add(
      new THREE.PlaneGeometry(panel.w, panel.h),
      material,
      panel.x,
      panel.y,
      panel.z + 0.018,
      { cast: false, disposeMat: material },
    );
  }
}

function buildTotem(add, totem, mats, tex) {
  const group = new THREE.Group();
  group.name = 'totem';
  add(new THREE.CylinderGeometry(0.16, 0.19, 0.02, 32), mats.kick, totem.x, 0.01, totem.z, { parent: group });
  const screenBottom = totem.y - totem.h / 2;
  const poleH = Math.max(0.2, screenBottom - 0.02);
  add(
    new THREE.CylinderGeometry(0.015, 0.018, poleH, 16),
    mats.metal,
    totem.x,
    0.02 + poleH / 2,
    totem.z,
    { parent: group },
  );
  // buildScreen places the bezel center at block.z + depth/2, so pass the front face.
  const screen = buildScreen(add, { ...totem, z: totem.z - totem.d / 2 }, mats, tex.totem);
  group.add(screen);
  return group;
}

function buildSign(add, sign, mats, tex) {
  const group = new THREE.Group();
  group.name = 'sign';
  const baseH = SIGN.baseH;
  const baseD = SIGN.baseD;
  // PlaneGeometry faces +Z, which is the visitor side. No yaw.
  add(
    rounded(sign.w + 0.07, baseH, baseD, 0.01, 3),
    mats.kick,
    sign.x,
    baseH / 2,
    sign.z,
    { parent: group },
  );
  const poleH = sign.h;
  const poleZ = sign.z - 0.02;
  for (const side of [-1, 1]) {
    add(
      new THREE.CylinderGeometry(0.008, 0.008, poleH, 12),
      mats.metal,
      sign.x + side * (sign.w / 2 - 0.015),
      baseH + poleH / 2,
      poleZ,
      { parent: group },
    );
  }
  add(
    rounded(sign.w + 0.04, 0.03, 0.032, 0.004, 2),
    mats.metal,
    sign.x,
    baseH + sign.h + 0.012,
    sign.z,
    { parent: group },
  );
  add(
    new THREE.BoxGeometry(sign.w, sign.h, 0.012),
    mats.bezel,
    sign.x,
    sign.y,
    sign.z - 0.007,
    { parent: group },
  );
  const material = new THREE.MeshBasicMaterial({ map: tex.sign, toneMapped: false });
  add(
    new THREE.PlaneGeometry(sign.w, sign.h),
    material,
    sign.x,
    sign.y,
    sign.z + 0.001,
    { parent: group, cast: false, disposeMat: material },
  );
  return group;
}

function buildPerson(add, cfg, layout, mats) {
  const group = new THREE.Group();
  group.name = 'person';
  group.visible = cfg.person !== false;
  group.position.set(layout.person.x, 0, layout.person.z);
  const skin = mats.person;
  add(new THREE.CapsuleGeometry(0.065, 0.58, 4, 12), skin, -0.08, 0.36, 0, { parent: group });
  add(new THREE.CapsuleGeometry(0.065, 0.58, 4, 12), skin, 0.08, 0.36, 0, { parent: group });
  add(new THREE.CapsuleGeometry(0.15, 0.42, 6, 16), skin, 0, 1.02, 0, { parent: group });
  add(new THREE.CapsuleGeometry(0.045, 0.34, 4, 8), skin, -0.22, 1.05, 0, { parent: group, rot: [0, 0, 0.18] });
  add(new THREE.CapsuleGeometry(0.045, 0.34, 4, 8), skin, 0.22, 1.05, 0, { parent: group, rot: [0, 0, -0.18] });
  add(new THREE.CylinderGeometry(0.045, 0.05, 0.1, 12), skin, 0, 1.4, 0, { parent: group });
  add(new THREE.SphereGeometry(0.11, 24, 16), skin, 0, 1.59, 0, { parent: group });
  return group;
}

function buildFootprint(layout, mats) {
  const y = 0.006;
  const { x0, x1, z0, z1 } = layout.footprint;
  const points = [[x0, z0], [x1, z0], [x1, z1], [x0, z1], [x0, z0]]
    .map(([x, z]) => new THREE.Vector3(x, y, z));
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), mats.footprint);
  line.name = 'footprint';
  return line;
}
