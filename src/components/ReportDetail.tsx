import type { Report, VerificationStatus } from '../lib/validation'
import { formatDateTime } from '../lib/format'
import { Badge } from './Badge'

function severityTone(severity: Report['severity']) {
  if (severity === 'high') return 'danger'
  if (severity === 'medium') return 'warning'
  return 'success'
}

function statusTone(status: VerificationStatus) {
  if (status === 'verified') return 'success'
  if (status === 'resolved') return 'info'
  return 'neutral'
}

export function ReportDetail({
  report,
  onEdit,
  onSetStatus,
}: {
  report: Report
  onEdit: () => void
  onSetStatus: (status: VerificationStatus) => void
}) {
  return (
    <div className="cg-panel cg-detail">
      <div className="cg-detail-header">
        <div className="cg-detail-title">{report.title}</div>
        <div className="cg-detail-actions">
          <button className="cg-btn cg-btn-ghost" type="button" onClick={onEdit}>
            Edit
          </button>
          <button
            className="cg-btn cg-btn-ghost"
            type="button"
            onClick={() => onSetStatus('verified')}
          >
            Mark verified
          </button>
          <button
            className="cg-btn cg-btn-ghost"
            type="button"
            onClick={() => onSetStatus('resolved')}
          >
            Mark resolved
          </button>
        </div>
      </div>

      <div className="cg-meta">
        <Badge tone={severityTone(report.severity)}>{report.severity}</Badge>
        <Badge tone={statusTone(report.verification_status)}>{report.verification_status}</Badge>
        <span className="cg-meta-item">{report.category}</span>
        <span className="cg-meta-item">{report.neighborhood}</span>
      </div>

      <div className="cg-submeta">
        <div>
          <span className="cg-submeta-key">Created:</span> {formatDateTime(report.created_at)}
        </div>
        <div>
          <span className="cg-submeta-key">Source:</span> {report.source_label}
        </div>
      </div>

      <div className="cg-section">
        <div className="cg-section-title">Summary</div>
        <div className="cg-muted">
          {report.ai_summary}{' '}
          <span className="cg-inline-badge">({report.summary_mode === 'ai' ? 'AI' : 'Fallback'})</span>
        </div>
      </div>

      <div className="cg-section">
        <div className="cg-section-title">Raw description</div>
        <div className="cg-pre">{report.raw_description}</div>
      </div>

      <div className="cg-section">
        <div className="cg-section-title">Recommended checklist</div>
        <ol className="cg-checklist">
          {report.recommended_checklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </div>

      {report.tags.length ? (
        <div className="cg-section">
          <div className="cg-section-title">Tags</div>
          <div className="cg-tags">
            {report.tags.map((tag) => (
              <span key={tag} className="cg-tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
