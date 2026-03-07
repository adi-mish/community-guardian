import type { Neighborhood, Report, ReportCategory, Severity, VerificationStatus } from './validation'

export type ReportFilters = {
  query: string
  category: ReportCategory | 'all'
  neighborhood: Neighborhood | 'all'
  severity: Severity | 'all'
  verification_status: VerificationStatus | 'all'
}

export const DEFAULT_REPORT_FILTERS: ReportFilters = {
  query: '',
  category: 'all',
  neighborhood: 'all',
  severity: 'all',
  verification_status: 'all',
}

function includesInsensitive(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase())
}

export function filterReports(reports: Report[], filters: ReportFilters): Report[] {
  const query = filters.query.trim()

  return reports.filter((report) => {
    if (filters.category !== 'all' && report.category !== filters.category) return false
    if (filters.neighborhood !== 'all' && report.neighborhood !== filters.neighborhood) return false
    if (filters.severity !== 'all' && report.severity !== filters.severity) return false
    if (
      filters.verification_status !== 'all' &&
      report.verification_status !== filters.verification_status
    ) {
      return false
    }

    if (!query) return true
    if (includesInsensitive(report.title, query)) return true
    if (includesInsensitive(report.raw_description, query)) return true
    return report.tags.some((tag) => includesInsensitive(tag, query))
  })
}

export function sortReportsNewestFirst(reports: Report[]): Report[] {
  return [...reports].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
}

