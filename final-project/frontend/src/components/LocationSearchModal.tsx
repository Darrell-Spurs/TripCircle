import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useSearchPlaces, Place } from '../hooks/usePlaces'

interface LocationSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (formattedText: string) => void
}

export default function LocationSearchModal({
  isOpen,
  onClose,
  onSelect,
}: LocationSearchModalProps) {
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Search places when debounced query changes
  const { data: places, isLoading } = useSearchPlaces(
    { keyword: debouncedQuery },
    debouncedQuery.length > 0
  )

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
      setDebouncedQuery('')
    }
  }, [isOpen])

  const handleSelectPlace = (place: Place) => {
    // Format: [Location Name](Google Maps Link)
    // 優先使用 place_id（能顯示地點資訊）
    let googleMapsUrl = ''
    if (place.placeId) {
      // 使用新格式（適用於移動設備和桌面）
      googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.placeId}`
    } else if (place.lat && place.lng) {
      // 如果沒有 place_id，使用座標作為備選
      googleMapsUrl = `https://www.google.com/maps/?q=${place.lat},${place.lng}`
    } else if (place.address) {
      googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`
    }
    
    const formattedText = `[${place.name}](${googleMapsUrl})`
    onSelect(formattedText)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-md w-full max-h-[80vh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              📍 {t.comment?.addLocation || 'Add Location'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.comment?.searchLocationPlaceholder || 'Search for a location...'}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {!debouncedQuery ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🔍</div>
              <p>{t.comment?.searchLocationHint || 'Start typing to search for locations'}</p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-8 text-gray-500">
              {t.common.loading}
            </div>
          ) : places && places.length > 0 ? (
            <div className="space-y-2">
              {places.map((place) => (
                <button
                  key={place.placeId}
                  type="button"
                  onClick={() => handleSelectPlace(place)}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-gray-200 hover:border-indigo-300 transition cursor-pointer"
                >
                  <div className="font-medium text-gray-900">{place.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{place.address}</div>
                  {place.rating && (
                    <div className="text-xs text-gray-500 mt-1">
                      ⭐ {place.rating.toFixed(1)}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📍</div>
              <p>{t.comment?.noLocationsFound || 'No locations found'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

