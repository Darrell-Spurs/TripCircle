import { useState, useEffect, useRef } from 'react'
import { Activity, CreateActivityData, UpdateActivityData, TripMember } from '../types'
import { useLanguage } from '../context/LanguageContext'
import { useSearchPlaces, Place } from '../hooks/usePlaces'
import AlertModal from './AlertModal'
import ActivityParticipantSelector from './ActivityParticipantSelector'
import ActivityTagSelector from './ActivityTagSelector'
import ActivityCostShareEditor from './ActivityCostShareEditor'
import LocationSelectorModal from './LocationSelectorModal'
import LocationSearchModal from './LocationSearchModal'
import { useUpdateActivity } from '../hooks/useActivities'
import { SavedLocation } from '../types'
import api from '../lib/api'

type TravelMode = 'driving' | 'walking' | 'bicycling' | 'transit'

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
  defaultStartTime?: string // Default start time for new activities (end time of previous activity)
  paceBuffer?: { prePct: number; postPct: number } // Buffer percentages for transportation time
  onTransportModeChange?: (mode: TravelMode) => void // Callback when transportation mode changes
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
  defaultStartTime,
  paceBuffer = { prePct: 0.15, postPct: 0.15 },
  onTransportModeChange,
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
  const [activityType, setActivityType] = useState<'regular' | 'gathering_point' | 'branch_point' | 'merge_point'>('regular')
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
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [transportMode, setTransportMode] = useState<TravelMode>('driving')
  const [transportDuration, setTransportDuration] = useState<number | null>(null)
  const [isCalculatingTransport, setIsCalculatingTransport] = useState(false)
  const [showLocationSearch, setShowLocationSearch] = useState(false)
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
      setActivityType(activity.activityType || 'regular')
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
      // For new activities, set default start time from previous activity's end time
      let defaultStart = ''
      if (defaultStartTime) {
        const dateObj = new Date(defaultStartTime)
        const locale = language === 'zh-TW' ? 'zh-TW' : 'en-US'
        defaultStart = dateObj.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false })
      }
      setFormData({
        notes: '',
        body: '',
        startTime: defaultStart,
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
      setActivityType('regular')
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

  const handleLocationSelect = (formattedText: string) => {
    setFormData((prev) => {
      const separator = prev.notes.trim() ? '\n\n' : ''
      return { ...prev, notes: prev.notes + separator + formattedText }
    })
  }

  const calculateTransportTime = async (fromLat: number, fromLng: number, toLat: number, toLng: number, mode: TravelMode) => {
    try {
      setIsCalculatingTransport(true)
      
      // Calculate departure time (use defaultStartTime if available, or current time)
      let departureTime: number | undefined
      if (defaultStartTime) {
        const defaultStart = new Date(defaultStartTime)
        const now = new Date()
        let departureDate = new Date(defaultStart)
        
        // If the departure time is in the past, move it to the same time in the nearest future
        if (departureDate < now) {
          const hours = departureDate.getHours()
          const minutes = departureDate.getMinutes()
          const seconds = departureDate.getSeconds()
          
          departureDate = new Date(now)
          departureDate.setHours(hours, minutes, seconds, 0)
          
          if (departureDate < now) {
            departureDate.setDate(departureDate.getDate() + 1)
          }
        }
        
        departureTime = Math.floor(departureDate.getTime() / 1000)
      }
      
      const response = await api.get('/places/directions', {
        params: {
          originLat: fromLat,
          originLng: fromLng,
          destLat: toLat,
          destLng: toLng,
          mode: mode,
          ...(departureTime ? { departureTime: departureTime.toString() } : {}),
        },
      })
      
      const durationValue = response.data.durationValue
      if (durationValue && typeof durationValue === 'number') {
        setTransportDuration(durationValue)
        return durationValue
      }
      return null
    } catch (error) {
      console.error('Failed to calculate transport time:', error)
      setTransportDuration(null)
      return null
    } finally {
      setIsCalculatingTransport(false)
    }
  }

  const handlePlaceSelect = async (place: Place) => {
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

    // If this is a new activity and we have a previous activity, calculate transport time
    if (!activity && defaultStartTime && place.lat && place.lng) {
      const lastActivity = existingActivities[existingActivities.length - 1]
      if (lastActivity?.lat && lastActivity?.lng) {
        const duration = await calculateTransportTime(
          lastActivity.lat,
          lastActivity.lng,
          place.lat,
          place.lng,
          transportMode
        )
        
        if (duration) {
          // Apply buffer time to match transportation box
          const pre = Math.round(duration * paceBuffer.prePct)
          const post = Math.round(duration * paceBuffer.postPct)
          const bufferedDuration = duration + pre + post
          
          // Calculate new start time: previous activity end time + transport time (with buffer) + 1 minute buffer
          const defaultStart = new Date(defaultStartTime)
          const transportTimeMs = (bufferedDuration + 60) * 1000 // Add 1 minute buffer
          const newStartTime = new Date(defaultStart.getTime() + transportTimeMs)
          
          const locale = language === 'zh-TW' ? 'zh-TW' : 'en-US'
          const newStartTimeStr = newStartTime.toLocaleTimeString(locale, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
          
          setFormData((prev) => ({
            ...prev,
            startTime: newStartTimeStr,
            // Auto-set endTime to the same as new startTime
            endTime: prev.endTime || newStartTimeStr,
          }))
        }
      }
    }
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
      const newEndTime = adjustTime(formData.endTime, minutes)
      // Ensure endTime is not before startTime
      if (formData.startTime) {
        const startDate = new Date(`2000-01-01T${formData.startTime}`)
        const endDate = new Date(`2000-01-01T${newEndTime}`)
        if (endDate < startDate) {
          // If endTime would be before startTime, set it to the same as startTime
          setFormData((prev) => ({ ...prev, endTime: prev.startTime }))
          return
        }
      }
      setFormData((prev) => ({ ...prev, endTime: newEndTime }))
      return
    }
    // If endTime is empty but startTime exists, set endTime relative to startTime.
    if (formData.startTime) {
      const newEndTime = adjustTime(formData.startTime, minutes)
      // Ensure it's not before startTime
      const startDate = new Date(`2000-01-01T${formData.startTime}`)
      const endDate = new Date(`2000-01-01T${newEndTime}`)
      if (endDate < startDate) {
        setFormData((prev) => ({ ...prev, endTime: prev.startTime }))
      } else {
        setFormData((prev) => ({ ...prev, endTime: newEndTime }))
      }
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
    // Two ranges [s1, e1] and [s2, e2] overlap if and only if:
    // s1 < e2 AND s2 < e1
    // Note: If one ends exactly when another starts (e.g., 14:27-14:28 and 14:28-19:30),
    // that's not an overlap, just adjacency. The condition s2 < e1 ensures this.
    return s1 < e2 && s2 < e1
  }

  // Helper function to check if two activities have overlapping participants
  const hasParticipantOverlap = (activity1: Activity | null, activity2: Activity | null): boolean => {
    if (!activity1 || !activity2) return true // If either has no participants, treat as overlap (all participants)
    
    const participantIds1 = new Set(activity1.participants?.map((p) => p.userId) || [])
    const participantIds2 = new Set(activity2.participants?.map((p) => p.userId) || [])
    const hasParticipants1 = participantIds1.size > 0
    const hasParticipants2 = participantIds2.size > 0

    if (!hasParticipants1 && !hasParticipants2) {
      // Both have no participants - treat as overlap (both are "all participants")
      return true
    } else if (!hasParticipants1 || !hasParticipants2) {
      // One has no participants - treat as overlap (no participants = all participants)
      return true
    } else {
      // Both have participants - check if there's any overlap
      return Array.from(participantIds1).some((id) => participantIds2.has(id))
    }
  }

  // Check for overlaps with existing activities
  const checkForOverlaps = (): { hasOverlap: boolean; overlappingActivity: Activity | null } => {
    const newStartTime = combineDateTime(date, formData.startTime)
    const newEndTime = combineDateTime(date, formData.endTime)

    // Need both start and end time to check overlap
    if (!newStartTime || !newEndTime) {
      return { hasOverlap: false, overlappingActivity: null }
    }

    // Create a temporary activity object for the new activity being created/edited
    // newStartTime and newEndTime are already ISO strings from combineDateTime
    const newActivity: Activity | null = {
      id: activity?.id || -1,
      tripId: tripId,
      date: date,
      startTime: newStartTime, // Already an ISO string
      endTime: newEndTime, // Already an ISO string
      title: formData.locationName || 'New Activity',
      participants: participantIds.length > 0 
        ? participantIds.map(id => {
            const member = members.find(m => m.userId === id)
            return member?.user ? { userId: id, user: member.user } : null
          }).filter((p): p is { userId: number; user: any } => p !== null) as any
        : undefined,
      activityType: activityType,
    } as Activity

    // Check against existing activities (exclude the current activity if editing)
    const activitiesToCheck = existingActivities.filter(
      (a) => !activity || a.id !== activity.id
    )

    for (const existingActivity of activitiesToCheck) {
      const existingStartTime = existingActivity.startTime || undefined
      const existingEndTime = existingActivity.endTime || undefined
      
      // Skip if existing activity has no time
      if (!existingStartTime || !existingEndTime) {
        continue
      }

      // Check time overlap first
      const hasTimeOverlap = checkTimeOverlap(
        newStartTime,
        newEndTime,
        existingStartTime,
        existingEndTime
      )

      if (hasTimeOverlap) {
        // If there's time overlap, check participant overlap
        // If participants don't overlap, it's not a conflict (different people can have activities at the same time)
        if (!hasParticipantOverlap(newActivity, existingActivity)) {
          console.log('Time overlap but no participant overlap - no conflict:', {
            newActivity: { 
              start: newStartTime, 
              end: newEndTime,
              participants: participantIds 
            },
            existingActivity: { 
              id: existingActivity.id,
              title: existingActivity.title,
              start: existingStartTime, 
              end: existingEndTime,
              participants: existingActivity.participants?.map(p => p.userId) || []
            }
          })
          continue // Skip this activity - no conflict
        }

        console.log('Overlap detected:', {
          newActivity: { start: newStartTime, end: newEndTime },
          existingActivity: { 
            id: existingActivity.id,
            title: existingActivity.title,
            start: existingStartTime, 
            end: existingEndTime 
          }
        })
        return { hasOverlap: true, overlappingActivity: existingActivity }
      }
    }

    return { hasOverlap: false, overlappingActivity: null }
  }

  const submitActivity = async (skipOverlapCheck = false) => {
    // Check for time overlaps (unless skipping the check)
    if (!skipOverlapCheck) {
      const { hasOverlap, overlappingActivity } = checkForOverlaps()
      if (hasOverlap && overlappingActivity) {
        setOverlapActivity(overlappingActivity)
        setShowOverlapAlert(true)
        return
      }
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
      endTime: activityType === 'gathering_point' 
        ? (combineDateTime(date, formData.startTime) || undefined) // For gathering point, endTime = startTime
        : combineDateTime(date, formData.endTime),
      activityType: activityType,
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
    setIsSubmitting(true)

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
        setSubmitSuccess(true)
        setIsSubmitting(false)
        // Close modal after 2 seconds
        setTimeout(() => {
          setSubmitSuccess(false)
          onClose()
        }, 2000)
        return
      } catch (error: any) {
        setIsSubmitting(false)
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
        setIsSubmitting(false)
        setSubmitSuccess(true)
        // Close modal after 1.5 seconds
        setTimeout(() => {
          setSubmitSuccess(false)
          onClose()
        }, 1500)
        return
      } catch (error: any) {
        setIsSubmitting(false)
        const errorMessage = error.response?.data?.detail || error.message || 'Failed to create activity'
        setSubmitError(errorMessage)
        console.error('Activity create error:', error)
        return
      }
    }

    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitActivity(false)
  }

  const handleOverwriteConflict = async () => {
    if (!activity || !conflictData) return

    const data: any = {
      title: formData.locationName || 'Untitled Activity',
      notes: formData.notes || undefined,
      body: formData.body || undefined,
      startTime: combineDateTime(date, formData.startTime),
      endTime: activityType === 'gathering_point' 
        ? (combineDateTime(date, formData.startTime) || undefined) // For gathering point, endTime = startTime
        : combineDateTime(date, formData.endTime),
      activityType: activityType,
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
            {/* Activity Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.activity.activityType || 'Activity Type'}
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="regular"
                    checked={activityType === 'regular'}
                    onChange={(e) => {
                      setActivityType(e.target.value as 'regular' | 'gathering_point' | 'branch_point' | 'merge_point')
                      if (e.target.value === 'gathering_point') {
                        setFormData((prev) => ({ ...prev, endTime: '' }))
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{t.activity.regularActivity || 'Regular Activity'}</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="gathering_point"
                    checked={activityType === 'gathering_point'}
                    onChange={(e) => {
                      setActivityType(e.target.value as 'regular' | 'gathering_point' | 'branch_point' | 'merge_point')
                      if (e.target.value === 'gathering_point') {
                        setFormData((prev) => ({ ...prev, endTime: '' }))
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{t.activity.gatheringPoint || 'Gathering Point'}</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="branch_point"
                    checked={activityType === 'branch_point'}
                    onChange={(e) => {
                      setActivityType(e.target.value as 'regular' | 'gathering_point' | 'branch_point' | 'merge_point')
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{t.activity.branchPoint || 'Branch Point'}</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="merge_point"
                    checked={activityType === 'merge_point'}
                    onChange={(e) => {
                      setActivityType(e.target.value as 'regular' | 'gathering_point' | 'branch_point' | 'merge_point')
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{t.activity.mergePoint || 'Merge Point'}</span>
                </label>
              </div>
            </div>

            {/* Location Name with Autocomplete - Moved to top */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  {t.activity.locationName} <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowImportModal(true)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  📁 {t.locationFolders.importFromFolder}
                </button>
              </div>
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

            {/* Transportation Mode Selector - Only show for new activities with previous activity */}
            {!activity && defaultStartTime && existingActivities.length > 0 && formData.lat && formData.lng && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.route.modeLabel || 'Transportation Mode'}
                </label>
                <select
                  value={transportMode}
                  onChange={async (e) => {
                    const newMode = e.target.value as TravelMode
                    setTransportMode(newMode)
                    
                    // Notify parent component about mode change
                    if (onTransportModeChange) {
                      onTransportModeChange(newMode)
                    }
                    
                    // Recalculate transport time with new mode
                    const lastActivity = existingActivities[existingActivities.length - 1]
                    if (lastActivity?.lat && lastActivity?.lng && formData.lat && formData.lng) {
                      const duration = await calculateTransportTime(
                        lastActivity.lat,
                        lastActivity.lng,
                        formData.lat,
                        formData.lng,
                        newMode
                      )
                      
                      if (duration && defaultStartTime) {
                        // Apply buffer time to match transportation box
                        const pre = Math.round(duration * paceBuffer.prePct)
                        const post = Math.round(duration * paceBuffer.postPct)
                        const bufferedDuration = duration + pre + post
                        
                        // Update start time based on new transport duration (with buffer)
                        const defaultStart = new Date(defaultStartTime)
                        const transportTimeMs = (bufferedDuration + 60) * 1000 // Add 1 minute buffer
                        const newStartTime = new Date(defaultStart.getTime() + transportTimeMs)
                        
                        const locale = language === 'zh-TW' ? 'zh-TW' : 'en-US'
                        const newStartTimeStr = newStartTime.toLocaleTimeString(locale, {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        })
                        
                        setFormData((prev) => ({
                          ...prev,
                          startTime: newStartTimeStr,
                          // Auto-set endTime to the same as new startTime
                          endTime: prev.endTime || newStartTimeStr,
                        }))
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={isCalculatingTransport}
                >
                  <option value="driving">{t.route.driving}</option>
                  <option value="walking">{t.route.walking}</option>
                  <option value="bicycling">{t.route.bicycling}</option>
                  <option value="transit">{t.route.transit}</option>
                </select>
                {isCalculatingTransport && (
                  <p className="text-xs text-gray-500 mt-1">{t.route.loading}</p>
                )}
                {transportDuration !== null && !isCalculatingTransport && (() => {
                  // Apply buffer time to match transportation box display
                  const baseSec = transportDuration
                  const pre = Math.round(baseSec * paceBuffer.prePct)
                  const post = Math.round(baseSec * paceBuffer.postPct)
                  const bufferedSec = baseSec + pre + post
                  const bufferedMinutes = Math.round(bufferedSec / 60)
                  const baseMinutes = Math.round(baseSec / 60)
                  const bufferMinutes = Math.round((pre + post) / 60)
                  
                  return (
                    <p className="text-xs text-gray-600 mt-1">
                      {t.route.travelTime}: {baseMinutes} {t.route.minutes}
                      {bufferMinutes > 0 && (
                        <>
                          {' '}
                          (+{bufferMinutes} {language === 'zh-TW' ? '分 ' : 'm '}
                          {t.route.buffer || 'buffer'})
                        </>
                      )}
                      {' '}({t.common.total || 'Total'}: {bufferedMinutes} {t.route.minutes})
                    </p>
                  )
                })()}
              </div>
            )}

            <div className={`grid gap-4 ${activityType === 'gathering_point' ? 'grid-cols-1' : 'grid-cols-2'}`}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {activityType === 'gathering_point' ? (t.activity.time || 'Time') : t.activity.startTime}
                </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => {
                      const newStartTime = e.target.value
                      setFormData((prev) => {
                        // If endTime is empty or ahead of (or equal to) new startTime, set it to the same as startTime
                        let newEndTime = prev.endTime
                        if (newStartTime) {
                          if (!prev.endTime) {
                            // EndTime is empty, set it to startTime
                            newEndTime = newStartTime
                          } else {
                            // Check if endTime is ahead of (or equal to) startTime
                            const startDate = new Date(`2000-01-01T${newStartTime}`)
                            const endDate = new Date(`2000-01-01T${prev.endTime}`)
                            if (endDate <= startDate) {
                              // EndTime is before or equal to startTime, set it to startTime
                              newEndTime = newStartTime
                            }
                          }
                        }
                        return {
                          ...prev,
                          startTime: newStartTime,
                          endTime: newEndTime,
                        }
                      })
                    }}
                    step="60"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  />
                <div className="mt-2 grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    disabled={!formData.startTime}
                    onClick={() => adjustStartTime(1)}
                    className="px-2 py-1 rounded-full text-xs font-medium border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    {t.activity.add1m}
                  </button>
                  <button
                    type="button"
                    disabled={!formData.startTime}
                    onClick={() => adjustStartTime(10)}
                    className="px-2 py-1 rounded-full text-xs font-medium border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    {t.activity.add10m}
                  </button>
                  <button
                    type="button"
                    disabled={!formData.startTime}
                    onClick={() => adjustStartTime(-1)}
                    className="px-2 py-1 rounded-full text-xs font-medium border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    {t.activity.minus1m}
                  </button>
                  <button
                    type="button"
                    disabled={!formData.startTime}
                    onClick={() => adjustStartTime(-10)}
                    className="px-2 py-1 rounded-full text-xs font-medium border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    {t.activity.minus10m}
                  </button>
                </div>
              </div>

              {activityType !== 'gathering_point' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.activity.endTime}
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => {
                      const newEndTime = e.target.value
                      // Ensure endTime is not before startTime
                      if (formData.startTime && newEndTime) {
                        const startDate = new Date(`2000-01-01T${formData.startTime}`)
                        const endDate = new Date(`2000-01-01T${newEndTime}`)
                        if (endDate < startDate) {
                          // If endTime is before startTime, set it to the same as startTime
                          setFormData((prev) => ({ ...prev, endTime: prev.startTime }))
                          return
                        }
                      }
                      setFormData((prev) => ({ ...prev, endTime: newEndTime }))
                    }}
                    step="60"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  />
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      disabled={!formData.startTime && !formData.endTime}
                      onClick={() => adjustEndTime(1)}
                      className="px-2 py-1 rounded-full text-xs font-medium border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                      {t.activity.add1m}
                    </button>
                    <button
                      type="button"
                      disabled={!formData.startTime && !formData.endTime}
                      onClick={() => adjustEndTime(10)}
                      className="px-2 py-1 rounded-full text-xs font-medium border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                      {t.activity.add10m}
                    </button>
                    <button
                      type="button"
                      disabled={!formData.endTime}
                      onClick={() => adjustEndTime(-1)}
                      className="px-2 py-1 rounded-full text-xs font-medium border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                      {t.activity.minus1m}
                    </button>
                    <button
                      type="button"
                      disabled={!formData.endTime}
                      onClick={() => adjustEndTime(-10)}
                      className="px-2 py-1 rounded-full text-xs font-medium border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                      {t.activity.minus10m}
                    </button>
                  </div>
                </div>
              )}
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
              <div className="mt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowLocationSearch(true)
                  }}
                  className="px-2 py-1 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                  title={t.comment?.addLocation || 'Add Location'}
                >
                  <span>📍</span>
                  <span>{t.comment?.addLocation || 'Add Location'}</span>
                </button>
              </div>
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
              disabled={submitSuccess || isSubmitting}
              className={`flex-1 px-4 py-2 rounded-lg transition flex items-center justify-center gap-2 ${
                submitSuccess
                  ? 'bg-green-600 text-white cursor-not-allowed'
                  : isSubmitting
                    ? 'bg-indigo-500 text-white cursor-wait'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {submitSuccess ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {activity ? (t.activity.updateSuccess || 'Updated successfully!') : (t.activity.createSuccess || 'Created successfully!')}
                </>
              ) : isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 8 4 12zm8 0a8 8 0 018 8v-4a8 8 0 00-8-8v4zm8 0H4v4h16v-4z"></path>
                  </svg>
                  {activity ? (t.common.updating || 'Updating...') : (t.common.creating || 'Creating...')}
                </>
              ) : (
                activity ? t.common.update : t.common.create
              )}
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
        showCancel={true}
        cancelText={t.common.cancel}
        onConfirm={() => {
          // Add anyway - skip overlap check
          submitActivity(true)
        }}
        confirmText={t.activity.addAnyway || 'Add Anyway'}
      />

      {/* Location Selector Modal */}
      {showImportModal && (
        <LocationSelectorModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSelect={(location: SavedLocation) => {
            // Fill form with selected location data
            setFormData((prev) => ({
              ...prev,
              locationName: location.name,
              address: location.address,
              lat: location.lat,
              lng: location.lng,
              placeId: location.placeId,
            }))
            setSearchQuery(location.name)
            setSelectedPlace({
              placeId: location.placeId,
              name: location.name,
              address: location.address,
              lat: location.lat,
              lng: location.lng,
            })
          }}
        />
      )}

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

      {/* Location Search Modal */}
      <LocationSearchModal
        isOpen={showLocationSearch}
        onClose={() => setShowLocationSearch(false)}
        onSelect={handleLocationSelect}
      />
    </div>
  )
}

