import { type Landmark, type PostureFeedback, type PostureStatus } from '../types';

// MediaPipe Pose landmark connections
const POSE_CONNECTIONS: [number, number][] = [
  // Face
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  // Torso
  [11, 12], [11, 23], [12, 24], [23, 24],
  // Left arm
  [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
  // Right arm
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  // Left leg
  [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
  // Right leg
  [24, 26], [26, 28], [28, 30], [28, 32], [30, 32],
];

const STATUS_COLORS = {
  good: '#00ff88',
  warning: '#ffaa00',
  fix: '#ff3b3b',
  idle: '#4488ff',
};

export function drawPose(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  width: number,
  height: number,
  status: 'good' | 'warning' | 'fix' | 'idle'
): void {
  const color = STATUS_COLORS[status];
  const dimColor = color + '88'; // semi-transparent for connections

  ctx.clearRect(0, 0, width, height);

  if (!landmarks || landmarks.length === 0) return;

  const toPixel = (lm: Landmark) => ({
    x: lm.x * width,
    y: lm.y * height,
  });

  // Draw connections
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';

  for (const [i, j] of POSE_CONNECTIONS) {
    const a = landmarks[i];
    const b = landmarks[j];
    if (!a || !b) continue;
    if ((a.visibility ?? 1) < 0.4 || (b.visibility ?? 1) < 0.4) continue;

    const pa = toPixel(a);
    const pb = toPixel(b);

    ctx.beginPath();
    ctx.strokeStyle = dimColor;
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.stroke();
  }

  // Draw landmarks
  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i];
    if (!lm || (lm.visibility ?? 1) < 0.4) continue;

    const p = toPixel(lm);
    const radius = i < 11 ? 3 : 5; // smaller dots for face

    // Outer glow ring
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius + 2, 0, 2 * Math.PI);
    ctx.fillStyle = color + '44';
    ctx.fill();

    // Inner dot
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

// ─── HUD overlay ─────────────────────────────────────────────────────────────

const HUD_COLORS: Record<PostureStatus, string> = {
  good:    '#00ff88',
  warning: '#ffaa00',
  fix:     '#ff4444',
  idle:    '#4488ff',
};

const STATUS_LABEL: Record<PostureStatus, string> = {
  good:    'GOOD',
  warning: 'CHECK',
  fix:     'FIX',
  idle:    '',
};

function drawPill(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string,
  textColor: string,
  align: 'left' | 'center'
): void {
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';

  const metrics = ctx.measureText(text);
  const tw = metrics.width;
  const th = metrics.actualBoundingBoxDescent + metrics.actualBoundingBoxAscent;
  const pH = 10, pV = 7;

  const boxX = align === 'center' ? x - tw / 2 - pH : x - pH;
  const boxY = y - pV;
  const boxW = tw + pH * 2;
  const boxH = th + pV * 2 + 4;

  ctx.fillStyle = 'rgba(0,0,0,0.60)';
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(boxX, boxY, boxW, boxH, 10);
  } else {
    ctx.rect(boxX, boxY, boxW, boxH);
  }
  ctx.fill();

  ctx.fillStyle = textColor;
  ctx.fillText(text, x, y);
}

export function drawHUD(
  ctx: CanvasRenderingContext2D,
  repCount: number,
  feedback: PostureFeedback,
  width: number,
  height: number
): void {
  const bigSize   = Math.max(28, Math.round(height * 0.09));
  const smallSize = Math.max(16, Math.round(height * 0.048));
  const bigFont   = `bold ${bigSize}px 'Inter', system-ui, sans-serif`;
  const smallFont = `bold ${smallSize}px 'Inter', system-ui, sans-serif`;
  const color     = HUD_COLORS[feedback.status];

  // ── REPS counter (top-left) ──
  drawPill(ctx, `REPS  ${repCount}`, 28, 24, bigFont, color, 'left');

  // ── Status label (centred, ~18% from top) ──
  const label = STATUS_LABEL[feedback.status];
  if (label) {
    drawPill(ctx, label, width / 2, height * 0.18, bigFont, color, 'center');
  }

  // ── Primary angle (centred, ~30% from top) ──
  const primary = feedback.angles[0];
  if (primary && primary.value !== null) {
    const angleText = `${primary.label}  ${primary.value}${primary.unit}`;
    drawPill(ctx, angleText, width / 2, height * 0.30, smallFont, '#ffffff', 'center');
  }

  // Reset canvas state
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'alphabetic';
}
