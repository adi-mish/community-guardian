import type { Digest, Report, ReportCategory, Severity } from './validation'
import { DigestSchema } from './validation'

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

function severityScore(severity: Severity): number {
  if (severity === 'high') return 3
  if (severity === 'medium') return 2
  return 1
}

type RiskRule = {
  phrase: string
  keywords: string[]
  categories?: ReportCategory[]
}

const RISK_RULES: RiskRule[] = [
  {
    phrase: 'Credential theft via fake logins or verification codes',
    keywords: ['login', 'log in', 'password', 'reset', 'otp', 'one-time', 'verification code', 'mfa', 'two-factor'],
    categories: ['Scam / phishing', 'Home / network security'],
  },
  {
    phrase: 'Payment scams using urgency (gift cards, invoices, fees)',
    keywords: ['gift card', 'invoice', 'payment', 'overdue', 'fee', 'wire', 'urgent'],
    categories: ['Scam / phishing'],
  },
  {
    phrase: 'Malware or remote-access attempts disguised as support or updates',
    keywords: ['remote access', 'support', 'call this number', 'firmware update', 'download', 'infected', 'virus'],
    categories: ['Scam / phishing', 'Home / network security'],
  },
  {
    phrase: 'Vehicle and property theft risk in shared parking areas',
    keywords: ['break-in', 'window', 'smashed', 'parking', 'trail', 'valuables', 'stolen'],
    categories: ['Local physical safety'],
  },
  {
    phrase: 'Door-to-door impersonation or boundary testing',
    keywords: ['door', 'handle', 'impersonation', 'utilities', 'vest', 'gas leak', 'check inside'],
    categories: ['Local physical safety'],
  },
  {
    phrase: 'Home Wi‑Fi exposure from weak router configuration or unknown devices',
    keywords: ['router', 'wi-fi', 'wifi', 'default', 'admin', 'unknown device', 'connected', 'ssid', 'wps'],
    categories: ['Home / network security'],
  },
]

function normalizeReportText(report: Report): string {
  return `${report.title}\n${report.raw_description}\n${report.tags.join(' ')}`.toLowerCase()
}

function topCategories(reports: Report[]): ReportCategory[] {
  const score = new Map<ReportCategory, number>()
  for (const report of reports) {
    score.set(report.category, (score.get(report.category) ?? 0) + severityScore(report.severity))
  }
  return [...score.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category]) => category)
}

function confidenceLabel(reports: Report[]): Digest['confidence_label'] {
  if (reports.length <= 1) {
    const status = reports[0]?.verification_status
    return status && status !== 'unverified' ? 'Medium' : 'Low'
  }

  const grounded = reports.filter((r) => r.verification_status !== 'unverified').length
  if (grounded === 0) return 'Low'
  if (grounded / reports.length >= 0.6) return 'High'
  return 'Medium'
}

function actionChecklistForCategories(categories: ReportCategory[]): string[] {
  const actionsByCategory: Record<ReportCategory, string[]> = {
    'Scam / phishing': [
      'Pause before acting on urgent messages; avoid links and attachments.',
      'Verify requests via a trusted channel (official app/site/number).',
      'Enable MFA and change passwords for any affected accounts.',
    ],
    'Local physical safety': [
      'Secure doors/vehicles and remove valuables from sight.',
      'Use lighting and share only general location details (no addresses).',
      'Report recurring patterns to local non-emergency services.',
    ],
    'Home / network security': [
      'Change router admin credentials and update firmware.',
      'Review connected devices; remove unknown devices and rotate Wi‑Fi passwords.',
      'Run a malware scan and review sign-in history on key accounts.',
    ],
  }

  const checklist: string[] = []
  for (const category of categories) {
    for (const item of actionsByCategory[category]) {
      if (checklist.includes(item)) continue
      checklist.push(item)
      if (checklist.length === 3) return checklist
    }
  }
  while (checklist.length < 3) {
    checklist.push('Take a breath, verify information, and focus on routine protective steps.')
  }
  return checklist.slice(0, 3)
}

export function generateFallbackDigest(reports: Report[]): Digest {
  const categories = topCategories(reports).slice(0, 3)
  const categoryLabel =
    categories.length === 1
      ? categories[0]
      : categories.length === 2
        ? `${categories[0]} + ${categories[1]}`
        : `${categories[0]}, ${categories[1]} + ${categories[2]}`

  const risks = new Map<string, number>()
  for (const report of reports) {
    const text = normalizeReportText(report)
    for (const rule of RISK_RULES) {
      if (rule.categories && !rule.categories.includes(report.category)) continue
      if (!rule.keywords.some((kw) => text.includes(kw))) continue
      risks.set(rule.phrase, (risks.get(rule.phrase) ?? 0) + severityScore(report.severity))
    }
  }

  const riskEntries: Array<[string, number]> = risks.size
    ? [...risks.entries()]
    : [['General situational awareness and routine precautions', 1] as [string, number]]

  const keyRisks = riskEntries
    .sort((a, b) => b[1] - a[1])
    .map(([phrase]) => phrase)
    .slice(0, 5)

  const selected_report_ids = reports.map((r) => r.id)
  const communityVerifiedCount = reports.filter((r) => r.verification_status === 'community-verified').length
  const trustedSourceCount = reports.filter((r) => r.verification_status === 'trusted-source').length
  const resolvedCount = reports.filter((r) => r.verification_status === 'resolved').length

  const statusClause =
    communityVerifiedCount + trustedSourceCount + resolvedCount === 0
      ? 'Most items are unverified signals; treat them as prompts for routine caution, not confirmed facts.'
      : `${communityVerifiedCount} community-verified, ${trustedSourceCount} trusted-source, and ${resolvedCount} resolved items provide some grounding; still verify details before acting.`

  const digest = {
    selected_report_ids,
    digest_title: `Community digest: ${categoryLabel}`,
    digest_summary: `This digest summarizes ${reports.length} selected report${reports.length === 1 ? '' : 's'} and highlights the most useful next steps. ${statusClause}`,
    key_risks: keyRisks,
    action_checklist: actionChecklistForCategories(categories),
    confidence_label: confidenceLabel(reports),
    generated_at: new Date().toISOString(),
    mode: 'fallback',
    notes:
      'This digest is informational and may include unverified reports. Verification reflects the source report state, not model certainty. For emergencies, contact local emergency services. For unverified reports, prioritize low-regret actions (password hygiene, locking up, and verifying via trusted channels).',
  } satisfies Digest

  return DigestSchema.parse(digest)
}
