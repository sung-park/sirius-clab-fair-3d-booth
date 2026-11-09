import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { SPEC } from './layout.js';

export function createAnnotations(layout, cfg) {
  const root = new THREE.Group();
  root.name = 'annotations';

  const dimMat = new THREE.LineBasicMaterial({ color: 0x3a342c });
  const dims = new THREE.Group();
  dims.name = 'dims';
  dims.visible = !!cfg.dims;
  dims.userData.disposeMat = dimMat;

  const markMat = new THREE.LineBasicMaterial({ color: 0xd86a1f });
  const markup = new THREE.Group();
  markup.name = 'markup';
  markup.visible = !!cfg.markup;
  markup.userData.disposeMat = markMat;

  root.add(dims, markup);

  const x0 = -SPEC.width / 2;
  const x1 = SPEC.width / 2;
  const leftX = layout.totem && layout.totem.x < 0
    ? layout.totem.x - layout.totem.w / 2 - 0.18
    : x0 - 0.24;
  let rightX = x1 + 0.28;
  if (layout.totem && layout.totem.x > 0) rightX = Math.max(rightX, layout.totem.x + layout.totem.w / 2 + 0.2);
  if (layout.sign) rightX = Math.max(rightX, layout.sign.x + layout.sign.w / 2 + 0.22);

  hDim(dims, dimMat, x0, x1, 0.04, layout.zFront + 0.55, '2.25 m');
  for (let index = 0; index < 3; index += 1) {
    const a = x0 + index * SPEC.module;
    hDim(dims, dimMat, a, a + SPEC.module, 0.04, layout.zFront + 0.22, '0.75 m');
  }
  vDim(dims, dimMat, leftX, 0, SPEC.height, layout.faceZ, '2.25 m');
  vDim(dims, dimMat, leftX + 0.16, 0, SPEC.shelfH, layout.zFront, '선반 1.00 m');
  vDim(dims, dimMat, x1 + 0.14, SPEC.height - SPEC.headerH, SPEC.height, layout.faceZ, '0.30 m');
  hDim(dims, dimMat, layout.zBack, layout.zFront, 0.04, rightX, '깊이 0.75 m', true);
  if (!layout.flush) {
    hDim(dims, dimMat, layout.faceZ, layout.zFront, 0.04, rightX + 0.22, '선반 0.50 m', true);
  }
  const personDimX = layout.person.x > 0 ? layout.person.x - 0.34 : layout.person.x + 0.34;
  vDim(dims, dimMat, personDimX, 0, 1.7, layout.person.z, '1.70 m');
  if (layout.sign) {
    const outer = layout.sign.x + layout.sign.w / 2 + 0.14;
    const bottom = layout.sign.y - layout.sign.h / 2;
    const top = layout.sign.y + layout.sign.h / 2;
    vDim(dims, dimMat, outer, bottom, top, layout.sign.z, '2.00 m');
    hDim(
      dims,
      dimMat,
      layout.sign.x - layout.sign.w / 2,
      layout.sign.x + layout.sign.w / 2,
      bottom - 0.08,
      layout.sign.z + 0.16,
      `${layout.sign.w.toFixed(2)} m`,
    );
  }

  const frames = [];
  if (layout.tv) frames.push([layout.tv, '55″ TV (터치형 위치)']);
  const names = {
    hardware: '트래커 하드웨어',
    feature: '특성 기능 3줄',
    results: '과제 성과 출력물',
    plaque: '시료 비교 전시',
    product: '특성 기능',
    vision: '과제명 · 비전',
  };
  const panels = [];
  if (layout.column) panels.push(...Object.values(layout.column.panels));
  if (layout.wings) panels.push(...Object.values(layout.wings));
  if (layout.posters) panels.push(...layout.posters);
  for (const panel of panels) frames.push([panel, names[panel.key] || panel.key]);
  if (layout.totem) frames.push([layout.totem, '32″ 모니터']);
  if (layout.sign) {
    const copy = {
      partner: '파트너의 목소리',
      user: 'Fair행사용',
    }[layout.sign.design] || layout.sign.design;
    frames.push([layout.sign, `입간판 · ${copy}`]);
  }
  frames.push([layout.header, '상단 그래픽 2,250 × 300']);

  for (const [block, text] of frames) {
    rect(markup, markMat, block);
    const above = !block.key;
    const y = above ? block.y + block.h / 2 + 0.07 : block.y;
    tag(markup, text, block.x, y, block.z + 0.05, 'markup-label');
  }

  zone(markup, markMat, layout);

  

  return root;
}

