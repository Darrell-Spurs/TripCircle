import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useLocationFolders } from '../hooks/useLocationFolders'
import { SavedLocation } from '../types'

interface LocationSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (location: SavedLocation) => void
}

export default function LocationSelectorModal({
  isOpen,
  onClose,
  onSelect,
}: LocationSelectorModalProps) {
  const { t } = useLanguage()
  const { data: folders, isLoading } = useLocationFolders(true)

  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null)

  const selectedFolder = folders?.find((f) => f.id === selectedFolderId)
  const locations = selectedFolder?.locations || []

  if (!isOpen) return null

  const handleSelectLocation = (location: SavedLocation) => {
    onSelect(location)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">📁 {t.locationFolders.selectLocations}</h2>

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

        {/* Locations List */}
        {selectedFolderId && locations.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.locationFolders.selectLocations}
            </label>
            <div className="border border-gray-200 rounded-md max-h-64 overflow-y-auto">
              {locations.map((location) => (
                <button
                  key={location.id}
                  type="button"
                  onClick={() => handleSelectLocation(location)}
                  className="w-full text-left p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition"
                >
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
                </button>
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
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            {t.common.cancel}
          </button>
        </div>
      </div>
    </div>
  )
}

