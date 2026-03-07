import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { z } from 'zod'
import seedReportsJson from '../data/reports.json'
import { buildReportChecklist, summarizeReportFallback } from './fallback'
import {
  type Report,
  type ReportFormValues,
  type VerificationStatus,
  ReportSchema,
  parseTags,
} from './validation'

const STORAGE_KEY = 'community_guardian_reports_v1'
const ReportsListSchema = z.array(ReportSchema)

function safeLoadSeedReports(): Report[] {
  try {
    return ReportsListSchema.parse(seedReportsJson)
  } catch {
    return []
  }
}

function safeReadLocalStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeWriteLocalStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // ignore storage errors (private mode, quota, etc.)
  }
}

function makeReportId(): string {
  try {
    return `rpt_${crypto.randomUUID()}`
  } catch {
    return `rpt_${Date.now()}_${Math.random().toString(16).slice(2)}`
  }
}

function toReport(values: ReportFormValues, options: { id: string; created_at: string }): Report {
  const tags = parseTags(values.tags_text ?? '')
  return ReportSchema.parse({
    id: options.id,
    title: values.title,
    raw_description: values.raw_description,
    category: values.category,
    neighborhood: values.neighborhood,
    severity: values.severity,
    verification_status: values.verification_status,
    created_at: options.created_at,
    source_label: values.source_label,
    tags,
    recommended_checklist: buildReportChecklist(values.category, values.severity),
    ai_summary: summarizeReportFallback({
      title: values.title,
      raw_description: values.raw_description,
      category: values.category,
      severity: values.severity,
    }),
    summary_mode: 'fallback',
  })
}

function loadReports(): Report[] {
  const stored = safeReadLocalStorage(STORAGE_KEY)
  if (!stored) return safeLoadSeedReports()
  try {
    const parsed = JSON.parse(stored) as unknown
    return ReportsListSchema.parse(parsed)
  } catch {
    return safeLoadSeedReports()
  }
}

export type ReportsStore = {
  reports: Report[]
  createReport: (values: ReportFormValues) => Report
  updateReport: (id: string, values: ReportFormValues) => void
  setVerificationStatus: (id: string, status: VerificationStatus) => void
  resetToSampleData: () => void
}

const ReportsContext = createContext<ReportsStore | null>(null)

export function ReportsProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<Report[]>(() => loadReports())

  useEffect(() => {
    safeWriteLocalStorage(STORAGE_KEY, JSON.stringify(reports))
  }, [reports])

  const store = useMemo<ReportsStore>(() => {
    return {
      reports,
      createReport(values) {
        const next = toReport(values, { id: makeReportId(), created_at: new Date().toISOString() })
        setReports((prev) => [next, ...prev])
        return next
      },
      updateReport(id, values) {
        setReports((prev) =>
          prev.map((report) => {
            if (report.id !== id) return report
            return toReport(values, { id: report.id, created_at: report.created_at })
          }),
        )
      },
      setVerificationStatus(id, status) {
        setReports((prev) =>
          prev.map((report) =>
            report.id === id ? { ...report, verification_status: status } : report,
          ),
        )
      },
      resetToSampleData() {
        setReports(safeLoadSeedReports())
      },
    }
  }, [reports])

  return <ReportsContext.Provider value={store}>{children}</ReportsContext.Provider>
}

export function useReportsStore(): ReportsStore {
  const ctx = useContext(ReportsContext)
  if (!ctx) throw new Error('useReportsStore must be used within <ReportsProvider>.')
  return ctx
}
