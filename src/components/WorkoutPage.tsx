import { useEffect, useState, useCallback } from 'react';
import { type ExerciseType, type PostureFeedback, EXERCISES } from '../types';
import { useVoiceCoach } from '../hooks/useVoiceCoach';
import PoseDetector from './PoseDetector';
import './WorkoutPage.css';

interface Props {
  exercise: ExerciseType;
  repCount: number;
  feedback: PostureFeedback | null;
  onFeedback: (fb: PostureFeedback) => void;
  onRepCount: (n: number) => void;
  onIssueDetected: (issues: string[]) => void;
  onEndWorkout: () => void;
}

export default function WorkoutPage({
  exercise,
  repCount,
  feedback,
  onFeedback,
  onRepCount,
  onIssueDetected,
  onEndWorkout,
}: Props) {
  const ex = EXERCISES.find(e => e.id === exercise);
  const status = feedback?.status ?? 'idle';
  const score = feedback?.formScore ?? 0;
  const [voiceOn, setVoiceOn] = useState(true);

  const { announceRep, announceIssue, announceGoodForm, toggle } = useVoiceCoach();

  // Voice: announce reps
  useEffect(() => {
    announceRep(repCount);
  }, [repCount, announceRep]);

  // Voice: announce issues or good form
  useEffect(() => {
    if (!feedback) return;
    if (feedback.status === 'fix' || feedback.status === 'warning') {
      announceIssue(feedback);
    } else if (feedback.status === 'good') {
      announceGoodForm(feedback);
    }
  }, [feedback, announceIssue, announceGoodForm]);

  const handleToggleVoice = useCallback(() => {
    const nowOn = toggle();
    setVoiceOn(nowOn);
  }, [toggle]);

  const statusClass = `bottom-bar-status status-${status}`;

  return (
    <div className="workout-page">
      <PoseDetector
        exercise={exercise}
        onFeedback={onFeedback}
        onLoadingChange={() => {}}
        onRepCount={onRepCount}
        onIssueDetected={onIssueDetected}
      />

      {/* Top controls */}
      <div className="top-controls">
        <button className="top-pill-btn voice-toggle" onClick={handleToggleVoice} title={voiceOn ? 'Mute coach' : 'Unmute coach'}>
          {voiceOn ? '\u{1F50A}' : '\u{1F507}'}
        </button>
        <button className="top-pill-btn end-workout-btn" onClick={onEndWorkout}>
          End
        </button>
      </div>

      {/* Bottom rep bar */}
      <div className="bottom-bar">
        <div className="bottom-bar-left">
          <span className="bottom-bar-icon">{ex?.icon}</span>
          <span className="bottom-bar-exercise">{ex?.label}</span>
        </div>

        <div className="bottom-bar-center">
          <div className="bottom-bar-reps">
            <span className="bottom-bar-reps-number">{repCount}</span>
            <span className="bottom-bar-reps-label">REPS</span>
          </div>
        </div>

        <div className="bottom-bar-right">
          <div className={statusClass}>
            {status === 'idle' ? 'READY' : status === 'good' ? 'GOOD' : status === 'warning' ? 'CHECK' : 'FIX'}
          </div>
          {score > 0 && (
            <div className="bottom-bar-score">{score}%</div>
          )}
        </div>
      </div>
    </div>
  );
}
