import { useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useFeedTrip } from '../hooks/useFeed'
import { useLanguage } from '../context/LanguageContext'
import { Activity, FeedTripPhoto } from '../types'
import TripCommentsSection from '../components/TripCommentsSection'

export default function FeedTripDetail() {
  const { id } = useParams<{ id: string }>()
  const { t, language } = useLanguage()
  const navigate = useNavigate()
  const tripId = id ? parseInt(id) : 0
  const { data: trip, isLoading, error } = useFeedTrip(tripId)
  const [selectedPhoto, setSelectedPhoto] = useState<FeedTripPhoto | null>(null)

  // Format time without seconds
  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    const locale = language === 'zh-TW' ? 'zh-TW' : 'en-US'
    return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false })
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
    const locale = language === 'zh-TW' ? 'zh-TW' : 'en-US'
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">{t.common.loading}</div>
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{t.feed.tripNotFound}</h2>
          <p className="text-gray-600 mb-4">{t.feed.tripNotFoundDesc}</p>
          <Link to="/" className="text-indigo-600 hover:text-indigo-700">
            ← {t.feed.backToFeed}
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
          ← {t.feed.backToFeed}
        </Link>

        {/* Cover Image - use feedCoverImage (includes album photos) */}
        {trip.feedCoverImage ? (
          <img
            src={trip.feedCoverImage}
            alt={trip.title}
            className="w-full h-72 object-cover rounded-xl mb-6"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center rounded-xl mb-6">
            <span className="text-6xl">✈️</span>
          </div>
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
                {t.feed.viewAndImport}
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
                  {t.feed.published} {new Date(trip.publishedAt).toLocaleDateString(language === 'zh-TW' ? 'zh-TW' : 'en-US')}
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
                {new Date(trip.startDate).toLocaleDateString(language === 'zh-TW' ? 'zh-TW' : 'en-US')} - {new Date(trip.endDate).toLocaleDateString(language === 'zh-TW' ? 'zh-TW' : 'en-US')}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span>📍</span>
              <span>{trip.activities.length} {t.feed.activities}</span>
            </div>
            <div className="flex items-center gap-1 capitalize">
              <span>🏷️</span>
              <span>{trip.status}</span>
            </div>
          </div>
        </div>

        {/* Itinerary */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t.share.itinerary}</h2>

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
            <p className="text-gray-500 text-center py-8">{t.feed.noActivitiesInTrip}</p>
          )}
        </div>

        {/* Public Photos Gallery */}
        {trip.publicPhotos && trip.publicPhotos.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              📷 {t.photos?.tripPhotos || 'Trip Photos'} ({trip.publicPhotos.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {trip.publicPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-square cursor-pointer group overflow-hidden rounded-lg"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || 'Trip photo'}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  {photo.isFeedCover && (
                    <span className="absolute top-2 left-2 bg-indigo-500 text-white text-xs px-2 py-0.5 rounded-full">
                      ⭐ {t.photos?.cover || 'Cover'}
                    </span>
                  )}
                  {photo.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="text-white text-sm line-clamp-2">{photo.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photo Lightbox */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
            onClick={() => setSelectedPhoto(null)}
          >
            <button
              className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300"
              onClick={() => setSelectedPhoto(null)}
            >
              ×
            </button>
            <div className="max-w-4xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.caption || 'Trip photo'}
                className="max-w-full max-h-[80vh] object-contain"
              />
              {selectedPhoto.caption && (
                <p className="text-white text-center mt-4">{selectedPhoto.caption}</p>
              )}
              <p className="text-gray-400 text-sm text-center mt-2">
                {t.photos?.addedBy || 'Added by'} {selectedPhoto.addedBy.name}
              </p>
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div className="mt-6">
          <TripCommentsSection tripId={tripId} tripOwnerId={trip.owner.id} />
        </div>
      </div>
    </div>
  )
}

