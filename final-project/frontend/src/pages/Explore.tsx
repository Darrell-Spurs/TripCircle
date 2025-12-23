import { useState, useEffect, useRef } from 'react'
import { useSearchPlaces, Place } from '../hooks/usePlaces'
import { useTrips } from '../hooks/useTrips'
import { useCreateActivity } from '../hooks/useActivities'
import { GoogleMap, useLoadScript, InfoWindow, Marker } from '@react-google-maps/api'
import { useNavigate, Link } from 'react-router-dom'
import { trackEvent } from '../lib/amplitude'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import LocationFolderSelector from '../components/LocationFolderSelector'
import {
  useLocationFolders,
  useCreateLocationFolder,
  useUpdateLocationFolder,
  useDeleteLocationFolder,
} from '../hooks/useLocationFolders'
import { useDeleteSavedLocation, useUpdateSavedLocation } from '../hooks/useSavedLocations'
import { useCreateLocationFolderShareLink } from '../hooks/useLocationFolderShare'
import { LocationFolder, SavedLocation } from '../types'

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
  const [activeTab, setActiveTab] = useState<'search' | 'collections'>('search')
  
  // Search tab state
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const advancedMarkersRef = useRef<any[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSaveToFolderModal, setShowSaveToFolderModal] = useState(false)
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  // Collections tab state
  const { data: folders, isLoading: foldersLoading } = useLocationFolders(true)
  const createFolder = useCreateLocationFolder()
  const updateFolder = useUpdateLocationFolder()
  const deleteFolder = useDeleteLocationFolder()
  const deleteLocation = useDeleteSavedLocation()
  const updateLocation = useUpdateSavedLocation()
  const createShareLink = useCreateLocationFolderShareLink()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingFolder, setEditingFolder] = useState<LocationFolder | null>(null)
  const [editingLocation, setEditingLocation] = useState<SavedLocation | null>(null)
  const [viewingFolder, setViewingFolder] = useState<LocationFolder | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderDescription, setNewFolderDescription] = useState('')
  const [newFolderIsPublic, setNewFolderIsPublic] = useState(false)
  const [editNotes, setEditNotes] = useState('')
  const [editTags, setEditTags] = useState('')

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
      const dateObj = new Date(selectedDate + 'T00:00:00.000')
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

  // Collections tab handlers
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      await createFolder.mutateAsync({
        name: newFolderName.trim(),
        description: newFolderDescription.trim() || undefined,
        isPublic: newFolderIsPublic,
      })
      setShowCreateModal(false)
      setNewFolderName('')
      setNewFolderDescription('')
      setNewFolderIsPublic(false)
    } catch (error: any) {
      alert(error.response?.data?.detail || t.locationFolders.folderCreated)
    }
  }

  const handleUpdateFolder = async () => {
    if (!editingFolder || !newFolderName.trim()) return

    try {
      await updateFolder.mutateAsync({
        folderId: editingFolder.id,
        data: {
          name: newFolderName.trim(),
          description: newFolderDescription.trim() || undefined,
          isPublic: newFolderIsPublic,
        },
      })
      setEditingFolder(null)
      setNewFolderName('')
      setNewFolderDescription('')
      setNewFolderIsPublic(false)
    } catch (error: any) {
      alert(error.response?.data?.detail || t.locationFolders.folderUpdated)
    }
  }

  const handleDeleteFolder = async (folder: LocationFolder) => {
    if (!confirm(t.locationFolders.deleteFolderConfirm)) return

    try {
      await deleteFolder.mutateAsync(folder.id)
    } catch (error: any) {
      alert(error.response?.data?.detail || t.locationFolders.folderDeleted)
    }
  }

  const handleDeleteLocation = async (location: SavedLocation) => {
    if (!confirm(t.locationFolders.deleteLocationConfirm)) return

    try {
      await deleteLocation.mutateAsync({
        folderId: location.folderId,
        locationId: location.id,
      })
    } catch (error: any) {
      alert(error.response?.data?.detail || t.locationFolders.locationRemoved)
    }
  }

  const handleUpdateLocation = async () => {
    if (!editingLocation) return

    try {
      const tagsArray = editTags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)

      await updateLocation.mutateAsync({
        folderId: editingLocation.folderId,
        locationId: editingLocation.id,
        data: {
          notes: editNotes.trim() || undefined,
          tags: tagsArray.length > 0 ? tagsArray : undefined,
        },
      })
      setEditingLocation(null)
      setEditNotes('')
      setEditTags('')
    } catch (error: any) {
      alert(error.response?.data?.detail || t.locationFolders.locationUpdated)
    }
  }

  const handleStartEditLocation = (location: SavedLocation) => {
    setEditingLocation(location)
    setEditNotes(location.notes || '')
    setEditTags(location.tags?.join(', ') || '')
  }

  const handleStartEditFolder = (folder: LocationFolder) => {
    setEditingFolder(folder)
    setNewFolderName(folder.name)
    setNewFolderDescription(folder.description || '')
    setNewFolderIsPublic(folder.isPublic)
  }

  const handleViewFolder = (folder: LocationFolder) => {
    setViewingFolder(folder)
  }

  const handleCreateShareLink = async (folderId: number) => {
    try {
      const shareLink = await createShareLink.mutateAsync({
        folderId,
        data: { permission: 'view' },
      })
      const fullUrl = `${window.location.origin}/location-folders/shared/${shareLink.token}`
      navigator.clipboard.writeText(fullUrl)
      alert(t.share.linkCopied || t.locationFolders.shareLinkCreated || 'Link copied to clipboard!')
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to create share link')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{t.explore.title}</h1>
          {activeTab === 'collections' && !isGuest && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              + {t.locationFolders.createFolder}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'search'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🔍 {t.explore.search}
          </button>
          {!isGuest && (
            <button
              onClick={() => setActiveTab('collections')}
              className={`px-4 py-2 font-medium transition ${
                activeTab === 'collections'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📁 {t.locationFolders.myCollections}
            </button>
          )}
        </div>

        {/* Search Tab Content */}
        {activeTab === 'search' && (
          <>
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
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedPlace(place)
                          setShowAddModal(true)
                        }}
                        className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition"
                      >
                        {t.activity.addToTrip}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedPlace(place)
                          setShowSaveToFolderModal(true)
                        }}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition"
                      >
                        📁 {t.locationFolders.saveToFolder}
                      </button>
                    </div>
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
          </>
        )}

        {/* Collections Tab Content */}
        {activeTab === 'collections' && (
          <>
            {foldersLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">{t.common.loading}</p>
              </div>
            ) : !folders || folders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg shadow-md">
                <div className="text-6xl mb-4">📁</div>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">
                  {t.locationFolders.noFoldersYet}
                </h2>
                <p className="text-gray-500 mb-4">{t.locationFolders.noFoldersDescription}</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
                >
                  {t.locationFolders.createFirstFolder}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
                  >
                    <div className="p-4">
                      <h3 className="text-xl font-semibold mb-2">{folder.name}</h3>
                      {folder.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {folder.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                        <span>📍</span>
                        <span>
                          {folder.locationsCount || 0} {t.locationFolders.locations}
                        </span>
                        {folder.isPublic && (
                          <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                            {t.photos.public}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewFolder(folder)}
                          className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded text-center hover:bg-indigo-700 transition text-sm"
                        >
                          {t.common.view}
                        </button>
                        <button
                          onClick={() => handleStartEditFolder(folder)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition text-sm"
                          title={t.common.edit}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteFolder(folder)}
                          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
                          title={t.common.delete}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Create Folder Modal */}
            {showCreateModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                  <h2 className="text-2xl font-bold mb-4">{t.locationFolders.createFolder}</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.locationFolders.folderName} *
                      </label>
                      <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder={t.locationFolders.folderName}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.locationFolders.description} ({t.photos.optional})
                      </label>
                      <textarea
                        value={newFolderDescription}
                        onChange={(e) => setNewFolderDescription(e.target.value)}
                        placeholder={t.locationFolders.description}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="isPublic"
                        checked={newFolderIsPublic}
                        onChange={(e) => setNewFolderIsPublic(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isPublic" className="text-sm text-gray-700">
                        {t.locationFolders.isPublic}
                      </label>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={handleCreateFolder}
                        disabled={!newFolderName.trim() || createFolder.isPending}
                        className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                      >
                        {createFolder.isPending ? t.common.loading : t.common.create}
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateModal(false)
                          setNewFolderName('')
                          setNewFolderDescription('')
                          setNewFolderIsPublic(false)
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

            {/* Edit Folder Modal */}
            {editingFolder && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                  <h2 className="text-2xl font-bold mb-4">{t.common.edit}</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.locationFolders.folderName} *
                      </label>
                      <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.locationFolders.description} ({t.photos.optional})
                      </label>
                      <textarea
                        value={newFolderDescription}
                        onChange={(e) => setNewFolderDescription(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="editIsPublic"
                        checked={newFolderIsPublic}
                        onChange={(e) => setNewFolderIsPublic(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="editIsPublic" className="text-sm text-gray-700">
                        {t.locationFolders.isPublic}
                      </label>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={handleUpdateFolder}
                        disabled={!newFolderName.trim() || updateFolder.isPending}
                        className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                      >
                        {updateFolder.isPending ? t.common.loading : t.common.save}
                      </button>
                      <button
                        onClick={() => {
                          setEditingFolder(null)
                          setNewFolderName('')
                          setNewFolderDescription('')
                          setNewFolderIsPublic(false)
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

            {/* View Folder Modal */}
            {viewingFolder && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-bold">{viewingFolder.name}</h2>
                      {viewingFolder.description && (
                        <p className="text-gray-600 mt-1">{viewingFolder.description}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-2">
                        {viewingFolder.locationsCount || 0} {t.locationFolders.locations}
                      </p>
                    </div>
                    <button
                      onClick={() => setViewingFolder(null)}
                      className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  {viewingFolder.locations && viewingFolder.locations.length > 0 ? (
                    <div className="space-y-3">
                      {viewingFolder.locations.map((location) => (
                        <div
                          key={location.id}
                          className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{location.name}</h3>
                              <p className="text-sm text-gray-600">{location.address}</p>
                              {location.notes && (
                                <p className="text-sm text-gray-700 mt-2">{location.notes}</p>
                              )}
                              {location.tags && location.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {location.tags.map((tag, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => handleStartEditLocation(location)}
                                className="text-indigo-600 hover:text-indigo-700 p-1"
                                title={t.common.edit}
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteLocation(location)}
                                className="text-red-600 hover:text-red-700 p-1"
                                title={t.common.delete}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      {t.locationFolders.noFoldersDescription}
                    </div>
                  )}

                  <div className="flex gap-2 mt-6 pt-4 border-t">
                    {viewingFolder.isPublic ? (
                      <button
                        onClick={() => handleCreateShareLink(viewingFolder.id)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                      >
                        {t.locationFolders.share}
                      </button>
                    ) : (
                      <button
                        disabled
                        title={t.locationFolders.privateCollectionsCannotBeShared || 'Private collections cannot be shared. Make the collection public to share it.'}
                        className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed transition"
                      >
                        {t.locationFolders.share}
                      </button>
                    )}
                    <button
                      onClick={() => setViewingFolder(null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      {t.common.close}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Location Modal */}
            {editingLocation && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                  <h2 className="text-2xl font-bold mb-4">{t.common.edit}</h2>
                  <div className="mb-4">
                    <h3 className="font-semibold">{editingLocation.name}</h3>
                    <p className="text-sm text-gray-600">{editingLocation.address}</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.locationFolders.notes} ({t.photos.optional})
                      </label>
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder={t.locationFolders.notesPlaceholder}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.locationFolders.tags} ({t.photos.optional})
                      </label>
                      <input
                        type="text"
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                        placeholder={t.locationFolders.tagsPlaceholder}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={handleUpdateLocation}
                        disabled={updateLocation.isPending}
                        className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                      >
                        {updateLocation.isPending ? t.common.loading : t.common.save}
                      </button>
                      <button
                        onClick={() => {
                          setEditingLocation(null)
                          setEditNotes('')
                          setEditTags('')
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
          </>
        )}

        {showSaveToFolderModal && selectedPlace && (
          <LocationFolderSelector
            isOpen={showSaveToFolderModal}
            onClose={() => {
              setShowSaveToFolderModal(false)
              setSelectedPlace(null)
            }}
            place={selectedPlace}
            onSuccess={() => {
              setShowSuccess(true)
              setTimeout(() => setShowSuccess(false), 3000)
            }}
          />
        )}
      </div>
    </div>
  )
}
