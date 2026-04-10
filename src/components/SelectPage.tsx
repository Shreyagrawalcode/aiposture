import { type ExerciseType, EXERCISES } from '../types';
import './SelectPage.css';

interface Props {
  onStart: (exercise: ExerciseType) => void;
}

const CAMERA_HINTS: Record<ExerciseType, string> = {
  squat:    'Side view · 2–3 m',
  pushup:   'Side view · 2–3 m',
  deadlift: 'Side view · 2–3 m',
  ohpress:  'Front view · 2 m',
};

export default function SelectPage({ onStart }: Props) {
  return (
    <div className="select-page">
      <header className="select-header">
        <div className="select-logo">
          <span className="select-logo-icon">◈</span>
          <span className="select-logo-text">PostureAI</span>
        </div>
        <p className="select-tagline">Real-time AI form coach</p>
        <p className="select-subtitle">Pick an exercise to start</p>
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
            <span className="card-muscles">{ex.muscles}</span>
            <span className="card-desc">{ex.description}</span>
            <span className="card-camera">{CAMERA_HINTS[ex.id]}</span>
          </button>
        ))}
      </div>

      <footer className="select-footer">
        <span className="footer-badge">100% private</span>
        AI runs in your browser — zero data uploaded
      </footer>
    </div>
  );
}
