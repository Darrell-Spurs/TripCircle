import { useState, useEffect } from 'react'
import { Activity, CreateActivityData, UpdateActivityData } from '../types'

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
  const [formData, setFormData] = useState({
    title: '',
    notes: '',
    startTime: '',
    endTime: '',
    locationName: '',
    address: '',
  })

  // Extract time (HH:MM) from a datetime string
  const extractTime = (dateTimeStr: string | null | undefined): string => {
    if (!dateTimeStr) return ''
    const d = new Date(dateTimeStr)
    return d.toTimeString().slice(0, 5) // "HH:MM"
  }

  useEffect(() => {
    if (activity) {
      setFormData({
        title: activity.title,
        notes: activity.notes || '',
        startTime: extractTime(activity.startTime),
        endTime: extractTime(activity.endTime),
        locationName: activity.locationName || '',
        address: activity.address || '',
      })
    } else {
      setFormData({
        title: '',
        notes: '',
        startTime: '',
        endTime: '',
        locationName: '',
        address: '',
      })
    }
  }, [activity, isOpen])

  if (!isOpen) return null

  // Combine date and time into ISO string
  const combineDateTime = (dateStr: string, timeStr: string): string | undefined => {
    if (!timeStr) return undefined
    // dateStr is "YYYY-MM-DD", timeStr is "HH:MM"
    return new Date(`${dateStr}T${timeStr}:00`).toISOString()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data: any = {
      tripId,
      date,
      title: formData.title,
      notes: formData.notes || undefined,
      startTime: combineDateTime(date, formData.startTime),
      endTime: combineDateTime(date, formData.endTime),
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
        <h2 className="text-2xl font-bold mb-1">
          {activity ? 'Edit Activity' : 'Add Activity'}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {new Date(date + 'T00:00:00').toLocaleDateString(undefined, { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location Name
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
              Address
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
              Notes
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
              {activity ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

