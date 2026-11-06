/**
 * Booth frame, in metres. Three.js Y-up, right-handed.
 *
 * Origin is the center of the booth footprint on the floor.
 * +Z is the visitor side (정면). Graphics face +Z.
 * +X is the visitor's right.
 *
 * The plan camera uses up = (0, 0, -1), so +Z lands at the bottom of the
 * screen, matching the source plan (부스 정면 at the bottom).
 * The side camera sits on +X. A point in front of the booth then falls on
 * the left of the screen, matching the elevation arrow "앞 ←".
 * Both signs are checked in scripts/check-layout.mjs.
 */

export const SPEC = {
  width: 2.25,
  depth: 0.75,
  height: 2.25,
  module: 0.75,
  shelfH: 1,
  shelfD: 0.5,
  headerH: 0.3,
  bezel: 0.018,
};

export const HEADER_ASPECT = 1784 / 234;
export const SAMPLE_DX = [-0.12, 0.12];

export const CAMERA = { fov: 36, near: 0.08, far: 40 };

export const VIEWS = {
  hero: {
    pos: [2.15, 1.62, 4.7],
    target: [0.28, 1.06, 0.06],
    up: [0, 1, 0],
    rotate: true,
  },
  front: {
    pos: [0.22, 1.16, 5.35],
    target: [0.22, 1.08, 0],
    up: [0, 1, 0],
    rotate: true,
  },
  side: {
    pos: [5.35, 1.48, -0.2],
    target: [0, 1.05, 0.08],
    up: [0, 1, 0],
    rotate: true,
  },
  top: {
    pos: [0, 5.6, 0],
    target: [0, 0, 0],
    up: [0, 0, -1],
    rotate: false,
  },
  visitor: {
    pos: [0.1, 1.58, 2.15],
    target: [-0.15, 1.35, -0.15],
    up: [0, 1, 0],
    rotate: true,
  },
};

const ENUMS = {
  structure: ['split', 'flush'],
  tv: ['left', 'center', 'right', 'off'],
  totem: ['left', 'right', 'off'],
  totemOrient: ['portrait', 'landscape'],
  sign: ['partner', 'care', 'patent', 'off'],
  cabinet: ['closed', 'open', 'logo'],
  finish: ['white', 'gray', 'green'],
  floor: ['stone', 'wood', 'carpet'],
  light: ['hall', 'spot'],
};

const IDENTITY = [
  'structure', 'tv', 'totem', 'totemOrient', 'sign', 'header',
  'features', 'results', 'samples', 'cabinet',
];

/** One-panel portrait roll-up. 850 × 2000 mm is the usual fair size. */
export const SIGN = { w: 0.85, h: 2, baseH: 0.07, baseD: 0.22 };
/** Partner poster file is 667 × 2000. Keep that ratio so faces and the QR stay square. */
export const PARTNER_ASPECT = 667 / 2000;

export function screenSize(inches, portrait = false) {
  const diag = inches * 0.0254;
  const k = Math.hypot(16, 9);
  const w = (diag * 16) / k;
  const h = (diag * 9) / k;
  return portrait ? { w: h, h: w, diag } : { w, h, diag };
}

function base(over = {}) {
  return {
    structure: 'split',
    tv: 'left',
    totem: 'left',
    totemOrient: 'portrait',
    sign: 'partner',
    header: true,
    features: true,
    results: true,
    samples: true,
    cabinet: 'closed',
    person: true,
    dims: false,
    markup: false,
    finish: 'white',
    floor: 'stone',
    light: 'hall',
    note: '',
    view: 'hero',
    cam: null,
    ...over,
  };
}

const LOCKED = {
  structure: 'split',
  tv: 'left',
  totem: 'left',
  totemOrient: 'portrait',
  header: true,
  features: true,
  results: true,
  samples: true,
  cabinet: 'closed',
  finish: 'white',
  floor: 'carpet',
  light: 'hall',
};

export function lockConfig(cfg) {
  return { ...cfg, ...LOCKED };
}

export const PRESET_LIST = [
  {
    id: 'drawing',
    name: '도면 기본안',
    blurb: '도면 위치 그대로입니다. 화면은 뒤쪽 월, 앞쪽 선반 깊이는 0.50m, 55″는 왼쪽 두 모듈, 32″ 모니터는 왼쪽 세로입니다. 오른쪽 벽은 트래커 하드웨어 구성이고, 그 아래는 시료 비교입니다.',
    config: base(),
  },
];

export function defaultConfig() {
  return lockConfig({ ...PRESET_LIST[0].config });
}

export function matchPreset(cfg) {
  for (const preset of PRESET_LIST) {
    if (IDENTITY.every((key) => preset.config[key] === cfg[key])) return preset.id;
  }
  return '';
}

export function describe(cfg) {
  const sign = {
    partner: '우측 입간판은 파트너의 목소리입니다.',
    care: '우측 입간판은 케어 안입니다.',
    patent: '우측 입간판은 특허 안입니다.',
    off: '입간판은 빼 두었습니다.',
  }[cfg.sign];
  return `${PRESET_LIST[0].blurb} ${sign}`;
}

