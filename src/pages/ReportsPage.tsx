import { useEffect, useMemo, useState } from 'react'
import { ReportDetail } from '../components/ReportDetail'
import { ReportFormModal } from '../components/ReportFormModal'
import { DEFAULT_REPORT_FILTERS, filterReports, sortReportsNewestFirst, type ReportFilters } from '../lib/filters'
import { formatDateTime } from '../lib/format'
import { useReportsStore } from '../lib/reportsContext'
import {
  NEIGHBORHOODS,
  REPORT_CATEGORIES,
  SEVERITIES,
  VERIFICATION_STATUSES,
  type Report,
  type ReportCategory,
  type Severity,
  type VerificationStatus,
  type Neighborhood,
} from '../lib/validation'
import { Badge } from '../components/Badge'

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

function ListItem({ report, active, onSelect }: { report: Report; active: boolean; onSelect: () => void }) {
  return (
    <button className={`cg-list-item ${active ? 'is-active' : ''}`} type="button" onClick={onSelect}>
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
    </button>
  )
}

export function ReportsPage() {
  const { reports, createReport, updateReport, setVerificationStatus } = useReportsStore()
  const [filters, setFilters] = useState<ReportFilters>(DEFAULT_REPORT_FILTERS)
  const [selectedId, setSelectedId] = useState<string | null>(reports[0]?.id ?? null)
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; initial?: Report | null } | null>(null)

  const visibleReports = useMemo(() => {
    const filtered = filterReports(reports, filters)
    return sortReportsNewestFirst(filtered)
  }, [filters, reports])

  const selected = useMemo(
    () => reports.find((report) => report.id === selectedId) ?? null,
    [reports, selectedId],
  )

  useEffect(() => {
    if (!selectedId && visibleReports[0]) setSelectedId(visibleReports[0].id)
    if (selectedId && !reports.some((r) => r.id === selectedId)) setSelectedId(visibleReports[0]?.id ?? null)
  }, [reports, selectedId, visibleReports])

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
          <button
            className="cg-btn cg-btn-primary"
            type="button"
            onClick={() => setModal({ mode: 'create' })}
          >
            New report
          </button>
        </div>
      </div>

      <div className="cg-content-grid">
        <div className="cg-panel cg-list">
          <div className="cg-list-header">
            <div className="cg-list-title">
              Reports <span className="cg-muted">({visibleReports.length})</span>
            </div>
            <button className="cg-btn cg-btn-ghost" type="button" onClick={() => setFilters(DEFAULT_REPORT_FILTERS)}>
              Reset filters
            </button>
          </div>

          {visibleReports.length ? (
            <div className="cg-list-scroll" role="list">
              {visibleReports.map((report) => (
                <ListItem
                  key={report.id}
                  report={report}
                  active={report.id === selectedId}
                  onSelect={() => setSelectedId(report.id)}
                />
              ))}
            </div>
          ) : (
            <div className="cg-empty">
              <div className="cg-empty-title">No matching reports</div>
              <div className="cg-muted">Try broadening filters or creating a new report.</div>
            </div>
          )}
        </div>

        {selected ? (
          <ReportDetail
            report={selected}
            onEdit={() => setModal({ mode: 'edit', initial: selected })}
            onSetStatus={(status) => setVerificationStatus(selected.id, status)}
          />
        ) : (
          <div className="cg-panel cg-empty">
            <div className="cg-empty-title">Select a report</div>
            <div className="cg-muted">Choose a report to view details and checklist.</div>
          </div>
        )}
      </div>

      <ReportFormModal
        open={modal !== null}
        mode={modal?.mode ?? 'create'}
        initial={modal?.initial ?? null}
        onClose={() => setModal(null)}
        onSave={(values) => {
          if (modal?.mode === 'edit' && modal.initial) {
            updateReport(modal.initial.id, values)
            setSelectedId(modal.initial.id)
          } else {
            const created = createReport(values)
            setSelectedId(created.id)
          }
          setModal(null)
        }}
      />
    </div>
  )
}
