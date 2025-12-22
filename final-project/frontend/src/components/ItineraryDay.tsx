import { useEffect, useRef, useState } from 'react'
import { Activity } from '../types'
import ActivityCard from './ActivityCard'
import { useLanguage } from '../context/LanguageContext'
import api from '../lib/api'
import { GoogleMap, LoadScript, Polyline, InfoWindow, Marker } from '@react-google-maps/api'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface ItineraryDayProps {
  date: string
  activities: Activity[]
  onEdit: (activity: Activity) => void
  onDelete: (activityId: number) => void
  onReorder: (activityIds: number[]) => void
  onAddActivity?: () => void
  canEdit: boolean
  paceBuffer?: {
    prePct: number
    postPct: number
  }
}

type TravelMode = 'driving' | 'walking' | 'transit'

type DirectionsData = {
  distanceText: string | null
  distanceValue: number | null
  durationText: string | null
  durationValue: number | null
  polyline: string | null
}

type SegmentRouteState = DirectionsData & { mode: TravelMode }

// Load both 'marker' (for AdvancedMarkerElement) and 'geometry' (for polyline decoding)
const GOOGLE_MAPS_MARKER_LIBRARIES = ['marker', 'geometry'] as any
const FIT_BOUNDS_PADDING = { top: 60, right: 60, bottom: 60, left: 60 } as any
const SINGLE_POINT_ZOOM = 14

const directionsCache = new Map<string, DirectionsData>()
const directionsInFlight = new Map<string, Promise<DirectionsData>>()

function buildDirectionsCacheKey(params: {
  originLat: number
  originLng: number
  destLat: number
  destLng: number
  mode: TravelMode
}) {
  const { originLat, originLng, destLat, destLng, mode } = params
  return `${originLat},${originLng}->${destLat},${destLng}::${mode}`
}

async function fetchDirections(params: {
  originLat: number
  originLng: number
  destLat: number
  destLng: number
  mode: TravelMode
}): Promise<DirectionsData> {
  const key = buildDirectionsCacheKey(params)

  const cached = directionsCache.get(key)
  if (cached) return cached

  const inflight = directionsInFlight.get(key)
  if (inflight) return inflight

  const promise = (async () => {
    const response = await api.get('/places/directions', { params })
    const data: DirectionsData = {
      distanceText: response.data.distanceText || null,
      distanceValue: typeof response.data.distanceValue === 'number' ? response.data.distanceValue : null,
      durationText: response.data.durationText || null,
      durationValue: typeof response.data.durationValue === 'number' ? response.data.durationValue : null,
      polyline: typeof response.data.polyline === 'string' ? response.data.polyline : null,
    }
    directionsCache.set(key, data)
    return data
  })()

  directionsInFlight.set(key, promise)

  try {
    return await promise
  } finally {
    directionsInFlight.delete(key)
  }
}

interface RouteSegmentProps {
  from: Activity
  to: Activity
  showDragPlaceholder: boolean
  segmentId: string
  mode: TravelMode
  onModeChange: (mode: TravelMode) => void
  paceBuffer: {
    prePct: number
    postPct: number
  }
  onRouteData: (segmentId: string, data: SegmentRouteState) => void
}

