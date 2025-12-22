import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'

const PREDEFINED_TAGS = [
  'Food',
  'Sightseeing',
  'Shopping',
  'Entertainment',
  'Transportation',
  'Accommodation',
  'Nature',
  'Culture',
  'Adventure',
  'Relaxation',
]

interface ActivityTagSelectorProps {
  selectedTags: string[]
  onChange: (tags: string[]) => void
}

export default function ActivityTagSelector({ selectedTags, onChange }: ActivityTagSelectorProps) {
  const { t } = useLanguage()
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const availablePredefinedTags = PREDEFINED_TAGS.filter((tag) => !selectedTags.includes(tag))

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      onChange([...selectedTags, trimmedTag])
      setInputValue('')
      setShowSuggestions(false)
    }
  }

  const handleRemoveTag = (tag: string) => {
    onChange(selectedTags.filter((t) => t !== tag))
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      handleAddTag(inputValue)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {t.activity.tags || 'Tags'}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleInputKeyDown}
          placeholder={t.activity.addTag || 'Add tag...'}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
        {showSuggestions && (availablePredefinedTags.length > 0 || inputValue.trim()) && (
          <div
            ref={suggestionsRef}
            className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto"
          >
            {inputValue.trim() && (
              <button
                type="button"
                onClick={() => handleAddTag(inputValue)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-100"
              >
                <span className="font-medium">{t.activity.createTag || 'Create'}: </span>
                {inputValue.trim()}
              </button>
            )}
            {availablePredefinedTags.length > 0 && (
              <>
                {inputValue.trim() && <div className="border-t border-gray-200" />}
                <div className="px-2 py-1 text-xs font-semibold text-gray-500">
                  {t.activity.predefinedTags || 'Predefined Tags'}
                </div>
                {availablePredefinedTags
                  .filter((tag) => tag.toLowerCase().includes(inputValue.toLowerCase()))
                  .map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddTag(tag)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    >
                      {tag}
                    </button>
                  ))}
              </>
            )}
          </div>
        )}
      </div>
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="text-indigo-600 hover:text-indigo-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

