import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isGuest, loading } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">{t.common.loading}</div>
      </div>
    )
  }

  // Allow access if user is logged in OR browsing as guest
  if (!user && !isGuest) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1405720d-5c41-4d4c-bfdb-6af1608d58b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProtectedRoute.tsx',message:'Redirecting to login with return URL',data:{currentPath:location.pathname + location.search},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion agent log
    return <Navigate to={`/auth/login?return=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }

  return <>{children}</>
}