function RouteSegment({ from, to, showDragPlaceholder, segmentId, mode, onModeChange, paceBuffer, onRouteData }: RouteSegmentProps) {
  const { t, language } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [distanceText, setDistanceText] = useState<string | null>(null)
  const [durationText, setDurationText] = useState<string | null>(null)
  const [durationValue, setDurationValue] = useState<number | null>(null)
  const [_distanceValue, setDistanceValue] = useState<number | null>(null)

  const hasCoordinates =
    typeof from.lat === 'number' &&
    typeof from.lng === 'number' &&
    typeof to.lat === 'number' &&
    typeof to.lng === 'number'

  const locale = language === 'zh-TW' ? 'zh-TW' : 'en-US'

  const formatTime = (date: Date) => {
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  useEffect(() => {
    if (!hasCoordinates) {
      return
    }

    let cancelled = false

    const fetchRoute = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const data = await fetchDirections({
          originLat: from.lat as number,
          originLng: from.lng as number,
          destLat: to.lat as number,
          destLng: to.lng as number,
          mode,
        })

        if (cancelled) return

        setDistanceText(data.distanceText)
        setDistanceValue(data.distanceValue)
        setDurationText(data.durationText)
        setDurationValue(data.durationValue)

        onRouteData(segmentId, { mode, ...data })
      } catch (err: any) {
        if (cancelled) return
        setError(err.response?.data?.detail || t.route.error)
        setDistanceText(null)
        setDistanceValue(null)
        setDurationText(null)
        setDurationValue(null)
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchRoute()

    return () => {
      cancelled = true
    }
  }, [from.lat, from.lng, to.lat, to.lng, mode, t.route.error, hasCoordinates])

  const fromLabel = from.locationName || from.title
  const toLabel = to.locationName || to.title

  const applyBufferedDurationSec = (baseSec: number) => {
    const pre = Math.round(baseSec * paceBuffer.prePct)
    const post = Math.round(baseSec * paceBuffer.postPct)
    return { effectiveSec: baseSec + pre + post, bufferSec: pre + post }
  }

  // Transportation time block:
  // - Prefer start at previous activity endTime (if present), else startTime
  // - End time is computed using estimated durationValue from Directions API
  const transportStart = (from.endTime || from.startTime) ? new Date((from.endTime || from.startTime) as string) : null
  const buffered = durationValue !== null ? applyBufferedDurationSec(durationValue) : null
  const transportEnd =
    transportStart && buffered
      ? new Date(transportStart.getTime() + buffered.effectiveSec * 1000)
      : null

  const buildGoogleMapsUrl = () => {
    const origin =
      typeof from.lat === 'number' && typeof from.lng === 'number'
        ? `${from.lat},${from.lng}`
        : encodeURIComponent(from.address || from.locationName || from.title)

    const destination =
      typeof to.lat === 'number' && typeof to.lng === 'number'
        ? `${to.lat},${to.lng}`
        : encodeURIComponent(to.address || to.locationName || to.title)

    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=${mode}`
  }

  const handleOpenInMaps = () => {
    const url = buildGoogleMapsUrl()
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (!fromLabel || !toLabel) {
    return null
  }

  return (
    <div className="mt-3 flex gap-2 items-start">
      {/* Keep alignment with the draggable handle above */}
      {showDragPlaceholder && (
        <div className="p-2 text-transparent select-none" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="6" r="1.5" />
            <circle cx="15" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" />
            <circle cx="15" cy="18" r="1.5" />
          </svg>
        </div>
      )}

      <div className="flex-1 flex gap-4 items-center">
        {/* Transportation Time Block */}
        <div className="flex-shrink-0 w-24 bg-gradient-to-b from-violet-50/80 to-white border border-violet-200/55 rounded-xl px-2 py-2 flex items-center justify-center min-h-[64px] shadow-sm">
          {transportStart && transportEnd ? (
            <div className="text-sm text-slate-800 font-semibold text-center leading-tight flex flex-col items-center justify-center">
              <span className="whitespace-nowrap tabular-nums">{formatTime(transportStart)}</span>
              <span className="text-slate-300 text-xs my-0.5 rotate-90 leading-none">~</span>
              <span className="whitespace-nowrap tabular-nums">{formatTime(transportEnd)}</span>
            </div>
          ) : (
            <span className="text-xs text-slate-700 font-semibold text-center">
              {durationText || (isLoading ? t.route.loading : '—')}
            </span>
          )}
        </div>

        {/* Transportation Content */}
        <div className="flex-1 bg-gradient-to-b from-violet-50/35 to-white border border-violet-200/45 rounded-xl px-4 py-2 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="text-sm text-slate-600">
              <div className="font-semibold text-slate-800">
                {t.route.title}{' '}
                <span className="font-normal">
                  {t.route.between} {fromLabel} {t.route.and} {toLabel}
                </span>
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {isLoading && <span>{t.route.loading}</span>}
                {!isLoading && error && <span>{error}</span>}
                {!isLoading && !error && distanceText && durationText && (
                  <span>
                    {durationText}
                    {buffered && buffered.bufferSec > 0 && (
                      <>
                        {' '}
                        (+{Math.max(1, Math.round(buffered.bufferSec / 60))}
                        {language === 'zh-TW' ? '分 ' : 'm '}
                        {t.route.buffer})
                      </>
                    )}
                    {' '}({distanceText})
                  </span>
                )}
                {!isLoading && !error && !distanceText && !durationText && hasCoordinates && (
                  <span>{t.route.noRouteData}</span>
                )}
                {!hasCoordinates && (
                  <span>{t.route.noRouteData}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <span>{t.route.modeLabel}:</span>
                <select
                  value={mode}
                  onChange={(e) => onModeChange(e.target.value as TravelMode)}
                  className="border border-violet-200/55 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-violet-400"
                >
                  <option value="driving">{t.route.driving}</option>
                  <option value="walking">{t.route.walking}</option>
                  <option value="transit">{t.route.transit}</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleOpenInMaps}
                className="inline-flex items-center px-3 py-1.5 border border-violet-200/55 text-xs font-medium rounded-full text-slate-700 bg-violet-50/60 hover:bg-violet-100/40 transition"
              >
                {t.route.openInMaps}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SortableActivityItem({ activity, onEdit, onDelete, canEdit }: {
  activity: Activity
  onEdit: (activity: Activity) => void
  onDelete: (activityId: number) => void
  canEdit: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="flex gap-2 items-start">
      {/* Drag handle - only this part is draggable */}
      {canEdit && (
        <div
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 text-gray-400 hover:text-gray-600 touch-none"
          title="Drag to reorder"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="6" r="1.5" />
            <circle cx="15" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" />
            <circle cx="15" cy="18" r="1.5" />
          </svg>
        </div>
      )}
      {/* Activity card - clicks work normally */}
      <div className="flex-1">
        <ActivityCard
          activity={activity}
          onEdit={onEdit}
          onDelete={onDelete}
          canEdit={canEdit}
        />
      </div>
    </div>
  )
}

export default function ItineraryDay({
  date,
  activities,
  onEdit,
  onDelete,
  onReorder,
  onAddActivity,
  canEdit,
  paceBuffer = { prePct: 0.075, postPct: 0.075 },
}: ItineraryDayProps) {
  const { t, language } = useLanguage()
  const applyBufferedDurationSec = (baseSec: number) => {
    const pre = Math.round(baseSec * paceBuffer.prePct)
    const post = Math.round(baseSec * paceBuffer.postPct)
    return baseSec + pre + post
  }

  const [segmentModes, setSegmentModes] = useState<Record<string, TravelMode>>({})
  const [segmentRoutes, setSegmentRoutes] = useState<Record<string, SegmentRouteState>>({})
  const [showMap, setShowMap] = useState(false)
  const [selectedMarkerId, setSelectedMarkerId] = useState<number | null>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const mapMarkersRef = useRef<any[]>([])
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = activities.findIndex((a) => a.id === active.id)
      const newIndex = activities.findIndex((a) => a.id === over.id)

      const newActivities = arrayMove(activities, oldIndex, newIndex)
      onReorder(newActivities.map((a) => a.id))
    }
  }

  const dateObj = new Date(date)
  // Use the current language for date formatting
  const locale = language === 'zh-TW' ? 'zh-TW' : 'en-US'
  const formattedDate = dateObj.toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const dayPlaces = activities
    .filter((a) => typeof a.lat === 'number' && typeof a.lng === 'number')
    .map((a) => ({ id: a.id, title: a.title, address: a.address, lat: a.lat as number, lng: a.lng as number }))

  const mapPath = dayPlaces.map((p) => ({ lat: p.lat, lng: p.lng }))

  const decodePolyline = (encoded: string): Array<{ lat: number; lng: number }> => {
    // Use Google's official polyline decoder from the geometry library
    const g: any = (globalThis as any).google
    if (g?.maps?.geometry?.encoding?.decodePath) {
      try {
        const decoded = g.maps.geometry.encoding.decodePath(encoded)
        return decoded.map((p: any) => ({ lat: p.lat(), lng: p.lng() }))
      } catch (err) {
        console.warn('Failed to decode polyline with Google decoder, falling back to custom decoder', err)
      }
    }
    
    // Fallback to custom decoder if Google's decoder is not available
    let index = 0
    let lat = 0
    let lng = 0
    const coordinates: Array<{ lat: number; lng: number }> = []

    while (index < encoded.length) {
      let b: number
      let shift = 0
      let result = 0
      do {
        b = encoded.charCodeAt(index++) - 63
        result |= (b & 0x1f) << shift
        shift += 5
      } while (b >= 0x20)
      const dlat = (result & 1) ? ~(result >> 1) : (result >> 1)
      lat += dlat

      shift = 0
      result = 0
      do {
        b = encoded.charCodeAt(index++) - 63
        result |= (b & 0x1f) << shift
        shift += 5
      } while (b >= 0x20)
      const dlng = (result & 1) ? ~(result >> 1) : (result >> 1)
      lng += dlng

      coordinates.push({ lat: lat / 1e5, lng: lng / 1e5 })
    }

    return coordinates
  }

  const routePath = (() => {
    // Prefer real Directions polyline if available; else fall back to straight lines.
    const path: Array<{ lat: number; lng: number }> = []

    for (let i = 0; i < activities.length - 1; i++) {
      const from = activities[i]
      const to = activities[i + 1]
      const segmentId = `${from.id}-${to.id}`
      const mode = segmentModes[segmentId] || 'driving'
      const route = segmentRoutes[segmentId]
      if (!route || route.mode !== mode) continue

      if (route.polyline) {
        const decoded = decodePolyline(route.polyline)
        if (decoded.length > 0) {
          if (path.length > 0) decoded.shift() // avoid duplicate join point
          path.push(...decoded)
        }
      }
    }

    return path.length >= 2 ? path : mapPath
  })()

  const mapCenter =
    dayPlaces.length > 0
      ? { lat: dayPlaces[0].lat, lng: dayPlaces[0].lng }
      : { lat: 37.7749, lng: -122.4194 }

  const totals = (() => {
    let totalDurationSec = 0
    let totalDistanceM = 0

    for (let i = 0; i < activities.length - 1; i++) {
      const segmentId = `${activities[i].id}-${activities[i + 1].id}`
      const mode = segmentModes[segmentId] || 'driving'
      const route = segmentRoutes[segmentId]
      if (!route || route.mode !== mode) continue
      if (route.durationValue !== null) totalDurationSec += applyBufferedDurationSec(route.durationValue)
      if (route.distanceValue !== null) totalDistanceM += route.distanceValue
    }

    const formatDuration = (sec: number) => {
      if (sec <= 0) return '—'
      const minutes = Math.round(sec / 60)
      const h = Math.floor(minutes / 60)
      const m = minutes % 60
      if (h <= 0) return `${m}m`
      if (m === 0) return `${h}h`
      return `${h}h ${m}m`
    }

    const formatDistance = (meters: number) => {
      if (meters <= 0) return '—'
      if (meters < 1000) return `${Math.round(meters)} m`
      return `${(meters / 1000).toFixed(1)} km`
    }

    return {
      travelTimeText: formatDuration(totalDurationSec),
      travelDistanceText: formatDistance(totalDistanceM),
    }
  })()

  const scheduleConflicts = (() => {
    let conflicts = 0

    for (let i = 0; i < activities.length - 1; i++) {
      const from = activities[i]
      const to = activities[i + 1]

      const departStr = (from.endTime || from.startTime) as string | undefined
      const arriveTargetStr = to.startTime as string | undefined
      if (!departStr || !arriveTargetStr) continue

      const depart = new Date(departStr)
      const target = new Date(arriveTargetStr)
      if (Number.isNaN(depart.getTime()) || Number.isNaN(target.getTime())) continue

      const segmentId = `${from.id}-${to.id}`
      const mode = segmentModes[segmentId] || 'driving'
      const route = segmentRoutes[segmentId]
      if (!route || route.mode !== mode || route.durationValue === null) continue

      const arrive = new Date(depart.getTime() + applyBufferedDurationSec(route.durationValue) * 1000)
      if (arrive.getTime() > target.getTime()) {
        conflicts++
      }
    }

    return conflicts
  })()

  const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID
  const useAdvancedMarkers = !!mapId

  // Auto-fit map to include all day locations (while staying nicely zoomed in)
  useEffect(() => {
    if (!mapInstance) return
    if (!dayPlaces || dayPlaces.length === 0) return

    const g: any = (globalThis as any).google
    if (!g?.maps?.LatLngBounds) return

    if (dayPlaces.length === 1) {
      mapInstance.setCenter({ lat: dayPlaces[0].lat, lng: dayPlaces[0].lng })
      mapInstance.setZoom(SINGLE_POINT_ZOOM)
      return
    }

    const bounds = new g.maps.LatLngBounds()
    dayPlaces.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }))
    mapInstance.fitBounds(bounds, FIT_BOUNDS_PADDING)
  }, [mapInstance, dayPlaces, showMap])

  // Ensure route data exists when the day map is opened (so the route polyline can render).
  useEffect(() => {
    if (!showMap) return
    if (activities.length < 2) return

    let cancelled = false

    const run = async () => {
      for (let i = 0; i < activities.length - 1; i++) {
        const from = activities[i]
        const to = activities[i + 1]
        if (!(typeof from.lat === 'number' && typeof from.lng === 'number' && typeof to.lat === 'number' && typeof to.lng === 'number')) {
          continue
        }

        const segmentId = `${from.id}-${to.id}`
        const mode = segmentModes[segmentId] || 'driving'
        const existing = segmentRoutes[segmentId]
        if (existing && existing.mode === mode && existing.polyline) continue

        try {
          const data = await fetchDirections({
            originLat: from.lat,
            originLng: from.lng,
            destLat: to.lat,
            destLng: to.lng,
            mode,
          })

          if (cancelled) return
          setSegmentRoutes((prev) => ({ ...prev, [segmentId]: { mode, ...data } }))
        } catch {
          // ignore; segment UI will show error if needed
        }
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [showMap, activities, segmentModes, segmentRoutes])

  // Advanced Markers (google.maps.marker.AdvancedMarkerElement)
  useEffect(() => {
    if (!mapInstance) return
    if (!useAdvancedMarkers) return

    // Clear old markers
    mapMarkersRef.current.forEach((m) => {
      try {
        m.map = null
      } catch {
        // ignore
      }
    })
    mapMarkersRef.current = []

    const g: any = (globalThis as any).google
    const AdvancedMarkerElement = g?.maps?.marker?.AdvancedMarkerElement
    if (!AdvancedMarkerElement) {
      // If marker library isn't available, don't render markers (avoids crashing).
      return
    }

    dayPlaces.forEach((p, idx) => {
      const content = document.createElement('div')
      content.className =
        'w-7 h-7 rounded-full bg-white border border-violet-300 shadow-sm flex items-center justify-center text-xs font-semibold text-gray-900'
      content.textContent = String(idx + 1)

      const marker = new AdvancedMarkerElement({
        map: mapInstance,
        position: { lat: p.lat, lng: p.lng },
        content,
      })

      if (typeof marker.addListener === 'function') {
        marker.addListener('gmp-click', (e: any) => {
          // Prevent the click from also selecting underlying POIs (which opens Google’s default info window).
          if (e?.domEvent?.stopPropagation) e.domEvent.stopPropagation()
          if (e?.domEvent?.preventDefault) e.domEvent.preventDefault()
          setSelectedMarkerId(p.id)
        })
      } else if (content) {
        content.addEventListener('click', () => setSelectedMarkerId(p.id))
      }

      mapMarkersRef.current.push(marker)
    })

    return () => {
      mapMarkersRef.current.forEach((m) => {
        try {
          m.map = null
        } catch {
          // ignore
        }
      })
      mapMarkersRef.current = []
    }
  }, [mapInstance, dayPlaces])

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold">{formattedDate}</h3>
          {scheduleConflicts > 0 && (
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              {t.route.scheduleConflicts}: {scheduleConflicts}
            </span>
          )}
          {dayPlaces.length > 0 && (
            <div className="text-xs text-gray-500">
              <span className="mr-3">
                {t.route.travelTime}: <span className="font-medium text-gray-700">{totals.travelTimeText}</span>
              </span>
              <span>
                {t.route.travelDistance}: <span className="font-medium text-gray-700">{totals.travelDistanceText}</span>
              </span>
            </div>
          )}
        </div>
        {canEdit && onAddActivity && (
          <button
            onClick={onAddActivity}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
          >
            + {t.activity.addActivity}
          </button>
        )}
      </div>

      {dayPlaces.length > 0 && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowMap((v) => !v)}
            className="text-sm font-medium text-violet-700 hover:text-violet-800"
          >
            {showMap ? t.route.hideMap : t.route.showMap}
          </button>

          {showMap && (
            <div className="mt-3 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="font-semibold text-gray-800">{t.route.mapTitle}</div>
              </div>
              {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
                <LoadScript
                  googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                  // Load 'marker' for AdvancedMarkerElement (if Map ID is configured)
                  // Load 'geometry' for polyline decoding (always needed)
                  libraries={useAdvancedMarkers ? GOOGLE_MAPS_MARKER_LIBRARIES : ['geometry']}
                >
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '320px' }}
                    center={mapCenter}
                    zoom={12}
                    options={{
                      ...(useAdvancedMarkers ? ({ mapId } as any) : {}),
                      // Prevent Google POI clicks from opening the default info window (avoids "double windows").
                      clickableIcons: false,
                    } as any}
                    onLoad={(map) => {
                      setMapInstance(map)
                      // Force-disable POI clicks on the live map instance (extra safety)
                      map.setOptions({ clickableIcons: false })
                    }}
                    onUnmount={() => setMapInstance(null)}
                  >
                    {routePath.length >= 2 && (
                      <Polyline
                        path={routePath}
                        options={{
                          strokeColor: '#7C3AED',
                          strokeOpacity: 0.8,
                          strokeWeight: 5,
                        }}
                      />
                    )}

                    {/* Fallback markers (legacy) when Map ID is not configured */}
                    {!useAdvancedMarkers &&
                      dayPlaces.map((p, idx) => (
                        <Marker
                          key={p.id}
                          position={{ lat: p.lat, lng: p.lng }}
                          label={{ text: String(idx + 1), color: '#111827', fontSize: '12px', fontWeight: '600' }}
                          onClick={() => setSelectedMarkerId(p.id)}
                        />
                      ))}

                    {selectedMarkerId !== null && (() => {
                      const p = dayPlaces.find((x) => x.id === selectedMarkerId)
                      if (!p) return null
                      return (
                        <InfoWindow
                          position={{ lat: p.lat, lng: p.lng }}
                          onCloseClick={() => setSelectedMarkerId(null)}
                        >
                          <div>
                            <div className="font-semibold">{p.title}</div>
                            {p.address && <div className="text-sm text-gray-600">{p.address}</div>}
                          </div>
                        </InfoWindow>
                      )
                    })()}
                  </GoogleMap>
                </LoadScript>
              ) : (
                <div className="flex items-center justify-center h-80 bg-gray-50">
                  <div className="text-sm text-gray-500">{t.route.mapsNotConfigured}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {activities.length === 0 ? (
        <p className="text-gray-500 text-sm">{t.activity.noActivitiesForDay}</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={activities.map((a) => a.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <div key={activity.id}>
                  <SortableActivityItem
                    activity={activity}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    canEdit={canEdit}
                  />
                  {index < activities.length - 1 && (
                    (() => {
                      const segmentId = `${activity.id}-${activities[index + 1].id}`
                      const mode = segmentModes[segmentId] || 'driving'
                      return (
                    <RouteSegment
                      from={activity}
                      to={activities[index + 1]}
                      showDragPlaceholder={canEdit}
                      segmentId={segmentId}
                      mode={mode}
                      onModeChange={(nextMode) =>
                        setSegmentModes((prev) => ({ ...prev, [segmentId]: nextMode }))
                      }
                      paceBuffer={paceBuffer}
                      onRouteData={(id, data) =>
                        setSegmentRoutes((prev) => ({ ...prev, [id]: data }))
                      }
                    />
                      )
                    })()
                  )}
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}

