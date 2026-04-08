import { type ExerciseType } from '../types';
import './CameraGuide.css';

interface Props {
  exercise: ExerciseType;
}

const GUIDE: Record<ExerciseType, { direction: string; distance: string; tip: string; icon: string }> = {
  squat: {
    direction: 'Side profile',
    distance: '2–3 metres away',
    tip: 'Full body visible — head to feet',
    icon: '↔',
  },
  pushup: {
    direction: 'Side profile',
    distance: '2–3 metres away',
    tip: 'Full body visible — head to feet',
    icon: '↔',
  },
  deadlift: {
    direction: 'Side profile',
    distance: '2–3 metres away',
    tip: 'Full body visible — head to feet',
    icon: '↔',
  },
  ohpress: {
    direction: 'Face the camera',
    distance: '2 metres away',
    tip: 'Arms and shoulders fully visible',
    icon: '↑',
  },
};

export default function CameraGuide({ exercise }: Props) {
  const g = GUIDE[exercise];
  return (
    <div className="camera-guide">
      <div className="guide-item">
        <span className="guide-icon">📐</span>
        <div>
          <div className="guide-label">Camera angle</div>
          <div className="guide-value">{g.direction}</div>
        </div>
      </div>
      <div className="guide-divider" />
      <div className="guide-item">
        <span className="guide-icon">📏</span>
        <div>
          <div className="guide-label">Distance</div>
          <div className="guide-value">{g.distance}</div>
        </div>
      </div>
      <div className="guide-divider" />
      <div className="guide-item">
        <span className="guide-icon">✓</span>
        <div>
          <div className="guide-label">Make sure</div>
          <div className="guide-value">{g.tip}</div>
        </div>
      </div>
    </div>
  );
}
