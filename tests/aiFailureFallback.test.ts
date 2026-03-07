import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import reportsJson from '../src/data/reports.json'
import { ReportSchema } from '../src/lib/validation'
import { buildDigest } from '../server/digestService'

describe('AI failure fallback', () => {
  it('falls back when AI output is malformed', async () => {
    const reports = z.array(ReportSchema).parse(reportsJson).slice(0, 2)

    const result = await buildDigest(reports, {
      forceFallback: false,
      aiGenerator: async () =>
        // missing required fields -> schema parse should fail
        ({ digest_title: 'x' } as unknown as any),
    })

    expect(result.digest.mode).toBe('fallback')
    expect(result.message).toMatch(/rule-based digest/i)
  })
})

