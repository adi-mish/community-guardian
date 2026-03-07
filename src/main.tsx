import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ReportsProvider } from './lib/reportsContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ReportsProvider>
        <App />
      </ReportsProvider>
    </BrowserRouter>
  </StrictMode>,
)
