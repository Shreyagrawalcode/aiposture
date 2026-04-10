import { type ExerciseType, type Landmark, type PostureFeedback, type PostureStatus } from '../types';
import { allVisible, calculateAngle } from './angleUtils';

// ─── Squat ────────────────────────────────────────────────────────────────────
function analyzeSquat(lm: Landmark[]): PostureFeedback {
  // Left side: hip(23) knee(25) ankle(27) | Right side: hip(24) knee(26) ankle(28)
  const leftVisible = allVisible([lm[23], lm[25], lm[27]]);
  const rightVisible = allVisible([lm[24], lm[26], lm[28]]);

  if (!leftVisible && !rightVisible) {
    return idleFeedback('Stand sideways or face the camera so your full body is visible.');
  }

  const side = leftVisible ? 'left' : 'right';
  const [hip, knee, ankle] =
    side === 'left'
      ? [lm[23], lm[25], lm[27]]
      : [lm[24], lm[26], lm[28]];

  const kneeAngle = calculateAngle(hip, knee, ankle);

  // Hip angle: shoulder-hip-knee
  const shoulder = side === 'left' ? lm[11] : lm[12];
  const hipAngle = calculateAngle(shoulder, hip, knee);

  // If person is just standing upright (knee > 155 AND hip > 155), show idle not red
  if (kneeAngle > 155 && hipAngle > 155) {
    return {
      status: 'idle',
      angles: [
        { label: 'Knee Angle', value: kneeAngle, unit: '°' },
        { label: 'Hip Angle', value: hipAngle, unit: '°' },
      ],
      issues: [],
      tips: ['Start squatting when you\'re ready — the AI will track your form.'],
    };
  }

  // Knee-over-toe: in normalised coords, if knee.x > ankle.x significantly (mirrored)
  const kneePastToe = Math.abs(knee.x - ankle.x) > 0.08;

  const issues: string[] = [];

  // Knee depth classification
  let status: PostureStatus;
  if (kneeAngle < 95) {
    status = 'good';
  } else if (kneeAngle <= 130) {
    status = 'warning';
    issues.push('Squat deeper — aim for thighs parallel or below');
  } else {
    status = 'warning';
    issues.push('Not squatting deep enough — bend your knees more');
  }

  // Hip angle (too vertical = no hinge)
  if (hipAngle > 160) {
    if (status === 'good') status = 'warning';
    issues.push('Hinge your hips back — avoid staying too upright');
  }

  // Knee caving (valgus) — rough check using both knees if visible
  if (leftVisible && rightVisible) {
    const kneeWidth = Math.abs(lm[25].x - lm[26].x);
    const ankleWidth = Math.abs(lm[27].x - lm[28].x);
    if (kneeWidth < ankleWidth * 0.75) {
      if (status === 'good') status = 'warning';
      issues.push('Knees caving inward — push knees out over toes');
    }
  }

  if (kneePastToe) {
    if (status === 'good') status = 'warning';
    issues.push('Keep knees tracking over toes, not behind them');
  }

  return {
    status,
    angles: [
      { label: 'Knee Angle', value: kneeAngle, unit: '°' },
      { label: 'Hip Angle', value: hipAngle, unit: '°' },
    ],
    issues,
    tips: squatTips(issues),
  };
}

function squatTips(issues: string[]): string[] {
  if (issues.length === 0) {
    return [
      'Great depth! Drive through your heels on the way up.',
      'Keep your chest proud and core braced throughout.',
      'Pause at the bottom to build strength in that range.',
    ];
  }
  const tips: string[] = [];
  if (issues.some((i) => i.includes('deep'))) {
    tips.push('Practice box squats to build confidence at depth.');
    tips.push('Elevate heels slightly if ankle mobility limits depth.');
  }
  if (issues.some((i) => i.includes('caving') || i.includes('Knees'))) {
    tips.push('Place a resistance band above knees — push out against it.');
    tips.push('Strengthen glute medius with lateral band walks.');
  }
  if (issues.some((i) => i.includes('hips') || i.includes('upright'))) {
    tips.push('Practice hip hinge drills with a dowel rod along your spine.');
  }
  // Pad to 3 tips
  const defaults = [
    'Brace your core before descending.',
    'Keep weight evenly distributed across your whole foot.',
    'Film yourself from the side to track your bar path.',
  ];
  while (tips.length < 3) tips.push(defaults[tips.length]);
  return tips.slice(0, 3);
}

