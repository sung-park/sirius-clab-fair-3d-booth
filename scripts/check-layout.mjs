import * as THREE from 'three';
import {
  CAMERA,
  PRESET_LIST,
  SPEC,
  VIEWS,
  computeLayout,
  decodeConfig,
  encodeConfig,
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
  if (!layout.flush && layout.tray) {
    assert(layout.tray.z - layout.tray.d / 2 >= layout.faceZ - 0.02, `${id} tray back`);
    assert(layout.tray.z + layout.tray.d / 2 <= layout.zFront + 0.02, `${id} tray front`);
  }
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
  ...PRESET_LIST[2].config,
  note: 'TV를 가운데로',
  view: 'side',
}));
assert(round && round.tv === 'center' && round.note === 'TV를 가운데로' && round.view === 'side', 'hash roundtrip');

if (failed) {
  console.error(`${failed} checks failed`);
  process.exit(1);
}
console.log('layout ok');
