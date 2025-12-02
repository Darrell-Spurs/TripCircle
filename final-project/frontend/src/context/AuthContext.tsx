import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi, User } from '../lib/auth'

interface AuthContextType {
  user: User | null
  isGuest: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  googleLogin: () => void
  continueAsGuest: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isGuest, setIsGuest] = useState(false)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('token')
      const guestMode = localStorage.getItem('guest') === 'true'
      
      if (guestMode) {
        setIsGuest(true)
        setUser(null)
        setLoading(false)
        return
      }
      
      if (token) {
        const userData = await authApi.getMe()
        setUser(userData)
        setIsGuest(false)
      } else {
        setUser(null)
        setIsGuest(false)
      }
    } catch (error) {
      localStorage.removeItem('token')
      setUser(null)
      setIsGuest(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  const login = async (email: string, password: string) => {
    await authApi.login({ email, password })
    localStorage.removeItem('guest')
    setIsGuest(false)
    await refreshUser()
  }

  const register = async (email: string, password: string, name: string) => {
    await authApi.register({ email, password, name })
    localStorage.removeItem('guest')
    setIsGuest(false)
    await refreshUser()
  }

  const logout = () => {
    authApi.logout()
    localStorage.removeItem('guest')
    setUser(null)
    setIsGuest(false)
  }

  const continueAsGuest = () => {
    localStorage.setItem('guest', 'true')
    localStorage.removeItem('token')
    setUser(null)
    setIsGuest(true)
  }

  const googleLogin = () => {
    authApi.googleLogin()
  }

  return (
    <AuthContext.Provider value={{ user, isGuest, loading, login, register, logout, googleLogin, continueAsGuest, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

