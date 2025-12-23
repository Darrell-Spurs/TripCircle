import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useFeed } from '../hooks/useFeed'
import { useLanguage } from '../context/LanguageContext'

export default function Feed() {
  const { t, language } = useLanguage()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Get initial values from URL or defaults
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10))
  // Separate input value (for immediate UI feedback) from actual search query (for API calls)
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '')
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '')
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '')
  
  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  const { data, isLoading } = useFeed({ page, limit: 20, q: query || undefined, startDate: startDate || undefined, endDate: endDate || undefined })

  // Reset page when filters change (but not when page itself changes)
  useEffect(() => {
    setPage(1)
  }, [query, startDate, endDate])

  // Sync URL params when state changes
  useEffect(() => {
    const params = new URLSearchParams()
    if (page > 1) params.set('page', page.toString())
    if (query) params.set('q', query)
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    setSearchParams(params, { replace: true })
  }, [page, query, startDate, endDate, setSearchParams])

  // Debounce search input: update actual query after user stops typing
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new timer to update query after 500ms of no typing
    debounceTimerRef.current = setTimeout(() => {
      setQuery(searchInput)
      setPage(1)
    }, 500)

    // Cleanup on unmount or when searchInput changes
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchInput])

  const handleSearch = (searchTerm: string) => {
    setSearchInput(searchTerm)
    // Don't update query immediately - let debounce handle it
  }

  const handleClearFilters = () => {
    setSearchInput('')
    setQuery('')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  const handleLocationClick = (locationName: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleSearch(locationName)
  }

  const handleSearchInExplore = (locationName: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    navigate(`/explore?keyword=${encodeURIComponent(locationName)}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">{t.common.loading}</div>
      </div>
    )
  }

  const hasActiveFilters = query || startDate || endDate

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t.feed.discoverTrips}</h1>
          <p className="text-gray-600 mt-2">{t.feed.exploreDescription}</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                {t.common.search}
              </label>
              <input
                id="search"
                type="text"
                value={searchInput}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={t.feed.searchPlaceholder || t.common.search}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                {t.feed.startDate || 'Start Date'}
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                {t.feed.endDate || 'End Date'}
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          {hasActiveFilters && (
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={handleClearFilters}
                className="text-sm text-indigo-600 hover:text-indigo-700 underline"
              >
                {t.feed.clearFilters || 'Clear Filters'}
              </button>
              {data?.appliedFilters && (
                <span className="text-sm text-gray-500">
                  {t.feed.filtersApplied || 'Filters applied'}
                </span>
              )}
            </div>
          )}
        </div>

        {!data || data.trips.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🌍</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              {hasActiveFilters ? (t.feed.noResults || 'No trips found') : t.feed.noTripsYet}
            </h2>
            <p className="text-gray-500 mb-4">
              {hasActiveFilters
                ? t.feed.tryDifferentFilters || 'Try adjusting your search or filters'
                : t.feed.beFirstToShare}
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                {t.feed.clearFilters || 'Clear Filters'}
              </button>
            )}
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
                    {/* Cover Image - use feedCoverImage (includes album photos) */}
                    {trip.feedCoverImage ? (
                      <img
                        src={trip.feedCoverImage}
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
                            {trip.activitiesPreview.slice(0, 3).map((activity) => {
                              const locationName = activity.locationName || activity.title
                              return (
                                <div
                                  key={activity.id}
                                  className="inline-flex items-center gap-1 group"
                                >
                                  <button
                                    onClick={(e) => handleLocationClick(locationName, e)}
                                    className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-indigo-100 hover:text-indigo-700 transition cursor-pointer"
                                    title={t.feed.filterByLocation || `Filter by ${locationName}`}
                                  >
                                    📍 {locationName}
                                  </button>
                                  <button
                                    onClick={(e) => handleSearchInExplore(locationName, e)}
                                    className="opacity-0 group-hover:opacity-100 inline-flex items-center px-1.5 py-0.5 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition"
                                    title={t.feed.searchInExplore || `Search ${locationName} in Explore`}
                                  >
                                    🔍
                                  </button>
                                </div>
                              )
                            })}
                            {trip.activitiesCount > 3 && (
                              <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                                +{trip.activitiesCount - 3} {t.feed.moreActivities}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Date range */}
                      <div className="text-xs text-gray-500 mb-3">
                        {new Date(trip.startDate).toLocaleDateString(language === 'zh-TW' ? 'zh-TW' : 'en-US')} - {new Date(trip.endDate).toLocaleDateString(language === 'zh-TW' ? 'zh-TW' : 'en-US')}
                      </div>

                      {/* Author and Stats */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2">
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
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                          {trip.publicPhotosCount > 0 && (
                            <div className="flex items-center gap-1">
                              <span>📷</span>
                              <span>{trip.publicPhotosCount}</span>
                            </div>
                          )}
                          {trip.commentsCount > 0 && (
                            <div className="flex items-center gap-1">
                              <span>💬</span>
                              <span>{trip.commentsCount}</span>
                            </div>
                          )}
                        </div>
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
                  {t.feed.previous}
                </button>
                <span className="px-4 py-2 text-gray-600">
                  {t.feed.page} {page} {t.feed.of} {data.pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={page === data.pagination.totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.feed.next}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

