import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'

// Prevent Electron from navigating to files dropped outside the drop zone
document.addEventListener('dragover', e => e.preventDefault())
document.addEventListener('drop', e => e.preventDefault())

// Disable browser context menu
document.addEventListener('contextmenu', e => e.preventDefault())

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
