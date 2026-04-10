import { type ExerciseType, type Landmark, type PostureFeedback, type PostureStatus } from '../types';
import { allVisible, calculateAngle } from './angleUtils';

// ─── Coach messages — rotated each call ─────────────────────────────────────
const GOOD_MSGS = [
  'Solid rep — keep going.',
  'Form is clean, stay locked in.',
  'That\'s it. Repeat that.',
  'Looking strong.',
  'Perfect. Again.',
  'Textbook form.',
  'You\'re dialled in.',
  'Great control.',
];
const IDLE_MSGS = [
  'Ready when you are.',
  'Step in frame to start.',
  'Waiting for movement...',
  'Get set and begin.',
];

let _gi = 0;
function goodMsg(): string { return GOOD_MSGS[_gi++ % GOOD_MSGS.length]; }
function idleMsg(): string { return IDLE_MSGS[Math.floor(Math.random() * IDLE_MSGS.length)]; }

// ─── Confidence-weighted visibility ─────────────────────────────────────────
// Only trust landmarks with >0.6 visibility (stricter than default 0.5)
function allConfident(lms: Landmark[]): boolean {
  return lms.every(lm => (lm.visibility ?? 0) > 0.6);
}

// ─── Score helper ────────────────────────────────────────────────────────────
function angleScore(value: number, ideal: number, okRange: number, badRange: number): number {
  const diff = Math.abs(value - ideal);
  if (diff <= okRange) return 100;
  if (diff >= badRange) return 0;
  return Math.round(100 * (1 - (diff - okRange) / (badRange - okRange)));
}

function makeResult(
  status: PostureStatus,
  angles: { label: string; value: number; unit: string }[],
  issues: string[],
  score: number,
  coach: string
): PostureFeedback {
  return { status, angles, issues, tips: [], coachMessage: coach, formScore: score };
}

function idleFeedback(msg: string): PostureFeedback {
  return makeResult('idle', [], [], 0, msg);
}

// ─── SQUAT ───────────────────────────────────────────────────────────────────
function analyzeSquat(lm: Landmark[]): PostureFeedback {
  const leftVis = allConfident([lm[23], lm[25], lm[27]]);
  const rightVis = allConfident([lm[24], lm[26], lm[28]]);
  if (!leftVis && !rightVis) return idleFeedback('Position full body in frame.');

  const side = leftVis ? 'left' : 'right';
  const [hip, knee, ankle] = side === 'left' ? [lm[23], lm[25], lm[27]] : [lm[24], lm[26], lm[28]];
  const shoulder = side === 'left' ? lm[11] : lm[12];

  const kneeAngle = calculateAngle(hip, knee, ankle);
  const hipAngle = calculateAngle(shoulder, hip, knee);

  // ── WIDE idle zone — standing upright means NOT squatting ──
  // Any knee angle above 145 with hip above 145 = standing still
  if (kneeAngle > 145 && hipAngle > 145) {
    return {
      status: 'idle',
      angles: [
        { label: 'Knee', value: kneeAngle, unit: '°' },
        { label: 'Hip', value: hipAngle, unit: '°' },
      ],
      issues: [],
      tips: [],
      coachMessage: idleMsg(),
      formScore: 0,
    };
  }

  const issues: string[] = [];
  let score = 100;

  // Depth — ideal ~85° at parallel
  const depthScore = angleScore(kneeAngle, 85, 15, 50);
  score = Math.min(score, depthScore);

  if (kneeAngle > 125) {
    issues.push('Go deeper — sit until thighs are parallel');
  } else if (kneeAngle > 100) {
    issues.push('Almost there — drop a few more inches');
  }

  // Hip hinge — must lean forward somewhat
  if (hipAngle > 160) {
    issues.push('Hinge hips back — don\'t stay so upright');
    score = Math.min(score, 60);
  }

  // Knee valgus
  if (leftVis && rightVis) {
    const kneeW = Math.abs(lm[25].x - lm[26].x);
    const ankleW = Math.abs(lm[27].x - lm[28].x);
    if (kneeW < ankleW * 0.7) {
      issues.push('Knees caving in — push them out');
      score = Math.min(score, 50);
    }
  }

  const status: PostureStatus = score >= 80 ? 'good' : score >= 45 ? 'warning' : 'fix';
  return makeResult(
    status,
    [{ label: 'Knee', value: kneeAngle, unit: '°' }, { label: 'Hip', value: hipAngle, unit: '°' }],
    issues, score, issues.length === 0 ? goodMsg() : issues[0]
  );
}

