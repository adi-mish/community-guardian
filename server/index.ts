import 'dotenv/config'
import express from 'express'
import { DigestRequestSchema } from '../src/lib/validation.ts'
import { buildDigest } from './digestService.ts'
import { generateAiDigest } from './openaiDigest.ts'

const app = express()

app.disable('x-powered-by')
app.use(express.json({ limit: '250kb' }))

app.get('/api/health', (_req, res) => {
  const apiKey = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_MODEL ?? null
  res.setHeader('Cache-Control', 'no-store')
  res.json({ ok: true, ai_available: Boolean(apiKey), model })
})

app.post('/api/digest', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store')

  const parsed = DigestRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid request.'
    res.status(400).json({ error: message })
    return
  }

  const reports = parsed.data.reports
  const forceFallback = Boolean((req.body as { force_fallback?: unknown }).force_fallback)

  const apiKey = process.env.OPENAI_API_KEY

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
  res.json(result)
})

const port = Number(process.env.PORT ?? '8787')
app.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`)
})
