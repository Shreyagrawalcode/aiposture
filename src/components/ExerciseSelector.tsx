import { type ExerciseType, EXERCISES } from '../types';
import './ExerciseSelector.css';

interface Props {
  selected: ExerciseType;
  onChange: (exercise: ExerciseType) => void;
}

export default function ExerciseSelector({ selected, onChange }: Props) {
  return (
    <div className="exercise-selector">
      {EXERCISES.map((ex) => (
        <button
          key={ex.id}
          className={`exercise-tab ${selected === ex.id ? 'active' : ''}`}
          onClick={() => onChange(ex.id)}
          title={ex.description}
        >
          <span className="exercise-icon">{ex.icon}</span>
          <span className="exercise-label">{ex.label}</span>
        </button>
      ))}
    </div>
  );
}
