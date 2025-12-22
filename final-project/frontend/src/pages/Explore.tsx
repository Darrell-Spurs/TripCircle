import { useState, useEffect, useRef } from 'react'
import { useSearchPlaces, Place } from '../hooks/usePlaces'
import { useTrips } from '../hooks/useTrips'
import { useCreateActivity } from '../hooks/useActivities'
import { GoogleMap, useLoadScript, InfoWindow, Marker } from '@react-google-maps/api'
import { useNavigate, Link } from 'react-router-dom'
import { trackEvent } from '../lib/amplitude'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

// Libraries for Google Maps - must be defined outside component to prevent re-renders
const GOOGLE_MAPS_LIBRARIES: ('marker')[] = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID ? ['marker'] : []

const mapContainerStyle = {
  width: '100%',
  height: '400px',
}

const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194,
}

const FIT_BOUNDS_PADDING = { top: 60, right: 60, bottom: 60, left: 60 } as any
const SINGLE_POINT_ZOOM = 14

export default function Explore() {
  const navigate = useNavigate()
  const { isGuest } = useAuth()
  const { t } = useLanguage()
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const advancedMarkersRef = useRef<any[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  // Load Google Maps script once at component mount (not conditionally)
  // This prevents the script from being unmounted/remounted when search results change
  const { isLoaded: isMapLoaded, loadError: mapLoadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES as any,
  })
  
  const { data: trips } = useTrips()
  
  // Get selected trip for date range restriction
  const selectedTrip = trips?.find(t => t.id === selectedTripId)
  
  // Reset date when trip changes
  useEffect(() => {
    if (selectedTripId && selectedTrip) {
      // Set default date to start date of trip
      // Use local date to avoid timezone issues
      const startDateObj = new Date(selectedTrip.startDate)
      const year = startDateObj.getFullYear()
      const month = String(startDateObj.getMonth() + 1).padStart(2, '0')
      const day = String(startDateObj.getDate()).padStart(2, '0')
      setSelectedDate(`${year}-${month}-${day}`)
    } else {
      setSelectedDate('')
    }
  }, [selectedTripId, selectedTrip])
  const { data: places, isLoading } = useSearchPlaces(
    { keyword, location },
    keyword.length > 0
  )
  const createActivity = useCreateActivity()

  useEffect(() => {
    if (keyword && places && places.length > 0) {
      trackEvent('explore_search', { keyword, location, resultCount: places.length })
    }
  }, [keyword, location, places])

  const handleAddToTrip = async () => {
    if (!selectedPlace || !selectedTripId || !selectedDate) return

    try {
      // Convert date to ISO format at midnight UTC to avoid timezone issues
      const dateObj = new Date(selectedDate + 'T00:00:00.000Z')
      await createActivity.mutateAsync({
        tripId: selectedTripId,
        date: dateObj.toISOString(),
        title: selectedPlace.name,
        locationName: selectedPlace.name,
        address: selectedPlace.address,
        lat: selectedPlace.lat,
        lng: selectedPlace.lng,
        placeId: selectedPlace.placeId,
        orderIndex: 0,
      })
      // Show success message
      setShowSuccess(true)
      // Close modal and navigate after a short delay
      setTimeout(() => {
        setShowAddModal(false)
        setSelectedPlace(null)
        setSelectedTripId(null)
        setSelectedDate('')
        setShowSuccess(false)
        navigate('/explore')
      }, 1500)
    } catch (error: any) {
      // Only show error if it's a real error (not a navigation issue)
      const errorMessage = error.response?.data?.detail || error.message || t.common.error
      if (!errorMessage.includes('navigate')) {
        alert(t.activity.addToTrip + ' ' + t.common.error + ': ' + errorMessage)
      }
    }
  }

  const mapCenter = places && places.length > 0
    ? { lat: places[0].lat, lng: places[0].lng }
    : defaultCenter

  // Auto-fit map to show all results (still nicely zoomed in)
  useEffect(() => {
    if (!mapInstance) return
    if (!places || places.length === 0) return

    const g: any = (globalThis as any).google
    if (!g?.maps?.LatLngBounds) return

    if (places.length === 1) {
      mapInstance.setCenter({ lat: places[0].lat, lng: places[0].lng })
      mapInstance.setZoom(SINGLE_POINT_ZOOM)
      return
    }

    const bounds = new g.maps.LatLngBounds()
    places.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }))
    mapInstance.fitBounds(bounds, FIT_BOUNDS_PADDING)
  }, [mapInstance, places])

  // Create advanced markers for search results
  useEffect(() => {
    if (!mapInstance) return

    const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID
    const useAdvancedMarkers = !!mapId
    if (!useAdvancedMarkers) return

    // clear old markers
    while (advancedMarkersRef.current.length) {
      const m = advancedMarkersRef.current.pop()
      try {
        m.map = null
      } catch {
        // ignore
      }
    }

    const g: any = (globalThis as any).google
    const AdvancedMarkerElement = g?.maps?.marker?.AdvancedMarkerElement
    if (!AdvancedMarkerElement) return

    places?.forEach((place) => {
      const marker = new AdvancedMarkerElement({
        map: mapInstance,
        position: { lat: place.lat, lng: place.lng },
      })
      if (typeof marker.addListener === 'function') {
        marker.addListener('gmp-click', (e: any) => {
          if (e?.domEvent?.stopPropagation) e.domEvent.stopPropagation()
          if (e?.domEvent?.preventDefault) e.domEvent.preventDefault()
          setSelectedPlace(place)
        })
      }
      advancedMarkersRef.current.push(marker)
    })

    return () => {
      while (advancedMarkersRef.current.length) {
        const m = advancedMarkersRef.current.pop()
        try {
          m.map = null
        } catch {
          // ignore
        }
      }
    }
  }, [mapInstance, places])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{t.explore.title}</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.explore.searchKeyword}
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={t.explore.searchPlaceholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.explore.location}
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t.explore.locationPlaceholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-8">
            <p className="text-gray-600">{t.explore.searching}</p>
          </div>
        )}

        {places && places.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">{t.explore.results}</h2>
              {places.map((place) => (
                <div
                  key={place.placeId}
                  className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition cursor-pointer"
                  onClick={() => setSelectedPlace(place)}
                >
                  <h3 className="font-semibold text-lg mb-2">{place.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{place.address}</p>
                  {place.rating && (
                    <p className="text-sm text-gray-500">⭐ {place.rating.toFixed(1)}</p>
                  )}
                  {!isGuest && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedPlace(place)
                        setShowAddModal(true)
                      }}
                      className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 transition"
                    >
                      {t.activity.addToTrip}
                    </button>
                  )}
                  {isGuest && (
                    <p className="mt-2 text-xs text-gray-500">
                      <Link to="/auth/login" className="text-indigo-600 hover:underline">
                        {t.nav.login}
                      </Link> {t.explore.loginToAdd}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-xl font-semibold mb-4">{t.explore.map}</h2>
              {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
                <div className="flex items-center justify-center h-96 bg-gray-100 rounded">
                  <p className="text-gray-500">{t.explore.googleMapsNotConfigured}</p>
                </div>
              ) : mapLoadError ? (
                <div className="flex items-center justify-center h-96 bg-gray-100 rounded">
                  <p className="text-red-500">Failed to load Google Maps</p>
                </div>
              ) : !isMapLoaded ? (
                <div className="flex items-center justify-center h-96 bg-gray-100 rounded">
                  <p className="text-gray-500">{t.common.loading}</p>
                </div>
              ) : (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={mapCenter}
                  zoom={13}
                  options={{
                    ...(import.meta.env.VITE_GOOGLE_MAPS_MAP_ID ? ({ mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID } as any) : {}),
                    clickableIcons: false,
                  } as any}
                  onLoad={(map) => {
                    setMapInstance(map)
                    // Force-disable POI clicks on the live map instance (extra safety)
                    map.setOptions({ clickableIcons: false })
                  }}
                  onUnmount={() => setMapInstance(null)}
                >
                  {/* Fallback markers when Map ID is not configured */}
                  {!import.meta.env.VITE_GOOGLE_MAPS_MAP_ID &&
                    places.map((place) => (
                      <Marker
                        key={place.placeId}
                        position={{ lat: place.lat, lng: place.lng }}
                        onClick={() => setSelectedPlace(place)}
                      />
                    ))}
                  {selectedPlace && (
                    <InfoWindow
                      position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
                      onCloseClick={() => setSelectedPlace(null)}
                    >
                      <div>
                        <h3 className="font-semibold">{selectedPlace.name}</h3>
                        <p className="text-sm">{selectedPlace.address}</p>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              )}
            </div>
          </div>
        )}

        {places && places.length === 0 && keyword && !isLoading && (
          <div className="text-center py-8">
            <p className="text-gray-600">{t.explore.noPlacesFound}</p>
          </div>
        )}

        {showAddModal && selectedPlace && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-4">{t.activity.addToTrip}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.activity.selectTrip}
                  </label>
                  <select
                    value={selectedTripId || ''}
                    onChange={(e) => setSelectedTripId(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">{t.activity.chooseTrip}</option>
                    {trips?.map((trip) => (
                      <option key={trip.id} value={trip.id}>
                        {trip.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.activity.date}
                    {selectedTrip && (
                      <span className="text-xs text-gray-500 ml-2">
                        ({new Date(selectedTrip.startDate).toLocaleDateString()} - {new Date(selectedTrip.endDate).toLocaleDateString()})
                      </span>
                    )}
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={selectedTrip ? (() => {
                      const start = new Date(selectedTrip.startDate)
                      const year = start.getFullYear()
                      const month = String(start.getMonth() + 1).padStart(2, '0')
                      const day = String(start.getDate()).padStart(2, '0')
                      return `${year}-${month}-${day}`
                    })() : undefined}
                    max={selectedTrip ? (() => {
                      const end = new Date(selectedTrip.endDate)
                      const year = end.getFullYear()
                      const month = String(end.getMonth() + 1).padStart(2, '0')
                      const day = String(end.getDate()).padStart(2, '0')
                      return `${year}-${month}-${day}`
                    })() : undefined}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  {showSuccess ? (
                    <div className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg flex items-center justify-center">
                      {t.common.createSuccess}
                    </div>
                  ) : (
                    <button
                      onClick={handleAddToTrip}
                      disabled={!selectedTripId || !selectedDate || createActivity.isPending}
                      className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                      {createActivity.isPending ? t.common.loading : t.activity.add}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowAddModal(false)
                      setSelectedPlace(null)
                      setSelectedTripId(null)
                      setSelectedDate('')
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    {t.common.cancel}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
