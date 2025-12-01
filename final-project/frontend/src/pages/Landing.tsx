import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Landing() {
  const { user, isGuest, continueAsGuest } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            🧭 TripCircle
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Plan your trips together with friends
          </p>
          {user || isGuest ? (
            <Link
              to="/dashboard"
              className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Go to Dashboard
            </Link>
          ) : (
            <div className="space-y-4">
              <div className="space-x-4">
                <Link
                  to="/auth/login"
                  className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
                >
                  Login
                </Link>
                <Link
                  to="/auth/register"
                  className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition border-2 border-indigo-600"
                >
                  Sign Up
                </Link>
              </div>
              <div className="pt-4">
                <button
                  onClick={() => {
                    continueAsGuest()
                    window.location.href = '/dashboard'
                  }}
                  className="text-gray-600 hover:text-gray-800 underline text-sm"
                >
                  Continue without login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

