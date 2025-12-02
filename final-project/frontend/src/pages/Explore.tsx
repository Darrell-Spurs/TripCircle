import { useState, useEffect } from 'react'
import { useSearchPlaces, Place } from '../hooks/usePlaces'
import { useTrips } from '../hooks/useTrips'
import { useCreateActivity } from '../hooks/useActivities'
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api'
import { useNavigate, Link } from 'react-router-dom'
import { trackEvent } from '../lib/amplitude'
import { useAuth } from '../context/AuthContext'

const mapContainerStyle = {
  width: '100%',
  height: '400px',
}

const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194,
}

export default function Explore() {
  const navigate = useNavigate()
  const { isGuest } = useAuth()
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  
  const { data: trips } = useTrips()
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
      await createActivity.mutateAsync({
        tripId: selectedTripId,
        date: new Date(selectedDate).toISOString(),
        title: selectedPlace.name,
        locationName: selectedPlace.name,
        address: selectedPlace.address,
        lat: selectedPlace.lat,
        lng: selectedPlace.lng,
        placeId: selectedPlace.placeId,
        orderIndex: 0,
      })
      setShowAddModal(false)
      setSelectedPlace(null)
      alert('Activity added to trip!')
      navigate(`/trips/${selectedTripId}`)
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to add activity')
    }
  }

  const mapCenter = places && places.length > 0
    ? { lat: places[0].lat, lng: places[0].lng }
    : defaultCenter

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Explore Places</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Keyword
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g., museums, restaurants, parks"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location (optional)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., San Francisco, CA"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-8">
            <p className="text-gray-600">Searching...</p>
          </div>
        )}

        {places && places.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Results</h2>
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
                      Add to Trip
                    </button>
                  )}
                  {isGuest && (
                    <p className="mt-2 text-xs text-gray-500">
                      <Link to="/auth/login" className="text-indigo-600 hover:underline">
                        Login
                      </Link> to add to trips
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-xl font-semibold mb-4">Map</h2>
              {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
                <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={mapCenter}
                    zoom={13}
                  >
                    {places.map((place) => (
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
                </LoadScript>
              ) : (
                <div className="flex items-center justify-center h-96 bg-gray-100 rounded">
                  <p className="text-gray-500">Google Maps API key not configured</p>
                </div>
              )}
            </div>
          </div>
        )}

        {places && places.length === 0 && keyword && !isLoading && (
          <div className="text-center py-8">
            <p className="text-gray-600">No places found. Try a different search.</p>
          </div>
        )}

        {showAddModal && selectedPlace && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-4">Add to Trip</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Trip
                  </label>
                  <select
                    value={selectedTripId || ''}
                    onChange={(e) => setSelectedTripId(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Choose a trip...</option>
                    {trips?.map((trip) => (
                      <option key={trip.id} value={trip.id}>
                        {trip.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleAddToTrip}
                    disabled={!selectedTripId || !selectedDate || createActivity.isPending}
                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {createActivity.isPending ? 'Adding...' : 'Add'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddModal(false)
                      setSelectedPlace(null)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
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
