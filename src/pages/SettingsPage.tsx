import { useReportsStore } from '../lib/reportsContext'

export function SettingsPage() {
  const { resetToSampleData } = useReportsStore()

  return (
    <div className="cg-page">
      <div className="cg-panel cg-stack">
        <div>
          <div className="cg-section-title">Privacy & limitations</div>
          <ul className="cg-checklist">
            <li>All built-in reports are synthetic and stored locally in your browser.</li>
            <li>
              When AI is enabled and configured, only the selected reports are sent to the local server for digest
              generation.
            </li>
            <li>AI output is parsed as strict JSON and validated; malformed output triggers deterministic fallback.</li>
            <li>Digests are informational only, not emergency, medical, or legal advice.</li>
            <li>Use general neighborhood names; avoid exact addresses or personal data.</li>
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