function stackColumn(x, faceZ, top, bottom, cfg) {
  const w = SPEC.module - 0.12;
  const gap = 0.028;
  const panels = {};
  const plaqueH = 0.12;
  const plaqueLift = 0.055;
  let upperBottom = bottom;
  if (cfg.samples) {
    panels.plaque = {
      key: 'plaque',
      x,
      y: bottom + plaqueLift + plaqueH / 2,
      z: faceZ,
      w,
      h: plaqueH,
    };
    upperBottom = panels.plaque.y + plaqueH / 2 + gap;
  }
  const h = top - upperBottom;
  if (h > 0.24) {
    panels.hardware = {
      key: 'hardware',
      x,
      y: upperBottom + h / 2,
      z: faceZ,
      w,
      h,
    };
  }
  return { x, w, panels };
}

function sideCards(cfg, tv, faceZ) {
  const keys = [];
  if (cfg.features) keys.push('product');
  if (cfg.results) keys.push('results');
  if (!keys.length || !tv) return null;
  const cardW = 0.34;
  const xAbs = SPEC.width / 2 - 0.055 - cardW / 2;
  const spots = keys.length === 1 ? [xAbs] : [-xAbs, xAbs];
  const wings = {};
  keys.forEach((key, index) => {
    const side = spots[index] < 0 ? 'left' : 'right';
    wings[side] = {
      key,
      x: spots[index],
      y: tv.y,
      z: faceZ,
      w: cardW,
      h: tv.h,
    };
  });
  return wings;
}

function graphicWall(cfg, faceZ, top, bottom) {
  const keys = [];
  if (cfg.features) keys.push('vision', 'product');
  if (cfg.results) keys.push('results');
  if (!keys.length) return null;
  const gap = 0.05;
  const w = Math.min(SPEC.module - 0.08, (SPEC.width - gap * (keys.length + 1)) / keys.length);
  const h = top - bottom;
  const y = (top + bottom) / 2;
  const total = keys.length * w + (keys.length - 1) * gap;
  let x = -total / 2 + w / 2;
  return keys.map((key) => {
    const panel = { key, x, y, z: faceZ, w, h };
    x += w + gap;
    return panel;
  });
}

function signWidth(design) {
  if (design === 'partner') return SIGN.h * PARTNER_ASPECT;
  return SIGN.w;
}

function placeSign(cfg, totem, zFront) {
  if (cfg.sign === 'off') return null;
  let clearance = SPEC.width / 2;
  if (totem && totem.x > 0) clearance = Math.max(clearance, totem.x + totem.w / 2);
  const w = signWidth(cfg.sign);
  const x = clearance + 0.18 + w / 2;
  // Forward of the front face, so the side view still shows the 0.75 m depth.
  const z = zFront + 0.28;
  return {
    x,
    y: SIGN.baseH + SIGN.h / 2,
    z,
    w,
    h: SIGN.h,
    d: 0.016,
    design: cfg.sign,
  };
}

function placePerson(cfg, totem, sign, zFront) {
  let x = cfg.totem === 'left' ? 1.72 : -1.72;
  if (sign) {
    x = -(SPEC.width / 2 + 0.46);
    if (totem && totem.x < 0) x = Math.min(x, totem.x - totem.w / 2 - 0.36);
  }
  return { x, y: 0, z: zFront + 0.15, h: 1.7 };
}

