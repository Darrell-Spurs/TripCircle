import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useLocationFolders, useCreateLocationFolder } from '../hooks/useLocationFolders'
import { useSaveLocation } from '../hooks/useSavedLocations'
import { Place } from '../hooks/usePlaces'

interface LocationFolderSelectorProps {
  isOpen: boolean
  onClose: () => void
  place: Place
  onSuccess?: () => void
}

export default function LocationFolderSelector({
  isOpen,
  onClose,
  place,
  onSuccess,
}: LocationFolderSelectorProps) {
  const { t } = useLanguage()
  const { data: folders, isLoading } = useLocationFolders()
  const createFolder = useCreateLocationFolder()
  const saveLocation = useSaveLocation()

  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderDescription, setNewFolderDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  if (!isOpen) return null

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      const folder = await createFolder.mutateAsync({
        name: newFolderName.trim(),
        description: newFolderDescription.trim() || undefined,
        isPublic: false,
      })
      setSelectedFolderId(folder.id)
      setShowCreateForm(false)
      setNewFolderName('')
      setNewFolderDescription('')
    } catch (error: any) {
      alert(error.response?.data?.detail || t.locationFolders.folderCreated)
    }
  }

  const handleSave = async () => {
    if (!selectedFolderId) return

    setIsSaving(true)
    try {
      const tagsArray = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)

      await saveLocation.mutateAsync({
        folderId: selectedFolderId,
        data: {
          name: place.name,
          address: place.address,
          lat: place.lat,
          lng: place.lng,
          placeId: place.placeId,
          notes: notes.trim() || undefined,
          tags: tagsArray.length > 0 ? tagsArray : undefined,
        },
      })

      // Track recently used folder
      try {
        const stored = localStorage.getItem('recentLocationFolders')
        const recent = stored ? JSON.parse(stored) : []
        const filtered = recent.filter((id: number) => id !== selectedFolderId)
        const updated = [selectedFolderId, ...filtered].slice(0, 10)
        localStorage.setItem('recentLocationFolders', JSON.stringify(updated))
      } catch {
        // Ignore localStorage errors
      }

      setSelectedFolderId(null)
      setNotes('')
      setTags('')
      onSuccess?.()
      onClose()
    } catch (error: any) {
      alert(error.response?.data?.detail || t.locationFolders.locationSaved)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    setSelectedFolderId(null)
    setShowCreateForm(false)
    setNewFolderName('')
    setNewFolderDescription('')
    setNotes('')
    setTags('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">📁 {t.locationFolders.saveToFolder}</h2>

        {/* Place Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-lg mb-1">{place.name}</h3>
          <p className="text-sm text-gray-600">{place.address}</p>
        </div>

        {/* Create New Folder */}
        {showCreateForm ? (
          <div className="mb-4 space-y-3 p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium">{t.locationFolders.createNewFolder}</h3>
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
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || createFolder.isPending}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {createFolder.isPending ? t.common.loading : t.common.create}
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  setNewFolderName('')
                  setNewFolderDescription('')
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                {t.common.cancel}
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                {t.locationFolders.selectFolder} *
              </label>
              <button
                onClick={() => setShowCreateForm(true)}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                + {t.locationFolders.createNewFolder}
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-4">{t.common.loading}</div>
            ) : folders && folders.length > 0 ? (
              <select
                value={selectedFolderId || ''}
                onChange={(e) => setSelectedFolderId(parseInt(e.target.value))}
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
                <p className="mb-2">{t.locationFolders.noFoldersYet}</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="text-indigo-600 hover:text-indigo-700 text-sm"
                >
                  {t.locationFolders.createFirstFolder}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Notes and Tags (only if folder selected) */}
        {selectedFolderId && !showCreateForm && (
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.locationFolders.addNotes} ({t.photos.optional})
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.locationFolders.notesPlaceholder}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.locationFolders.addTags} ({t.photos.optional})
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder={t.locationFolders.tagsPlaceholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={handleSave}
            disabled={!selectedFolderId || isSaving || saveLocation.isPending}
            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving || saveLocation.isPending
              ? t.common.loading
              : t.locationFolders.saveToFolder}
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

