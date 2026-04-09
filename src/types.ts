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
}

export interface WorkoutResults {
  repCount: number;
  issues: string[];
  exercise: ExerciseType;
}

export const EXERCISES: ExerciseConfig[] = [
  {
    id: 'squat',
    label: 'Squat',
    icon: '🏋️',
    description: 'Tracks knee angle, hip depth & knee-toe alignment',
  },
  {
    id: 'pushup',
    label: 'Push-up / Plank',
    icon: '💪',
    description: 'Tracks elbow angle & hip sag',
  },
  {
    id: 'deadlift',
    label: 'Deadlift',
    icon: '🔩',
    description: 'Tracks back angle & knee bend',
  },
  {
    id: 'ohpress',
    label: 'Overhead Press',
    icon: '🙌',
    description: 'Tracks elbow lockout & wrist alignment',
  },
];
