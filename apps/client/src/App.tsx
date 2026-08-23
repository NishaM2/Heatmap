import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthProvider'
import { useAuth } from './hooks/useAuth'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import FriendsPage from '@/pages/FriendsPage'
import SettingsPage from '@/pages/SettingsPage'
import ComparisonPage from '@/pages/ComparisonPage'
import LandingPage from '@/pages/LandingPage'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (user) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/comparison/:goalId" element={<ProtectedRoute><ComparisonPage /></ProtectedRoute>} />
      <Route path="/" element={<LandingPage />} />
    </Routes>
  )
}

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App