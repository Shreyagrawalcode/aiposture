import { type Landmark } from '../types';

/**
 * Calculate the angle at joint B formed by points A-B-C.
 * Returns degrees in range [0, 180].
 */
export function calculateAngle(a: Landmark, b: Landmark, c: Landmark): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return Math.round(angle);
}

/**
 * Returns the midpoint of two landmarks.
 */
export function midpoint(a: Landmark, b: Landmark): Landmark {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
    visibility: Math.min(a.visibility ?? 1, b.visibility ?? 1),
  };
}

/**
 * Check if landmark is sufficiently visible (above threshold).
 */
export function isVisible(lm: Landmark, threshold = 0.5): boolean {
  return (lm.visibility ?? 1) > threshold;
}

/**
 * All landmarks visible check for a group.
 */
export function allVisible(lms: Landmark[], threshold = 0.5): boolean {
  return lms.every((lm) => isVisible(lm, threshold));
}
