import { type Landmark, type PostureFeedback, type PostureStatus } from '../types';

// Body-only connections (skip face landmarks 0-10 for cleaner look)
const POSE_CONNECTIONS: [number, number][] = [
  // Torso
  [11, 12], [11, 23], [12, 24], [23, 24],
  // Left arm
  [11, 13], [13, 15],
  // Right arm
  [12, 14], [14, 16],
  // Left leg
  [23, 25], [25, 27],
  // Right leg
  [24, 26], [26, 28],
];

const STATUS_COLORS: Record<PostureStatus, string> = {
  good:    '#00e68a',
  warning: '#ffb84d',
  fix:     '#ff5c5c',
  idle:    '#5c9eff',
};

// Secondary color for gradient skeleton effect
const STATUS_COLORS_ALT: Record<PostureStatus, string> = {
  good:    '#a78bfa',
  warning: '#ff8f00',
  fix:     '#ff1744',
  idle:    '#818cf8',
};

export function drawPose(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  width: number,
  height: number,
  status: PostureStatus
): void {
  const color = STATUS_COLORS[status];

  ctx.clearRect(0, 0, width, height);
  if (!landmarks || landmarks.length === 0) return;

  const toPixel = (lm: Landmark) => ({
    x: lm.x * width,
    y: lm.y * height,
  });

  const colorAlt = STATUS_COLORS_ALT[status];

  // Draw connections with gradient glow
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const [i, j] of POSE_CONNECTIONS) {
    const a = landmarks[i];
    const b = landmarks[j];
    if (!a || !b) continue;
    if ((a.visibility ?? 1) < 0.4 || (b.visibility ?? 1) < 0.4) continue;

    const pa = toPixel(a);
    const pb = toPixel(b);

    // Create gradient along the bone
    const grad = ctx.createLinearGradient(pa.x, pa.y, pb.x, pb.y);
    grad.addColorStop(0, color + 'cc');
    grad.addColorStop(1, colorAlt + 'cc');

    const glowGrad = ctx.createLinearGradient(pa.x, pa.y, pb.x, pb.y);
    glowGrad.addColorStop(0, color + '25');
    glowGrad.addColorStop(1, colorAlt + '25');

    // Outer glow line
    ctx.beginPath();
    ctx.strokeStyle = glowGrad;
    ctx.lineWidth = 10;
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.stroke();

    // Inner solid line
    ctx.beginPath();
    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.stroke();
  }

  // Draw key joints with dual-ring style
  const keyJoints = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
  for (const idx of keyJoints) {
    const lm = landmarks[idx];
    if (!lm || (lm.visibility ?? 1) < 0.4) continue;

    const p = toPixel(lm);

    // Outer ring glow
    ctx.beginPath();
    ctx.arc(p.x, p.y, 9, 0, 2 * Math.PI);
    ctx.fillStyle = colorAlt + '18';
    ctx.fill();

    // Inner ring
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();

    // Center bright dot
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
}

// ─── HUD overlay ─────────────────────────────────────────────────────────────

function drawGlassPill(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string,
  textColor: string,
  align: 'left' | 'center',
  bgAlpha = 0.5
): { width: number; height: number } {
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';

  const metrics = ctx.measureText(text);
  const tw = metrics.width;
  const th = metrics.actualBoundingBoxDescent + metrics.actualBoundingBoxAscent;
  const pH = 14, pV = 9;

  const boxX = align === 'center' ? x - tw / 2 - pH : x - pH;
  const boxY = y - pV;
  const boxW = tw + pH * 2;
  const boxH = th + pV * 2 + 4;

  ctx.fillStyle = `rgba(0,0,0,${bgAlpha})`;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(boxX, boxY, boxW, boxH, 12);
  } else {
    ctx.rect(boxX, boxY, boxW, boxH);
  }
  ctx.fill();

  ctx.fillStyle = textColor;
  ctx.fillText(text, x, y);

  return { width: boxW, height: boxH };
}

export function drawHUD(
  ctx: CanvasRenderingContext2D,
  _repCount: number,
  feedback: PostureFeedback,
  width: number,
  height: number
): void {
  const color = STATUS_COLORS[feedback.status];

  // ── Status badge (top-centre) ──
  if (feedback.status !== 'idle') {
    const statusSize = Math.max(20, Math.round(height * 0.055));
    const statusFont = `800 ${statusSize}px 'Inter', system-ui, sans-serif`;
    const label = feedback.status === 'good' ? 'GOOD FORM' : feedback.status === 'warning' ? 'CHECK FORM' : 'FIX FORM';
    drawGlassPill(ctx, label, width / 2, 24, statusFont, color, 'center');
  }

  // ── Form score (top-right) ──
  if (feedback.formScore > 0) {
    const scoreSize = Math.max(16, Math.round(height * 0.042));
    const scoreFont = `700 ${scoreSize}px 'Inter', system-ui, sans-serif`;
    drawGlassPill(ctx, `${feedback.formScore}%`, width - 24, 24, scoreFont, color, 'left');
  }

  // ── Primary angle (below status) ──
  const primary = feedback.angles[0];
  if (primary && primary.value !== null && feedback.status !== 'idle') {
    const angleSize = Math.max(14, Math.round(height * 0.038));
    const angleFont = `600 ${angleSize}px 'Inter', system-ui, sans-serif`;
    drawGlassPill(ctx, `${primary.label}  ${primary.value}${primary.unit}`, width / 2, height * 0.14, angleFont, '#ffffffcc', 'center', 0.4);
  }

  // ── Coach message (bottom-centre, just above the bottom bar) ──
  if (feedback.coachMessage) {
    const msgSize = Math.max(13, Math.round(height * 0.036));
    const msgFont = `600 ${msgSize}px 'Inter', system-ui, sans-serif`;
    const msgColor = feedback.status === 'idle' ? '#ffffffaa' : color;
    // Positioned closer to bottom bar (~75px from bottom)
    drawGlassPill(ctx, feedback.coachMessage, width / 2, height - 78, msgFont, msgColor, 'center', 0.6);
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}
