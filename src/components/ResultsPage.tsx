import { type WorkoutResults, EXERCISES } from '../types';
import './ResultsPage.css';

interface Props {
  results: WorkoutResults;
  onTryAgain: () => void;
}

// ─── Full explanations for every issue string from exerciseAnalysis.ts ────────
const ISSUE_DETAILS: Record<string, { why: string; fix: string }> = {
  // ── Squat ──
  'Squat deeper — aim for thighs parallel or below': {
    why: 'Partial squats shift load away from the glutes and hamstrings, reducing muscle development. Stopping before parallel also limits hip mobility gains and undertrains the inner quad (VMO).',
    fix: 'Aim for thighs at least parallel to the floor. If ankle mobility restricts depth, place small plates under your heels or spend time on calf and ankle stretching daily.',
  },
  'Not squatting deep enough — bend your knees more': {
    why: 'Insufficient knee bend means you are barely loading your legs. The movement becomes more of a hip hinge than a squat, missing the quad-dominant loading that squats are designed for.',
    fix: 'Think about sitting down onto a low chair behind you. Practice goblet squats holding a weight at chest height to reinforce the upright torso and deeper knee bend.',
  },
  'Hinge your hips back — avoid staying too upright': {
    why: 'An overly upright torso during a squat pushes the knees far forward and reduces glute engagement. It also places more stress on the knee joint than on the powerful hip extensors.',
    fix: 'Initiate the squat by pushing your hips back first, then bending your knees. Practice the hip hinge with a dowel rod running along your spine to feel the correct movement pattern.',
  },
  'Knees caving inward — push knees out over toes': {
    why: 'Knee valgus (inward collapse) places lateral stress on the MCL and ACL and is a leading cause of knee injury. It usually signals weak glute medius muscles and tight hip adductors.',
    fix: 'Actively push your knees outward throughout the entire squat. Use a resistance band just above the knees during warm-up sets to train the outward drive pattern.',
  },
  'Keep knees tracking over toes, not behind them': {
    why: 'When knees track behind the toes the shin angle becomes too vertical, restricting depth and forcing an excessive forward lean in the torso to compensate.',
    fix: 'Allow your knees to travel forward over your toes as you descend. This is normal and safe. Focus on spreading the floor with your feet to create external rotation torque.',
  },

  // ── Push-up / Plank ──
  'Lower your chest closer to the floor': {
    why: 'Stopping the push-up halfway limits chest and tricep development. Partial reps train only a portion of the muscle\'s strength curve and build incomplete motor patterns.',
    fix: 'Lower until your chest lightly touches or hovers just above the floor. Start with incline push-ups on a bench if full-depth is currently too difficult, and progress from there.',
  },
  'Arms barely bending — perform a full range push-up': {
    why: 'Push-ups with minimal arm bend provide almost no training stimulus. The muscle is never loaded through its full range of motion, which significantly limits strength and hypertrophy gains.',
    fix: 'Reduce the difficulty first — use your knees or an incline surface — and focus on achieving a full range of motion on every rep. Build up to floor push-ups gradually.',
  },
  'Hips sagging — squeeze glutes and brace your core': {
    why: 'A sagging lower back during push-ups compresses the lumbar spine and removes the core from the movement. Over time this can lead to lower back pain and poor movement habits.',
    fix: 'Before every rep, squeeze your glutes hard and brace your abs as if bracing for a punch. Think of your body as a rigid plank from head to heels. Practice dead-bug holds to build anti-extension core strength.',
  },
  'Hips too high — lower into a straight plank line': {
    why: 'Piking the hips shifts load off the chest and shoulders and turns the movement into something closer to a downward dog. The muscles intended to be trained are not adequately loaded.',
    fix: 'Engage your quads, point your tailbone down slightly, and think about driving your hips toward the floor until your body forms one straight line. Holding a plank for 30 seconds before your set can reinforce this position.',
  },

  // ── Deadlift ──
  'Back rounding — brace your lats and keep a neutral spine': {
    why: 'A rounded lumbar spine during a loaded deadlift places enormous shear force on the spinal discs. Even moderate rounding over time significantly increases disc herniation risk.',
    fix: 'Before each pull, take a deep breath, brace your core 360°, and "protect your armpits" by engaging your lats. Think about a proud chest and a long spine. Reduce weight until you can maintain neutral.',
  },
  'Severe back rounding — stop and reset with lighter weight': {
    why: 'Severe spinal flexion under load is one of the most injury-prone positions in strength training. Continuing to lift with this degree of rounding risks acute disc injury or long-term spinal damage.',
    fix: 'Stop the set immediately, reduce the weight significantly, and focus on form. Practice Romanian deadlifts and hip hinge drills with no weight to rebuild the correct movement pattern before adding load.',
  },
  'Bend your knees more at the start — this is not a stiff-leg deadlift': {
    why: 'Starting a conventional deadlift with straight legs forces the lower back to do excessive work from the floor. The quads and glutes should initiate the pull, not the spinal erectors alone.',
    fix: 'Set your hips lower at the start — think "push the floor away" rather than "pull the bar up". Your shins should be nearly vertical and close to the bar before you initiate the lift.',
  },
  'Excessive forward lean — drive your hips back, not down': {
    why: 'Excessive forward lean turns the deadlift into a good-morning pattern, placing most of the load on the lower back rather than distributing it across the legs and hips as intended.',
    fix: 'Sit your hips back and keep your chest up. The bar should stay in contact with your legs throughout the lift. Film from the side to check that your shoulder stays over or slightly in front of the bar at the start.',
  },

  // ── Overhead Press ──
  'Extend arms fully overhead — squeeze at lockout': {
    why: 'Incomplete lockout means the deltoids and triceps are never fully trained through their range of motion. It also prevents the important shrug at the top that engages the upper traps for shoulder stability.',
    fix: 'Press until your elbows are fully extended and actively shrug your shoulders at the top. If you cannot reach lockout, reduce the weight. Flexibility work on the thoracic spine can also help overhead range.',
  },
  'Arms not reaching overhead — press all the way up': {
    why: 'Stopping the press well short of overhead significantly reduces shoulder and tricep development. It also indicates possible thoracic mobility restrictions that should be addressed to prevent shoulder impingement over time.',
    fix: 'Work on thoracic extension mobility with a foam roller and doorway chest stretches. Start with lighter weight and focus on achieving a full overhead position before adding load.',
  },
  'Wrists drifting sideways — keep them stacked over shoulders': {
    why: 'Lateral wrist drift creates a torque imbalance at the shoulder joint and can cause impingement at the top of the press. It also inefficiently loads one side more than the other.',
    fix: 'Keep your wrists directly above your shoulders throughout the press. Think about pressing the bar straight up along a vertical line. Using a slightly narrower grip can help keep wrists in a more neutral path.',
  },
  'Get your wrists above your ears at the top': {
    why: 'If your wrists finish in front of your face rather than above your head, the bar path is travelling forward instead of straight up. This forward path increases shoulder joint stress at the top.',
    fix: 'As you lock out, think about pressing "back and up" rather than just up. Your biceps should be close to or touching your ears at full lockout. Drive your head through the window formed by your arms.',
  },
  'Excessive back lean — engage core and keep hips under bar': {
    why: 'Leaning back to compensate during an overhead press turns it into an incline press and places excessive compression on the lumbar spine. It is a common compensation for insufficient shoulder mobility.',
    fix: 'Brace your core tightly, squeeze your glutes, and keep your hips directly under the bar throughout the lift. If you cannot press without leaning back, the weight is too heavy — reduce it and build mobility first.',
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
          <p>No form issues detected — great session!</p>
        </div>
      ) : (
        <div className="results-issues-section">
          <h2 className="results-section-title">
            Form issues detected ({results.issues.length})
          </h2>
          <div className="results-issues-list">
            {results.issues.map((issue, i) => {
              const detail = ISSUE_DETAILS[issue];
              return (
                <div key={i} className="results-issue-card">
                  <div className="issue-card-title">{issue}</div>
                  {detail ? (
                    <>
                      <div className="issue-card-section">
                        <span className="issue-card-label">Why it matters</span>
                        <p>{detail.why}</p>
                      </div>
                      <div className="issue-card-section">
                        <span className="issue-card-label">How to fix it</span>
                        <p>{detail.fix}</p>
                      </div>
                    </>
                  ) : (
                    <p className="issue-card-generic">Work on addressing this before your next session.</p>
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
