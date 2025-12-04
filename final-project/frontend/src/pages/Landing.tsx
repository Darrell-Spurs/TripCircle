import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function Landing() {
  const { user, isGuest, continueAsGuest } = useAuth()
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            {t.landing.title}
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            {t.landing.subtitle}
          </p>
          {user || isGuest ? (
            <Link
              to="/dashboard"
              className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              {t.landing.goToDashboard}
            </Link>
          ) : (
            <div className="space-y-4">
              <div className="space-x-4">
                <Link
                  to="/auth/login"
                  className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
                >
                  {t.landing.login}
                </Link>
                <Link
                  to="/auth/register"
                  className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition border-2 border-indigo-600"
                >
                  {t.landing.signUp}
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
                  {t.landing.continueWithoutLogin}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

