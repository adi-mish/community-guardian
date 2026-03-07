import 'dotenv/config'
import express from 'express'
import { generateFallbackDigest } from '../src/lib/fallback.ts'
import { DigestRequestSchema, DigestSchema, type Digest } from '../src/lib/validation.ts'
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

  if (forceFallback) {
    const digest = generateFallbackDigest(reports)
    res.json({ digest, message: 'AI disabled. A rule-based digest was generated instead.' })
    return
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    const digest = generateFallbackDigest(reports)
    res.json({ digest, message: 'AI unavailable. A rule-based digest was generated instead.' })
    return
  }

  const baseUrl = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1'
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
  const timeoutMsRaw = process.env.OPENAI_TIMEOUT_MS ?? '12000'
  const timeoutMs = Number.isFinite(Number(timeoutMsRaw)) ? Number(timeoutMsRaw) : 12000

  try {
    const ai = await generateAiDigest(reports, { apiKey, baseUrl, model, timeoutMs })
    const digest = DigestSchema.parse({
      selected_report_ids: reports.map((r) => r.id),
      generated_at: new Date().toISOString(),
      mode: 'ai',
      ...ai,
    } satisfies Digest)

    res.json({ digest })
  } catch {
    const digest = generateFallbackDigest(reports)
    res.json({
      digest,
      message: 'AI output was unavailable or malformed. A rule-based digest was generated instead.',
    })
  }
})

const port = Number(process.env.PORT ?? '8787')
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] listening on http://localhost:${port}`)
})

