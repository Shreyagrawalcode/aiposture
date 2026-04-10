import { useState, useCallback, useRef } from 'react';
import SelectPage  from './components/SelectPage';
import WorkoutPage from './components/WorkoutPage';
import ResultsPage from './components/ResultsPage';
import { type ExerciseType, type PostureFeedback, type WorkoutResults } from './types';

type PageState = 'select' | 'workout' | 'results';

export default function App() {
  const [page, setPage]         = useState<PageState>('select');
  const [exercise, setExercise] = useState<ExerciseType>('squat');
  const [repCount, setRepCount] = useState(0);
  const [feedback, setFeedback] = useState<PostureFeedback | null>(null);
  const [results, setResults]   = useState<WorkoutResults | null>(null);

  // Accumulate unique issues via ref — no re-renders on each frame
  const accumulatedIssuesRef = useRef<Set<string>>(new Set());
  const repCountRef = useRef(0);
  // Track form scores for summary
  const scoresRef = useRef<number[]>([]);
  const bestScoreRef = useRef(0);

  const handleStart = useCallback((ex: ExerciseType) => {
    setExercise(ex);
    setRepCount(0);
    setFeedback(null);
    repCountRef.current = 0;
    accumulatedIssuesRef.current = new Set();
    scoresRef.current = [];
    bestScoreRef.current = 0;
    setPage('workout');
  }, []);

  const handleRepCount = useCallback((n: number) => {
    repCountRef.current = n;
    setRepCount(n);
  }, []);

  const handleFeedback = useCallback((fb: PostureFeedback) => {
    setFeedback(fb);
    if (fb.formScore > 0) {
      scoresRef.current.push(fb.formScore);
      if (fb.formScore > bestScoreRef.current) bestScoreRef.current = fb.formScore;
    }
  }, []);

  const handleIssueDetected = useCallback((issues: string[]) => {
    issues.forEach(i => accumulatedIssuesRef.current.add(i));
  }, []);

  const handleEndWorkout = useCallback(() => {
    const scores = scoresRef.current;
    const avg = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
    setResults({
      repCount: repCountRef.current,
      issues: Array.from(accumulatedIssuesRef.current),
      exercise,
      bestScore: bestScoreRef.current,
      avgScore: avg,
    });
    setPage('results');
  }, [exercise]);

  const handleTryAgain = useCallback(() => {
    setResults(null);
    setFeedback(null);
    setPage('select');
  }, []);

  return (
    <>
      {page === 'select' && (
        <SelectPage onStart={handleStart} />
      )}
      {page === 'workout' && (
        <WorkoutPage
          exercise={exercise}
          repCount={repCount}
          feedback={feedback}
          onFeedback={handleFeedback}
          onRepCount={handleRepCount}
          onIssueDetected={handleIssueDetected}
          onEndWorkout={handleEndWorkout}
        />
      )}
      {page === 'results' && results && (
        <ResultsPage results={results} onTryAgain={handleTryAgain} />
      )}
    </>
  );
}
