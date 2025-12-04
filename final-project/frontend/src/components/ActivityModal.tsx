import { useState, useEffect } from 'react'
import { Activity, CreateActivityData, UpdateActivityData } from '../types'
import { useLanguage } from '../context/LanguageContext'

interface ActivityModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: CreateActivityData | UpdateActivityData) => Promise<void>
  activity?: Activity
  tripId: number
  date: string
  defaultOrderIndex: number
}

export default function ActivityModal({
  isOpen,
  onClose,
  onSave,
  activity,
  tripId,
  date,
  defaultOrderIndex,
}: ActivityModalProps) {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    title: '',
    notes: '',
    startTime: '',
    endTime: '',
    locationName: '',
    address: '',
    noTime: false,
  })

  useEffect(() => {
    if (activity) {
      const hasNoTime = !activity.startTime && !activity.endTime
      setFormData({
        title: activity.title,
        notes: activity.notes || '',
        startTime: activity.startTime ? new Date(activity.startTime).toISOString().slice(0, 16) : '',
        endTime: activity.endTime ? new Date(activity.endTime).toISOString().slice(0, 16) : '',
        locationName: activity.locationName || '',
        address: activity.address || '',
        noTime: hasNoTime,
      })
    } else {
      setFormData({
        title: '',
        notes: '',
        startTime: '',
        endTime: '',
        locationName: '',
        address: '',
        noTime: false,
      })
    }
  }, [activity, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data: any = {
      tripId,
      date,
      title: formData.title,
      notes: formData.notes || undefined,
      startTime: formData.noTime ? undefined : (formData.startTime ? new Date(formData.startTime).toISOString() : undefined),
      endTime: formData.noTime ? undefined : (formData.endTime ? new Date(formData.endTime).toISOString() : undefined),
      locationName: formData.locationName || undefined,
      address: formData.address || undefined,
      orderIndex: activity?.orderIndex ?? defaultOrderIndex,
    }

    if (activity) {
      // Update - remove tripId and date if not changing
      delete data.tripId
      if (data.date === new Date(activity.date).toISOString()) {
        delete data.date
      }
    }

    await onSave(data)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">
          {activity ? 'Edit Activity' : 'Add Activity'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.activity.title} *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={formData.noTime}
                onChange={(e) => {
                  setFormData({ 
                    ...formData, 
                    noTime: e.target.checked,
                    startTime: e.target.checked ? '' : formData.startTime,
                    endTime: e.target.checked ? '' : formData.endTime,
                  })
                }}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">{t.activity.noAssignedTime}</span>
            </label>
          </div>

          {!formData.noTime && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.activity.startTime}
                </label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.activity.endTime}
                </label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.activity.location}
            </label>
            <input
              type="text"
              value={formData.locationName}
              onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.activity.address}
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.activity.notes}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              {activity ? t.common.update : t.common.create}
            </button>
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

