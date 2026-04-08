import { useState, useCallback } from 'react';
import ExerciseSelector from './components/ExerciseSelector';
import PoseDetector from './components/PoseDetector';
import FeedbackPanel from './components/FeedbackPanel';
import CameraGuide from './components/CameraGuide';
import { type ExerciseType, type PostureFeedback } from './types';
import './App.css';

function getStartFeedback(exercise: ExerciseType): PostureFeedback {
  const tips: Record<ExerciseType, string[]> = {
    squat: [
      'Stand sideways to the camera — your full body must be in frame.',
      'Feet shoulder-width apart, toes slightly turned out.',
      'Begin your squat — the AI will analyse your knee and hip angles.',
    ],
    pushup: [
      'Get into push-up position sideways to the camera.',
      'Keep your body in a straight line from head to heels.',
      'Lower yourself — the AI will check your elbow angle and hip position.',
    ],
    deadlift: [
      'Stand sideways to the camera with your full body in frame.',
      'Hinge at the hips with a slight knee bend to start position.',
      'The AI will track your back angle and flag any rounding.',
    ],
    ohpress: [
      'Face the camera directly so both arms are visible.',
      'Hold the bar or weights at shoulder height to begin.',
      'Press overhead — the AI will check your lockout and wrist alignment.',
    ],
  };

  return {
    status: 'idle',
    angles: [],
    issues: ['Step into frame and start moving — analysis begins automatically.'],
    tips: tips[exercise],
  };
}

export default function App() {
  const [exercise, setExercise] = useState<ExerciseType>('squat');
  const [feedback, setFeedback] = useState<PostureFeedback>(() => getStartFeedback('squat'));
  const [loading, setLoading] = useState(true);

  const handleExerciseChange = useCallback((ex: ExerciseType) => {
    setExercise(ex);
    setFeedback(getStartFeedback(ex));
  }, []);

  const handleFeedback = useCallback((fb: PostureFeedback) => {
    setFeedback(fb);
  }, []);

  const handleLoadingChange = useCallback((isLoading: boolean) => {
    setLoading(isLoading);
  }, []);

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">◈</span>
          <span className="logo-text">PostureAI</span>
        </div>
        <div className="header-sub">Real-time exercise form analysis</div>
      </header>

      {/* ── Exercise selector ── */}
      <section className="selector-section">
        <ExerciseSelector selected={exercise} onChange={handleExerciseChange} />
      </section>

      {/* ── Camera placement guide ── */}
      <div className="guide-section">
        <CameraGuide exercise={exercise} />
      </div>

      {/* ── Main content ── */}
      <main className="main-content">
        <div className="camera-wrapper">
          <PoseDetector
            exercise={exercise}
            onFeedback={handleFeedback}
            onLoadingChange={handleLoadingChange}
          />
        </div>
        <aside className="feedback-wrapper">
          <FeedbackPanel feedback={feedback} loading={loading} />
        </aside>
      </main>

      {/* ── Footer ── */}
      <footer className="app-footer">
        PostureAI — AI runs entirely in your browser. No data is uploaded.
      </footer>
    </div>
  );
}
