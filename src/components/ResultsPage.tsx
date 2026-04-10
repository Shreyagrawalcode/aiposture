import { type WorkoutResults, EXERCISES } from '../types';
import './ResultsPage.css';

interface Props {
  results: WorkoutResults;
  onTryAgain: () => void;
}

// ─── Concise fix for every issue ─────────────────────────────────────────────
const ISSUE_FIXES: Record<string, string> = {
  // Squat
  'Go deeper — sit until thighs are parallel':
    'Practice box squats. Elevate heels if ankle mobility is limiting.',
  'Almost there — drop a few more inches':
    'You\'re close! Hold the bottom for 2s to build confidence at depth.',
  'Hinge hips back — don\'t stay so upright':
    'Push hips back first, then bend knees. Slight forward lean is normal.',
  'Knees caving in — push them out':
    'Use a band above knees during warm-up. Focus on lateral band walks.',
  'Track knees over your toes':
    'Spread the floor with your feet. External rotation = stable knees.',

  // Push-up
  'Bend your arms more — full ROM':
    'Start on a bench or knees. Full range of motion > difficulty.',
  'Lower your chest closer to the floor':
    'Chest should nearly touch the floor. Try push-up handles for depth.',
  'Hips sagging — squeeze glutes & brace':
    'Squeeze glutes + brace abs before every rep. Think rigid plank.',
  'Hips too high — flatten into plank':
    'Drop hips, engage quads, tuck tailbone slightly down.',

  // Deadlift
  'Back rounding badly — reset now':
    'Stop. Go lighter. Practice Romanian deadlifts to rebuild pattern.',
  'Keep your spine neutral — chest up':
    'Brace core 360°, pull lats tight, proud chest. Drop weight if needed.',
  'Bend knees more at the start':
    'Set hips lower. Think "push the floor away" not "pull the bar".',
  'Too much forward lean — hips back':
    'Hips back, chest up, bar touching legs the whole way.',

  // OHP
  'Press all the way up — full lockout':
    'Lock elbows and shrug at top. Use lighter weight for full ROM.',
  'Extend more — squeeze at the top':
    'Almost there — drive head through your arms at lockout.',
  'Keep wrists stacked over shoulders':
    'Press in a straight vertical line. Slightly narrower grip helps.',
  'Get wrists above your ears':
    'Think "back and up" not just up. Biceps should touch ears.',
  'Too much lean — brace your core':
    'Squeeze glutes, brace abs, stay vertical. If leaning = too heavy.',
};

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Elite';
  if (score >= 75) return 'Strong';
  if (score >= 60) return 'Decent';
  if (score >= 40) return 'Needs work';
  return 'Keep practicing';
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'score-great';
  if (score >= 60) return 'score-ok';
  return 'score-low';
}

export default function ResultsPage({ results, onTryAgain }: Props) {
  const ex = EXERCISES.find(e => e.id === results.exercise);

  return (
    <div className="results-page">
      <header className="results-header">
        <div className="results-logo">
          <span className="results-logo-icon">◈</span>
          <span className="results-logo-text">PostureAI</span>
        </div>
        <span className="results-done-label">Session Complete</span>
      </header>

      {/* ── Stats row ── */}
      <div className="results-stats">
        <div className="stat-card">
          <span className="stat-icon">{ex?.icon}</span>
          <span className="stat-value">{ex?.label}</span>
          <span className="stat-label">Exercise</span>
        </div>
        <div className="stat-card stat-card-primary">
          <span className="stat-value stat-reps">{results.repCount}</span>
          <span className="stat-label">Reps</span>
        </div>
        <div className="stat-card">
          <span className={`stat-value ${getScoreColor(results.avgScore)}`}>{results.avgScore}%</span>
          <span className="stat-label">{getScoreLabel(results.avgScore)}</span>
        </div>
      </div>

      {/* ── Score bar ── */}
      <div className="score-bar-container">
        <div className="score-bar-track">
          <div
            className={`score-bar-fill ${getScoreColor(results.avgScore)}`}
            style={{ width: `${Math.max(results.avgScore, 3)}%` }}
          />
        </div>
        <div className="score-bar-labels">
          <span>Best: {results.bestScore}%</span>
          <span>Avg: {results.avgScore}%</span>
        </div>
      </div>

      {/* ── Issues ── */}
      {results.issues.length === 0 ? (
        <div className="results-perfect">
          <span className="perfect-icon">✓</span>
          <p>Perfect form — nothing to fix!</p>
        </div>
      ) : (
        <div className="results-issues-section">
          <h2 className="results-section-title">
            Things to work on
          </h2>
          <div className="results-issues-list">
            {results.issues.map((issue, i) => {
              const fix = ISSUE_FIXES[issue];
              return (
                <div key={i} className="results-issue-card">
                  <div className="issue-card-number">{i + 1}</div>
                  <div className="issue-card-content">
                    <div className="issue-card-title">{issue}</div>
                    {fix && <p className="issue-card-fix">{fix}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="results-actions">
        <button className="try-again-btn" onClick={onTryAgain}>
          Go Again
        </button>
      </div>
    </div>
  );
}
