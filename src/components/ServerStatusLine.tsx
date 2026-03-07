import { useEffect, useState } from 'react'
import { HealthResponseSchema, type HealthResponse } from '../lib/validation'

type StatusState =
  | { status: 'loading' }
  | { status: 'ready'; health: HealthResponse }
  | { status: 'error' }

function lastDigestLabel(mode: HealthResponse['last_digest_mode']): string {
  if (mode === 'ai') return 'AI'
  if (mode === 'fallback') return 'Fallback'
  return '—'
}

export function ServerStatusLine() {
  const [state, setState] = useState<StatusState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const resp = await fetch('/api/health', { cache: 'no-store' })
        if (!resp.ok) throw new Error('Health check failed.')
        const json = (await resp.json()) as unknown
        const parsed = HealthResponseSchema.parse(json)
        if (cancelled) return
        setState({ status: 'ready', health: parsed })
      } catch {
        if (cancelled) return
        setState({ status: 'error' })
      }
    }

    void poll()
    const interval = window.setInterval(poll, 15000)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [])

  if (state.status === 'loading') {
    return <div className="cg-brand-status cg-muted">Server: checking…</div>
  }

  if (state.status === 'error') {
    return <div className="cg-brand-status cg-muted">Server: unreachable • Digests will use in-browser rules.</div>
  }

  const health = state.health
  const aiLabel = health.ai_available ? `configured${health.model ? ` (${health.model})` : ''}` : 'not configured'

  return (
    <div className="cg-brand-status cg-muted">
      Server: OK • AI: {aiLabel} • Last digest: {lastDigestLabel(health.last_digest_mode)}
    </div>
  )
}

