import { type ExerciseType, type PostureFeedback } from '../types';
import PoseDetector from './PoseDetector';
import './WorkoutPage.css';

interface Props {
  exercise: ExerciseType;
  onRepCount: (n: number) => void;
  onIssueDetected: (issues: string[]) => void;
  onEndWorkout: () => void;
}

export default function WorkoutPage({
  exercise,
  onRepCount,
  onIssueDetected,
  onEndWorkout,
}: Props) {
  const noop = (_: PostureFeedback) => {};

  return (
    <div className="workout-page">
      <PoseDetector
        exercise={exercise}
        onFeedback={noop}
        onLoadingChange={() => {}}
        onRepCount={onRepCount}
        onIssueDetected={onIssueDetected}
      />
      <button className="end-workout-btn" onClick={onEndWorkout}>
        End Workout
      </button>
    </div>
  );
}
