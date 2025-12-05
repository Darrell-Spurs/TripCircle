import { Link } from 'react-router-dom'
import { useTrips, useDeleteTrip } from '../hooks/useTrips'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { Trip } from '../types'

export default function Dashboard() {
  const { isGuest } = useAuth()
  const { t } = useLanguage()
  const { data: trips, isLoading } = useTrips()
  const deleteTrip = useDeleteTrip()

  const handleDelete = async (tripId: number) => {
    if (confirm(t.trip.deleteConfirm)) {
      await deleteTrip.mutateAsync(tripId)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">{t.common.loading}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">{t.dashboard.myTrips}</h1>
            {isGuest && (
              <p className="text-sm text-gray-500 mt-1">
                {t.dashboard.browsingAsGuest}<Link to="/auth/login" className="text-indigo-600 hover:underline">{t.nav.login}</Link> {t.dashboard.loginToSave}
              </p>
            )}
          </div>
          {!isGuest && (
            <Link
              to="/trips/new"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              {t.dashboard.newTrip}
            </Link>
          )}
        </div>

        {isGuest ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-600 mb-4 text-lg">
              {t.dashboard.welcomeGuest}
            </p>
            <p className="text-gray-500 mb-6">
              {t.dashboard.welcomeGuestDesc}
            </p>
            <div className="space-x-4">
              <Link
                to="/auth/login"
                className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
              >
                {t.nav.login}
              </Link>
              <Link
                to="/auth/register"
                className="inline-block bg-white text-indigo-600 px-6 py-3 rounded-lg hover:bg-gray-50 transition border-2 border-indigo-600"
              >
                {t.nav.signUp}
              </Link>
            </div>
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-500 mb-4">{t.dashboard.youCanExplore}</p>
              <div className="space-x-4">
                <Link
                  to="/explore"
                  className="inline-block text-indigo-600 hover:text-indigo-700 underline"
                >
                  {t.dashboard.explorePlaces}
                </Link>
                <Link
                  to="/admin/analytics"
                  className="inline-block text-indigo-600 hover:text-indigo-700 underline"
                >
                  {t.dashboard.viewAnalytics}
                </Link>
              </div>
            </div>
          </div>
        ) : !trips || trips.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">{t.dashboard.noTrips}</p>
            <Link
              to="/trips/new"
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
            >
              {t.dashboard.createTrip}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip: Trip) => (
              <div
                key={trip.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
              >
                {trip.coverImage && (
                  <img
                    src={trip.coverImage}
                    alt={trip.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2">{trip.title}</h3>
                  {trip.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {trip.description}
                    </p>
                  )}
                  <div className="text-sm text-gray-500 mb-3">
                    <p>
                      {new Date(trip.startDate).toLocaleDateString()} -{' '}
                      {new Date(trip.endDate).toLocaleDateString()}
                    </p>
                    <p className="mt-1">
                      {t.dashboard.status}: <span className="capitalize">{trip.status}</span>
                    </p>
                    {trip.role && (
                      <p className="mt-1">
                        {t.dashboard.role}: <span className="capitalize">{trip.role}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/trips/${trip.id}`}
                      className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded text-center hover:bg-indigo-700 transition"
                    >
                      {t.common.view}
                    </Link>
                    {trip.isOwner && (
                      <button
                        onClick={() => handleDelete(trip.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                      >
                        {t.common.delete}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