export function computeLayout(cfg) {
  const flush = cfg.structure === 'flush';
  const backD = flush ? SPEC.depth : SPEC.depth - SPEC.shelfD;
  const shelfD = flush ? SPEC.depth : SPEC.shelfD;
  const zBack = -SPEC.depth / 2;
  const zFront = SPEC.depth / 2;
  const faceZ = flush ? zFront : zBack + backD;

  const wall = flush
    ? {
      w: SPEC.width,
      h: SPEC.height - SPEC.shelfH,
      d: SPEC.depth,
      x: 0,
      y: SPEC.shelfH + (SPEC.height - SPEC.shelfH) / 2,
      z: 0,
    }
    : {
      w: SPEC.width,
      h: SPEC.height,
      d: backD,
      x: 0,
      y: SPEC.height / 2,
      z: zBack + backD / 2,
    };

  const cabinet = {
    w: SPEC.width,
    h: SPEC.shelfH,
    d: shelfD,
    x: 0,
    y: SPEC.shelfH / 2,
    z: flush ? 0 : faceZ + shelfD / 2,
    frontZ: zFront,
    backZ: flush ? zBack : faceZ,
    topY: SPEC.shelfH,
  };

  const printW = SPEC.width - 0.012;
  const printH = printW / HEADER_ASPECT;
  const header = {
    w: printW,
    h: printH,
    x: 0,
    y: SPEC.height - printH / 2,
    z: faceZ,
  };

  const contentTop = SPEC.height - SPEC.headerH - 0.03;
  const contentBottom = SPEC.shelfH + 0.03;
  const active = screenSize(55);
  const tvOuter = {
    w: active.w + SPEC.bezel * 2,
    h: active.h + SPEC.bezel * 2,
  };

  let tv = null;
  if (cfg.tv !== 'off') {
    const x = cfg.tv === 'center' ? 0 : cfg.tv === 'right' ? SPEC.width / 6 : -SPEC.width / 6;
    const y = contentTop - tvOuter.h / 2;
    tv = {
      x,
      y,
      z: faceZ,
      w: tvOuter.w,
      h: tvOuter.h,
      d: 0.036,
      screenW: active.w,
      screenH: active.h,
    };
  }

  let column = null;
  if (cfg.tv === 'left' || cfg.tv === 'right') {
    const x = cfg.tv === 'left'
      ? SPEC.width / 2 - SPEC.module / 2
      : -SPEC.width / 2 + SPEC.module / 2;
    column = stackColumn(x, faceZ, contentTop, contentBottom, cfg);
  }

  const wings = cfg.tv === 'center' ? sideCards(cfg, tv, faceZ) : null;
  const posters = cfg.tv === 'off' ? graphicWall(cfg, faceZ, contentTop, contentBottom) : null;

  let tray = null;
  if (cfg.samples) {
    const w = 0.5;
    const d = 0.24;
    let x = 0;
    if (cfg.tv === 'left') x = SPEC.module;
    else if (cfg.tv === 'right') x = -SPEC.module;
    const limit = SPEC.width / 2 - w / 2 - 0.04;
    x = Math.max(-limit, Math.min(limit, x));
    const z = flush ? zFront + d / 2 : faceZ + shelfD * 0.62;
    tray = {
      x,
      y: SPEC.shelfH,
      z,
      w,
      d,
      h: 0.014,
      flush,
      devices: [
        { dx: SAMPLE_DX[0], label: 'Sirius 13g' },
        { dx: SAMPLE_DX[1], label: '비교 시료' },
      ],
    };
  }

  let totem = null;
  if (cfg.totem !== 'off') {
    const portrait = cfg.totemOrient !== 'landscape';
    const scr = screenSize(32, portrait);
    const w = scr.w + SPEC.bezel * 2;
    const h = scr.h + SPEC.bezel * 2;
    const side = cfg.totem === 'right' ? 1 : -1;
    totem = {
      x: side * (SPEC.width / 2 + w / 2 + 0.08),
      y: 1.86 - h / 2,
      z: flush ? zFront - 0.12 : (faceZ + zFront) / 2,
      w,
      h,
      d: 0.04,
      portrait,
      screenW: scr.w,
      screenH: scr.h,
    };
  }

  const sign = placeSign(cfg, totem, zFront);
  const person = placePerson(cfg, totem, sign, zFront);

  return {
    flush,
    backD,
    shelfD,
    zBack,
    zFront,
    faceZ,
    wall,
    cabinet,
    header,
    seams: [-SPEC.module / 2, SPEC.module / 2],
    contentTop,
    contentBottom,
    tv,
    column,
    wings,
    posters,
    tray,
    totem,
    sign,
    person,
    footprint: { x0: -SPEC.width / 2, x1: SPEC.width / 2, z0: zBack, z1: zFront },
  };
}

function bytesToB64(bytes) {
  let bin = '';
  for (const byte of bytes) bin += String.fromCharCode(byte);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function b64ToBytes(text) {
  const pad = text.length % 4 === 0 ? '' : '='.repeat(4 - (text.length % 4));
  const bin = atob(text.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function encodeConfig(cfg) {
  const slim = {};
  for (const key of Object.keys(defaultConfig())) {
    if (cfg[key] !== undefined && cfg[key] !== null && key !== 'cam') slim[key] = cfg[key];
  }
  if (cfg.view === 'free' && cfg.cam) slim.cam = cfg.cam;
  const json = JSON.stringify(slim);
  return bytesToB64(new TextEncoder().encode(json));
}

function triad(value) {
  if (!Array.isArray(value) || value.length !== 3) return null;
  const nums = value.map(Number);
  if (nums.some((n) => !Number.isFinite(n))) return null;
  return nums;
}

export function decodeConfig(hash) {
  if (!hash) return null;
  try {
    const json = new TextDecoder().decode(b64ToBytes(hash));
    const raw = JSON.parse(json);
    const cfg = defaultConfig();
    for (const [key, options] of Object.entries(ENUMS)) {
      if (options.includes(raw[key])) cfg[key] = raw[key];
    }
    for (const key of ['header', 'features', 'results', 'samples', 'person', 'dims', 'markup']) {
      if (typeof raw[key] === 'boolean') cfg[key] = raw[key];
    }
    if (typeof raw.note === 'string') cfg.note = raw.note.replace(/\s+/g, ' ').slice(0, 140);
    if (typeof raw.view === 'string' && (raw.view === 'free' || VIEWS[raw.view])) cfg.view = raw.view;
    if (raw.cam) {
      const p = triad(raw.cam.p);
      const t = triad(raw.cam.t);
      const u = triad(raw.cam.u);
      if (p && t && u) cfg.cam = { p, t, u };
    }
    return lockConfig(cfg);
  } catch {
    return null;
  }
}
