import { useEffect, useState } from 'react'
import { AuthContext, type User } from './AuthContext'
import { authApi } from '../services/api'

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSession = async () => {
    try {
      const data = await authApi.getSession()
      setUser(data?.user || null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSession()
  }, [])

  const login = async (email: string, password: string) => {
    const data = await authApi.signIn({ email, password })
    setUser(data?.user || null)
  }

  const logout = async () => {
    await authApi.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refetch: fetchSession
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}