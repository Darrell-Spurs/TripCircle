import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import {
  useLocationFolders,
  useCreateLocationFolder,
  useUpdateLocationFolder,
  useDeleteLocationFolder,
} from '../hooks/useLocationFolders'
import { useDeleteSavedLocation, useUpdateSavedLocation } from '../hooks/useSavedLocations'
import { useCreateLocationFolderShareLink } from '../hooks/useLocationFolderShare'
import { LocationFolder, SavedLocation } from '../types'

export default function LocationFolders() {
  const { t } = useLanguage()
  const { data: folders, isLoading } = useLocationFolders(true)
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
      alert(t.locationFolders.shareLinkCreated + ': ' + fullUrl)
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to create share link')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">{t.common.loading}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{t.locationFolders.myCollections}</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            + {t.locationFolders.createFolder}
          </button>
        </div>

        {!folders || folders.length === 0 ? (
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
                <button
                  onClick={() => handleCreateShareLink(viewingFolder.id)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  {t.locationFolders.share}
                </button>
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
      </div>
    </div>
  )
}

