import { readFileSync } from 'node:fs'
import { z } from 'zod'
import { buildReportChecklist, summarizeReportFallback } from '../src/lib/fallback.ts'
import { ReportSchema, type Report } from '../src/lib/validation.ts'

const ReportsListSchema = z.array(ReportSchema)

const store = new Map<string, Report>()
let seeded = false

function loadSeedReports(): Report[] {
  const url = new URL('../src/data/reports.json', import.meta.url)
  const raw = readFileSync(url, 'utf-8')
  const json = JSON.parse(raw) as unknown
  return ReportsListSchema.parse(json)
}

function canonicalize(report: Report): Report {
  return {
    ...report,
    recommended_checklist: buildReportChecklist(report.category, report.severity),
    ai_summary: summarizeReportFallback(report),
    summary_mode: 'fallback',
  }
}

export function ensureSeeded(): void {
  if (seeded) return
  for (const report of loadSeedReports()) {
    store.set(report.id, canonicalize(report))
  }
  seeded = true
}

export function upsertReports(reports: Report[]): { upserted: number } {
  ensureSeeded()
  let upserted = 0
  for (const report of reports) {
    store.set(report.id, canonicalize(report))
    upserted += 1
  }
  return { upserted }
}

export function getReportsByIds(ids: string[]): { reports: Report[]; missing_ids: string[] } {
  ensureSeeded()
  const reports: Report[] = []
  const missing_ids: string[] = []

  for (const id of ids) {
    const report = store.get(id)
    if (!report) missing_ids.push(id)
    else reports.push(report)
  }

  return { reports, missing_ids }
}

export function getStoreStats(): { total_reports: number } {
  ensureSeeded()
  return { total_reports: store.size }
}

