import * as THREE from 'three';

const FONT = 'Pretendard, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
const GREEN = '#115945';
const INK = '#14211c';
const PAPER = '#fbfaf6';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(2, Math.round(w));
  c.height = Math.max(2, Math.round(h));
  return { c, ctx: c.getContext('2d') };
}

function toTexture(source, anisotropy) {
  const texture = new THREE.CanvasTexture(source);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
  return texture;
}

function sized(width, height, long = 1200) {
  const aspect = width / height;
  if (aspect >= 1) return canvas(long, Math.max(180, long / aspect));
  return canvas(Math.max(180, long * aspect), long);
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function paw(ctx, x, y, s, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y + s * 0.22, s * 0.46, s * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();
  const toes = [[-0.42, -0.42], [-0.15, -0.58], [0.16, -0.58], [0.43, -0.42]];
  for (const [tx, ty] of toes) {
    ctx.beginPath();
    ctx.ellipse(x + tx * s, y + ty * s, s * 0.15, s * 0.19, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function wrap(ctx, text, x, y, maxWidth, lineHeight) {
  let line = '';
  let cursor = y;
  for (const ch of text) {
    const next = line + ch;
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line, x, cursor);
      line = ch;
      cursor += lineHeight;
    } else {
      line = next;
    }
  }
  if (line) ctx.fillText(line, x, cursor);
  return cursor;
}

function drawTv(ctx, w, h) {
  ctx.fillStyle = '#0e1714';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = GREEN;
  ctx.fillRect(0, 0, w, 10);
  paw(ctx, 86, 92, 30, '#e9fff5');
  ctx.fillStyle = '#f4faf6';
  ctx.font = `600 44px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Sirius', 128, 108);
  ctx.font = `500 22px ${FONT}`;
  ctx.fillStyle = '#9dbaae';
  ctx.fillText('터치 체험  ·  예시 화면', 268, 106);

  roundRect(ctx, w - 230, 64, 168, 48, 24);
  ctx.fillStyle = GREEN;
  ctx.fill();
  ctx.fillStyle = '#e7fff4';
  ctx.font = `650 20px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('TOUCH', w - 146, 96);
  ctx.textAlign = 'left';

  roundRect(ctx, 56, 160, 520, 460, 28);
  ctx.fillStyle = '#14241e';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(316, 370, 118, 0, Math.PI * 2);
  ctx.strokeStyle = '#1e3d32';
  ctx.lineWidth = 18;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(316, 370, 118, -Math.PI / 2, Math.PI * 0.9);
  ctx.strokeStyle = '#3ddea0';
  ctx.stroke();
  ctx.fillStyle = '#f4faf6';
  ctx.textAlign = 'center';
  ctx.font = `600 76px ${FONT}`;
  ctx.fillText('18', 316, 384);
  ctx.font = `500 24px ${FONT}`;
  ctx.fillStyle = '#b7d0c4';
  ctx.fillText('호흡수 / min', 316, 428);
  ctx.font = `500 18px ${FONT}`;
  ctx.fillStyle = '#6f8f82';
  ctx.fillText('예시 데이터', 316, 560);

  const stats = [['활동', '72', 'index'], ['긁기', '3', '회'], ['핥기', '5', '회']];
  stats.forEach((stat, index) => {
    const x = 620;
    const y = 160 + index * 156;
    roundRect(ctx, x, y, 600, 140, 24);
    ctx.fillStyle = '#14241e';
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.fillStyle = '#9dbaae';
    ctx.font = `500 26px ${FONT}`;
    ctx.fillText(stat[0], x + 36, y + 50);
    ctx.fillStyle = '#f4faf6';
    ctx.font = `600 54px ${FONT}`;
    ctx.fillText(stat[1], x + 36, y + 112);
    const valueWidth = ctx.measureText(stat[1]).width;
    ctx.fillStyle = '#6f8f82';
    ctx.font = `500 24px ${FONT}`;
    ctx.fillText(stat[2], x + 52 + valueWidth, y + 112);
  });

  ctx.fillStyle = '#7f9c8e';
  ctx.font = `500 20px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText('반려견의 일상을 기록하고, 작은 이상 신호까지 놓치지 않습니다', 60, 688);
}

function drawTotem(ctx, w, h, portrait) {
  ctx.fillStyle = '#101211';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = GREEN;
  ctx.fillRect(0, 0, w, portrait ? 14 : 10);
  const s = portrait ? 54 : 36;
  paw(ctx, w / 2, portrait ? 150 : 92, s, '#e9fff5');
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f4faf6';
  ctx.font = `650 ${portrait ? 72 : 54}px ${FONT}`;
  ctx.fillText('Sirius', w / 2, portrait ? 280 : 180);
  ctx.font = `500 ${portrait ? 28 : 22}px ${FONT}`;
  ctx.fillStyle = '#b7d0c4';
  ctx.fillText('스마트 펫 케어', w / 2, portrait ? 340 : 224);

  ctx.fillStyle = '#f4faf6';
  ctx.font = `650 ${portrait ? 150 : 92}px ${FONT}`;
  ctx.fillText('13g', w / 2, portrait ? 560 : 360);
  ctx.font = `500 ${portrait ? 28 : 22}px ${FONT}`;
  ctx.fillStyle = '#9dbaae';
  ctx.fillText('초경량 펫 웨어러블', w / 2, portrait ? 620 : 410);

  const lines = ['하루 종일 편안한 착용', '행동 · 긁기 · 핥기 · 호흡', '앱 · 구독 케어'];
  ctx.textAlign = 'left';
  ctx.fillStyle = '#d7f3e6';
  const lineSize = portrait ? 32 : 24;
  ctx.font = `500 ${lineSize}px ${FONT}`;
  lines.forEach((line, index) => {
    const y = (portrait ? 760 : 490) + index * (portrait ? 78 : 52);
    ctx.fillStyle = GREEN;
    roundRect(ctx, portrait ? 90 : 80, y - lineSize, 18, lineSize + 6, 4);
    ctx.fill();
    ctx.fillStyle = '#f4faf6';
    ctx.fillText(line, portrait ? 130 : 116, y);
  });

  ctx.textAlign = 'center';
  ctx.fillStyle = '#9dbaae';
  ctx.font = `500 ${portrait ? 24 : 18}px ${FONT}`;
  ctx.fillText('A1 특허 1건   ·   A2 특허 19건', w / 2, h - (portrait ? 80 : 48));
  ctx.textAlign = 'left';
}

function labelPill(ctx, x, y, text, size) {
  ctx.font = `600 ${size}px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const width = ctx.measureText(text).width + size * 1.1;
  const height = size * 1.65;
  roundRect(ctx, x, y - height / 2, width, height, height / 2);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#c5d4cb';
  ctx.lineWidth = Math.max(1.5, size * 0.07);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#1b2a23';
  ctx.fillText(text, x + size * 0.55, y);
  ctx.textBaseline = 'alphabetic';
}

function drawHardware(ctx, w, h) {
  ctx.fillStyle = '#f4f6f4';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = GREEN;
  ctx.fillRect(0, 0, w, Math.max(4, h * 0.008));

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#12241c';
  ctx.font = `650 ${Math.floor(w * 0.044)}px ${FONT}`;
  ctx.fillText('하루 종일 착용하는', w / 2, h * 0.058);
  ctx.fillText('우리 반려견 첫번째 트래커', w / 2, h * 0.108);
  ctx.fillStyle = GREEN;
  ctx.font = `600 ${Math.floor(w * 0.028)}px ${FONT}`;
  ctx.fillText('하드웨어 구성', w / 2, h * 0.15);

  const cx = w * 0.3;
  const s = h * 0.105;
  const rows = [0.26, 0.385, 0.52, 0.65, 0.775, 0.9];

  const oval = (x, y, rx, ry, fill, stroke) => {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  };

  oval(cx, h * rows[0], s * 0.78, s * 0.46, '#fbfbfb', '#d3dcd6');
  roundRect(ctx, cx - s * 0.2, h * rows[0] - s * 0.7, s * 0.4, s * 0.36, s * 0.08);
  ctx.fillStyle = '#f3f6f4';
  ctx.fill();
  ctx.strokeStyle = '#d3dcd6';
  ctx.stroke();
  ctx.fillStyle = '#e3ebe6';
  roundRect(ctx, cx - s * 0.09, h * rows[0] - s * 0.56, s * 0.18, s * 0.14, 3);
  ctx.fill();

  const buzzerX = cx - s * 0.42;
  ctx.fillStyle = '#1c1e1d';
  ctx.beginPath();
  ctx.arc(buzzerX, h * rows[1], s * 0.24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3c403c';
  ctx.beginPath();
  ctx.arc(buzzerX, h * rows[1], s * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d4b46a';
  ctx.fillRect(buzzerX + s * 0.2, h * rows[1] - s * 0.05, s * 0.16, s * 0.1);

  const cellX = cx + s * 0.48;
  roundRect(ctx, cellX - s * 0.32, h * rows[1] - s * 0.18, s * 0.64, s * 0.36, s * 0.08);
  ctx.fillStyle = '#fbfbfb';
  ctx.strokeStyle = '#d0d8d3';
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#d4b46a';
  ctx.fillRect(cellX + s * 0.2, h * rows[1] - s * 0.1, s * 0.08, s * 0.2);

  roundRect(ctx, cx - s * 0.95, h * rows[2] - s * 0.4, s * 1.9, s * 0.8, s * 0.26);
  ctx.fillStyle = '#1c6b46';
  ctx.fill();
  ctx.strokeStyle = '#145338';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#141816';
  roundRect(ctx, cx - s * 0.24, h * rows[2] - s * 0.18, s * 0.48, s * 0.36, 4);
  ctx.fill();
  ctx.fillStyle = '#e7fff4';
  ctx.font = `650 ${Math.floor(s * 0.16)}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MCU', cx, h * rows[2]);
  ctx.fillStyle = '#e1c16e';
  for (let i = -2; i <= 2; i += 1) {
    ctx.fillRect(cx - s * 0.78, h * rows[2] + i * s * 0.12 - 2, s * 0.07, 4);
    ctx.fillRect(cx + s * 0.71, h * rows[2] + i * s * 0.12 - 2, s * 0.07, 4);
  }

  roundRect(ctx, cx - s * 0.38, h * rows[3] - s * 0.38, s * 0.76, s * 0.76, s * 0.1);
  ctx.fillStyle = '#237a50';
  ctx.fill();
  ctx.strokeStyle = '#d9f5e8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, h * rows[3], s * 0.1, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(17, 89, 69, 0.45)';
  ctx.lineWidth = 3;
  for (const radius of [0.32, 0.46, 0.6]) {
    ctx.beginPath();
    ctx.arc(cx, h * rows[3], s * radius, -0.7, 0.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, h * rows[3], s * radius, Math.PI - 0.7, Math.PI + 0.7);
    ctx.stroke();
  }

  roundRect(ctx, cx - s * 0.72, h * rows[4] - s * 0.3, s * 1.44, s * 0.6, s * 0.1);
  ctx.fillStyle = '#fbfbfb';
  ctx.strokeStyle = '#cfd8d3';
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#1b2a23';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${Math.floor(s * 0.15)}px ${FONT}`;
  ctx.fillText('보호자 연락처', cx, h * rows[4] - s * 0.08);
  ctx.font = `650 ${Math.floor(s * 0.16)}px ${FONT}`;
  ctx.fillText('01012345678', cx, h * rows[4] + s * 0.12);

  oval(cx, h * rows[5], s * 0.82, s * 0.48, '#fbfbfb', '#d3dcd6');
  oval(cx, h * rows[5], s * 0.4, s * 0.22, '#f4f6f4', '#d3dcd6');

  const labels = [
    '후면 케이스 · 클립',
    '부저 · 배터리',
    '메인 보드 · MCU',
    '생체 레이더 센서',
    '초저전력 전자종이',
    '전면 하우징',
  ];
  const labelX = w * 0.54;
  const size = Math.floor(w * 0.026);
  labels.forEach((text, index) => {
    const y = h * rows[index];
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.95, y);
    ctx.lineTo(labelX - 8, y);
    ctx.strokeStyle = '#b7c7be';
    ctx.lineWidth = 2;
    ctx.stroke();
    labelPill(ctx, labelX, y, text, size);
  });
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function drawFeature(ctx, w, h) {
  ctx.fillStyle = GREEN;
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f4faf6';
  ctx.font = `650 ${Math.floor(h * 0.36)}px ${FONT}`;
  ctx.fillText('특성 기능', w / 2, h * 0.38);
  ctx.font = `500 ${Math.floor(h * 0.2)}px ${FONT}`;
  ctx.fillStyle = '#d7f3e6';
  ctx.fillText('13g  ·  행동 · 호흡  ·  앱 · 구독', w / 2, h * 0.72);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function drawResults(ctx, w, h) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = GREEN;
  ctx.fillRect(0, 0, 12, h);
  const pad = Math.min(w, h) * 0.08;
  ctx.fillStyle = GREEN;
  ctx.textAlign = 'left';
  ctx.font = `650 ${Math.floor(h * 0.055)}px ${FONT}`;
  ctx.fillText('과제 성과 출력물', pad + 8, h * 0.1);

  const boxW = (w - pad * 2 - pad * 0.35) / 2;
  const boxH = h * 0.22;
  [['A1 특허', '1', '건'], ['A2 특허', '19', '건']].forEach((item, index) => {
    const x = pad + index * (boxW + pad * 0.35);
    const y = h * 0.15;
    roundRect(ctx, x, y, boxW, boxH, 18);
    ctx.fillStyle = '#e7f3ec';
    ctx.fill();
    ctx.fillStyle = '#4e6b60';
    ctx.font = `500 ${Math.floor(h * 0.035)}px ${FONT}`;
    ctx.fillText(item[0], x + boxW * 0.1, y + boxH * 0.34);
    ctx.fillStyle = GREEN;
    ctx.font = `650 ${Math.floor(h * 0.09)}px ${FONT}`;
    ctx.fillText(item[1], x + boxW * 0.1, y + boxH * 0.78);
  });

  ctx.fillStyle = INK;
  ctx.font = `650 ${Math.floor(h * 0.042)}px ${FONT}`;
  ctx.fillText('측정하는 것', pad + 8, h * 0.48);
  const rows = [
    ['행동', '일상적인 활동량'],
    ['피부', '긁기 · 핥기'],
    ['호흡', '호흡수'],
  ];
  rows.forEach((row, index) => {
    const y = h * 0.56 + index * h * 0.1;
    ctx.fillStyle = GREEN;
    roundRect(ctx, pad + 8, y - h * 0.03, 10, h * 0.045, 3);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.font = `650 ${Math.floor(h * 0.04)}px ${FONT}`;
    ctx.fillText(row[0], pad + 32, y);
    ctx.fillStyle = '#5d7268';
    ctx.font = `500 ${Math.floor(h * 0.036)}px ${FONT}`;
    ctx.fillText(row[1], pad + w * 0.28, y);
  });

  ctx.fillStyle = '#8aa399';
  ctx.font = `500 ${Math.floor(h * 0.03)}px ${FONT}`;
  ctx.fillText('24기 MX   ·   Sirius   ·   부스 배포용 출력물', pad + 8, h * 0.95);
}

function drawPlaque(ctx, w, h) {
  ctx.fillStyle = '#1b2420';
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f4faf6';
  ctx.font = `650 ${Math.floor(h * 0.38)}px ${FONT}`;
  ctx.fillText('시료 비교 전시', w / 2, h * 0.38);
  ctx.fillStyle = '#9dbaae';
  ctx.font = `500 ${Math.floor(h * 0.22)}px ${FONT}`;
  ctx.fillText('Sirius 13g      ·      비교 시료', w / 2, h * 0.72);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function drawVision(ctx, w, h) {
  ctx.fillStyle = '#101211';
  ctx.fillRect(0, 0, w, h);
  paw(ctx, w * 0.2, h * 0.16, Math.min(w, h) * 0.08, '#e9fff5');
  ctx.fillStyle = '#f4faf6';
  ctx.font = `650 ${Math.floor(h * 0.07)}px ${FONT}`;
  ctx.fillText('Sirius', w * 0.1, h * 0.34);
  ctx.font = `500 ${Math.floor(h * 0.028)}px ${FONT}`;
  ctx.fillStyle = '#9dbaae';
  ctx.fillText('AI 펫 케어', w * 0.1, h * 0.4);
  ctx.fillStyle = '#f4faf6';
  ctx.font = `600 ${Math.floor(h * 0.045)}px ${FONT}`;
  const text = '반려견의 일상을 기록하고 작은 이상 신호까지 놓치지 않는 AI 펫 케어';
  wrap(ctx, text, w * 0.1, h * 0.52, w * 0.8, h * 0.07);
  ctx.fillStyle = '#9dbaae';
  ctx.font = `500 ${Math.floor(h * 0.03)}px ${FONT}`;
  ctx.fillText('A1 특허 1건   ·   A2 특허 19건', w * 0.1, h * 0.9);
}

function drawProduct(ctx, w, h) {
  ctx.fillStyle = GREEN;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#d7f3e6';
  ctx.font = `600 ${Math.floor(h * 0.035)}px ${FONT}`;
  ctx.fillText('특성 기능', w * 0.1, h * 0.1);
  ctx.fillStyle = '#f4faf6';
  ctx.font = `650 ${Math.floor(h * 0.16)}px ${FONT}`;
  ctx.fillText('13g', w * 0.1, h * 0.28);
  ctx.font = `500 ${Math.floor(h * 0.04)}px ${FONT}`;
  ctx.fillStyle = '#d7f3e6';
  ctx.fillText('초경량 펫 웨어러블', w * 0.1, h * 0.35);
  const lines = [
    '하루 종일 착용해도 편안한 무게',
    '행동, 긁기·핥기, 호흡수까지 측정',
    '행동·생체 데이터 기반 펫 케어 앱',
    '파트너십 기반 구독 서비스',
  ];
  ctx.fillStyle = '#f4faf6';
  ctx.font = `500 ${Math.floor(h * 0.038)}px ${FONT}`;
  lines.forEach((line, index) => {
    const y = h * 0.48 + index * h * 0.09;
    ctx.fillStyle = '#d7f3e6';
    ctx.fillRect(w * 0.1, y - h * 0.028, 8, h * 0.04);
    ctx.fillStyle = '#f4faf6';
    wrap(ctx, line, w * 0.16, y, w * 0.72, h * 0.05);
  });
}

function drawSignCare(ctx, w, h) {
  ctx.fillStyle = '#070807';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = GREEN;
  ctx.fillRect(0, 0, w, h * 0.012);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#d7f3e6';
  ctx.font = `650 ${Math.floor(w * 0.045)}px ${FONT}`;
  ctx.fillText('24기 MX', w * 0.9, h * 0.055);

  paw(ctx, w / 2, h * 0.15, w * 0.16, '#f4faf6');
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = `650 ${Math.floor(w * 0.12)}px ${FONT}`;
  ctx.fillText('Sirius', w / 2, h * 0.27);
  ctx.fillStyle = '#c9ddd3';
  ctx.font = `500 ${Math.floor(w * 0.04)}px ${FONT}`;
  const tagline = [
    '반려견의 일상을 기록하고',
    '작은 이상 신호까지 놓치지 않는',
    'AI 펫 케어',
  ];
  tagline.forEach((line, index) => {
    ctx.fillText(line, w / 2, h * 0.318 + index * h * 0.032);
  });

  ctx.fillStyle = GREEN;
  roundRect(ctx, w * 0.1, h * 0.45, w * 0.8, h * 0.16, w * 0.03);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `650 ${Math.floor(w * 0.16)}px ${FONT}`;
  ctx.fillText('13g', w / 2, h * 0.535);
  ctx.font = `500 ${Math.floor(w * 0.038)}px ${FONT}`;
  ctx.fillStyle = '#e7fff4';
  ctx.fillText('하루 종일 착용해도 편한 무게', w / 2, h * 0.575);

  const rows = [
    ['행동', '산책부터 휴식까지 일상을 기록'],
    ['긁기 · 핥기', '작은 이상 신호도 남김'],
    ['호흡수', '안정 상태까지 정밀하게 측정'],
  ];
  rows.forEach((row, index) => {
    const y = h * 0.66 + index * h * 0.075;
    ctx.fillStyle = GREEN;
    roundRect(ctx, w * 0.1, y - h * 0.02, w * 0.045, h * 0.028, 6);
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = `650 ${Math.floor(w * 0.048)}px ${FONT}`;
    ctx.fillText(row[0], w * 0.18, y);
    ctx.fillStyle = '#b7cfc4';
    ctx.font = `500 ${Math.floor(w * 0.034)}px ${FONT}`;
    ctx.fillText(row[1], w * 0.18, y + h * 0.028);
  });

  ctx.fillStyle = GREEN;
  ctx.fillRect(0, h * 0.9, w, h * 0.1);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = `650 ${Math.floor(w * 0.046)}px ${FONT}`;
  ctx.fillText('앱 · 파트너십 구독', w / 2, h * 0.945);
  ctx.font = `500 ${Math.floor(w * 0.034)}px ${FONT}`;
  ctx.fillStyle = '#d7f3e6';
  ctx.fillText('행동·생체 데이터로 잇는 펫 케어', w / 2, h * 0.972);
  ctx.textAlign = 'left';
}

function drawSignPatent(ctx, w, h) {
  ctx.fillStyle = GREEN;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#07110e';
  ctx.fillRect(0, 0, w, h * 0.2);
  paw(ctx, w * 0.22, h * 0.09, w * 0.09, '#f4faf6');
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = `650 ${Math.floor(w * 0.09)}px ${FONT}`;
  ctx.fillText('Sirius', w * 0.38, h * 0.095);
  ctx.font = `500 ${Math.floor(w * 0.036)}px ${FONT}`;
  ctx.fillStyle = '#c9ddd3';
  ctx.fillText('AI 펫 케어', w * 0.38, h * 0.13);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#d7f3e6';
  ctx.font = `650 ${Math.floor(w * 0.04)}px ${FONT}`;
  ctx.fillText('24기 MX', w * 0.9, h * 0.17);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#e7fff4';
  ctx.font = `650 ${Math.floor(w * 0.055)}px ${FONT}`;
  ctx.fillText('과제 성과', w / 2, h * 0.27);

  const cards = [
    ['A1 특허', '1', '건'],
    ['A2 특허', '19', '건'],
  ];
  cards.forEach((card, index) => {
    const y = h * 0.31 + index * h * 0.24;
    roundRect(ctx, w * 0.08, y, w * 0.84, h * 0.21, w * 0.03);
    ctx.fillStyle = '#f7f4ef';
    ctx.fill();
    ctx.fillStyle = GREEN;
    ctx.font = `650 ${Math.floor(w * 0.05)}px ${FONT}`;
    ctx.fillText(card[0], w / 2, y + h * 0.055);
    ctx.fillStyle = '#10241c';
    ctx.font = `650 ${Math.floor(w * 0.2)}px ${FONT}`;
    ctx.fillText(card[1], w / 2, y + h * 0.145);
    ctx.font = `600 ${Math.floor(w * 0.04)}px ${FONT}`;
    ctx.fillStyle = '#3e5c50';
    ctx.fillText(card[2], w / 2, y + h * 0.185);
  });

  ctx.fillStyle = '#07110e';
  ctx.fillRect(0, h * 0.84, w, h * 0.16);
  ctx.fillStyle = '#ffffff';
  ctx.font = `500 ${Math.floor(w * 0.036)}px ${FONT}`;
  ctx.fillText('반려견의 일상을 기록하고', w / 2, h * 0.885);
  ctx.fillText('작은 이상 신호까지 놓치지 않습니다', w / 2, h * 0.915);
  ctx.font = `650 ${Math.floor(w * 0.04)}px ${FONT}`;
  ctx.fillStyle = '#d7f3e6';
  ctx.fillText('13g 웨어러블  ·  앱  ·  구독', w / 2, h * 0.955);
  ctx.textAlign = 'left';
}

function drawDoor(ctx, w, h) {
  ctx.fillStyle = '#f7f4ef';
  ctx.fillRect(0, 0, w, h);
  paw(ctx, w / 2, h * 0.36, w * 0.16, GREEN);
  ctx.textAlign = 'center';
  ctx.fillStyle = GREEN;
  ctx.font = `650 ${Math.floor(w * 0.12)}px ${FONT}`;
  ctx.fillText('Sirius', w / 2, h * 0.62);
  ctx.font = `500 ${Math.floor(w * 0.045)}px ${FONT}`;
  ctx.fillStyle = '#3e5c50';
  ctx.fillText('AI 펫 케어', w / 2, h * 0.7);
  ctx.textAlign = 'left';
}

function grain(ctx, w, h, base, line) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 28) {
    ctx.fillStyle = line;
    ctx.globalAlpha = 0.15 + Math.random() * 0.25;
    ctx.fillRect(0, y + Math.random() * 6, w, 2 + Math.random() * 3);
  }
  ctx.globalAlpha = 1;
}

export function buildTextures(layout, anisotropy) {
  const made = [];
  const keep = (texture) => {
    made.push(texture);
    return texture;
  };
  const paint = (drawer, width, height) => {
    const { c, ctx } = sized(width, height);
    drawer(ctx, c.width, c.height);
    return keep(toTexture(c, anisotropy));
  };

  const textures = {
    tv: null,
    totem: null,
    feature: null,
    results: null,
    plaque: null,
    vision: null,
    product: null,
    door: null,
    sign: null,
  };

  if (layout.tv) {
    const { c, ctx } = canvas(1280, 720);
    drawTv(ctx, 1280, 720);
    textures.tv = keep(toTexture(c, anisotropy));
  }
  if (layout.totem) {
    const portrait = layout.totem.portrait;
    const { c, ctx } = canvas(portrait ? 720 : 1280, portrait ? 1280 : 720);
    drawTotem(ctx, c.width, c.height, portrait);
    textures.totem = keep(toTexture(c, anisotropy));
  }
  if (layout.sign) {
    const { c, ctx } = canvas(900, 2118);
    if (layout.sign.design === 'patent') drawSignPatent(ctx, c.width, c.height);
    else drawSignCare(ctx, c.width, c.height);
    textures.sign = keep(toTexture(c, anisotropy));
  }

  const panels = [];
  if (layout.column) panels.push(...Object.values(layout.column.panels));
  if (layout.wings) panels.push(...Object.values(layout.wings));
  if (layout.posters) panels.push(...layout.posters);
  const drawers = {
    feature: drawFeature,
    results: drawResults,
    plaque: drawPlaque,
    vision: drawVision,
    product: drawProduct,
    hardware: drawHardware,
  };
  for (const panel of panels) {
    if (textures[panel.key]) continue;
    if (panel.key === 'hardware') {
      const height = 1500;
      const { c, ctx } = canvas(Math.round(height * panel.w / panel.h), height);
      drawHardware(ctx, c.width, c.height);
      textures.hardware = keep(toTexture(c, anisotropy));
    } else if (drawers[panel.key]) {
      textures[panel.key] = paint(drawers[panel.key], panel.w, panel.h);
    }
  }
  if (layout.column || true) {
    const { c, ctx } = canvas(640, 880);
    drawDoor(ctx, 640, 880);
    textures.door = keep(toTexture(c, anisotropy));
  }

  textures.dispose = () => {
    made.forEach((texture) => texture.dispose());
  };
  return textures;
}

export function buildFloors(anisotropy) {
  const woodCanvas = canvas(512, 512);
  grain(woodCanvas.ctx, 512, 512, '#c4a36e', '#6d4b28');
  const wood = toTexture(woodCanvas.c, anisotropy);
  wood.wrapS = THREE.RepeatWrapping;
  wood.wrapT = THREE.RepeatWrapping;
  wood.repeat.set(4, 4);

  const carpetCanvas = canvas(256, 256);
  const image = carpetCanvas.ctx.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i += 1) {
    const n = 108 + Math.random() * 18;
    image.data[i * 4] = n + 6;
    image.data[i * 4 + 1] = n + 4;
    image.data[i * 4 + 2] = n - 4;
    image.data[i * 4 + 3] = 255;
  }
  carpetCanvas.ctx.putImageData(image, 0, 0);
  const carpet = toTexture(carpetCanvas.c, anisotropy);
  carpet.wrapS = THREE.RepeatWrapping;
  carpet.wrapT = THREE.RepeatWrapping;
  carpet.repeat.set(6, 6);

  return { wood, carpet };
}
