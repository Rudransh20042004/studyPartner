import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './utils/storagePolyfill' // Initialize storage polyfill before anything else
import './index.css'
import DatabasePage from './pages/DatabasePage'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DatabasePage />
  </StrictMode>,
)