// ─── PUSH-UP ─────────────────────────────────────────────────────────────────
function analyzePushup(lm: Landmark[]): PostureFeedback {
  const leftVis = allConfident([lm[11], lm[13], lm[15]]);
  const rightVis = allConfident([lm[12], lm[14], lm[16]]);
  if (!leftVis && !rightVis) return idleFeedback('Get into push-up position sideways.');

  const [shoulder, elbow, wrist] = leftVis ? [lm[11], lm[13], lm[15]] : [lm[12], lm[14], lm[16]];
  const elbowAngle = calculateAngle(shoulder, elbow, wrist);

  // Hip sag/pike detection
  const leftHipVis = allConfident([lm[11], lm[23], lm[27]]);
  const rightHipVis = allConfident([lm[12], lm[24], lm[28]]);
  let hipSag = false, hipPike = false;

  if (leftHipVis) {
    const expected = lm[11].y + (lm[27].y - lm[11].y) * 0.5;
    hipSag = lm[23].y > expected + 0.05;
    hipPike = lm[23].y < expected - 0.08;
  } else if (rightHipVis) {
    const expected = lm[12].y + (lm[28].y - lm[12].y) * 0.5;
    hipSag = lm[24].y > expected + 0.05;
    hipPike = lm[24].y < expected - 0.08;
  }

  // Standing upright — not in push-up position
  if (elbowAngle > 150 && !hipSag && !hipPike) {
    return {
      status: 'idle',
      angles: [{ label: 'Elbow', value: elbowAngle, unit: '°' }],
      issues: [], tips: [],
      coachMessage: idleMsg(), formScore: 0,
    };
  }

  const issues: string[] = [];
  let score = 100;

  const romScore = angleScore(elbowAngle, 70, 25, 75);
  score = Math.min(score, romScore);

  if (elbowAngle > 140) {
    issues.push('Bend your arms more — full ROM');
  } else if (elbowAngle > 105) {
    issues.push('Lower your chest closer to the floor');
  }

  if (hipSag) { issues.push('Hips sagging — squeeze glutes & brace'); score = Math.min(score, 50); }
  if (hipPike) { issues.push('Hips too high — flatten into plank'); score = Math.min(score, 60); }

  const status: PostureStatus = score >= 80 ? 'good' : score >= 45 ? 'warning' : 'fix';
  return makeResult(
    status,
    [{ label: 'Elbow', value: elbowAngle, unit: '°' }],
    issues, score, issues.length === 0 ? goodMsg() : issues[0]
  );
}

