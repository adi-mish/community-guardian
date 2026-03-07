import { useState } from 'react'
import {
  NEIGHBORHOODS,
  REPORT_CATEGORIES,
  SEVERITIES,
  VERIFICATION_STATUSES,
  ReportFormSchema,
  type Report,
  type ReportFormValues,
} from '../lib/validation'

type Mode = 'create' | 'edit'

type Props = {
  mode: Mode
  initial?: Report | null
  onClose: () => void
  onSave: (values: ReportFormValues) => void
}

type FieldErrors = Partial<Record<keyof ReportFormValues, string>>

function toFormValues(report: Report): ReportFormValues {
  return {
    title: report.title,
    raw_description: report.raw_description,
    category: report.category,
    neighborhood: report.neighborhood,
    severity: report.severity,
    verification_status: report.verification_status,
    source_label: report.source_label,
    tags_text: report.tags.join(', '),
  }
}

function emptyFormValues(): ReportFormValues {
  return {
    title: '',
    raw_description: '',
    category: 'Scam / phishing',
    neighborhood: 'Downtown',
    severity: 'low',
    verification_status: 'unverified',
    source_label: 'Resident tip (synthetic)',
    tags_text: '',
  }
}

function collectFieldErrors(
  issues: { path: (string | number | symbol)[]; message: string }[],
): FieldErrors {
  const errors: FieldErrors = {}
  for (const issue of issues) {
    const key = issue.path[0]
    if (typeof key === 'string') {
      errors[key as keyof ReportFormValues] ??= issue.message
    }
  }
  return errors
}

export function ReportFormModal({ mode, initial, onClose, onSave }: Props) {
  const initialValues = mode === 'edit' && initial ? toFormValues(initial) : emptyFormValues()
  const [values, setValues] = useState<ReportFormValues>(() => initialValues)
  const [errors, setErrors] = useState<FieldErrors>(() => ({}))

  const title = mode === 'create' ? 'Create report' : 'Edit report'

  return (
    <div
      className="cg-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="cg-modal">
        <div className="cg-modal-header">
          <div className="cg-modal-title">{title}</div>
          <button className="cg-btn cg-btn-ghost" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <form
          className="cg-form"
          onSubmit={(e) => {
            e.preventDefault()
            const parsed = ReportFormSchema.safeParse(values)
            if (!parsed.success) {
              setErrors(collectFieldErrors(parsed.error.issues))
              return
            }
            setErrors({})
            onSave(parsed.data)
          }}
        >
          <div className="cg-grid-2">
            <label className="cg-field">
              <div className="cg-label">Title</div>
              <input
                className="cg-input"
                value={values.title}
                onChange={(e) => setValues((p) => ({ ...p, title: e.target.value }))}
                placeholder="Short, specific title"
              />
              {errors.title ? <div className="cg-error">{errors.title}</div> : null}
            </label>

            <label className="cg-field">
              <div className="cg-label">Source label</div>
              <input
                className="cg-input"
                value={values.source_label}
                onChange={(e) => setValues((p) => ({ ...p, source_label: e.target.value }))}
                placeholder="Resident tip (synthetic)"
              />
              {errors.source_label ? <div className="cg-error">{errors.source_label}</div> : null}
            </label>

            <label className="cg-field">
              <div className="cg-label">Category</div>
              <select
                className="cg-select"
                value={values.category}
                onChange={(e) =>
                  setValues((p) => ({ ...p, category: e.target.value as ReportFormValues['category'] }))
                }
              >
                {REPORT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category ? <div className="cg-error">Please select a valid category.</div> : null}
            </label>

            <label className="cg-field">
              <div className="cg-label">Neighborhood</div>
              <select
                className="cg-select"
                value={values.neighborhood}
                onChange={(e) =>
                  setValues((p) => ({
                    ...p,
                    neighborhood: e.target.value as ReportFormValues['neighborhood'],
                  }))
                }
              >
                {NEIGHBORHOODS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              {errors.neighborhood ? (
                <div className="cg-error">Please select a valid neighborhood.</div>
              ) : null}
            </label>

            <label className="cg-field">
              <div className="cg-label">Severity</div>
              <select
                className="cg-select"
                value={values.severity}
                onChange={(e) =>
                  setValues((p) => ({ ...p, severity: e.target.value as ReportFormValues['severity'] }))
                }
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {errors.severity ? <div className="cg-error">Please select a valid severity.</div> : null}
            </label>

            <label className="cg-field">
              <div className="cg-label">Verification status</div>
              <select
                className="cg-select"
                value={values.verification_status}
                onChange={(e) =>
                  setValues((p) => ({
                    ...p,
                    verification_status: e.target.value as ReportFormValues['verification_status'],
                  }))
                }
              >
                {VERIFICATION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {errors.verification_status ? (
                <div className="cg-error">Please select a valid status.</div>
              ) : null}
            </label>
          </div>

          <label className="cg-field">
            <div className="cg-label">Description</div>
            <textarea
              className="cg-textarea"
              value={values.raw_description}
              onChange={(e) => setValues((p) => ({ ...p, raw_description: e.target.value }))}
              placeholder="What happened? Include what was seen or received, and what you did next."
              rows={6}
            />
            {errors.raw_description ? <div className="cg-error">{errors.raw_description}</div> : null}
          </label>

          <label className="cg-field">
            <div className="cg-label">Tags (comma-separated)</div>
            <input
              className="cg-input"
              value={values.tags_text ?? ''}
              onChange={(e) => setValues((p) => ({ ...p, tags_text: e.target.value }))}
              placeholder="e.g., urgent, link, router"
            />
          </label>

          <div className="cg-modal-actions">
            <button className="cg-btn cg-btn-ghost" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="cg-btn cg-btn-primary" type="submit">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
