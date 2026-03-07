import './App.css'
import { Navigate, NavLink, Route, Routes } from 'react-router-dom'
import { ServerStatusLine } from './components/ServerStatusLine'
import { ReportsPage } from './pages/ReportsPage'
import { DigestPage } from './pages/DigestPage'
import { SettingsPage } from './pages/SettingsPage'

function App() {
  return (
    <div className="cg-shell">
      <header className="cg-header">
        <div className="cg-brand">
          <div className="cg-brand-title">Community Guardian</div>
          <div className="cg-brand-subtitle">Calm, actionable safety digests from local reports.</div>
          <ServerStatusLine />
        </div>
      </header>

      <div className="cg-body">
        <nav className="cg-nav" aria-label="Primary">
          <NavLink to="/reports" className={({ isActive }) => `cg-nav-link ${isActive ? 'is-active' : ''}`}>
            Reports
          </NavLink>
          <NavLink to="/digest" className={({ isActive }) => `cg-nav-link ${isActive ? 'is-active' : ''}`}>
            Digest generator
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `cg-nav-link ${isActive ? 'is-active' : ''}`}>
            Settings / info
          </NavLink>
        </nav>

        <main className="cg-main">
          <Routes>
            <Route path="/" element={<Navigate to="/reports" replace />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/digest" element={<DigestPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/reports" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
