import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useTripPhotos, useUpdateTripPhoto, useDeleteTripPhoto, useSetFeedCover, useClearFeedCover } from '../hooks/useTripPhotos'
import { TripPhoto } from '../types'
import AddPhotoModal from './AddPhotoModal'

interface TripPhotosTabProps {
  tripId: number
  canEdit: boolean
}

export default function TripPhotosTab({ tripId, canEdit }: TripPhotosTabProps) {
  const { t } = useLanguage()
  const { data: photos, isLoading } = useTripPhotos(tripId)
  const updatePhoto = useUpdateTripPhoto()
  const deletePhoto = useDeleteTripPhoto()
  const setFeedCover = useSetFeedCover()
  const clearFeedCover = useClearFeedCover()
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<TripPhoto | null>(null)
  const [editingCaption, setEditingCaption] = useState<number | null>(null)
  const [captionText, setCaptionText] = useState('')

  const handleTogglePublic = async (photo: TripPhoto) => {
    try {
      await updatePhoto.mutateAsync({
        photoId: photo.id,
        tripId,
        isPublic: !photo.isPublic,
      })
    } catch (error) {
      console.error('Failed to update photo:', error)
    }
  }

  const handleSetFeedCover = async (photo: TripPhoto) => {
    try {
      await setFeedCover.mutateAsync({ tripId, photoId: photo.id })
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to set feed cover')
    }
  }

  const handleClearFeedCover = async () => {
    try {
      await clearFeedCover.mutateAsync(tripId)
    } catch (error) {
      console.error('Failed to clear feed cover:', error)
    }
  }

  const handleDelete = async (photo: TripPhoto) => {
    if (!confirm(t.photos?.deleteConfirm || 'Are you sure you want to delete this photo?')) {
      return
    }
    try {
      await deletePhoto.mutateAsync({ photoId: photo.id, tripId })
    } catch (error) {
      console.error('Failed to delete photo:', error)
    }
  }

  const handleStartEditCaption = (photo: TripPhoto) => {
    setEditingCaption(photo.id)
    setCaptionText(photo.caption || '')
  }

  const handleSaveCaption = async (photoId: number) => {
    try {
      await updatePhoto.mutateAsync({
        photoId,
        tripId,
        caption: captionText.trim() || undefined,
      })
      setEditingCaption(null)
      setCaptionText('')
    } catch (error) {
      console.error('Failed to update caption:', error)
    }
  }

  const handleCancelEditCaption = () => {
    setEditingCaption(null)
    setCaptionText('')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">{t.common?.loading || 'Loading...'}</div>
      </div>
    )
  }

  const publicPhotos = photos?.filter((p) => p.isPublic) || []
  const privatePhotos = photos?.filter((p) => !p.isPublic) || []
  const feedCover = photos?.find((p) => p.isFeedCover)

  return (
    <div className="space-y-6">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            📷 {t.photos?.albumTitle || 'Trip Album'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {photos?.length || 0} {t.photos?.photosCount || 'photos'}{' '}
            {publicPhotos.length > 0 && `(${publicPhotos.length} ${t.photos?.public || 'public'})`}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
          >
            <span>+</span>
            {t.photos?.addPhoto || 'Add Photo'}
          </button>
        )}
      </div>

      {/* Feed Cover Info */}
      {feedCover && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-center gap-4">
          <img
            src={feedCover.url}
            alt="Feed cover"
            className="w-16 h-16 object-cover rounded"
          />
          <div className="flex-1">
            <p className="font-medium text-indigo-900">
              ⭐ {t.photos?.feedCoverSelected || 'Feed Cover Selected'}
            </p>
            <p className="text-sm text-indigo-700">
              {t.photos?.feedCoverDescription || 'This photo will be displayed as the cover in the feed'}
            </p>
          </div>
          {canEdit && (
            <button
              onClick={handleClearFeedCover}
              className="text-indigo-600 hover:text-indigo-800 text-sm"
            >
              {t.photos?.clearFeedCover || 'Clear'}
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {(!photos || photos.length === 0) && (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <div className="text-6xl mb-4">📷</div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            {t.photos?.noPhotosYet || 'No photos yet'}
          </h3>
          <p className="text-gray-500 mb-4">
            {t.photos?.noPhotosDescription || 'Add photos to capture your trip memories'}
          </p>
          {canEdit && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              {t.photos?.addFirstPhoto || 'Add First Photo'}
            </button>
          )}
        </div>
      )}

      {/* Photo Grid */}
      {photos && photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition"
            >
              {/* Photo */}
              <div
                className="aspect-square cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  src={photo.url}
                  alt={photo.caption || 'Trip photo'}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Badges */}
              <div className="absolute top-2 left-2 flex gap-1">
                {photo.isPublic && (
                  <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {t.photos?.public || 'Public'}
                  </span>
                )}
                {photo.isFeedCover && (
                  <span className="bg-indigo-500 text-white text-xs px-2 py-0.5 rounded-full">
                    ⭐ {t.photos?.cover || 'Cover'}
                  </span>
                )}
              </div>

              {/* Actions overlay */}
              {canEdit && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTogglePublic(photo)
                    }}
                    className={`p-1.5 rounded-full ${
                      photo.isPublic
                        ? 'bg-green-500 text-white'
                        : 'bg-white text-gray-600'
                    } shadow hover:scale-110 transition`}
                    title={photo.isPublic ? 'Make private' : 'Make public'}
                  >
                    {photo.isPublic ? '🔓' : '🔒'}
                  </button>
                  {photo.isPublic && !photo.isFeedCover && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSetFeedCover(photo)
                      }}
                      className="p-1.5 rounded-full bg-white text-gray-600 shadow hover:scale-110 transition"
                      title="Set as feed cover"
                    >
                      ⭐
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(photo)
                    }}
                    className="p-1.5 rounded-full bg-white text-red-500 shadow hover:scale-110 transition"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              )}

              {/* Caption */}
              <div className="p-2">
                {editingCaption === photo.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={captionText}
                      onChange={(e) => setCaptionText(e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveCaption(photo.id)}
                        className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                      >
                        {t.common?.save || 'Save'}
                      </button>
                      <button
                        onClick={handleCancelEditCaption}
                        className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        {t.common?.cancel || 'Cancel'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`text-sm ${photo.caption ? 'text-gray-700' : 'text-gray-400 italic'} ${
                      canEdit ? 'cursor-pointer hover:text-indigo-600' : ''
                    }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (canEdit) handleStartEditCaption(photo)
                    }}
                  >
                    {photo.caption || (canEdit ? (t.photos?.addCaption || 'Add caption...') : '')}
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-1">
                  {t.photos?.addedBy || 'Added by'} {photo.addedBy.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300"
            onClick={() => setSelectedPhoto(null)}
          >
            ×
          </button>
          <div className="max-w-4xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.caption || 'Trip photo'}
              className="max-w-full max-h-[80vh] object-contain"
            />
            {selectedPhoto.caption && (
              <p className="text-white text-center mt-4">{selectedPhoto.caption}</p>
            )}
          </div>
        </div>
      )}

      {/* Add Photo Modal */}
      <AddPhotoModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        tripId={tripId}
      />
    </div>
  )
}