// ─── Push-up / Plank ─────────────────────────────────────────────────────────
function analyzePushup(lm: Landmark[]): PostureFeedback {
  // Elbow: shoulder(11/12) elbow(13/14) wrist(15/16)
  const leftElbow = allVisible([lm[11], lm[13], lm[15]]);
  const rightElbow = allVisible([lm[12], lm[14], lm[16]]);

  if (!leftElbow && !rightElbow) {
    return idleFeedback('Get into push-up/plank position facing sideways to the camera.');
  }

  const [shoulder, elbow, wrist] = leftElbow
    ? [lm[11], lm[13], lm[15]]
    : [lm[12], lm[14], lm[16]];

  const elbowAngle = calculateAngle(shoulder, elbow, wrist);

  // Hip sag: check if hip y is below the shoulder-ankle line
  const leftHipVisible = allVisible([lm[11], lm[23], lm[27]]);
  const rightHipVisible = allVisible([lm[12], lm[24], lm[28]]);

  let hipSag = false;
  let hipPike = false;

  if (leftHipVisible) {
    const shoulderY = lm[11].y;
    const ankleY = lm[27].y;
    const hipY = lm[23].y;
    // In normalised coords y increases downward
    const expectedHipY = shoulderY + (ankleY - shoulderY) * 0.5; // midpoint
    hipSag = hipY > expectedHipY + 0.05;
    hipPike = hipY < expectedHipY - 0.08;
  } else if (rightHipVisible) {
    const shoulderY = lm[12].y;
    const ankleY = lm[28].y;
    const hipY = lm[24].y;
    const expectedHipY = shoulderY + (ankleY - shoulderY) * 0.5;
    hipSag = hipY > expectedHipY + 0.05;
    hipPike = hipY < expectedHipY - 0.08;
  }

  const issues: string[] = [];
  let status: PostureStatus = 'good';

  // If arms are nearly straight and no hip data indicates push-up position, treat as idle
  if (elbowAngle > 155 && !hipSag && !hipPike) {
    return {
      status: 'idle',
      angles: [{ label: 'Elbow Angle', value: elbowAngle, unit: '°' }],
      issues: [],
      tips: ['Get into push-up position — the AI will track your form.'],
    };
  }

  if (elbowAngle < 75) {
    status = 'good';
  } else if (elbowAngle <= 110) {
    status = 'good'; // mid-range push-up
  } else if (elbowAngle <= 150) {
    status = 'warning';
    issues.push('Lower your chest closer to the floor');
  } else {
    status = 'warning';
    issues.push('Arms barely bending — perform a full range push-up');
  }

  if (hipSag) {
    if (status === 'good') status = 'warning';
    issues.push('Hips sagging — squeeze glutes and brace your core');
  }

  if (hipPike) {
    if (status === 'good') status = 'warning';
    issues.push('Hips too high — lower into a straight plank line');
  }

  return {
    status,
    angles: [{ label: 'Elbow Angle', value: elbowAngle, unit: '°' }],
    issues,
    tips: pushupTips(issues),
  };
}

function pushupTips(issues: string[]): string[] {
  if (issues.length === 0) {
    return [
      'Great form! Pause at the bottom for extra chest activation.',
      'Try tempo push-ups: 3s down, 1s hold, 1s up.',
      'Add a resistance band across your back for progressive overload.',
    ];
  }
  const tips: string[] = [];
  if (issues.some((i) => i.includes('Lower') || i.includes('range'))) {
    tips.push('Start with incline push-ups to build strength through full range.');
    tips.push('Use push-up handles to allow deeper chest travel.');
  }
  if (issues.some((i) => i.includes('sag') || i.includes('core'))) {
    tips.push('Practice dead-bug holds to strengthen your anti-extension core.');
    tips.push('Hold a plank for 30–60 s before attempting push-ups.');
  }
  if (issues.some((i) => i.includes('high'))) {
    tips.push('Engage your quads and point your tailbone slightly downward.');
  }
  const defaults = [
    'Keep your elbows at ~45° from your torso, not flared out.',
    'Breathe in on the way down, out on the way up.',
    'Full body tension is the key to a solid push-up.',
  ];
  while (tips.length < 3) tips.push(defaults[tips.length]);
  return tips.slice(0, 3);
}

