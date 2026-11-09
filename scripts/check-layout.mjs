import * as THREE from 'three';
import {
  CAMERA,
  PRESET_LIST,
  POSTER_ASPECT,
  SIGN,
  SPEC,
  VIEWS,
  computeLayout,
  decodeConfig,
  encodeConfig,
  lockConfig,
  screenSize,
} from '../src/layout.js';

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('FAIL', msg);
  }
}

const tv = screenSize(55);
assert(Math.abs(tv.w - 1.218) < 0.01, `55" width ${tv.w}`);
assert(Math.abs(tv.h - 0.685) < 0.01, `55" height ${tv.h}`);
const portrait = screenSize(32, true);
assert(portrait.h > portrait.w, '32" portrait is taller than wide');

for (const preset of PRESET_LIST) {
  const layout = computeLayout(preset.config);
  const id = preset.id;
  assert(Math.abs(layout.zFront - layout.zBack - SPEC.depth) < 1e-9, `${id} depth`);
  assert(Math.abs(layout.header.y + layout.header.h / 2 - SPEC.height) < 1e-6, `${id} header top`);
  const headerBottom = layout.header.y - layout.header.h / 2;
  assert(headerBottom + 1e-6 >= layout.contentTop, `${id} header clears the wall content`);
  if (layout.flush) {
    assert(Math.abs(layout.faceZ - layout.zFront) < 1e-9, `${id} flush face`);
  } else {
    assert(Math.abs(layout.shelfD - 0.5) < 1e-9, `${id} shelf depth`);
    assert(Math.abs(layout.backD - 0.25) < 1e-9, `${id} back depth`);
    assert(Math.abs(layout.zFront - layout.faceZ - 0.5) < 1e-9, `${id} counter run`);
  }

  const panels = [];
  if (layout.tv) panels.push({ ...layout.tv, key: 'tv' });
  if (layout.column) panels.push(...Object.values(layout.column.panels));
  if (layout.wings) panels.push(...Object.values(layout.wings));
  if (layout.posters) panels.push(...layout.posters);
  for (const panel of panels) {
    assert(panel.x - panel.w / 2 >= -SPEC.width / 2 - 0.02, `${id} ${panel.key} left`);
    assert(panel.x + panel.w / 2 <= SPEC.width / 2 + 0.02, `${id} ${panel.key} right`);
    assert(panel.y + panel.h / 2 <= headerBottom + 0.01, `${id} ${panel.key} under header`);
    assert(panel.y - panel.h / 2 >= SPEC.shelfH - 0.02, `${id} ${panel.key} above shelf`);
  }
  if (layout.tv && layout.column) {
    const tvRight = layout.tv.x + layout.tv.w / 2;
    const tvLeft = layout.tv.x - layout.tv.w / 2;
    const colLeft = layout.column.x - layout.column.w / 2;
    const colRight = layout.column.x + layout.column.w / 2;
    const gap = layout.tv.x < layout.column.x ? colLeft - tvRight : tvLeft - colRight;
    assert(gap > 0.04, `${id} tv/column gap ${gap}`);
  }
  if (layout.column) {
    const stack = Object.values(layout.column.panels).sort((a, b) => b.y - a.y);
    for (let i = 0; i < stack.length - 1; i += 1) {
      const gap = (stack[i].y - stack[i].h / 2) - (stack[i + 1].y + stack[i + 1].h / 2);
      assert(gap > -0.001, `${id} stack overlap ${gap}`);
    }
  }
  if (layout.totem) {
    const towardBooth = layout.totem.x < 0
      ? -SPEC.width / 2 - (layout.totem.x + layout.totem.w / 2)
      : layout.totem.x - layout.totem.w / 2 - SPEC.width / 2;
    assert(towardBooth > 0.04, `${id} totem gap ${towardBooth}`);
  }
  if (layout.sign) {
    const aspect = POSTER_ASPECT[layout.sign.design];
    assert(aspect > 0, `${id} sign aspect`);
    assert(Math.abs(layout.sign.w - SIGN.h * aspect) < 1e-9, `${id} sign width ${layout.sign.w}`);
    assert(layout.sign.h === SIGN.h, `${id} sign height ${layout.sign.h}`);
    assert(Math.abs(layout.sign.y - (SIGN.baseH + SIGN.h / 2)) < 1e-9, `${id} sign sits on its base`);
    assert(layout.sign.x > 0, `${id} sign is on the visitor's right`);
    assert(layout.sign.x - layout.sign.w / 2 > SPEC.width / 2 + 0.1, `${id} sign clears the booth`);
    assert(layout.sign.z - SIGN.baseD / 2 > layout.zFront + 0.02, `${id} sign base is in front of the booth`);
    assert(layout.sign.design === preset.config.sign, `${id} sign design`);
    const stand = { x: layout.sign.x, z: layout.sign.z, w: layout.sign.w, d: SIGN.baseD };
    if (layout.totem) assert(clears(stand, layout.totem, 0.06), `${id} sign clears the totem`);
    const person = { x: layout.person.x, z: layout.person.z, w: 0.5, d: 0.36 };
    assert(clears(person, stand, 0.05), `${id} person clears the sign`);
  } else {
    assert(false, `${id} sign is always present`);
  }
  if (!layout.flush && layout.tray) {
    assert(layout.tray.z - layout.tray.d / 2 >= layout.faceZ - 0.02, `${id} tray back`);
    assert(layout.tray.z + layout.tray.d / 2 <= layout.zFront + 0.02, `${id} tray front`);
  }
}

