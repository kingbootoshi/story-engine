import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import '../style.css'

// Check auth session on app load
import { useAuthStore } from './stores/authStore'
useAuthStore.getState().checkSession()

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)