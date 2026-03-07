type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

export function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: BadgeTone
  children: import('react').ReactNode
}) {
  return <span className={`cg-badge cg-badge-${tone}`}>{children}</span>
}
