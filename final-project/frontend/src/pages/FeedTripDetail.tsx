import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useFeedTrip } from '../hooks/useFeed'
import { Activity } from '../types'

export default function FeedTripDetail() {
  const { id } = useParams<{ id: string }>()
  const tripId = id ? parseInt(id) : 0
  const { data: trip, isLoading, error } = useFeedTrip(tripId)

  // Format time without seconds
  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  // Group activities by date (only dates with activities)
  const activitiesByDate = useMemo(() => {
    if (!trip?.activities) return {}
    const grouped: Record<string, Activity[]> = {}

    trip.activities.forEach((activity) => {
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
  }, [trip?.activities])

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Trip not found</h2>
          <p className="text-gray-600 mb-4">This trip may not be published or doesn't exist.</p>
          <Link to="/" className="text-indigo-600 hover:text-indigo-700">
            ← Back to Feed
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back link */}
        <Link
          to="/"
          className="text-indigo-600 hover:text-indigo-700 mb-6 inline-block"
        >
          ← Back to Feed
        </Link>

        {/* Cover Image */}
        {trip.coverImage && (
          <img
            src={trip.coverImage}
            alt={trip.title}
            className="w-full h-72 object-cover rounded-xl mb-6"
          />
        )}

        {/* Trip Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{trip.title}</h1>
            {trip.shareToken && (
              <Link
                to={`/share/${trip.shareToken}`}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm flex items-center gap-2 flex-shrink-0"
              >
                <span>📥</span>
                View & Import
              </Link>
            )}
          </div>

          {/* Author info */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
            {trip.owner.avatarUrl ? (
              <img
                src={trip.owner.avatarUrl}
                alt={trip.owner.name}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-indigo-600 font-medium">
                  {trip.owner.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900">{trip.owner.name}</p>
              {trip.publishedAt && (
                <p className="text-sm text-gray-500">
                  Published {new Date(trip.publishedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* Trip body/description */}
          {trip.body && (
            <div className="prose prose-gray max-w-none mb-4">
              <p className="text-gray-700 whitespace-pre-wrap">{trip.body}</p>
            </div>
          )}

          {trip.description && !trip.body && (
            <p className="text-gray-600 mb-4">{trip.description}</p>
          )}

          {/* Trip meta */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <span>📅</span>
              <span>
                {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span>📍</span>
              <span>{trip.activities.length} activities</span>
            </div>
            <div className="flex items-center gap-1 capitalize">
              <span>🏷️</span>
              <span>{trip.status}</span>
            </div>
          </div>
        </div>

        {/* Itinerary */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Itinerary</h2>

          {datesWithActivities.length > 0 ? (
            <div className="space-y-8">
              {datesWithActivities.map((date) => (
                <div key={date}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    {formatDate(date)}
                  </h3>
                  <div className="space-y-4">
                    {activitiesByDate[date].map((activity) => (
                      <div
                        key={activity.id}
                        className="bg-gray-50 rounded-lg p-4"
                      >
                        <h4 className="font-semibold text-gray-900 mb-2">
                          {activity.title}
                        </h4>

                        {(activity.startTime || activity.endTime) && (
                          <p className="text-sm text-gray-600 mb-2">
                            🕐 {formatTime(activity.startTime)} - {formatTime(activity.endTime)}
                          </p>
                        )}

                        {activity.locationName && (
                          <p className="text-sm text-gray-600 mb-2">
                            📍 {activity.locationName}
                            {activity.address && (
                              <span className="text-gray-500"> - {activity.address}</span>
                            )}
                          </p>
                        )}

                        {/* Activity body for feed */}
                        {activity.body && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-gray-700 whitespace-pre-wrap">{activity.body}</p>
                          </div>
                        )}

                        {/* Notes (if no body) */}
                        {!activity.body && activity.notes && (
                          <p className="text-sm text-gray-600 mt-2">{activity.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No activities in this trip yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

