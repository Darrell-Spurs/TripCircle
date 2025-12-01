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
        navigate('/dashboard')
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

