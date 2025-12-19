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
    body: '',
    startTime: '',
    endTime: '',
    locationName: '',
    address: '',
    noTime: false,
  })

  // Extract time (HH:MM) from a datetime string
  const extractTime = (dateTimeStr: string | null | undefined): string => {
    if (!dateTimeStr) return ''
    const d = new Date(dateTimeStr)
    return d.toTimeString().slice(0, 5) // "HH:MM"
  }

  useEffect(() => {
    if (activity) {
      const hasNoTime = !activity.startTime && !activity.endTime
      setFormData({
        title: activity.title,
        notes: activity.notes || '',
        body: activity.body || '',
        startTime: extractTime(activity.startTime),
        endTime: extractTime(activity.endTime),
        locationName: activity.locationName || '',
        address: activity.address || '',
        noTime: hasNoTime,
      })
    } else {
      setFormData({
        title: '',
        notes: '',
        body: '',
        startTime: '',
        endTime: '',
        locationName: '',
        address: '',
        noTime: false,
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

  const clampToEndOfDayMinutes = (totalMinutes: number) => {
    const max = 23 * 60 + 59
    return Math.min(Math.max(totalMinutes, 0), max)
  }

  const adjustTime = (time: string, minutes: number) => {
    const [hStr, mStr] = time.split(':')
    const h = Number(hStr)
    const m = Number(mStr)
    if (Number.isNaN(h) || Number.isNaN(m)) return time

    const nextTotal = clampToEndOfDayMinutes(h * 60 + m + minutes)
    const nextH = String(Math.floor(nextTotal / 60)).padStart(2, '0')
    const nextM = String(nextTotal % 60).padStart(2, '0')
    return `${nextH}:${nextM}`
  }

  const adjustStartTime = (minutes: number) => {
    if (!formData.startTime) return
    setFormData((prev) => ({ ...prev, startTime: adjustTime(prev.startTime, minutes) }))
  }

  const adjustEndTime = (minutes: number) => {
    if (formData.endTime) {
      setFormData((prev) => ({ ...prev, endTime: adjustTime(prev.endTime, minutes) }))
      return
    }
    // If endTime is empty but startTime exists, set endTime relative to startTime.
    if (formData.startTime) {
      setFormData((prev) => ({ ...prev, endTime: adjustTime(prev.startTime, minutes) }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data: any = {
      tripId,
      date,
      title: formData.title,
      notes: formData.notes || undefined,
      body: formData.body || undefined,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Header - fixed */}
        <div className="p-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-2xl font-bold mb-1">
            {activity ? t.activity.editActivity : t.activity.addActivity}
          </h2>
          <p className="text-sm text-gray-500">
            {new Date(date + 'T00:00:00').toLocaleDateString(undefined, { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Scrollable form content */}
        <div className="flex-1 overflow-y-auto p-6 pt-4">
          <form id="activity-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.activity.titleRequired}
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
                  {t.activity.startTime}
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="mt-2 grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    disabled={!formData.startTime}
                    onClick={() => adjustStartTime(15)}
                    className="px-2 py-1 rounded-full text-xs font-medium border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    {t.activity.add15m}
                  </button>
                  <button
                    type="button"
                    disabled={!formData.startTime}
                    onClick={() => adjustStartTime(30)}
                    className="px-2 py-1 rounded-full text-xs font-medium border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    {t.activity.add30m}
                  </button>
                  <button
                    type="button"
                    disabled={!formData.startTime}
                    onClick={() => adjustStartTime(-15)}
                    className="px-2 py-1 rounded-full text-xs font-medium border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    {t.activity.minus15m}
                  </button>
                  <button
                    type="button"
                    disabled={!formData.startTime}
                    onClick={() => adjustStartTime(-30)}
                    className="px-2 py-1 rounded-full text-xs font-medium border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    {t.activity.minus30m}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.activity.endTime}
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="mt-2 grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    disabled={!formData.startTime && !formData.endTime}
                    onClick={() => adjustEndTime(15)}
                    className="px-2 py-1 rounded-full text-xs font-medium border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    {t.activity.add15m}
                  </button>
                  <button
                    type="button"
                    disabled={!formData.startTime && !formData.endTime}
                    onClick={() => adjustEndTime(30)}
                    className="px-2 py-1 rounded-full text-xs font-medium border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    {t.activity.add30m}
                  </button>
                  <button
                    type="button"
                    disabled={!formData.endTime}
                    onClick={() => adjustEndTime(-15)}
                    className="px-2 py-1 rounded-full text-xs font-medium border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    {t.activity.minus15m}
                  </button>
                  <button
                    type="button"
                    disabled={!formData.endTime}
                    onClick={() => adjustEndTime(-30)}
                    className="px-2 py-1 rounded-full text-xs font-medium border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    {t.activity.minus30m}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.activity.locationName}
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
                rows={2}
                placeholder={t.activity.quickNotesPlaceholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.activity.storyForFeed}
              </label>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                rows={3}
                placeholder={t.activity.storyPlaceholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">{t.activity.storyDescription}</p>
            </div>
          </form>
        </div>

        {/* Footer buttons - fixed at bottom, outside scrollable area */}
        <div className="flex gap-4 p-6 pt-4 border-t border-gray-100 flex-shrink-0">
          <button
            type="submit"
            form="activity-form"
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
      </div>
    </div>
  )
}