// ─── DEADLIFT ────────────────────────────────────────────────────────────────
function analyzeDeadlift(lm: Landmark[]): PostureFeedback {
  const leftVis = allConfident([lm[11], lm[23], lm[25]]);
  const rightVis = allConfident([lm[12], lm[24], lm[26]]);
  if (!leftVis && !rightVis) return idleFeedback('Stand sideways, full body visible.');

  const [shoulder, hip, knee] = leftVis ? [lm[11], lm[23], lm[25]] : [lm[12], lm[24], lm[26]];
  const ankle = leftVis ? lm[27] : lm[28];

  const backAngle = calculateAngle(shoulder, hip, knee);
  const kneeAngle = calculateAngle(hip, knee, ankle);

  // Standing upright
  if (backAngle > 160 && kneeAngle > 160) {
    return {
      status: 'idle',
      angles: [
        { label: 'Back', value: backAngle, unit: '°' },
        { label: 'Knee', value: kneeAngle, unit: '°' },
      ],
      issues: [], tips: [],
      coachMessage: idleMsg(), formScore: 0,
    };
  }

  const issues: string[] = [];
  let score = 100;

  const backScore = angleScore(backAngle, 170, 20, 50);
  score = Math.min(score, backScore);

  if (backAngle < 130) {
    issues.push('Back rounding badly — reset now');
    score = Math.min(score, 20);
  } else if (backAngle < 150) {
    issues.push('Keep your spine neutral — chest up');
  }

  if (kneeAngle > 170) {
    issues.push('Bend knees more at the start');
    score = Math.min(score, 65);
  }

  if (shoulder.y > hip.y + 0.05) {
    issues.push('Too much forward lean — hips back');
    score = Math.min(score, 55);
  }

  const status: PostureStatus = score >= 80 ? 'good' : score >= 45 ? 'warning' : 'fix';
  return makeResult(
    status,
    [{ label: 'Back', value: backAngle, unit: '°' }, { label: 'Knee', value: kneeAngle, unit: '°' }],
    issues, score, issues.length === 0 ? goodMsg() : issues[0]
  );
}

// ─── OVERHEAD PRESS ──────────────────────────────────────────────────────────
function analyzeOHPress(lm: Landmark[]): PostureFeedback {
  const leftVis = allConfident([lm[11], lm[13], lm[15]]);
  const rightVis = allConfident([lm[12], lm[14], lm[16]]);
  if (!leftVis && !rightVis) return idleFeedback('Face camera, arms at shoulder height.');

  const [shoulder, elbow, wrist] = leftVis ? [lm[11], lm[13], lm[15]] : [lm[12], lm[14], lm[16]];
  const elbowAngle = calculateAngle(shoulder, elbow, wrist);
  const wristAbove = wrist.y < shoulder.y;
  const wristAligned = Math.abs(wrist.x - shoulder.x) < 0.1;

  const hipVis = leftVis ? allConfident([lm[23]]) : allConfident([lm[24]]);
  const hip = leftVis ? lm[23] : lm[24];
  let lean = false;
  if (hipVis) lean = Math.abs(hip.x - shoulder.x) > 0.12;

  // Arms at sides = idle
  if (elbowAngle < 90 && !wristAbove) {
    return {
      status: 'idle',
      angles: [{ label: 'Elbow', value: elbowAngle, unit: '°' }],
      issues: [], tips: [],
      coachMessage: idleMsg(), formScore: 0,
    };
  }

  const issues: string[] = [];
  let score = 100;

  const lockoutScore = angleScore(elbowAngle, 175, 15, 55);
  score = Math.min(score, lockoutScore);

  if (elbowAngle <= 130) {
    issues.push('Press all the way up — full lockout');
  } else if (elbowAngle <= 160) {
    issues.push('Extend more — squeeze at the top');
  }

  if (!wristAligned) { issues.push('Keep wrists stacked over shoulders'); score = Math.min(score, 65); }
  if (!wristAbove && elbowAngle > 130) { issues.push('Get wrists above your ears'); score = Math.min(score, 60); }
  if (lean) { issues.push('Too much lean — brace your core'); score = Math.min(score, 50); }

  const status: PostureStatus = score >= 80 ? 'good' : score >= 45 ? 'warning' : 'fix';
  return makeResult(
    status,
    [{ label: 'Elbow', value: elbowAngle, unit: '°' }],
    issues, score, issues.length === 0 ? goodMsg() : issues[0]
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function analyzeExercise(exercise: ExerciseType, landmarks: Landmark[]): PostureFeedback {
  if (!landmarks || landmarks.length < 33) return idleFeedback('No pose detected.');

  switch (exercise) {
    case 'squat':    return analyzeSquat(landmarks);
    case 'pushup':   return analyzePushup(landmarks);
    case 'deadlift': return analyzeDeadlift(landmarks);
    case 'ohpress':  return analyzeOHPress(landmarks);
  }
}
