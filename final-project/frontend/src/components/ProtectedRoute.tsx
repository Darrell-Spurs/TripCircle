import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isGuest, loading } = useAuth()
  const { t } = useLanguage()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">{t.common.loading}</div>
      </div>
    )
  }

  // Allow access if user is logged in OR browsing as guest
  if (!user && !isGuest) {
    return <Navigate to="/auth/login" replace />
  }

  return <>{children}</>
}

