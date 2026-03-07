import { useReportsStore } from '../lib/reportsContext'

export function SettingsPage() {
  const { resetToSampleData } = useReportsStore()

  return (
    <div className="cg-page">
      <div className="cg-panel cg-stack">
        <div>
          <div className="cg-section-title">Privacy & limitations</div>
          <ul className="cg-checklist">
            <li>All reports are synthetic and stored locally in your browser.</li>
            <li>Digest generation may use AI when configured; a rule-based fallback is always available.</li>
            <li>Digests are not emergency, medical, or legal advice.</li>
          </ul>
        </div>

        <div className="cg-divider" />

        <div>
          <div className="cg-section-title">Reset</div>
          <div className="cg-muted">Restore the built-in synthetic dataset (overwrites local changes).</div>
          <div style={{ marginTop: 12 }}>
            <button className="cg-btn cg-btn-ghost" type="button" onClick={resetToSampleData}>
              Reset to sample data
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
