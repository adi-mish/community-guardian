import type { Severity, VerificationStatus } from './validation'

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

export function severityTone(severity: Severity): BadgeTone {
  if (severity === 'high') return 'danger'
  if (severity === 'medium') return 'warning'
  return 'success'
}

export function verificationStatusTone(status: VerificationStatus): BadgeTone {
  if (status === 'trusted-source') return 'success'
  if (status === 'community-verified') return 'info'
  if (status === 'resolved') return 'neutral'
  return 'neutral'
}

export function verificationStatusLabel(status: VerificationStatus): string {
  if (status === 'unverified') return 'Unverified'
  if (status === 'community-verified') return 'Community verified'
  if (status === 'trusted-source') return 'Trusted source'
  return 'Resolved'
}

