import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import LanguageSwitcher from './LanguageSwitcher'

export default function Navbar() {
  const { user, isGuest, logout } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-indigo-600">
            🧭 TripCircle
          </Link>
          
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="text-gray-700 hover:text-indigo-600 transition"
            >
              {t.nav.dashboard}
            </Link>
            <Link
              to="/explore"
              className="text-gray-700 hover:text-indigo-600 transition"
            >
              {t.nav.explore}
            </Link>
            {!isGuest && (
              <Link
                to="/admin/analytics"
                className="text-gray-700 hover:text-indigo-600 transition"
              >
                {t.nav.analytics}
              </Link>
            )}
            
            <LanguageSwitcher />
            
            {user || isGuest ? (
              <div className="flex items-center gap-4 ml-4 pl-4 border-l">
                {isGuest ? (
                  <>
                    <span className="text-sm text-gray-500">{t.nav.guestMode}</span>
                    <Link
                      to="/auth/login"
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                    >
                      {t.nav.login}
                    </Link>
                  </>
                ) : (
                  <>
                    {user && <span className="text-sm text-gray-700">{user.name}</span>}
                    <button
                      onClick={handleLogout}
                      className="text-gray-700 hover:text-red-600 text-sm"
                    >
                      {t.nav.logout}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-4">
                <Link
                  to="/auth/login"
                  className="text-gray-700 hover:text-indigo-600 transition text-sm"
                >
                  {t.nav.login}
                </Link>
                <Link
                  to="/auth/register"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm"
                >
                  {t.nav.signUp}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

