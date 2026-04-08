import { type Landmark } from '../types';

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
