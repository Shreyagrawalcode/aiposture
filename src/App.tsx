import { useState, useCallback, useRef } from 'react';
import SelectPage  from './components/SelectPage';
import WorkoutPage from './components/WorkoutPage';
import ResultsPage from './components/ResultsPage';
import { type ExerciseType, type WorkoutResults } from './types';

type PageState = 'select' | 'workout' | 'results';

export default function App() {
  const [page, setPage]         = useState<PageState>('select');
  const [exercise, setExercise] = useState<ExerciseType>('squat');
  const [, setRepCount] = useState(0);
  const [results, setResults]   = useState<WorkoutResults | null>(null);

  // Accumulate unique issues via ref — no re-renders on each frame
  const accumulatedIssuesRef = useRef<Set<string>>(new Set());
  // Keep a ref for repCount so handleEndWorkout closure always has the latest value
  const repCountRef = useRef(0);

  const handleStart = useCallback((ex: ExerciseType) => {
    setExercise(ex);
    setRepCount(0);
    repCountRef.current = 0;
    accumulatedIssuesRef.current = new Set();
    setPage('workout');
  }, []);

  const handleRepCount = useCallback((n: number) => {
    repCountRef.current = n;
    setRepCount(n);
  }, []);

  const handleIssueDetected = useCallback((issues: string[]) => {
    issues.forEach(i => accumulatedIssuesRef.current.add(i));
  }, []);

  const handleEndWorkout = useCallback(() => {
    setResults({
      repCount: repCountRef.current,
      issues: Array.from(accumulatedIssuesRef.current),
      exercise,
    });
    setPage('results');
  }, [exercise]);

  const handleTryAgain = useCallback(() => {
    setResults(null);
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
