import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './app/index.css'
import './style/paper.css'
import App from './app/App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
