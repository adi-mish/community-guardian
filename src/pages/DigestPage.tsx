import { useEffect, useMemo, useState } from 'react'
import { Badge } from '../components/Badge'
import { DEFAULT_REPORT_FILTERS, filterReports, sortReportsNewestFirst, type ReportFilters } from '../lib/filters'
import { formatDateTime } from '../lib/format'
import { generateFallbackDigest } from '../lib/fallback'
import { useReportsStore } from '../lib/reportsContext'
import {
  DigestSchema,
  NEIGHBORHOODS,
  REPORT_CATEGORIES,
  SEVERITIES,
  VERIFICATION_STATUSES,
  type Digest,
  type Neighborhood,
  type Report,
  type ReportCategory,
  type Severity,
  type VerificationStatus,
} from '../lib/validation'

type DigestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; digest: Digest; message?: string }
  | { status: 'error'; error: string }

function modeTone(mode: Digest['mode']) {
  return mode === 'ai' ? 'info' : 'neutral'
}

function confidenceTone(label: Digest['confidence_label']) {
  if (label === 'High') return 'success'
  if (label === 'Medium') return 'warning'
  return 'neutral'
}

function severityTone(severity: Severity) {
  if (severity === 'high') return 'danger'
  if (severity === 'medium') return 'warning'
  return 'success'
}

function statusTone(status: VerificationStatus) {
  if (status === 'verified') return 'success'
  if (status === 'resolved') return 'info'
  return 'neutral'
}

function SourceReportCard({ report }: { report: Report }) {
  return (
    <div className="cg-panel" style={{ padding: 12 }}>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontWeight: 700, lineHeight: 1.25 }}>{report.title}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Badge tone={severityTone(report.severity)}>{report.severity}</Badge>
          <Badge tone={statusTone(report.verification_status)}>{report.verification_status}</Badge>
        </div>
      </div>
      <div className="cg-list-item-meta" style={{ marginTop: 6 }}>
        <span>{report.category}</span>
        <span className="cg-dot">•</span>
        <span>{report.neighborhood}</span>
        <span className="cg-dot">•</span>
        <span>{formatDateTime(report.created_at)}</span>
      </div>
      <div className="cg-muted" style={{ marginTop: 8 }}>
        {report.ai_summary}
      </div>
      <details style={{ marginTop: 10 }}>
        <summary style={{ cursor: 'pointer' }}>Inspect raw report</summary>
        <div className="cg-pre" style={{ marginTop: 10 }}>
          {report.raw_description}
        </div>
        <div style={{ marginTop: 10 }}>
          <div className="cg-section-title">Checklist</div>
          <ol className="cg-checklist">
            {report.recommended_checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
      </details>
    </div>
  )
}

