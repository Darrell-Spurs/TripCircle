import { useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useLocationFolders } from '../hooks/useLocationFolders'
import { useCreateActivity } from '../hooks/useActivities'
import { Activity } from '../types'
import api from '../lib/api'

interface ImportLocationModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: number
  defaultDate?: string
  existingActivities?: Activity[]
  onSuccess?: () => void
}

export default function ImportLocationModal({
  isOpen,
  onClose,
  tripId,
  defaultDate,
  existingActivities = [],
  onSuccess,
}: ImportLocationModalProps) {
  const { t } = useLanguage()
  const { data: folders, isLoading } = useLocationFolders(true)
  const createActivity = useCreateActivity()

  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null)
  const [selectedLocations, setSelectedLocations] = useState<Set<number>>(new Set())
  const [selectedDate, setSelectedDate] = useState(defaultDate || '')
  const [isImporting, setIsImporting] = useState(false)

  const selectedFolder = folders?.find((f) => f.id === selectedFolderId)
  const locations = selectedFolder?.locations || []

  useEffect(() => {
    if (defaultDate) {
      setSelectedDate(defaultDate)
    }
  }, [defaultDate])

  const handleToggleLocation = (locationId: number) => {
    const newSelected = new Set(selectedLocations)
    if (newSelected.has(locationId)) {
      newSelected.delete(locationId)
    } else {
      newSelected.add(locationId)
    }
    setSelectedLocations(newSelected)
  }

  const handleSelectAll = () => {
    if (locations.length === 0) return
    if (selectedLocations.size === locations.length) {
      setSelectedLocations(new Set())
    } else {
      setSelectedLocations(new Set(locations.map((loc) => loc.id)))
    }
  }

  const handleImport = async () => {
    if (!selectedFolderId || selectedLocations.size === 0 || !selectedDate) {
      alert(t.locationFolders.noLocationsSelected)
      return
    }

    setIsImporting(true)
    try {
      const locationsToImport = locations.filter((loc) => selectedLocations.has(loc.id))
      const dateObj = new Date(selectedDate + 'T00:00:00.000')

      // Get existing activities for this date, sorted by orderIndex
      const existingForDate = existingActivities
        .filter((a) => {
          const activityDate = new Date(a.date).toISOString().split('T')[0]
          return activityDate === selectedDate
        })
        .sort((a, b) => a.orderIndex - b.orderIndex)

      // Calculate start times for each imported location
      // Start time = previous activity's end time + transportation time + 1 minute
      let currentStartTime: Date | null = null
      
      // If there are existing activities, use the last one's end time
      if (existingForDate.length > 0) {
        const lastActivity = existingForDate[existingForDate.length - 1]
        if (lastActivity.endTime) {
          currentStartTime = new Date(lastActivity.endTime)
        } else if (lastActivity.startTime) {
          // If no end time, estimate 1 hour duration
          currentStartTime = new Date(new Date(lastActivity.startTime).getTime() + 60 * 60 * 1000)
        }
      }

      // Create activities for each selected location
      for (let i = 0; i < locationsToImport.length; i++) {
        const location = locationsToImport[i]
        let startTime: string | undefined = undefined

        // Calculate start time if we have a previous activity
        if (currentStartTime && i === 0 && existingForDate.length > 0) {
          // First imported location: calculate transportation time from last existing activity
          const lastActivity = existingForDate[existingForDate.length - 1]
          if (
            lastActivity.lat &&
            lastActivity.lng &&
            location.lat &&
            location.lng
          ) {
            try {
              // Fetch directions to get transportation time
              const response = await api.get('/places/directions', {
                params: {
                  originLat: lastActivity.lat,
                  originLng: lastActivity.lng,
                  destLat: location.lat,
                  destLng: location.lng,
                  mode: 'driving',
                  departureTime: Math.floor(currentStartTime.getTime() / 1000).toString(),
                },
              })

              const durationValue = response.data.durationValue
              if (durationValue && typeof durationValue === 'number') {
                // Add transportation time + 1 minute buffer
                const transportTimeMs = (durationValue + 60) * 1000
                currentStartTime = new Date(currentStartTime.getTime() + transportTimeMs)
                startTime = currentStartTime.toISOString()
              } else {
                // Fallback: add 30 minutes if no duration
                currentStartTime = new Date(currentStartTime.getTime() + 30 * 60 * 1000)
                startTime = currentStartTime.toISOString()
              }
            } catch (error) {
              // Fallback: add 30 minutes if API call fails
              currentStartTime = new Date(currentStartTime.getTime() + 30 * 60 * 1000)
              startTime = currentStartTime.toISOString()
            }
          } else {
            // No coordinates, just add 1 minute
            currentStartTime = new Date(currentStartTime.getTime() + 60 * 1000)
            startTime = currentStartTime.toISOString()
          }
        } else if (currentStartTime && i > 0) {
          // Subsequent imported locations: calculate from previous imported location
          const prevLocation = locationsToImport[i - 1]
          if (
            prevLocation.lat &&
            prevLocation.lng &&
            location.lat &&
            location.lng
          ) {
            try {
              // Fetch directions to get transportation time
              const response = await api.get('/places/directions', {
                params: {
                  originLat: prevLocation.lat,
                  originLng: prevLocation.lng,
                  destLat: location.lat,
                  destLng: location.lng,
                  mode: 'driving',
                  departureTime: Math.floor(currentStartTime.getTime() / 1000).toString(),
                },
              })

              const durationValue = response.data.durationValue
              if (durationValue && typeof durationValue === 'number') {
                // Add transportation time + 1 minute buffer
                const transportTimeMs = (durationValue + 60) * 1000
                currentStartTime = new Date(currentStartTime.getTime() + transportTimeMs)
                startTime = currentStartTime.toISOString()
              } else {
                // Fallback: add 30 minutes if no duration
                currentStartTime = new Date(currentStartTime.getTime() + 30 * 60 * 1000)
                startTime = currentStartTime.toISOString()
              }
            } catch (error) {
              // Fallback: add 30 minutes if API call fails
              currentStartTime = new Date(currentStartTime.getTime() + 30 * 60 * 1000)
              startTime = currentStartTime.toISOString()
            }
          } else {
            // No coordinates, just add 1 minute
            currentStartTime = new Date(currentStartTime.getTime() + 60 * 1000)
            startTime = currentStartTime.toISOString()
          }
        }

        await createActivity.mutateAsync({
          tripId,
          date: dateObj.toISOString(),
          title: location.name,
          locationName: location.name,
          address: location.address,
          lat: location.lat,
          lng: location.lng,
          placeId: location.placeId,
          notes: location.notes || undefined,
          startTime,
          orderIndex: existingForDate.length + i,
        })
      }

      setSelectedFolderId(null)
      setSelectedLocations(new Set())
      setSelectedDate(defaultDate || '')
      onSuccess?.()
      onClose()
    } catch (error: any) {
      alert(error.response?.data?.detail || t.locationFolders.importFailed)
    } finally {
      setIsImporting(false)
    }
  }

  const handleClose = () => {
    setSelectedFolderId(null)
    setSelectedLocations(new Set())
    setSelectedDate(defaultDate || '')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">📁 {t.locationFolders.importFromFolder}</h2>

        {/* Folder Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.locationFolders.selectFolder} *
          </label>
          {isLoading ? (
            <div className="text-center py-4">{t.common.loading}</div>
          ) : folders && folders.length > 0 ? (
            <select
              value={selectedFolderId || ''}
              onChange={(e) => {
                setSelectedFolderId(parseInt(e.target.value))
                setSelectedLocations(new Set())
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">{t.locationFolders.selectFolder}</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name} ({folder.locationsCount || 0})
                </option>
              ))}
            </select>
          ) : (
            <div className="text-center py-4 text-gray-500">
              {t.locationFolders.noFoldersYet}
            </div>
          )}
        </div>

        {/* Date Selection */}
        {selectedFolderId && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.locationFolders.selectDate} *
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        )}

        {/* Locations List */}
        {selectedFolderId && locations.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                {t.locationFolders.selectLocations} ({selectedLocations.size}/{locations.length})
              </label>
              <button
                onClick={handleSelectAll}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                {selectedLocations.size === locations.length
                  ? t.activity.deselectAll
                  : t.activity.selectAll}
              </button>
            </div>
            <div className="border border-gray-200 rounded-md max-h-64 overflow-y-auto">
              {locations.map((location) => (
                <label
                  key={location.id}
                  className="flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={selectedLocations.has(location.id)}
                    onChange={() => handleToggleLocation(location.id)}
                    className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{location.name}</div>
                    <div className="text-sm text-gray-600">{location.address}</div>
                    {location.notes && (
                      <div className="text-sm text-gray-500 mt-1">{location.notes}</div>
                    )}
                    {location.tags && location.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {location.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {selectedFolderId && locations.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {t.locationFolders.noFoldersDescription}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={handleImport}
            disabled={
              !selectedFolderId ||
              selectedLocations.size === 0 ||
              !selectedDate ||
              isImporting ||
              createActivity.isPending
            }
            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isImporting || createActivity.isPending
              ? t.common.loading
              : t.locationFolders.importSelected}
          </button>
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            {t.common.cancel}
          </button>
        </div>
      </div>
    </div>
  )
}

