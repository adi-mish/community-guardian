import type { Report, ReportCategory, Severity } from './validation'

function clampText(input: string, maxLen: number): string {
  const text = input.trim().replaceAll(/\s+/g, ' ')
  if (text.length <= maxLen) return text
  return `${text.slice(0, Math.max(0, maxLen - 1)).trim()}…`
}

function firstSentence(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return ''
  const match = trimmed.match(/^(.+?[.!?])(\s|$)/)
  return match?.[1] ?? trimmed
}

export function buildReportChecklist(category: ReportCategory, severity: Severity): string[] {
  const baseByCategory: Record<ReportCategory, string[]> = {
    'Scam / phishing': [
      'Avoid clicking links or opening attachments from unexpected messages.',
      'Verify requests using a trusted channel (official number/app/site).',
      'Enable MFA and review recent logins for affected accounts.',
    ],
    'Local physical safety': [
      'Share only general location details (no exact addresses).',
      'Use well-lit routes and keep doors/windows secured.',
      'Report urgent or ongoing incidents to local emergency services.',
    ],
    'Home / network security': [
      'Update router/device firmware and restart if needed.',
      'Change default/admin passwords and use WPA2/WPA3 where available.',
      'Review connected devices and revoke unknown sessions.',
    ],
  }

  const base = [...baseByCategory[category]]

  if (severity === 'high') {
    if (category === 'Scam / phishing') {
      base.unshift('Assume urgency is a tactic; pause before acting.')
    }
    if (category === 'Home / network security') {
      base.unshift('If you suspect compromise, change key passwords from a clean device.')
    }
    if (category === 'Local physical safety') {
      base.unshift('If something feels unsafe right now, prioritize leaving the area.')
    }
  }

  return base.slice(0, 5)
}

export function summarizeReportFallback(input: Pick<Report, 'title' | 'raw_description' | 'category' | 'severity'>): string {
  const sentence = firstSentence(input.raw_description)
  const snippet = clampText(sentence || input.raw_description, 200)
  return `${input.category} (${input.severity}): ${snippet || clampText(input.title, 200)}`
}

