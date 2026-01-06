import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import LanguageSwitcher from './LanguageSwitcher'

export default function Navbar() {
  const { user, isGuest, logout } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (path: string) => {
    return location.pathname.startsWith(path) ? 'text-indigo-600 font-semibold' : 'text-gray-700 hover:text-indigo-600'
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <Link to="/" className="text-xl sm:text-2xl font-bold text-indigo-600">
            🧭 <span className="hidden sm:inline">TripCircle</span>
          </Link>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/dashboard"
              className={`transition text-sm sm:text-base ${isActive('/dashboard')}`}
            >
              <span className="hidden sm:inline">{t.nav.dashboard}</span>
              <span className="sm:hidden">📅</span>
            </Link>
            <Link
              to="/explore"
              className={`transition text-sm sm:text-base ${isActive('/explore')}`}
            >
              <span className="hidden sm:inline">{t.nav.explore}</span>
              <span className="sm:hidden">🔍</span>
            </Link>
            {!isGuest && (
              <Link
                to="/admin/analytics"
                className={`transition text-sm sm:text-base ${isActive('/admin/analytics')}`}
              >
                <span className="hidden sm:inline">{t.nav.analytics}</span>
                <span className="sm:hidden">📊</span>
              </Link>
            )}
            
            <LanguageSwitcher />
            
            {user || isGuest ? (
              <div className="flex items-center gap-2 sm:gap-4 ml-2 sm:ml-4 pl-2 sm:pl-4 border-l">
                {isGuest ? (
                  <>
                    <span className="hidden sm:inline text-sm text-gray-500">{t.nav.guestMode}</span>
                    <Link
                      to="/auth/login"
                      className="text-indigo-600 hover:text-indigo-700 text-xs sm:text-sm font-medium"
                    >
                      {t.nav.login}
                    </Link>
                  </>
                ) : (
                  <>
                    {user && <span className="hidden sm:inline text-sm text-gray-700">{user.name}</span>}
                    <button
                      onClick={handleLogout}
                      className="text-gray-700 hover:text-red-600 p-1.5 rounded-lg hover:bg-gray-100 transition min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
                      title={t.nav.logout}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="hidden sm:inline ml-1">{t.nav.logout}</span>
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2 sm:ml-4">
                <Link
                  to="/auth/login"
                  className="text-gray-700 hover:text-indigo-600 transition text-xs sm:text-sm"
                >
                  {t.nav.login}
                </Link>
                <Link
                  to="/auth/register"
                  className="bg-indigo-600 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-indigo-700 transition text-xs sm:text-sm"
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

