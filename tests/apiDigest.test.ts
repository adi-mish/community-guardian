import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../server/app'
import { DigestResponseSchema, HealthResponseSchema } from '../src/lib/validation'

describe('api integration', () => {
  it('returns a valid digest for report ids', async () => {
    const prev = process.env.OPENAI_API_KEY
    try {
      delete process.env.OPENAI_API_KEY

      const app = createApp()
      const res = await request(app)
        .post('/api/digest')
        .send({ report_ids: ['rpt_001', 'rpt_002'] })
        .expect(200)

      const parsed = DigestResponseSchema.parse(res.body)
      expect(parsed.digest.mode).toBe('fallback')
      expect(parsed.digest.selected_report_ids).toEqual(['rpt_001', 'rpt_002'])
    } finally {
      if (prev !== undefined) process.env.OPENAI_API_KEY = prev
      else delete process.env.OPENAI_API_KEY
    }
  })

  it('rejects invalid digest requests with 400', async () => {
    const app = createApp()
    const res = await request(app).post('/api/digest').send({ report_ids: [] }).expect(400)
    expect(res.body).toEqual({ error: 'Select at least one report to generate a digest.' })
  })

  it('returns fallback when force_fallback is true', async () => {
    const prev = process.env.OPENAI_API_KEY
    try {
      process.env.OPENAI_API_KEY = 'test'

      const app = createApp()
      const res = await request(app)
        .post('/api/digest')
        .send({ report_ids: ['rpt_001'], force_fallback: true })
        .expect(200)

      const parsed = DigestResponseSchema.parse(res.body)
      expect(parsed.digest.mode).toBe('fallback')
      expect(parsed.message?.toLowerCase()).toContain('rule-based digest')
    } finally {
      if (prev !== undefined) process.env.OPENAI_API_KEY = prev
      else delete process.env.OPENAI_API_KEY
    }
  })

  it('rejects unknown report ids with 400', async () => {
    const app = createApp()
    const res = await request(app).post('/api/digest').send({ report_ids: ['rpt_missing'] }).expect(400)
    expect(res.body).toEqual({ error: 'One or more selected reports could not be found.' })
  })

  it('exposes last digest mode in /api/health', async () => {
    const prev = process.env.OPENAI_API_KEY
    try {
      delete process.env.OPENAI_API_KEY

      const app = createApp()

      const before = await request(app).get('/api/health').expect(200)
      const beforeHealth = HealthResponseSchema.parse(before.body)
      expect(beforeHealth.last_digest_mode).toBeNull()

      await request(app).post('/api/digest').send({ report_ids: ['rpt_001'] }).expect(200)

      const after = await request(app).get('/api/health').expect(200)
      const afterHealth = HealthResponseSchema.parse(after.body)
      expect(afterHealth.last_digest_mode).toBe('fallback')
    } finally {
      if (prev !== undefined) process.env.OPENAI_API_KEY = prev
      else delete process.env.OPENAI_API_KEY
    }
  })
})
