import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Interface font, self-hosted: no request to a third-party font CDN on page load.
import '@fontsource-variable/inter/wght.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
