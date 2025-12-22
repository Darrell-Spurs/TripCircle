import { useState, useEffect, useRef } from 'react'
import { Activity, CreateActivityData, UpdateActivityData, TripMember } from '../types'
import { useLanguage } from '../context/LanguageContext'
import { useSearchPlaces, Place } from '../hooks/usePlaces'
import AlertModal from './AlertModal'
import ActivityParticipantSelector from './ActivityParticipantSelector'
import ActivityTagSelector from './ActivityTagSelector'
import ActivityCostShareEditor from './ActivityCostShareEditor'
import { useUpdateActivity } from '../hooks/useActivities'

interface ActivityModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: CreateActivityData | UpdateActivityData) => Promise<void>
  activity?: Activity
  tripId: number
  date: string
  defaultOrderIndex: number
  existingActivities?: Activity[] // Activities for the same date to check overlaps
  members?: TripMember[] // Trip members for participant selection
}

export default function ActivityModal({
  isOpen,
  onClose,
  onSave,
  activity,
  tripId,
  date,
  defaultOrderIndex,
  existingActivities = [],
  members = [],
}: ActivityModalProps) {
  const { t, language } = useLanguage()
  const updateActivity = useUpdateActivity()
  const [formData, setFormData] = useState({
    notes: '',
    body: '',
    startTime: '',
    endTime: '',
    locationName: '',
    address: '',
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
    placeId: undefined as string | undefined,
    noTime: false,
  })
  const [participantIds, setParticipantIds] = useState<number[]>([])
  const [cost, setCost] = useState<number | undefined>(undefined)
  const [currency, setCurrency] = useState<string | undefined>(undefined)
  const [tags, setTags] = useState<string[]>([])
  const [costShares, setCostShares] = useState<{ userId: number; amount: number }[] | null>(null)
  const [_splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [, setSelectedPlace] = useState<Place | null>(null)
  const [showOverlapAlert, setShowOverlapAlert] = useState(false)
  const [overlapActivity, setOverlapActivity] = useState<Activity | null>(null)
  const [showConflictAlert, setShowConflictAlert] = useState(false)
  const [conflictData, setConflictData] = useState<{ currentVersion: Activity; error: string } | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Debounce search query
  const [debouncedQuery, setDebouncedQuery] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Search places when user types
  const { data: searchResults, isLoading: isSearching } = useSearchPlaces(
    { keyword: debouncedQuery },
    debouncedQuery.length > 2 && showSuggestions
  )

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Extract time (HH:MM) from a datetime string - 24-hour format
  const extractTime = (dateTimeStr: string | null | undefined): string => {
    if (!dateTimeStr) return ''
    const d = new Date(dateTimeStr)
    if (Number.isNaN(d.getTime())) return ''
    const locale = language === 'zh-TW' ? 'zh-TW' : 'en-US'
    // Always use 24-hour format
    return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  useEffect(() => {
    if (activity) {
      const hasNoTime = !activity.startTime && !activity.endTime
      setFormData({
        notes: activity.notes || '',
        body: activity.body || '',
        startTime: extractTime(activity.startTime),
        endTime: extractTime(activity.endTime),
        locationName: activity.locationName || '',
        address: activity.address || '',
        lat: activity.lat,
        lng: activity.lng,
        placeId: activity.placeId,
        noTime: hasNoTime,
      })
      setSearchQuery(activity.locationName || '')
      setSelectedPlace(
        activity.locationName && activity.lat && activity.lng
          ? {
              placeId: activity.placeId || '',
              name: activity.locationName,
              address: activity.address || '',
              lat: activity.lat,
              lng: activity.lng,
            }
          : null
      )
      setParticipantIds(activity.participants?.map((p) => p.userId) || [])
      setCost(activity.cost)
      setCurrency(activity.currency)
      setTags(activity.tags || [])
      const existingCostShares = activity.costShares?.map((cs) => ({ userId: cs.userId, amount: cs.amount })) || []
      setCostShares(existingCostShares.length > 0 ? existingCostShares : null)
      // Determine split mode based on whether cost shares exist and are equal
      if (existingCostShares.length > 0 && activity.cost) {
        const costPerPerson = activity.cost / existingCostShares.length
        const isEqual = existingCostShares.every((cs) => Math.abs(cs.amount - costPerPerson) < 0.01)
        setSplitMode(isEqual ? 'equal' : 'custom')
      } else {
        setSplitMode('equal')
      }
    } else {
      setFormData({
        notes: '',
        body: '',
        startTime: '',
        endTime: '',
        locationName: '',
        address: '',
        lat: undefined,
        lng: undefined,
        placeId: undefined,
        noTime: false,
      })
      setSearchQuery('')
      setSelectedPlace(null)
      // Default to all members
      setParticipantIds(members.map((m) => m.userId))
      setCost(undefined)
      setCurrency(undefined)
      setTags([])
      setCostShares(null)
      setSplitMode('equal')
    }
    setShowSuggestions(false)
    setSubmitError(null)
  }, [activity, isOpen, members])

  const handlePlaceSelect = (place: Place) => {
    setFormData((prev) => ({
      ...prev,
      locationName: place.name,
      address: place.address,
      lat: place.lat,
      lng: place.lng,
      placeId: place.placeId,
    }))
    setSearchQuery(place.name)
    setSelectedPlace(place)
    setShowSuggestions(false)
  }

  const handleLocationNameChange = (value: string) => {
    setSearchQuery(value)
    setFormData((prev) => ({ ...prev, locationName: value }))
    if (value.length > 2) {
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
      // Clear place data if user clears the search
      if (value === '') {
        setFormData((prev) => ({
          ...prev,
          address: '',
          lat: undefined,
          lng: undefined,
          placeId: undefined,
        }))
        setSelectedPlace(null)
      }
    }
  }

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

  // Check if two time ranges overlap
  const checkTimeOverlap = (
    start1: string | undefined,
    end1: string | undefined,
    start2: string | undefined,
    end2: string | undefined
  ): boolean => {
    // If either activity has no time, no overlap
    if (!start1 || !end1 || !start2 || !end2) return false

    const s1 = new Date(start1).getTime()
    const e1 = new Date(end1).getTime()
    const s2 = new Date(start2).getTime()
    const e2 = new Date(end2).getTime()

    // Check if ranges overlap: (s1 < e2) && (s2 < e1)
    return s1 < e2 && s2 < e1
  }

  // Check for overlaps with existing activities
  const checkForOverlaps = (): { hasOverlap: boolean; overlappingActivity: Activity | null } => {
    const newStartTime = combineDateTime(date, formData.startTime)
    const newEndTime = combineDateTime(date, formData.endTime)

    // Need both start and end time to check overlap
    if (!newStartTime || !newEndTime) {
      return { hasOverlap: false, overlappingActivity: null }
    }

    // Check against existing activities (exclude the current activity if editing)
    const activitiesToCheck = existingActivities.filter(
      (a) => !activity || a.id !== activity.id
    )

    for (const existingActivity of activitiesToCheck) {
      if (
        checkTimeOverlap(
          newStartTime,
          newEndTime,
          existingActivity.startTime || undefined,
          existingActivity.endTime || undefined
        )
      ) {
        return { hasOverlap: true, overlappingActivity: existingActivity }
      }
    }

    return { hasOverlap: false, overlappingActivity: null }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check for time overlaps
    const { hasOverlap, overlappingActivity } = checkForOverlaps()
    if (hasOverlap && overlappingActivity) {
      setOverlapActivity(overlappingActivity)
      setShowOverlapAlert(true)
      return
    }

    // Use locationName as title if no title field exists
    // For updates: use null to clear fields, undefined means "don't change"
    // For creates: use undefined to let backend use defaults
    const isUpdate = !!activity
    
    const data: any = {
      tripId,
      date,
      title: formData.locationName || 'Untitled Activity', // Use locationName as title
      // For updates, send null to clear; for creates, send undefined to skip
      notes: formData.notes || (isUpdate ? null : undefined),
      body: formData.body || (isUpdate ? null : undefined),
      startTime: combineDateTime(date, formData.startTime),
      endTime: combineDateTime(date, formData.endTime),
      locationName: formData.locationName || (isUpdate ? null : undefined),
      address: formData.address || (isUpdate ? null : undefined),
      lat: formData.lat ?? (isUpdate ? null : undefined),
      lng: formData.lng ?? (isUpdate ? null : undefined),
      placeId: formData.placeId ?? (isUpdate ? null : undefined),
      orderIndex: activity?.orderIndex ?? defaultOrderIndex,
      participantIds: participantIds.length > 0 ? participantIds : undefined,
      cost: cost ?? (isUpdate ? null : undefined),
      currency: currency || (isUpdate ? null : undefined),
      tags: tags.length > 0 ? tags : (isUpdate ? [] : undefined),
      // Include cost shares only if custom amounts are set (null means use equal split)
      // Backend will auto-calculate equal split if costShares is not provided
      costShares: costShares && costShares.length > 0 ? costShares : undefined,
    }

    if (activity) {
      // Update - always remove tripId and date (edit modal doesn't allow changing these)
      // Note: Previously the date comparison was broken because it compared "YYYY-MM-DD" to ISO string
      delete data.tripId
      delete data.date
      // Include lastModifiedAt for conflict resolution
      if (activity.lastModifiedAt) {
        data.lastModifiedAt = activity.lastModifiedAt
      }
    }

    // Clear any previous error
    setSubmitError(null)

    // Handle conflict resolution for updates
    if (activity) {
      try {
        const result = await updateActivity.mutateAsync({
          activityId: activity.id,
          data,
          currentActivity: activity,
        })

        if (result.conflict) {
          setConflictData({
            currentVersion: result.currentVersion!,
            error: result.error || 'Activity was modified by another user',
          })
          setShowConflictAlert(true)
          return
        }
      } catch (error: any) {
        if (error.response?.status === 409) {
          setConflictData({
            currentVersion: error.response.data.currentVersion,
            error: error.response.data.detail,
          })
          setShowConflictAlert(true)
          return
        }
        // Show error to user instead of silently failing
        const errorMessage = error.response?.data?.detail || error.message || 'Failed to update activity'
        setSubmitError(errorMessage)
        console.error('Activity update error:', error)
        return
      }
    } else {
      try {
        await onSave(data)
      } catch (error: any) {
        const errorMessage = error.response?.data?.detail || error.message || 'Failed to create activity'
        setSubmitError(errorMessage)
        console.error('Activity create error:', error)
        return
      }
    }

    onClose()
  }

  const handleOverwriteConflict = async () => {
    if (!activity || !conflictData) return

    const data: any = {
      title: formData.locationName || 'Untitled Activity',
      notes: formData.notes || undefined,
      body: formData.body || undefined,
      startTime: combineDateTime(date, formData.startTime),
      endTime: combineDateTime(date, formData.endTime),
      locationName: formData.locationName || undefined,
      address: formData.address || undefined,
      lat: formData.lat,
      lng: formData.lng,
      placeId: formData.placeId,
      participantIds: participantIds.length > 0 ? participantIds : undefined,
      cost: cost,
      currency: currency,
      tags: tags.length > 0 ? tags : undefined,
      // Force overwrite by not including lastModifiedAt
    }

    try {
      await updateActivity.mutateAsync({
        activityId: activity.id,
        data,
        currentActivity: activity,
      })
      setShowConflictAlert(false)
      onClose()
    } catch (error) {
      console.error('Failed to overwrite:', error)
    }
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
            {/* Location Name with Autocomplete - Moved to top */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.activity.locationName} <span className="text-red-500">*</span>
              </label>
              <input
                ref={searchInputRef}
                type="text"
                required
                value={searchQuery}
                onChange={(e) => handleLocationNameChange(e.target.value)}
                onFocus={() => {
                  if (searchQuery.length > 2) setShowSuggestions(true)
                }}
                placeholder={t.activity.searchLocationPlaceholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              {/* Autocomplete Suggestions Dropdown */}
              {showSuggestions && (searchResults || isSearching) && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                >
                  {isSearching && (
                    <div className="px-3 py-2 text-sm text-gray-500">Searching...</div>
                  )}
                  {!isSearching && searchResults && searchResults.length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-500">No results found</div>
                  )}
                  {!isSearching &&
                    searchResults &&
                    searchResults.map((place) => (
                      <button
                        key={place.placeId}
                        type="button"
                        onClick={() => handlePlaceSelect(place)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{place.name}</div>
                        <div className="text-sm text-gray-500">{place.address}</div>
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Address field - auto-filled but editable */}
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

            {/* Participants Section */}
            {members.length > 0 && (
              <ActivityParticipantSelector
                members={members}
                selectedUserIds={participantIds}
                onChange={setParticipantIds}
              />
            )}

            {/* Budget Section */}
            <ActivityCostShareEditor
              cost={cost}
              currency={currency}
              participants={members.filter((m) => participantIds.includes(m.userId))}
              costShares={costShares || undefined}
              onCostChange={setCost}
              onCurrencyChange={setCurrency}
              onCostSharesChange={(shares) => setCostShares(shares)}
              onSplitModeChange={setSplitMode}
            />

            {/* Tags Section */}
            <ActivityTagSelector selectedTags={tags} onChange={setTags} />
          </form>
        </div>

        {/* Footer buttons - fixed at bottom, outside scrollable area */}
        <div className="p-6 pt-4 border-t border-gray-100 flex-shrink-0">
          {/* Error message display */}
          {submitError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {submitError}
            </div>
          )}
          <div className="flex gap-4">
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

      {/* Overlap Alert Modal */}
      <AlertModal
        isOpen={showOverlapAlert}
        onClose={() => setShowOverlapAlert(false)}
        title={t.activity.overlapErrorTitle}
        message={
          overlapActivity
            ? `${t.activity.overlapErrorMessage}\n\n"${overlapActivity.title || overlapActivity.locationName || t.activity.addActivity}" (${extractTime(overlapActivity.startTime)} - ${extractTime(overlapActivity.endTime)})`
            : t.activity.overlapErrorGeneric
        }
        type="error"
      />

      {/* Conflict Alert Modal - Custom implementation */}
      {showConflictAlert && conflictData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl border-2 border-red-200 bg-red-50">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl flex-shrink-0">⚠️</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 text-red-800">
                    {t.activity.conflictTitle || 'Conflict Detected'}
                  </h3>
                  <p className="text-sm text-red-700 whitespace-pre-line mb-4">
                    {conflictData.error}
                    {'\n\n'}
                    {t.activity.conflictMessage || 'The activity was modified by another user. Do you want to overwrite their changes?'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleOverwriteConflict}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                    >
                      {t.activity.overwrite || 'Overwrite'}
                    </button>
                    <button
                      onClick={() => {
                        setShowConflictAlert(false)
                        if (conflictData.currentVersion) {
                          window.location.reload()
                        }
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
                    >
                      {t.activity.reload || 'Reload'}
                    </button>
                    <button
                      onClick={() => setShowConflictAlert(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                    >
                      {t.common.cancel}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

