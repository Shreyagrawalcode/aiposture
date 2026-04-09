import { type ExerciseType, EXERCISES } from '../types';
import './SelectPage.css';

interface Props {
  onStart: (exercise: ExerciseType) => void;
}

const CAMERA_HINTS: Record<ExerciseType, string> = {
  squat:    'Side profile · 2–3 m away',
  pushup:   'Side profile · 2–3 m away',
  deadlift: 'Side profile · 2–3 m away',
  ohpress:  'Face the camera · 2 m away',
};

export default function SelectPage({ onStart }: Props) {
  return (
    <div className="select-page">
      <header className="select-header">
        <div className="select-logo">
          <span className="select-logo-icon">◈</span>
          <span className="select-logo-text">PostureAI</span>
        </div>
        <p className="select-subtitle">Choose an exercise to start your session</p>
      </header>

      <div className="exercise-cards">
        {EXERCISES.map(ex => (
          <button
            key={ex.id}
            className="exercise-card"
            onClick={() => onStart(ex.id)}
          >
            <span className="card-icon">{ex.icon}</span>
            <span className="card-name">{ex.label}</span>
            <span className="card-desc">{ex.description}</span>
            <span className="card-camera">📷 {CAMERA_HINTS[ex.id]}</span>
          </button>
        ))}
      </div>

      <footer className="select-footer">
        AI runs entirely in your browser — no data is uploaded.
      </footer>
    </div>
  );
}
