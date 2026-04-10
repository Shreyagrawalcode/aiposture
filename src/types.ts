export type ExerciseType = 'squat' | 'pushup' | 'deadlift' | 'ohpress';

export type PostureStatus = 'good' | 'warning' | 'fix' | 'idle';

export interface JointAngle {
  label: string;
  value: number | null;
  unit: string;
}

export interface PostureFeedback {
  status: PostureStatus;
  angles: JointAngle[];
  issues: string[];
  tips: string[];
  /** Short coach-style message shown on the HUD — encouraging & actionable */
  coachMessage: string;
  /** Form quality 0–100 — used for skeleton color intensity */
  formScore: number;
}

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface ExerciseConfig {
  id: ExerciseType;
  label: string;
  icon: string;
  description: string;
  muscles: string;
}

export interface WorkoutResults {
  repCount: number;
  issues: string[];
  exercise: ExerciseType;
  /** Best form score achieved during the session */
  bestScore: number;
  /** Average form score across the session */
  avgScore: number;
}

export const EXERCISES: ExerciseConfig[] = [
  {
    id: 'squat',
    label: 'Squat',
    icon: '🏋️',
    description: 'Knee angle, hip depth & knee-toe alignment',
    muscles: 'Quads · Glutes · Core',
  },
  {
    id: 'pushup',
    label: 'Push-up',
    icon: '💪',
    description: 'Elbow angle, hip alignment & ROM',
    muscles: 'Chest · Triceps · Core',
  },
  {
    id: 'deadlift',
    label: 'Deadlift',
    icon: '🔩',
    description: 'Back angle, knee bend & hip hinge',
    muscles: 'Back · Hamstrings · Glutes',
  },
  {
    id: 'ohpress',
    label: 'Overhead Press',
    icon: '🙌',
    description: 'Elbow lockout & wrist alignment',
    muscles: 'Shoulders · Triceps · Core',
  },
];
