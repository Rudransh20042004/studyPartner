import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initCrossTabSync } from './utils/crossTabSync' // Initialize cross-tab sync
import './index.css'
import App from './App.jsx'

// Initialize cross-tab sync on app load
initCrossTabSync();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
