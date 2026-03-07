import { describe, expect, it } from 'vitest'
import { ReportFormSchema } from '../src/lib/validation'

describe('validation', () => {
  it('rejects incomplete report input with a clear error', () => {
    const parsed = ReportFormSchema.safeParse({
      title: '',
      raw_description: '',
      category: 'Scam / phishing',
      neighborhood: 'Downtown',
      severity: 'low',
      verification_status: 'unverified',
      source_label: 'Resident tip (synthetic)',
      tags_text: '',
    })

    expect(parsed.success).toBe(false)
    if (parsed.success) return

    const messages = parsed.error.issues.map((i) => i.message)
    expect(messages).toContain('Title is required.')
    expect(messages).toContain('Description is required.')
  })
})

