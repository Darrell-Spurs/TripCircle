import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'

interface TransportationTimeEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (startTime: string, endTime: string) => void
  onReset: () => void
  currentStartTime?: string
  currentEndTime?: string
  hasManualOverride: boolean
}

export default function TransportationTimeEditor({
  isOpen,
  onClose,
  onSave,
  onReset,
  currentStartTime,
  currentEndTime,
  hasManualOverride,
}: TransportationTimeEditorProps) {
  const { t, language } = useLanguage()
  const [startTime, setStartTime] = useState(() => {
    if (currentStartTime) {
      const date = new Date(currentStartTime)
      const locale = language === 'zh-TW' ? 'zh-TW' : 'en-US'
      return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false })
    }
    return ''
  })
  const [endTime, setEndTime] = useState(() => {
    if (currentEndTime) {
      const date = new Date(currentEndTime)
      const locale = language === 'zh-TW' ? 'zh-TW' : 'en-US'
      return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false })
    }
    return ''
  })

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate that end time is after start time
    if (startTime && endTime) {
      const [startH, startM] = startTime.split(':').map(Number)
      const [endH, endM] = endTime.split(':').map(Number)
      const startMinutes = startH * 60 + startM
      const endMinutes = endH * 60 + endM
      
      if (endMinutes <= startMinutes) {
        alert(t.route.endTimeAfterStart || 'End time must be after start time')
        return
      }
    }
    
    onSave(startTime, endTime)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">
          {t.route.editTransportationTime || 'Edit Transportation Time'}
        </h2>
        
        {hasManualOverride && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              {t.route.manualOverrideActive || 'Manual override is active'}
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.activity.startTime}
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                step="60"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.activity.endTime}
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                step="60"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              {t.common.save}
            </button>
            {hasManualOverride && (
              <button
                type="button"
                onClick={onReset}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                {t.route.resetToAuto || 'Reset to Auto'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              {t.common.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