// ─── Deadlift ─────────────────────────────────────────────────────────────────
function analyzeDeadlift(lm: Landmark[]): PostureFeedback {
  // Back angle: shoulder-hip-knee
  const leftVisible = allVisible([lm[11], lm[23], lm[25]]);
  const rightVisible = allVisible([lm[12], lm[24], lm[26]]);

  if (!leftVisible && !rightVisible) {
    return idleFeedback('Stand sideways to the camera so your full body is visible.');
  }

  const [shoulder, hip, knee] = leftVisible
    ? [lm[11], lm[23], lm[25]]
    : [lm[12], lm[24], lm[26]];

  const backAngle = calculateAngle(shoulder, hip, knee);

  // Knee bend
  const ankle = leftVisible ? lm[27] : lm[28];
  const kneeAngle = calculateAngle(hip, knee, ankle);

  // Standing upright — not doing a deadlift yet
  if (backAngle > 165 && kneeAngle > 165) {
    return {
      status: 'idle',
      angles: [
        { label: 'Back Angle', value: backAngle, unit: '°' },
        { label: 'Knee Bend', value: kneeAngle, unit: '°' },
      ],
      issues: [],
      tips: ['Start your deadlift when ready — the AI will track your form.'],
    };
  }

  const issues: string[] = [];
  let status: PostureStatus;

  if (backAngle >= 150) {
    status = 'good';
  } else if (backAngle >= 130) {
    status = 'warning';
    issues.push('Back rounding — brace your lats and keep a neutral spine');
  } else {
    status = 'fix';
    issues.push('Severe back rounding — stop and reset with lighter weight');
  }

  if (kneeAngle > 170) {
    if (status === 'good') status = 'warning';
    issues.push('Bend your knees more at the start — this is not a stiff-leg deadlift');
  }

  // Check shoulder-over-bar position (shoulder should be ahead of or over hips at hinge)
  if (shoulder.y > hip.y + 0.05) {
    // shoulder below hip in image space = excessive lean
    if (status === 'good') status = 'warning';
    issues.push('Excessive forward lean — drive your hips back, not down');
  }

  return {
    status,
    angles: [
      { label: 'Back Angle', value: backAngle, unit: '°' },
      { label: 'Knee Bend', value: kneeAngle, unit: '°' },
    ],
    issues,
    tips: deadliftTips(issues),
  };
}

function deadliftTips(issues: string[]): string[] {
  if (issues.length === 0) {
    return [
      'Strong back position! Focus on driving the floor away on the pull.',
      'Engage your lats by imagining you\'re protecting your armpits.',
      'Maintain the same back angle from the floor to the knee.',
    ];
  }
  const tips: string[] = [];
  if (issues.some((i) => i.includes('rounding') || i.includes('neutral'))) {
    tips.push('Practice Romanian deadlifts to reinforce hip hinge pattern.');
    tips.push('Use a lighter weight and focus on a proud chest, neutral spine.');
  }
  if (issues.some((i) => i.includes('knees'))) {
    tips.push('Think "push the floor away" rather than "pull the bar up".');
  }
  if (issues.some((i) => i.includes('lean'))) {
    tips.push('Set your hips back and down before you initiate the pull.');
  }
  const defaults = [
    'Breathe in deep, brace core 360°, then pull.',
    'Keep the bar close to your body the entire lift.',
    'Film from the side to check your spine position at lockout.',
  ];
  while (tips.length < 3) tips.push(defaults[tips.length]);
  return tips.slice(0, 3);
}

