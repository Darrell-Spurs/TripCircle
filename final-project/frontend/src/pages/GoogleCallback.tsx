import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function GoogleCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { refreshUser } = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      localStorage.setItem('token', token)
      refreshUser().then(() => {
        // Get return URL from localStorage (set by Login page) or default to dashboard
        const returnUrl = localStorage.getItem('returnUrl') || '/dashboard'
        localStorage.removeItem('returnUrl')
        navigate(returnUrl)
      })
    } else {
      navigate('/auth/login')
    }
  }, [searchParams, navigate, refreshUser])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">Completing login...</div>
    </div>
  )
}

