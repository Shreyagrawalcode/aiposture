import { type WorkoutResults, EXERCISES } from '../types';
import './ResultsPage.css';

interface Props {
  results: WorkoutResults;
  onTryAgain: () => void;
}

// ─── Concise feedback for every issue string ─────────────────────────────────
const ISSUE_DETAILS: Record<string, { fix: string }> = {
  // ── Squat ──
  'Squat deeper — aim for thighs parallel or below': {
    fix: 'Sit lower until thighs hit parallel. Try heel-elevated goblet squats to build depth.',
  },
  'Not squatting deep enough — bend your knees more': {
    fix: 'Imagine sitting onto a low chair. Practice box squats to find the right depth.',
  },
  'Hinge your hips back — avoid staying too upright': {
    fix: 'Push hips back first, then bend knees. Your torso should lean forward slightly.',
  },
  'Knees caving inward — push knees out over toes': {
    fix: 'Drive knees outward the whole time. Band squats help train this pattern.',
  },
  'Keep knees tracking over toes, not behind them': {
    fix: 'Let knees travel forward naturally — spread the floor with your feet.',
  },

  // ── Push-up / Plank ──
  'Lower your chest closer to the floor': {
    fix: 'Go all the way down until your chest nearly touches. Use incline push-ups to build up.',
  },
  'Arms barely bending — perform a full range push-up': {
    fix: 'Start on knees or a bench — full range of motion matters more than difficulty.',
  },
  'Hips sagging — squeeze glutes and brace your core': {
    fix: 'Squeeze glutes hard and brace abs. Your body should be a straight line head to heels.',
  },
  'Hips too high — lower into a straight plank line': {
    fix: 'Drop hips down, engage quads, tailbone slightly tucked. Think rigid plank.',
  },

  // ── Deadlift ──
  'Back rounding — brace your lats and keep a neutral spine': {
    fix: 'Deep breath, brace core 360\u00b0, pull lats tight. Drop weight if you can\'t stay neutral.',
  },
  'Severe back rounding — stop and reset with lighter weight': {
    fix: 'Stop now. Go lighter, practice Romanian deadlifts to rebuild the hinge pattern.',
  },
  'Bend your knees more at the start — this is not a stiff-leg deadlift': {
    fix: 'Set hips lower at the start. Think "push the floor away" not "pull the bar up".',
  },
  'Excessive forward lean — drive your hips back, not down': {
    fix: 'Hips back, chest up, bar close to body. Keep shoulders over or just ahead of the bar.',
  },

  // ── Overhead Press ──
  'Extend arms fully overhead — squeeze at lockout': {
    fix: 'Lock out elbows fully and shrug at the top. Drop weight if you can\'t reach lockout.',
  },
  'Arms not reaching overhead — press all the way up': {
    fix: 'Foam roll your upper back and stretch chest. Use lighter weight for full ROM.',
  },
  'Wrists drifting sideways — keep them stacked over shoulders': {
    fix: 'Press straight up in a vertical line. Try a slightly narrower grip.',
  },
  'Get your wrists above your ears at the top': {
    fix: 'Press back and up, not just up. Biceps should finish near your ears.',
  },
  'Excessive back lean — engage core and keep hips under bar': {
    fix: 'Brace core, squeeze glutes, stay vertical. If you lean, the weight is too heavy.',
  },
};

export default function ResultsPage({ results, onTryAgain }: Props) {
  const ex = EXERCISES.find(e => e.id === results.exercise);

  return (
    <div className="results-page">
      <header className="results-header">
        <div className="results-logo">
          <span className="results-logo-icon">◈</span>
          <span className="results-logo-text">PostureAI</span>
        </div>
      </header>

      {/* ── Summary card ── */}
      <div className="results-summary">
        <div className="results-ex-info">
          <span className="results-ex-icon">{ex?.icon}</span>
          <span className="results-ex-name">{ex?.label}</span>
        </div>
        <div className="results-reps-block">
          <span className="reps-number">{results.repCount}</span>
          <span className="reps-label">REPS</span>
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
            Things to work on ({results.issues.length})
          </h2>
          <div className="results-issues-list">
            {results.issues.map((issue, i) => {
              const detail = ISSUE_DETAILS[issue];
              return (
                <div key={i} className="results-issue-card">
                  <div className="issue-card-title">{issue}</div>
                  {detail && (
                    <p className="issue-card-fix">{detail.fix}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <button className="try-again-btn" onClick={onTryAgain}>
        Do Again
      </button>
    </div>
  );
}
