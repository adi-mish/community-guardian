import { generateFallbackDigest } from '../src/lib/fallback.ts'
import { DigestSchema, type AiDigestOutput, type Digest, type Report } from '../src/lib/validation.ts'

export type DigestBuildResult = { digest: Digest; message?: string }

export type AiGenerator = (reports: Report[]) => Promise<AiDigestOutput>

export async function buildDigest(
  reports: Report[],
  options: { forceFallback: boolean; aiGenerator?: AiGenerator },
): Promise<DigestBuildResult> {
  if (options.forceFallback) {
    return {
      digest: generateFallbackDigest(reports),
      message: 'AI disabled. A rule-based digest was generated instead.',
    }
  }

  if (!options.aiGenerator) {
    return {
      digest: generateFallbackDigest(reports),
      message: 'AI unavailable. A rule-based digest was generated instead.',
    }
  }

  try {
    const ai = await options.aiGenerator(reports)
    const digest = DigestSchema.parse({
      selected_report_ids: reports.map((r) => r.id),
      generated_at: new Date().toISOString(),
      mode: 'ai',
      ...ai,
    })
    return { digest }
  } catch {
    return {
      digest: generateFallbackDigest(reports),
      message: 'AI output was unavailable or malformed. A rule-based digest was generated instead.',
    }
  }
}

