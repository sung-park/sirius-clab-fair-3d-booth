import * as THREE from 'three';

const FONT = 'Pretendard, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
const NAVY = '#002f7f';

// Blender stand frame: +X visitor right, −Y toward the visitor, +Z up.
// Booth frame: +X visitor right, +Z toward the visitor, +Y up.
// A blender point (x, y, z) lands at booth (origin.x + x, origin.y + z, origin.z − y).

const PLATE_T = 0.008;
const PLINTH_X = 0.44;
const PLINTH_H = 0.022;
const GROOVE_D = 0.008;
const N = 5;
const PITCH = 0.03;
const GROOVE_W = 0.007;
const LIP = 0.016;
const Y0 = 0.012;
const PLINTH_D = LIP + GROOVE_W / 2 + (N - 1) * PITCH + GROOVE_W / 2 + LIP;
const SHEET_W = 0.38;
const SHEET_H = 0.162;
const SHEET_T = 0.005;
const SHEET_BOTTOM = PLATE_T + PLINTH_H - GROOVE_D + 0.0004;

const LAYERS = [
  { name: '전면 케이스', body: ['IP68 방수방진'], above: true, draw: 'case' },
  { name: 'E-Ink', body: ['분실 시 보호자 연락처 표시'], above: false, draw: 'eink' },
  { name: '메인보드', body: ['IMU : On-Device AI 기반 행동 검출', 'Radar : 호흡 수, 심박'], above: true, draw: 'board' },
  { name: '피에조', body: ['찾기 경험'], above: false, draw: 'piezo' },
  { name: '배터리', body: ['220mAh 충전식 배터리'], above: true, draw: 'battery' },
];

function grooveY(index) {
  return Y0 + LIP + GROOVE_W / 2 + index * PITCH;
}

function clearMat() {
  return new THREE.MeshPhysicalMaterial({
    color: '#f7f8f8',
    roughness: 0.06,
    metalness: 0,
    transmission: 1,
    thickness: 0.008,
    ior: 1.49,
    transparent: true,
  });
}

function canvasTexture(canvas) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.premultipliedAlpha = false;
  texture.needsUpdate = true;
  return texture;
}

