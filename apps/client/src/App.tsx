import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
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

// Without this, an unknown path matched no route and rendered a blank page.
const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4 text-center">
    <p className="text-5xl">🔥</p>
    <h1 className="text-2xl font-bold">Page not found</h1>
    <p className="text-muted-foreground text-sm">
      That page doesn't exist — it may have moved.
    </p>
    <Link to="/" className="text-primary hover:underline text-sm mt-2">
      Back to home
    </Link>
  </div>
)

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
      <Route path="*" element={<NotFound />} />
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