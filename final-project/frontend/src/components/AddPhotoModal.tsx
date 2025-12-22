import { useState } from 'react'
import { useAddTripPhoto } from '../hooks/useTripPhotos'
import { useLanguage } from '../context/LanguageContext'

interface AddPhotoModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: number
}

export default function AddPhotoModal({ isOpen, onClose, tripId }: AddPhotoModalProps) {
  const { t } = useLanguage()
  const [url, setUrl] = useState('')
  const [caption, setCaption] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [previewError, setPreviewError] = useState(false)
  const addPhoto = useAddTripPhoto()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await addPhoto.mutateAsync({
        tripId,
        url: url.trim(),
        caption: caption.trim() || undefined,
        isPublic,
      })
      setUrl('')
      setCaption('')
      setIsPublic(false)
      setPreviewError(false)
      onClose()
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to add photo')
    }
  }

  const handleUrlChange = (value: string) => {
    setUrl(value)
    setPreviewError(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">📷 {t.photos?.addPhoto || 'Add Photo'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.photos?.imageUrl || 'Image URL'} *
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Image Preview */}
          {url && (
            <div className="border border-gray-200 rounded-lg p-2">
              <p className="text-sm text-gray-500 mb-2">{t.photos?.preview || 'Preview'}:</p>
              {previewError ? (
                <div className="h-40 bg-gray-100 rounded flex items-center justify-center text-gray-500">
                  {t.photos?.unableToLoadImage || 'Unable to load image'}
                </div>
              ) : (
                <img
                  src={url}
                  alt="Preview"
                  className="max-h-48 w-full object-contain rounded"
                  onError={() => setPreviewError(true)}
                />
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.photos?.caption || 'Caption'} ({t.common?.optional || 'optional'})
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={t.photos?.captionPlaceholder || 'Add a caption for this photo...'}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="isPublic" className="text-sm text-gray-700">
              {t.photos?.makePublic || 'Make this photo public'}{' '}
              <span className="text-gray-500">
                ({t.photos?.publicDescription || 'Will appear in feed when trip is published'})
              </span>
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={addPhoto.isPending || !url.trim()}
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addPhoto.isPending ? (t.common?.loading || 'Adding...') : (t.photos?.addPhoto || 'Add Photo')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              {t.common?.cancel || 'Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