function clears(a, b, pad) {
  const dx = Math.abs(a.x - b.x) - ((a.w || 0) + (b.w || 0)) / 2;
  const dz = Math.abs(a.z - b.z) - ((a.d || 0) + (b.d || 0)) / 2;
  return dx > pad || dz > pad;
}

function project(view, point) {
  const cam = new THREE.PerspectiveCamera(CAMERA.fov, 16 / 9, CAMERA.near, CAMERA.far);
  cam.up.set(...view.up);
  cam.position.set(...view.pos);
  cam.lookAt(...view.target);
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
  return point.clone().project(cam);
}

const side = project(VIEWS.side, new THREE.Vector3(0, 1.1, 1.2));
assert(side.x < -0.05, `side view should put the front on the left, ndc x ${side.x}`);
const planFront = project(VIEWS.top, new THREE.Vector3(0, 0, 1));
assert(planFront.y < -0.05, `plan view should put +Z at the bottom, ndc y ${planFront.y}`);
const planRight = project(VIEWS.top, new THREE.Vector3(1, 0, 0));
assert(planRight.x > 0.05, `plan view should put +X on the right, ndc x ${planRight.x}`);

const round = decodeConfig(encodeConfig({
  ...PRESET_LIST[0].config,
  structure: 'flush',
  tv: 'center',
  totem: 'right',
  cabinet: 'open',
  note: '입간판 논의',
  view: 'side',
  sign: 'user',
}));
assert(round && round.note === '입간판 논의' && round.view === 'side' && round.sign === 'user', 'hash roundtrip');
assert(round.structure === 'split' && round.tv === 'left' && round.totem === 'left' && round.cabinet === 'closed', 'booth layout stays locked');
assert(lockConfig({ tv: 'right' }).tv === 'left', 'lock keeps the drawing TV');
const signed = decodeConfig(encodeConfig({ ...PRESET_LIST[0].config, sign: 'user' }));
assert(signed && signed.sign === 'user', 'sign design roundtrip');
for (const retired of ['care', 'patent', 'off']) {
  const dropped = decodeConfig(encodeConfig({ ...PRESET_LIST[0].config, sign: retired }));
  assert(dropped && dropped.sign === 'partner', `${retired} falls back to the partner poster`);
}
const user = computeLayout({ ...PRESET_LIST[0].config, sign: 'user' });
assert(Math.abs(user.sign.w / user.sign.h - POSTER_ASPECT.user) < 1e-9, 'fair poster keeps the photo ratio');
assert(Math.abs(computeLayout(PRESET_LIST[0].config).sign.w / SIGN.h - POSTER_ASPECT.partner) < 1e-9, 'partner poster keeps its photo ratio');

const acrylic = computeLayout(PRESET_LIST[0].config);
const slot = acrylic.column.panels.hardware;
assert(slot.style === 'acrylic', 'default hardware is the acrylic plate');
assert(Math.abs(slot.w - (SPEC.module - 0.12)) < 1e-9, 'acrylic plate fills the column');
const printed = computeLayout({ ...PRESET_LIST[0].config, plate: 'print' });
const sheet = printed.column.panels.hardware;
const plaque = printed.column.panels.plaque;
assert(sheet.style === 'print', 'print hardware style');
assert(Math.abs(sheet.w - slot.w) < 1e-9 && Math.abs(sheet.h - slot.h) < 1e-9, 'print fills the same slot as the acrylic plate');
assert(Math.abs(sheet.w - plaque.w) < 1e-9, 'print width matches the plaque');
assert(Math.abs(sheet.x - slot.x) < 1e-9 && Math.abs(sheet.y - slot.y) < 1e-9, 'print is centered in the slot');
assert(sheet.y - sheet.h / 2 > plaque.y + plaque.h / 2, 'print stays above the plaque');
assert(sheet.y + sheet.h / 2 <= acrylic.contentTop + 1e-9, 'print stays under the header');
const kept = decodeConfig(encodeConfig({ ...PRESET_LIST[0].config, plate: 'print', sign: 'user' }));
assert(kept && kept.plate === 'print' && kept.sign === 'user', 'plate roundtrip');
const { plate: _plate, ...legacy } = PRESET_LIST[0].config;
const missing = decodeConfig(encodeConfig(legacy));
assert(missing && missing.plate === 'acrylic', 'a hash without plate stays acrylic');
const unknown = decodeConfig(encodeConfig({ ...PRESET_LIST[0].config, plate: 'poster' }));
assert(unknown && unknown.plate === 'acrylic', 'unknown plate stays acrylic');

if (failed) {
  console.error(`${failed} checks failed`);
  process.exit(1);
}
console.log('layout ok');
