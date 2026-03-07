import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import reportsJson from '../src/data/reports.json'
import { DigestSchema, ReportSchema } from '../src/lib/validation'
import { generateFallbackDigest } from '../src/lib/fallback'

describe('fallback digest', () => {
  it('generates a valid digest from phishing reports', () => {
    const reports = z.array(ReportSchema).parse(reportsJson)
    const phishing = reports.filter((r) => r.category === 'Scam / phishing').slice(0, 4)

    const digest = generateFallbackDigest(phishing)
    expect(() => DigestSchema.parse(digest)).not.toThrow()
    expect(digest.mode).toBe('fallback')
    expect(digest.selected_report_ids).toEqual(phishing.map((r) => r.id))
    expect(digest.action_checklist).toHaveLength(3)
    expect(digest.key_risks.length).toBeGreaterThan(0)
  })
})