function hDim(parent, material, a, b, y, fixed, text, alongZ = false) {
  const start = alongZ ? new THREE.Vector3(fixed, y, a) : new THREE.Vector3(a, y, fixed);
  const end = alongZ ? new THREE.Vector3(fixed, y, b) : new THREE.Vector3(b, y, fixed);
  line(parent, material, start, end);
  const tick = alongZ ? new THREE.Vector3(0.04, 0, 0) : new THREE.Vector3(0, 0.045, 0);
  line(parent, material, start.clone().sub(tick), start.clone().add(tick));
  line(parent, material, end.clone().sub(tick), end.clone().add(tick));
  const mid = start.clone().add(end).multiplyScalar(0.5);
  tag(parent, text, mid.x, mid.y + 0.05, mid.z, 'dim-label');
}

function vDim(parent, material, x, y0, y1, z, text) {
  const start = new THREE.Vector3(x, y0, z);
  const end = new THREE.Vector3(x, y1, z);
  line(parent, material, start, end);
  const tick = new THREE.Vector3(0.045, 0, 0);
  line(parent, material, start.clone().sub(tick), start.clone().add(tick));
  line(parent, material, end.clone().sub(tick), end.clone().add(tick));
  tag(parent, text, x, (y0 + y1) / 2, z, 'dim-label');
}

function line(parent, material, a, b) {
  const geometry = new THREE.BufferGeometry().setFromPoints([a, b]);
  parent.add(new THREE.Line(geometry, material));
}

function rect(parent, material, block) {
  const hx = block.w / 2;
  const hy = block.h / 2;
  const z = block.z + (block.d || 0.02) + 0.015;
  const corners = [
    [-hx, -hy], [hx, -hy], [hx, hy], [-hx, hy], [-hx, -hy],
  ].map(([x, y]) => new THREE.Vector3(block.x + x, block.y + y, z));
  parent.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(corners), material));
}

function zone(parent, material, layout) {
  const y = 0.012;
  const x0 = -1.35;
  const x1 = 1.35;
  const z0 = layout.zFront + 0.08;
  const z1 = layout.zFront + 1.7;
  const points = [[x0, z0], [x1, z0], [x1, z1], [x0, z1], [x0, z0]]
    .map(([x, z]) => new THREE.Vector3(x, y, z));
  const dashed = new THREE.LineDashedMaterial({ color: 0xd86a1f, dashSize: 0.08, gapSize: 0.05 });
  const outline = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), dashed);
  outline.computeLineDistances();
  outline.userData.disposeMat = dashed;
  parent.add(outline);

  const radius = 0.16;
  const cz = layout.zFront + 1.15;
  const circle = [];
  for (let i = 0; i <= 40; i += 1) {
    const t = (i / 40) * Math.PI * 2;
    circle.push(new THREE.Vector3(Math.cos(t) * radius, y, cz + Math.sin(t) * radius));
  }
  parent.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(circle), material));
  tag(parent, '관람·체험 범위', 0, 0.04, z1 - 0.02, 'markup-label');
  tag(parent, '시선', 0, 0.04, cz, 'markup-label');
}

function tag(parent, text, x, y, z, className) {
  const el = document.createElement('div');
  el.className = className;
  el.textContent = text;
  const obj = new CSS2DObject(el);
  obj.position.set(x, y, z);
  parent.add(obj);
  return obj;
}
