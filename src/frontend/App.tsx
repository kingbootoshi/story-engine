import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Landing } from './pages/Landing/Landing'
import { Auth } from './pages/Auth/Auth'
import { Dashboard } from './pages/Dashboard/Dashboard'
import { WorldDetail } from './pages/World/WorldDetail'
import { useAuthStore } from './stores/authStore'

export function App() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route 
          path="/auth" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Auth />} 
        />
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/world/:worldId" 
          element={isAuthenticated ? <WorldDetail /> : <Navigate to="/auth" />} 
        />
      </Routes>
    </Router>
  )
}