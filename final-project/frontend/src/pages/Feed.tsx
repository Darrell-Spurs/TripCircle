import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useFeed } from '../hooks/useFeed'

export default function Feed() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useFeed(page, 20)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Discover Trips</h1>
          <p className="text-gray-600 mt-2">Explore travel experiences shared by the community</p>
        </div>

        {!data || data.trips.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🌍</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No trips yet</h2>
            <p className="text-gray-500">Be the first to share your travel experience!</p>
          </div>
        ) : (
          <>
            {/* Masonry-style grid */}
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
              {data.trips.map((trip) => (
                <Link
                  key={trip.id}
                  to={`/feed/${trip.id}`}
                  className="block break-inside-avoid"
                >
                  <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden">
                    {/* Cover Image */}
                    {trip.coverImage ? (
                      <img
                        src={trip.coverImage}
                        alt={trip.title}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                        <span className="text-4xl">✈️</span>
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                        {trip.title}
                      </h3>

                      {trip.body && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                          {trip.body}
                        </p>
                      )}

                      {/* Activities preview */}
                      {trip.activitiesPreview.length > 0 && (
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-1">
                            {trip.activitiesPreview.slice(0, 3).map((activity) => (
                              <span
                                key={activity.id}
                                className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                              >
                                📍 {activity.locationName || activity.title}
                              </span>
                            ))}
                            {trip.activitiesCount > 3 && (
                              <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                                +{trip.activitiesCount - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Date range */}
                      <div className="text-xs text-gray-500 mb-3">
                        {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                      </div>

                      {/* Author */}
                      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                        {trip.owner.avatarUrl ? (
                          <img
                            src={trip.owner.avatarUrl}
                            alt={trip.owner.name}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-indigo-600 text-xs font-medium">
                              {trip.owner.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="text-sm text-gray-700">{trip.owner.name}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {data.pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-600">
                  Page {page} of {data.pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={page === data.pagination.totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