function sheetCanvas(layer, index) {
  const scale = 8;
  const width = Math.round(SHEET_W * 1000 * scale);
  const height = Math.round(SHEET_H * 1000 * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const px = (mm) => mm * scale;
  const xOf = (meters) => width / 2 + meters * 1000 * scale;
  const yOf = (metersAboveSheetBottom) => height - metersAboveSheetBottom * 1000 * scale;

  const partX = -0.128 + index * 0.064;
  const partZ = SHEET_BOTTOM + SHEET_H / 2 - 0.006;
  const partHalf = { case: 0.021, eink: 0.017, board: 0.020, piezo: 0.013, battery: 0.014 }[layer.draw];
  ctx.save();
  ctx.translate(xOf(partX), yOf(partZ - SHEET_BOTTOM));
  drawPart(ctx, layer.draw, px);
  ctx.restore();

  const boxW = fitBox(ctx, layer, px);
  const lines = layer.body.length;
  const boxH = 0.0036 * 2 + 0.0062 + 0.0023 + lines * 0.0048 + Math.max(0, lines - 1) * 0.0016;
  // Below-callouts sit just above the part. On the rear sheets the plinth
  // hides the lower half from a standing visitor (shelf 1.00 m, eye ~1.55 m).
  const boxZ = layer.above
    ? SHEET_BOTTOM + SHEET_H - 0.0045 - boxH / 2
    : 0.118 + boxH / 2;
  const boxY = yOf(boxZ - SHEET_BOTTOM);
  strokeBox(ctx, xOf(partX), boxY, boxW, boxH * 1000 * scale);
  const lineTop = layer.above ? boxY + (boxH * 1000 * scale) / 2 : boxY - (boxH * 1000 * scale) / 2;
  const lineEnd = yOf(partZ - SHEET_BOTTOM + (layer.above ? partHalf : -partHalf));
  ctx.strokeStyle = NAVY;
  ctx.lineWidth = px(1.15);
  ctx.beginPath();
  ctx.moveTo(xOf(partX), lineTop);
  ctx.lineTo(xOf(partX), lineEnd);
  ctx.stroke();
  ctx.fillStyle = NAVY;
  ctx.beginPath();
  ctx.arc(xOf(partX), lineEnd, px(1.5), 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = NAVY;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `650 ${px(6.2)}px ${FONT}`;
  const nameZ = boxZ + boxH / 2 - 0.0036 - 0.0031;
  const nameY = yOf(nameZ - SHEET_BOTTOM);
  ctx.fillText(layer.name, xOf(partX), nameY);
  ctx.font = `500 ${px(4.4)}px ${FONT}`;
  layer.body.forEach((line, lineIndex) => {
    const bodyZ = nameZ - 0.0031 - 0.0023 - 0.0024 - lineIndex * (0.0048 + 0.0016);
    ctx.fillText(line, xOf(partX), yOf(bodyZ - SHEET_BOTTOM));
  });
  return canvas;
}

function fitBox(ctx, layer, px) {
  ctx.font = `500 ${px(4.4)}px ${FONT}`;
  const widest = Math.max(
    ctx.measureText(layer.name).width,
    ...layer.body.map((line) => ctx.measureText(line).width),
  );
  return Math.max(widest + px(8), px(40));
}

function strokeBox(ctx, x, y, w, h) {
  ctx.strokeStyle = NAVY;
  ctx.lineWidth = Math.max(2, h * 0.045);
  ctx.strokeRect(x - w / 2, y - h / 2, w, h);
}

function drawPart(ctx, kind, px) {
  const round = (w, h, fill, radius = 6) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, radius);
    ctx.fill();
  };
  if (kind === 'case') {
    round(px(50), px(42), '#1a1c1f', 10);
    round(px(46), px(38), '#f4f3ef', 8);
    round(px(28), px(20), '#d7e3ea', 4);
  } else if (kind === 'eink') {
    round(px(46), px(34), '#1a1c1f', 6);
    round(px(36), px(22), '#d7e3ea', 3);
  } else if (kind === 'board') {
    round(px(64), px(40), '#1c7a43', 4);
    ctx.save();
    ctx.translate(-px(12), -px(2));
    round(px(14), px(12), '#1a1c1f', 2);
    ctx.restore();
    ctx.save();
    ctx.translate(px(16), px(4));
    round(px(16), px(14), '#1a1c1f', 2);
    round(px(6), px(6), '#c5c8cc', 1);
    ctx.restore();
  } else if (kind === 'piezo') {
    ctx.fillStyle = '#1a1c1f';
    ctx.beginPath();
    ctx.arc(0, 0, px(13), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c5c8cc';
    ctx.beginPath();
    ctx.arc(0, 0, px(3.5), 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'battery') {
    round(px(40), px(28), '#c5c8cc', 4);
    round(px(40), px(7), '#1a1c1f', 1);
  }
}

function labelTexture(text, color, weight = 600) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.font = `${weight} 72px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 320, 64);
  return canvasTexture(canvas);
}

export function buildStand(add, stand) {
  const group = new THREE.Group();
  group.name = 'stand';
  const origin = { x: stand.x, y: stand.y + 0.001, z: stand.z };
  const clear = clearMat();
  const sheetGlass = clearMat();
  sheetGlass.thickness = SHEET_T;
  sheetGlass.attenuationDistance = 1.2;
  sheetGlass.attenuationColor = new THREE.Color('#ffffff');
  const plinthMat = new THREE.MeshStandardMaterial({ color: '#16181a', roughness: 0.55 });
  const strapMat = new THREE.MeshStandardMaterial({ color: '#242628', roughness: 0.72 });

  function place(size, loc, material, opt = {}) {
    return add(
      new THREE.BoxGeometry(size[0], size[2], size[1]),
      material,
      origin.x + loc[0],
      origin.y + loc[2],
      origin.z - loc[1],
      { ...opt, parent: group },
    );
  }

  place([0.5, 0.5, PLATE_T], [0, 0, PLATE_T / 2], clear, { name: 'stand-plate', disposeMat: clear });

  const slabH = PLINTH_H - GROOVE_D;
  place([PLINTH_X, PLINTH_D, slabH], [0, Y0 + PLINTH_D / 2, PLATE_T + slabH / 2], plinthMat, { disposeMat: plinthMat });
  const ribH = GROOVE_D + 0.0006;
  const ribZ = PLATE_T + slabH + ribH / 2 - 0.0006;
  const rib = (y0, y1) => {
    place([PLINTH_X, y1 - y0, ribH], [0, (y0 + y1) / 2, ribZ], plinthMat);
  };
  rib(Y0, grooveY(0) - GROOVE_W / 2);
  for (let index = 0; index < N - 1; index += 1) {
    rib(grooveY(index) + GROOVE_W / 2, grooveY(index + 1) - GROOVE_W / 2);
  }
  rib(grooveY(N - 1) + GROOVE_W / 2, Y0 + PLINTH_D);

  const titleMap = labelTexture('하드웨어 구성', '#f4f3ef', 650);
  const titleMat = new THREE.MeshBasicMaterial({ map: titleMap, transparent: true, toneMapped: false });
  titleMat.userData.ownsMap = true;
  add(
    new THREE.PlaneGeometry(0.16, 0.014),
    titleMat,
    origin.x,
    origin.y + PLATE_T + PLINTH_H * 0.48,
    origin.z - Y0 + 0.001,
    { parent: group, cast: false, receive: false, disposeMat: titleMat },
  );

  LAYERS.forEach((layer, index) => {
    const y = grooveY(index);
    const sheetZ = SHEET_BOTTOM + SHEET_H / 2;
    place(
      [SHEET_W, SHEET_T, SHEET_H],
      [0, y, sheetZ],
      sheetGlass,
      { cast: false, disposeMat: index === 0 ? sheetGlass : undefined },
    );
    const map = canvasTexture(sheetCanvas(layer, index));
    // Transmission only samples the opaque pass. Alpha-tested ink stays
    // visible through the sheets; a transparent material would drop out.
    const ink = new THREE.MeshBasicMaterial({
      map,
      transparent: false,
      alphaTest: 0.08,
      depthWrite: true,
      toneMapped: false,
    });
    ink.userData.ownsMap = true;
    add(
      new THREE.PlaneGeometry(SHEET_W, SHEET_H),
      ink,
      origin.x,
      origin.y + sheetZ,
      origin.z - (y - SHEET_T / 2) + 0.001,
      { parent: group, cast: false, receive: false, disposeMat: ink },
    );
  });

  const products = [
    { x: -0.155, size: [0.04, 0.032, 0.01], color: '#f4f3ef', name: 'Sirius', sub: '우리 제품 · 13 g', strap: [0.108, 0.012, 0.002] },
    { x: 0, size: [0.0815, 0.0303, 0.0115], color: '#2c3036', metal: 0.45, name: 'Fi', sub: '47 g', strap: [0.138, 0.019, 0.0024] },
    { x: 0.155, size: [0.071, 0.029, 0.017], color: '#e25b12', name: 'Tractive', sub: 'DOG 6 · 39 g', strap: [0.118, 0.016, 0.0022] },
  ];
  for (const product of products) {
    const y = -0.155;
    const body = new THREE.MeshStandardMaterial({
      color: product.color,
      roughness: product.metal ? 0.38 : 0.42,
      metalness: product.metal || 0,
    });
    place(product.strap, [product.x, y + 0.004, PLATE_T + product.strap[2] / 2], strapMat);
    place(
      product.size,
      [product.x, y, PLATE_T + product.strap[2] + product.size[2] / 2],
      body,
      { disposeMat: body },
    );
    const screen = new THREE.MeshStandardMaterial({ color: '#1a1c1f', roughness: 0.5 });
    place(
      [product.size[0] * 0.55, product.size[1] * 0.34, 0.0006],
      [product.x, y, PLATE_T + product.strap[2] + product.size[2] + 0.0004],
      screen,
      { disposeMat: screen },
    );
    flatType(add, group, origin, product.name, '#1a1c1f', product.x, y - 0.04, 0.07);
    flatType(add, group, origin, product.sub, '#1a6fd4', product.x, y - 0.056, 0.064);
  }
  flatType(add, group, origin, '실물 비교', NAVY, 0, -0.09, 0.09);
  return group;
}

function flatType(add, group, origin, text, color, x, blenderY, width) {
  const mat = new THREE.MeshBasicMaterial({
    map: labelTexture(text, color),
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  mat.userData.ownsMap = true;
  add(
    new THREE.PlaneGeometry(width, width * 0.2),
    mat,
    origin.x + x,
    origin.y + PLATE_T + 0.001,
    origin.z - blenderY,
    { parent: group, rot: [-Math.PI / 2, 0, 0], cast: false, receive: false, disposeMat: mat },
  );
}
