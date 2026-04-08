import { type PostureFeedback, type PostureStatus } from '../types';
import './FeedbackPanel.css';

interface Props {
  feedback: PostureFeedback;
  loading: boolean;
}

const STATUS_CONFIG: Record<
  PostureStatus,
  { label: string; className: string; icon: string }
> = {
  good: { label: 'Good Form', className: 'status-good', icon: '✓' },
  warning: { label: 'Needs Attention', className: 'status-warning', icon: '!' },
  fix: { label: 'Fix Now', className: 'status-fix', icon: '✗' },
  idle: { label: 'Waiting...', className: 'status-idle', icon: '◎' },
};

export default function FeedbackPanel({ feedback, loading }: Props) {
  const statusCfg = STATUS_CONFIG[feedback.status];

  return (
    <div className="feedback-panel">
      {/* Status badge */}
      <div className={`status-badge ${statusCfg.className}`}>
        <span className="status-icon">{statusCfg.icon}</span>
        <span className="status-label">{statusCfg.label}</span>
        {loading && <span className="loading-dot" />}
      </div>

      {/* Joint angles */}
      {feedback.angles.length > 0 && (
        <div className="angles-row">
          {feedback.angles.map((a) => (
            <div key={a.label} className="angle-chip">
              <span className="angle-value">
                {a.value !== null ? `${a.value}${a.unit}` : '—'}
              </span>
              <span className="angle-label">{a.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Issues */}
      {feedback.issues.length > 0 && (
        <div className="issues-list">
          {feedback.issues.map((issue, i) => (
            <div key={i} className="issue-item">
              <span className="issue-bullet">›</span>
              {issue}
            </div>
          ))}
        </div>
      )}

      {/* Tips */}
      <div className="tips-section">
        <div className="tips-header">Corrective Cues</div>
        <div className="tips-list">
          {feedback.tips.map((tip, i) => (
            <div key={i} className="tip-item">
              <span className="tip-number">{i + 1}</span>
              <span className="tip-text">{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