// ─── Overhead Press ───────────────────────────────────────────────────────────
function analyzeOHPress(lm: Landmark[]): PostureFeedback {
  // Elbow: shoulder(11/12) elbow(13/14) wrist(15/16)
  const leftVisible = allVisible([lm[11], lm[13], lm[15]]);
  const rightVisible = allVisible([lm[12], lm[14], lm[16]]);

  if (!leftVisible && !rightVisible) {
    return idleFeedback('Face the camera and raise your arms to shoulder height to begin.');
  }

  const [shoulder, elbow, wrist] = leftVisible
    ? [lm[11], lm[13], lm[15]]
    : [lm[12], lm[14], lm[16]];

  const elbowAngle = calculateAngle(shoulder, elbow, wrist);

  // Wrist above shoulder check (y decreases upward in normalised)
  const wristAboveShoulder = wrist.y < shoulder.y;
  // Wrist alignment: wrist x should be within ~0.06 of shoulder x
  const wristAligned = Math.abs(wrist.x - shoulder.x) < 0.1;

  // Hip lean-back check using hip landmark
  const hipVisible = leftVisible ? allVisible([lm[23]]) : allVisible([lm[24]]);
  const hip = leftVisible ? lm[23] : lm[24];
  let excessiveLean = false;
  if (hipVisible) {
    excessiveLean = Math.abs(hip.x - shoulder.x) > 0.12;
  }

  // If arms are down at sides (wrist below shoulder, low elbow angle), treat as idle
  if (elbowAngle < 90 && !wristAboveShoulder) {
    return {
      status: 'idle',
      angles: [{ label: 'Elbow Angle', value: elbowAngle, unit: '°' }],
      issues: [],
      tips: ['Raise the bar to shoulder height to begin — the AI will track your form.'],
    };
  }

  const issues: string[] = [];
  let status: PostureStatus = 'good';

  // Lockout check
  if (elbowAngle > 160) {
    status = 'good';
  } else if (elbowAngle > 130) {
    status = 'warning';
    issues.push('Extend arms fully overhead — squeeze at lockout');
  } else {
    status = 'warning';
    issues.push('Arms not reaching overhead — press all the way up');
  }

  if (!wristAligned) {
    if (status === 'good') status = 'warning';
    issues.push('Wrists drifting sideways — keep them stacked over shoulders');
  }

  if (!wristAboveShoulder && elbowAngle > 130) {
    if (status === 'good') status = 'warning';
    issues.push('Get your wrists above your ears at the top');
  }

  if (excessiveLean) {
    if (status === 'good') status = 'warning';
    issues.push('Excessive back lean — engage core and keep hips under bar');
  }

  return {
    status,
    angles: [{ label: 'Elbow Angle', value: elbowAngle, unit: '°' }],
    issues,
    tips: ohpTips(issues),
  };
}

function ohpTips(issues: string[]): string[] {
  if (issues.length === 0) {
    return [
      'Solid lockout! Focus on shrugging your traps at the very top.',
      'Keep your ribcage down and glutes squeezed throughout.',
      'Try paused reps at the bottom to build pressing strength.',
    ];
  }
  const tips: string[] = [];
  if (issues.some((i) => i.includes('Extend') || i.includes('press'))) {
    tips.push('Drop weight and practice full lockout reps consistently.');
    tips.push('Landmine press is great for building overhead strength safely.');
  }
  if (issues.some((i) => i.includes('Wrist') || i.includes('stacked'))) {
    tips.push('Keep a neutral wrist — avoid excessive wrist extension.');
  }
  if (issues.some((i) => i.includes('lean') || i.includes('core'))) {
    tips.push('Brace your core as if taking a punch — then press.');
    tips.push('Strengthen your anterior core with ab wheel rollouts.');
  }
  const defaults = [
    'Flare elbows slightly forward (not 90°) at the start.',
    'Drive your head through the window at lockout.',
    'Control the bar on the way down — don\'t let it crash.',
  ];
  while (tips.length < 3) tips.push(defaults[tips.length]);
  return tips.slice(0, 3);
}

// ─── Idle / fallback ─────────────────────────────────────────────────────────
function idleFeedback(hint: string): PostureFeedback {
  return {
    status: 'idle',
    angles: [],
    issues: [hint],
    tips: [
      'Make sure your full body is visible in the frame.',
      'Good lighting helps the AI detect your pose accurately.',
      'Stand 2–3 metres from the camera for best results.',
    ],
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function analyzeExercise(
  exercise: ExerciseType,
  landmarks: Landmark[]
): PostureFeedback {
  if (!landmarks || landmarks.length < 33) return idleFeedback('No pose detected.');

  switch (exercise) {
    case 'squat':
      return analyzeSquat(landmarks);
    case 'pushup':
      return analyzePushup(landmarks);
    case 'deadlift':
      return analyzeDeadlift(landmarks);
    case 'ohpress':
      return analyzeOHPress(landmarks);
  }
}
