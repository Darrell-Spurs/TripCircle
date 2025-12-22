import { useState, useRef } from 'react'
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
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const addPhoto = useAddTripPhoto()

  if (!isOpen) return null

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert(t.photos?.invalidFileType || 'Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert(t.photos?.fileTooLarge || 'File size must be less than 10MB')
      return
    }

    setSelectedFile(file)
    setPreviewError(false)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setFilePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const convertFileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        resolve(e.target?.result as string)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let imageUrl = url.trim()

      // If file upload method, convert file to data URL
      if (uploadMethod === 'file' && selectedFile) {
        imageUrl = await convertFileToDataUrl(selectedFile)
      }

      if (!imageUrl) {
        alert(t.photos?.imageRequired || 'Please provide an image URL or select a file')
        return
      }

      await addPhoto.mutateAsync({
        tripId,
        url: imageUrl,
        caption: caption.trim() || undefined,
        isPublic,
      })
      setUrl('')
      setCaption('')
      setIsPublic(false)
      setPreviewError(false)
      setSelectedFile(null)
      setFilePreview(null)
      setUploadMethod('url')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onClose()
    } catch (error: any) {
      alert(error.response?.data?.detail || t.photos?.addPhotoFailed || 'Failed to add photo')
    }
  }

  const handleUrlChange = (value: string) => {
    setUrl(value)
    setPreviewError(false)
  }

  const handleClose = () => {
    setUrl('')
    setCaption('')
    setIsPublic(false)
    setPreviewError(false)
    setSelectedFile(null)
    setFilePreview(null)
    setUploadMethod('url')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">📷 {t.photos?.addPhoto || 'Add Photo'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Upload Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.photos?.uploadMethod || 'Upload Method'} *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="uploadMethod"
                  value="url"
                  checked={uploadMethod === 'url'}
                  onChange={(e) => setUploadMethod(e.target.value as 'url' | 'file')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">{t.photos?.fromUrl || 'From URL'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="uploadMethod"
                  value="file"
                  checked={uploadMethod === 'file'}
                  onChange={(e) => setUploadMethod(e.target.value as 'url' | 'file')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">{t.photos?.fromDevice || 'From Device'}</span>
              </label>
            </div>
          </div>

          {/* URL Input */}
          {uploadMethod === 'url' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.photos?.imageUrl || 'Image URL'} *
              </label>
              <input
                type="url"
                required={uploadMethod === 'url'}
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          )}

          {/* File Input */}
          {uploadMethod === 'file' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.photos?.selectImage || 'Select Image'} *
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                required={uploadMethod === 'file'}
                onChange={handleFileSelect}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t.photos?.fileSizeLimit || 'Maximum file size: 10MB'}
              </p>
            </div>
          )}

          {/* Image Preview */}
          {(url || filePreview) && (
            <div className="border border-gray-200 rounded-lg p-2">
              <p className="text-sm text-gray-500 mb-2">{t.photos?.preview || 'Preview'}:</p>
              {previewError ? (
                <div className="h-40 bg-gray-100 rounded flex items-center justify-center text-gray-500">
                  {t.photos?.unableToLoadImage || 'Unable to load image'}
                </div>
              ) : (
                <img
                  src={filePreview || url}
                  alt="Preview"
                  className="max-h-48 w-full object-contain rounded"
                  onError={() => setPreviewError(true)}
                />
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.photos.caption} ({t.photos.optional})
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
              disabled={addPhoto.isPending || (uploadMethod === 'url' && !url.trim()) || (uploadMethod === 'file' && !selectedFile)}
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addPhoto.isPending ? (t.common?.loading || 'Adding...') : (t.photos?.addPhoto || 'Add Photo')}
            </button>
            <button
              type="button"
              onClick={handleClose}
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

