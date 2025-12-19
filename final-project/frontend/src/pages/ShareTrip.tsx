import { useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useSharedTrip, useImportSharedTrip } from '../hooks/useShare'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { trackEvent } from '../lib/amplitude'
import { Activity } from '../types'

export default function ShareTrip() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { user, isGuest } = useAuth()
  const { t, language } = useLanguage()
  const { data, isLoading } = useSharedTrip(token || '')
  const importTrip = useImportSharedTrip()

  const isLoggedIn = !!user && !isGuest

  const handleImport = async () => {
    if (!token) return
    
    if (!isLoggedIn) {
      // Redirect to login with return URL
      alert(t.share.pleaseLoginToImport)
      navigate('/auth/login')
      return
    }

    try {
      const result = await importTrip.mutateAsync(token)
      trackEvent('trip_imported', { sourceToken: token, newTripId: result.tripId })
      alert(t.share.tripImportedSuccess.replace('{title}', result.title))
      navigate(`/trips/${result.tripId}`)
    } catch (error: any) {
      alert(error.response?.data?.detail || t.share.failedToImport)
    }
  }

  // Format time without seconds
  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    const locale = language === 'zh-TW' ? 'zh-TW' : 'en-US'
    return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  // Group activities by date (only dates with activities)
  const activitiesByDate = useMemo(() => {
    if (!data?.trip?.activities) return {}
    const grouped: Record<string, Activity[]> = {}
    
    data.trip.activities.forEach((activity) => {
      const date = new Date(activity.date).toISOString().split('T')[0]
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(activity)
    })
    
    // Sort activities by orderIndex within each day
    Object.keys(grouped).forEach((date) => {
      grouped[date].sort((a, b) => a.orderIndex - b.orderIndex)
    })
    
    return grouped
  }, [data?.trip?.activities])

  // Get sorted dates that have activities
  const datesWithActivities = useMemo(() => {
    return Object.keys(activitiesByDate).sort()
  }, [activitiesByDate])

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  useEffect(() => {
    if (token && data) {
      trackEvent('share_link_opened', { token, tripId: data.trip.id })
    }
  }, [token, data])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">{t.common.loading}</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{t.feed.tripNotFound}</h2>
          <Link to="/" className="text-indigo-600 hover:text-indigo-700">
            {t.feed.goToHome}
          </Link>
        </div>
      </div>
    )
  }

  const { trip } = data

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">{t.share.sharedTripReadOnly}</p>
          <button
            onClick={handleImport}
            disabled={importTrip.isPending}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 text-sm flex items-center gap-2"
          >
            {importTrip.isPending ? (
              t.share.importing
            ) : (
              <>
                <span>📥</span>
                {t.share.importToMyTrips}
              </>
            )}
          </button>
        </div>

        {trip.coverImage && (
          <img
            src={trip.coverImage}
            alt={trip.title}
            className="w-full h-64 object-cover rounded-lg mb-6"
          />
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">{trip.title}</h1>
          {trip.description && (
            <p className="text-gray-600 mb-4">{trip.description}</p>
          )}
          <div className="flex gap-4 text-sm text-gray-500">
            <p>
              <span className="font-semibold">{t.trip.dates}:</span>{' '}
              {new Date(trip.startDate).toLocaleDateString()} -{' '}
              {new Date(trip.endDate).toLocaleDateString()}
            </p>
            <p>
              <span className="font-semibold">{t.trip.status}:</span>{' '}
              <span className="capitalize">{trip.status === 'planning' ? t.trip.planning : trip.status === 'upcoming' ? t.trip.upcoming : trip.status === 'ongoing' ? t.trip.ongoing : trip.status === 'completed' ? t.trip.completed : trip.status === 'cancelled' ? t.trip.cancelled : trip.status}</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">{t.share.itinerary}</h2>
          {datesWithActivities.length > 0 ? (
            <div className="space-y-8">
              {datesWithActivities.map((date) => (
                <div key={date}>
                  <h3 className="text-xl font-bold mb-4">{formatDate(date)}</h3>
                  <div className="space-y-3">
                    {activitiesByDate[date].map((activity) => (
                      <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-lg mb-2">{activity.title}</h4>
                        {(activity.startTime || activity.endTime) && (
                          <p className="text-sm text-gray-600 mb-2">
                            {formatTime(activity.startTime)} - {formatTime(activity.endTime)}
                          </p>
                        )}
                        {activity.locationName && (
                          <p className="text-sm text-gray-600 mb-2">
                            📍 {activity.locationName}
                            {activity.address && <span className="text-gray-500"> - {activity.address}</span>}
                          </p>
                        )}
                        {activity.notes && (
                          <p className="text-sm text-gray-700 mt-2">{activity.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">{t.share.noActivitiesPlanned}</p>
          )}
        </div>
      </div>
    </div>
  )
}
