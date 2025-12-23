import { useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useLocationFolders } from '../hooks/useLocationFolders'
import { useCreateActivity } from '../hooks/useActivities'

interface ImportLocationModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: number
  defaultDate?: string
  onSuccess?: () => void
}

export default function ImportLocationModal({
  isOpen,
  onClose,
  tripId,
  defaultDate,
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
      const dateObj = new Date(selectedDate + 'T00:00:00.000Z')

      // Create activities for each selected location
      for (let i = 0; i < locationsToImport.length; i++) {
        await createActivity.mutateAsync({
          tripId,
          date: dateObj.toISOString(),
          title: locationsToImport[i].name,
          locationName: locationsToImport[i].name,
          address: locationsToImport[i].address,
          lat: locationsToImport[i].lat,
          lng: locationsToImport[i].lng,
          placeId: locationsToImport[i].placeId,
          notes: locationsToImport[i].notes || undefined,
          orderIndex: i,
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