export function DigestPage() {
  const { reports } = useReportsStore()
  const [filters, setFilters] = useState<ReportFilters>(DEFAULT_REPORT_FILTERS)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [forceFallback, setForceFallback] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem('cg_force_fallback_v1') === 'true'
    } catch {
      return false
    }
  })
  const [digestState, setDigestState] = useState<DigestState>({ status: 'idle' })

  const visibleReports = useMemo(() => {
    const filtered = filterReports(reports, filters)
    return sortReportsNewestFirst(filtered)
  }, [filters, reports])

  const selectedReports = useMemo(() => {
    if (!selectedIds.size) return []
    return reports.filter((r) => selectedIds.has(r.id))
  }, [reports, selectedIds])

  useEffect(() => {
    try {
      window.localStorage.setItem('cg_force_fallback_v1', forceFallback ? 'true' : 'false')
    } catch {
      // ignore
    }
  }, [forceFallback])

  useEffect(() => {
    // Keep selection stable if reports change
    setSelectedIds((prev) => new Set([...prev].filter((id) => reports.some((r) => r.id === id))))
  }, [reports])

  async function generateDigest() {
    if (selectedReports.length === 0) {
      setDigestState({ status: 'error', error: 'Select at least one report to generate a digest.' })
      return
    }

    setDigestState({ status: 'loading' })

    try {
      const resp = await fetch('/api/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reports: selectedReports, force_fallback: forceFallback }),
      })

      if (!resp.ok) {
        const text = await resp.text()
        throw new Error(text || `Request failed: ${resp.status}`)
      }

      const data = (await resp.json()) as unknown
      const digest = DigestSchema.parse((data as { digest?: unknown }).digest)
      const message =
        typeof (data as { message?: unknown }).message === 'string'
          ? ((data as { message?: string }).message ?? undefined)
          : undefined
      setDigestState({ status: 'ready', digest, message })
    } catch {
      const digest = generateFallbackDigest(selectedReports)
      setDigestState({
        status: 'ready',
        digest,
        message: 'AI unavailable. A rule-based digest was generated instead.',
      })
    }
  }

  return (
    <div className="cg-page">
      <div className="cg-toolbar cg-panel">
        <div className="cg-toolbar-left">
          <div className="cg-field-inline">
            <div className="cg-label">Search</div>
            <input
              className="cg-input"
              value={filters.query}
              onChange={(e) => setFilters((p) => ({ ...p, query: e.target.value }))}
              placeholder="Title, description, or tag"
            />
          </div>

          <div className="cg-field-inline">
            <div className="cg-label">Category</div>
            <select
              className="cg-select"
              value={filters.category}
              onChange={(e) =>
                setFilters((p) => ({ ...p, category: e.target.value as ReportCategory | 'all' }))
              }
            >
              <option value="all">All</option>
              {REPORT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="cg-field-inline">
            <div className="cg-label">Severity</div>
            <select
              className="cg-select"
              value={filters.severity}
              onChange={(e) =>
                setFilters((p) => ({ ...p, severity: e.target.value as Severity | 'all' }))
              }
            >
              <option value="all">All</option>
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="cg-field-inline">
            <div className="cg-label">Neighborhood</div>
            <select
              className="cg-select"
              value={filters.neighborhood}
              onChange={(e) =>
                setFilters((p) => ({ ...p, neighborhood: e.target.value as Neighborhood | 'all' }))
              }
            >
              <option value="all">All</option>
              {NEIGHBORHOODS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="cg-field-inline">
            <div className="cg-label">Status</div>
            <select
              className="cg-select"
              value={filters.verification_status}
              onChange={(e) =>
                setFilters((p) => ({
                  ...p,
                  verification_status: e.target.value as VerificationStatus | 'all',
                }))
              }
            >
              <option value="all">All</option>
              {VERIFICATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="cg-toolbar-right">
          <label className="cg-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={forceFallback}
              onChange={(e) => setForceFallback(e.target.checked)}
            />
            Force fallback
          </label>

          <button className="cg-btn cg-btn-ghost" type="button" onClick={() => setSelectedIds(new Set())}>
            Clear selection
          </button>
          <button
            className="cg-btn cg-btn-ghost"
            type="button"
            onClick={() => setSelectedIds(new Set(visibleReports.map((r) => r.id)))}
          >
            Select visible
          </button>
          <button className="cg-btn cg-btn-primary" type="button" onClick={generateDigest} disabled={digestState.status === 'loading'}>
            {digestState.status === 'loading' ? 'Generating…' : `Generate digest (${selectedIds.size})`}
          </button>
        </div>
      </div>

      <div className="cg-content-grid">
        <div className="cg-panel cg-list">
          <div className="cg-list-header">
            <div className="cg-list-title">
              Select reports <span className="cg-muted">({visibleReports.length})</span>
            </div>
            <button className="cg-btn cg-btn-ghost" type="button" onClick={() => setFilters(DEFAULT_REPORT_FILTERS)}>
              Reset filters
            </button>
          </div>

          {visibleReports.length ? (
            <div className="cg-list-scroll" role="list">
              {visibleReports.map((report) => {
                const checked = selectedIds.has(report.id)
                return (
                  <label key={report.id} className="cg-list-item" style={{ cursor: 'pointer' }}>
                    <div className="cg-list-item-top">
                      <div className="cg-list-item-title">{report.title}</div>
                      <div className="cg-list-item-badges">
                        <Badge tone={severityTone(report.severity)}>{report.severity}</Badge>
                        <Badge tone={statusTone(report.verification_status)}>{report.verification_status}</Badge>
                      </div>
                    </div>
                    <div className="cg-list-item-meta">
                      <span>{report.category}</span>
                      <span className="cg-dot">•</span>
                      <span>{report.neighborhood}</span>
                      <span className="cg-dot">•</span>
                      <span>{formatDateTime(report.created_at)}</span>
                    </div>
                    <div className="cg-list-item-summary">{report.ai_summary}</div>
                    <div style={{ marginTop: 8 }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setSelectedIds((prev) => {
                            const next = new Set(prev)
                            if (e.target.checked) next.add(report.id)
                            else next.delete(report.id)
                            return next
                          })
                        }}
                      />{' '}
                      Select
                    </div>
                  </label>
                )
              })}
            </div>
          ) : (
            <div className="cg-empty">
              <div className="cg-empty-title">No matching reports</div>
              <div className="cg-muted">Try broadening filters or creating a new report.</div>
            </div>
          )}
        </div>

        <div className="cg-panel cg-detail">
          <div className="cg-detail-header">
            <div className="cg-detail-title">Digest</div>
          </div>

          {digestState.status === 'idle' ? (
            <div className="cg-muted" style={{ marginTop: 10 }}>
              Select reports, then generate a digest. The app will use AI when available, and fall back to
              deterministic rules when not.
            </div>
          ) : null}

          {digestState.status === 'loading' ? (
            <div className="cg-muted" style={{ marginTop: 10 }}>
              Generating a calm digest…
            </div>
          ) : null}

          {digestState.status === 'error' ? (
            <div style={{ marginTop: 10 }}>
              <div className="cg-error">{digestState.error}</div>
            </div>
          ) : null}

          {digestState.status === 'ready' ? (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {digestState.message ? (
                <div className="cg-pre" style={{ borderStyle: 'dashed' }}>
                  {digestState.message}
                </div>
              ) : null}

              <div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Badge tone={modeTone(digestState.digest.mode)}>
                    {digestState.digest.mode === 'ai' ? 'AI-generated' : 'Fallback-generated'}
                  </Badge>
                  <Badge tone={confidenceTone(digestState.digest.confidence_label)}>
                    Confidence: {digestState.digest.confidence_label}
                  </Badge>
                  <span className="cg-meta-item">Generated: {formatDateTime(digestState.digest.generated_at)}</span>
                </div>

                <div className="cg-section">
                  <div className="cg-section-title">{digestState.digest.digest_title}</div>
                  <div className="cg-muted">{digestState.digest.digest_summary}</div>
                </div>

                <div className="cg-section">
                  <div className="cg-section-title">Key risks</div>
                  <ul className="cg-checklist">
                    {digestState.digest.key_risks.map((risk) => (
                      <li key={risk}>{risk}</li>
                    ))}
                  </ul>
                </div>

                <div className="cg-section">
                  <div className="cg-section-title">1–2–3 action checklist</div>
                  <ol className="cg-checklist">
                    {digestState.digest.action_checklist.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                </div>

                <div className="cg-section">
                  <div className="cg-section-title">Notes</div>
                  <div className="cg-muted">{digestState.digest.notes}</div>
                </div>
              </div>

              <div className="cg-divider" />

              <div>
                <div className="cg-section-title">Source reports</div>
                <div className="cg-muted">
                  Inspect the underlying reports to understand what the digest is based on.
                </div>
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {selectedReports.map((report) => (
                    <SourceReportCard key={report.id} report={report} />
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
