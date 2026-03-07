import { generateFallbackDigest } from '../src/lib/fallback.ts'
import { DigestSchema, type AiDigestOutput, type Digest, type Report } from '../src/lib/validation.ts'

export type DigestBuildResult = { digest: Digest; message?: string }

export type AiGenerator = (reports: Report[]) => Promise<AiDigestOutput>

function clampText(input: string, maxLen: number): string {
  const text = input.trim().replaceAll(/\s+/g, ' ')
  if (text.length <= maxLen) return text
  return `${text.slice(0, Math.max(0, maxLen - 1)).trim()}…`
}

function appendSentence(base: string, sentence: string): string {
  const trimmed = base.trim()
  const separator = /[.!?…]$/.test(trimmed) ? ' ' : '. '
  return `${trimmed}${separator}${sentence}`
}

function standardizeNotes(notes: string): string {
  const lower = notes.toLowerCase()
  let next = notes.trim()

  if (!lower.includes('informational')) {
    next = appendSentence(next, 'This digest is informational and may include unverified reports.')
  }

  if (!lower.includes('verification reflects')) {
    next = appendSentence(next, 'Verification reflects the source report state, not model certainty.')
  }

  return clampText(next, 1200)
}

export async function buildDigest(
  reports: Report[],
  options: { forceFallback: boolean; aiGenerator?: AiGenerator },
): Promise<DigestBuildResult> {
  if (options.forceFallback) {
    return {
      digest: generateFallbackDigest(reports),
      message: 'AI disabled. Generated a rule-based digest instead.',
    }
  }

  if (!options.aiGenerator) {
    return {
      digest: generateFallbackDigest(reports),
      message: 'AI unavailable. Generated a rule-based digest instead.',
    }
  }

  try {
    const ai = await options.aiGenerator(reports)
    const digest = DigestSchema.parse({
      selected_report_ids: reports.map((r) => r.id),
      generated_at: new Date().toISOString(),
      mode: 'ai',
      ...ai,
      notes: standardizeNotes(ai.notes),
    })
    return { digest }
  } catch {
    return {
      digest: generateFallbackDigest(reports),
      message: 'AI returned an unexpected response. Generated a rule-based digest instead.',
    }
  }
}
