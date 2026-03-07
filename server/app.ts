import express from 'express'
import { DigestIdRequestSchema, ReportsSyncRequestSchema } from '../src/lib/validation.ts'
import { buildDigest } from './digestService.ts'
import { generateAiDigest } from './openaiDigest.ts'
import { getReportsByIds, getStoreStats, upsertReports } from './reportStore.ts'

export function createApp(): express.Express {
  const app = express()

  app.disable('x-powered-by')
  app.use(express.json({ limit: '250kb' }))

  let lastDigestMode: 'ai' | 'fallback' | null = null

  app.get('/api/health', (_req, res) => {
    const apiKey = process.env.OPENAI_API_KEY
    const model = process.env.OPENAI_MODEL ?? null
    const { total_reports } = getStoreStats()
    res.setHeader('Cache-Control', 'no-store')
    res.json({ ok: true, ai_available: Boolean(apiKey), model, total_reports, last_digest_mode: lastDigestMode })
  })

  app.post('/api/reports/sync', (req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    const parsed = ReportsSyncRequestSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid report sync payload.' })
      return
    }

    const result = upsertReports(parsed.data.reports)
    res.json({ ok: true, ...result })
  })

  app.post('/api/digest', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store')

    const parsed = DigestIdRequestSchema.safeParse(req.body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid request.'
      res.status(400).json({ error: message })
      return
    }

    const reportIds = parsed.data.report_ids
    const forceFallback = Boolean(parsed.data.force_fallback)

    const apiKey = process.env.OPENAI_API_KEY

    const resolved = getReportsByIds(reportIds)
    if (resolved.missing_ids.length) {
      res.status(400).json({ error: 'One or more selected reports could not be found.' })
      return
    }

    const reports = resolved.reports

    const aiGenerator =
      apiKey && !forceFallback
        ? async (selectedReports: typeof reports) => {
            const baseUrl = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1'
            const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
            const timeoutMsRaw = process.env.OPENAI_TIMEOUT_MS ?? '12000'
            const timeoutMs = Number.isFinite(Number(timeoutMsRaw)) ? Number(timeoutMsRaw) : 12000
            return generateAiDigest(selectedReports, { apiKey, baseUrl, model, timeoutMs })
          }
        : undefined

    const result = await buildDigest(reports, { forceFallback, aiGenerator })
    lastDigestMode = result.digest.mode
    res.json(result)
  })

  return app
}

