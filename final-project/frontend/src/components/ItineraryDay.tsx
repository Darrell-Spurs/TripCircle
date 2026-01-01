import { useEffect, useRef, useState, useCallback } from 'react'
import { Activity } from '../types'
import ActivityCard from './ActivityCard'
import { useLanguage } from '../context/LanguageContext'
import api from '../lib/api'
import TransportationTimeEditor from './TransportationTimeEditor'
import { useTransportationSegment, useUpdateTransportationSegment, useDeleteTransportationSegment } from '../hooks/useTransportationSegment'
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
  onUpdateActivity?: (activityId: number, data: { startTime?: string; endTime?: string }) => Promise<void>
  canEdit: boolean
  paceBuffer?: {
    prePct: number
    postPct: number
  }
  initialSegmentModes?: Record<string, TravelMode> // Initial segment modes (e.g., from ActivityModal)
  onUpdateScheduleTime?: (activityId: number) => Promise<void> // Update schedule time for a single activity
  onUpdateAllScheduleTimes?: (date: string) => Promise<void> // Update schedule times for all activities in the day
}

type TravelMode = 'driving' | 'walking' | 'bicycling' | 'transit'

type DirectionsData = {
  distanceText: string | null
  distanceValue: number | null
  durationText: string | null
  durationValue: number | null
  polyline: string | null
  steps?: import('../types').RouteStep[]
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
  departureTime?: number
}) {
  const { originLat, originLng, destLat, destLng, mode, departureTime } = params
  const timeKey = departureTime ? `::${departureTime}` : ''
  return `${originLat},${originLng}->${destLat},${destLng}::${mode}${timeKey}`
}

async function fetchDirections(params: {
  originLat: number
  originLng: number
  destLat: number
  destLng: number
  mode: TravelMode
  departureTime?: number
  language?: string
}): Promise<DirectionsData> {
  const key = buildDirectionsCacheKey(params)

  const cached = directionsCache.get(key)
  if (cached) return cached

  const inflight = directionsInFlight.get(key)
  if (inflight) return inflight

  const promise = (async () => {
    const apiParams: any = {
      originLat: params.originLat,
      originLng: params.originLng,
      destLat: params.destLat,
      destLng: params.destLng,
      mode: params.mode,
    }
    if (params.departureTime) {
      apiParams.departureTime = params.departureTime.toString()
    }
    if (params.language) {
      apiParams.language = params.language
    }
    const response = await api.get('/places/directions', { params: apiParams })
    
    // Validate response structure
    if (!response.data) {
      console.error('[fetchDirections] No data in response:', response)
      throw new Error('Invalid response from directions API')
    }
    
    const data: DirectionsData = {
      distanceText: response.data.distanceText || null,
      distanceValue: typeof response.data.distanceValue === 'number' ? response.data.distanceValue : null,
      durationText: response.data.durationText || null,
      durationValue: typeof response.data.durationValue === 'number' ? response.data.durationValue : null,
      polyline: typeof response.data.polyline === 'string' ? response.data.polyline : null,
      steps: Array.isArray(response.data.steps) ? response.data.steps : undefined,
    }
    
    console.log('[fetchDirections] Parsed data:', {
      hasDistance: !!data.distanceText,
      hasDuration: !!data.durationText,
      durationValue: data.durationValue,
      hasPolyline: !!data.polyline,
      stepsCount: data.steps?.length || 0,
    })
    
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
  canEdit?: boolean
}

// 通用的路線名稱本地化映射表（處理 API 返回英文的情況）
function localizeRouteName(lineName: string, language: string): string {
  if (!lineName || language !== 'zh-TW') {
    return lineName
  }
  
  // 常見的台灣捷運/地鐵路線名稱映射
  const routeNameMap: Record<string, string> = {
    'Bannan Line': '板南線',
    'Wenhu Line': '文湖線',
    'Songshan-Xindian Line': '松山新店線',
    'Zhonghe-Xinlu Line': '中和新蘆線',
    'Tamsui-Xinyi Line': '淡水信義線',
    'Circular Line': '環狀線',
    'Airport Line': '機場線',
    'Taoyuan Airport MRT': '桃園機場捷運',
    // 可以繼續添加更多映射
  }
  
  // 檢查是否有映射
  const mapped = routeNameMap[lineName]
  if (mapped) {
    return mapped
  }
  
  // 如果包含 "Line"，嘗試提取並轉換
  if (lineName.includes(' Line')) {
    const baseName = lineName.replace(' Line', '')
    // 可以添加更多智能轉換邏輯
  }
  
  return lineName
}

function RouteSegment({ from, to, showDragPlaceholder, segmentId, mode, onModeChange, paceBuffer, onRouteData, canEdit = false }: RouteSegmentProps) {
  const { t, language } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [distanceText, setDistanceText] = useState<string | null>(null)
  const [durationText, setDurationText] = useState<string | null>(null)
  const [durationValue, setDurationValue] = useState<number | null>(null)
  const [_distanceValue, setDistanceValue] = useState<number | null>(null)
  const [steps, setSteps] = useState<import('../types').RouteStep[]>([])
  const [showSteps, setShowSteps] = useState(false)
  const [showTimeEditor, setShowTimeEditor] = useState(false)
  
  // Load transportation segment from backend
  const { data: segment } = useTransportationSegment(from.id, to.id)
  const updateSegment = useUpdateTransportationSegment()
  const deleteSegment = useDeleteTransportationSegment()
  
  const manualStartTime = segment?.manualStartTime || null
  const manualEndTime = segment?.manualEndTime || null
  const hasManualOverride = segment?.isManualOverride || false
  
  // Use saved transportation mode from database, or fall back to prop mode, or default to 'driving'
  const savedMode = segment?.transportationMode || mode || 'driving'
  
  // Sync saved mode with parent component when segment loads
  useEffect(() => {
    if (segment?.transportationMode && segment.transportationMode !== mode) {
      onModeChange(segment.transportationMode as TravelMode)
    }
  }, [segment?.transportationMode, mode, onModeChange])

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

    // Don't fetch route if manual override is active
    if (hasManualOverride) {
      setIsLoading(false)
      setError(null)
      return
    }

    let cancelled = false

    const fetchRoute = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Calculate departure time from previous activity's end time (or start time if no end time)
        // If the time is in the past, move it to the same time in the nearest future
        let departureTime: number | undefined
        const transportStart = (from.endTime || from.startTime) ? new Date((from.endTime || from.startTime) as string) : null
        if (transportStart && !isNaN(transportStart.getTime())) {
          const now = new Date()
          let departureDate = new Date(transportStart)
          
          // If the departure time is in the past, move it to the same time in the nearest future
          if (departureDate < now) {
            // Get the time components (hours, minutes, seconds)
            const hours = departureDate.getHours()
            const minutes = departureDate.getMinutes()
            const seconds = departureDate.getSeconds()
            
            // Create a new date with today's date but the same time
            departureDate = new Date(now)
            departureDate.setHours(hours, minutes, seconds, 0)
            
            // If it's still in the past (e.g., it's 10pm now but we set it to 5pm today), move to tomorrow
            if (departureDate < now) {
              departureDate.setDate(departureDate.getDate() + 1)
            }
          }
          
          // Convert to Unix timestamp in seconds
          departureTime = Math.floor(departureDate.getTime() / 1000)
        }

        const data = await fetchDirections({
          originLat: from.lat as number,
          originLng: from.lng as number,
          destLat: to.lat as number,
          destLng: to.lng as number,
          mode,
          departureTime,
          language: language, // 傳遞語言參數以獲取本地化的路線名稱
        })

        if (cancelled) return

        setDistanceText(data.distanceText)
        setDistanceValue(data.distanceValue)
        setDurationText(data.durationText)
        setDurationValue(data.durationValue)
        setSteps(data.steps || [])

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
  }, [from.lat, from.lng, to.lat, to.lng, mode, from.endTime, from.startTime, t.route.error, hasCoordinates, hasManualOverride, language, segmentId, onRouteData])

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

    // Include departure time if available
    const transportStart = (from.endTime || from.startTime) ? new Date((from.endTime || from.startTime) as string) : null
    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=${mode}`
    
    if (transportStart && !isNaN(transportStart.getTime())) {
      // Format as ISO 8601 for Google Maps
      const isoTime = transportStart.toISOString()
      url += `&departure_time=${isoTime}`
    }

    return url
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
        <div className="flex-shrink-0 w-24 bg-gradient-to-b from-violet-50/80 to-white border border-violet-200/55 rounded-xl px-2 py-2 flex items-center justify-center min-h-[64px] shadow-sm relative">
          {(manualStartTime && manualEndTime) || (transportStart && transportEnd) ? (
            <div className="text-sm text-slate-800 font-semibold text-center leading-tight flex flex-col items-center justify-center">
              <span className="whitespace-nowrap tabular-nums">
                {manualStartTime ? formatTime(new Date(manualStartTime)) : formatTime(transportStart!)}
              </span>
              <span className="text-slate-300 text-xs my-0.5 rotate-90 leading-none">~</span>
              <span className="whitespace-nowrap tabular-nums">
                {manualEndTime ? formatTime(new Date(manualEndTime)) : formatTime(transportEnd!)}
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-700 font-semibold text-center">
              {durationText || (isLoading ? t.route.loading : '—')}
            </span>
          )}
          {/* Edit button */}
          {canEdit && (transportStart || transportEnd) && (
            <button
              type="button"
              onClick={() => setShowTimeEditor(true)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-violet-100 hover:bg-violet-200 text-violet-600 flex items-center justify-center text-xs"
              title={t.route.editTime || 'Edit time'}
            >
              ✎
            </button>
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
                {!hasManualOverride && isLoading && <span>{t.route.loading}</span>}
                {!hasManualOverride && !isLoading && error && <span>{error}</span>}
                {!hasManualOverride && !isLoading && !error && distanceText && durationText && (
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
                {!hasManualOverride && !isLoading && !error && !distanceText && !durationText && hasCoordinates && (
                  <span>{t.route.noRouteData}</span>
                )}
                {!hasManualOverride && !hasCoordinates && (
                  <span>{t.route.noRouteData}</span>
                )}
              </div>
              {/* Step-by-step transportation indicator - Only show for transit mode */}
              {mode === 'transit' && steps.length > 0 && (
                <div className="mt-2 text-xs text-slate-600">
                  {(() => {
                    // 合併連續的步行步驟用於摘要顯示
                    const summarySteps: Array<{ type: 'walk' | 'transit', duration: number, label: string }> = []
                    let walkGroup: import('../types').RouteStep[] = []
                    
                    for (let i = 0; i < steps.length; i++) {
                      const step = steps[i]
                      
                      if (step.travelMode === 'WALK') {
                        walkGroup.push(step)
                      } else {
                        // 遇到非步行步驟，先處理累積的步行步驟
                        if (walkGroup.length > 0) {
                          const totalDuration = walkGroup.reduce((sum, s) => {
                            return sum + (parseInt(s.duration || '0', 10) || 0)
                          }, 0)
                          const durationMinutes = Math.round(totalDuration / 60)
                          if (durationMinutes > 0) {
                            summarySteps.push({
                              type: 'walk',
                              duration: durationMinutes,
                              label: `${t.route.walk || 'Walk'} ${durationMinutes}${language === 'zh-TW' ? '分' : ' min'}`,
                            })
                          }
                          walkGroup = []
                        }
                        
                        // 處理 transit 步驟
                        if (step.transitDetails || step.travelMode === 'TRANSIT') {
                          const vehicleTypeMap: Record<string, string> = {
                            'BUS': t.route.vehicleTypeBus,
                            'SUBWAY': t.route.vehicleTypeSubway,
                            'TRAIN': t.route.vehicleTypeTrain,
                            'TRAM': t.route.vehicleTypeTram,
                            'HIGH_SPEED_TRAIN': t.route.vehicleTypeHighSpeedTrain,
                            'FERRY': t.route.vehicleTypeFerry,
                            'HEAVY_RAIL': t.route.vehicleTypeHeavyRail,
                            'LIGHT_RAIL': t.route.vehicleTypeLightRail,
                            'MONORAIL': t.route.vehicleTypeMonorail,
                            'CABLE_CAR': t.route.vehicleTypeCableCar,
                          }
                          const vehicleTypeText = step.transitDetails?.vehicleType 
                            ? (vehicleTypeMap[step.transitDetails.vehicleType] || step.transitDetails.vehicleType)
                            : t.route.transit
                          
                          const durationMinutes = step.duration ? Math.round(parseInt(step.duration, 10) / 60) : 0
                          
                          // 優先顯示路線名稱（班號），如果沒有才顯示起點站→終點站
                          // 確保 lineName 不是空字符串
                          let routeInfo = ''
                          if (step.transitDetails?.lineName && step.transitDetails.lineName.trim() !== '') {
                            routeInfo = step.transitDetails.lineName.trim()
                          } else if (step.transitDetails?.fromStation && step.transitDetails?.toStation) {
                            routeInfo = `${step.transitDetails.fromStation} → ${step.transitDetails.toStation}`
                          }
                          
                          // 顯示格式：交通方式 路線名稱 時間（如：公車 202 5分 或 地鐵 板南線 10分）
                          let label = vehicleTypeText
                          if (routeInfo) {
                            label += ` ${routeInfo}`
                          }
                          if (durationMinutes > 0) {
                            label += ` ${durationMinutes}${language === 'zh-TW' ? '分' : ' min'}`
                          }
                          
                          summarySteps.push({
                            type: 'transit',
                            duration: durationMinutes,
                            label: label,
                          })
                        }
                      }
                    }
                    
                    // 處理最後的步行步驟組
                    if (walkGroup.length > 0) {
                      const totalDuration = walkGroup.reduce((sum, s) => {
                        return sum + (parseInt(s.duration || '0', 10) || 0)
                      }, 0)
                      const durationMinutes = Math.round(totalDuration / 60)
                      if (durationMinutes > 0) {
                        summarySteps.push({
                          type: 'walk',
                          duration: durationMinutes,
                          label: `${t.route.walk || 'Walk'} ${durationMinutes}${language === 'zh-TW' ? '分' : ' min'}`,
                        })
                      }
                    }
                    
                    return (
                      <>
                        {/* 簡化摘要顯示 */}
                        <div className="italic">
                          {summarySteps.map((step, idx) => (
                            <span key={idx}>
                              {step.label}
                              {idx < summarySteps.length - 1 && ' → '}
                            </span>
                          ))}
                        </div>
                        {/* 顯示詳情按鈕 */}
                        <button
                          type="button"
                          onClick={() => setShowSteps(!showSteps)}
                          className="mt-1 text-violet-600 hover:text-violet-700 hover:underline transition flex items-center gap-1 text-xs"
                        >
                          {showSteps ? (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                              <span>{t.route.hideSteps || 'Hide details'}</span>
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                              <span>{t.route.showSteps || 'Show details'}</span>
                            </>
                          )}
                        </button>
                      </>
                    )
                  })()}
                  {showSteps && (() => {
                    // 合併連續的步行步驟
                    const processedSteps: (import('../types').RouteStep & { isMergedWalk?: boolean })[] = []
                    let walkGroup: import('../types').RouteStep[] = []
                    
                    for (let i = 0; i < steps.length; i++) {
                      const step = steps[i]
                      
                      if (step.travelMode === 'WALK') {
                        walkGroup.push(step)
                      } else {
                        // 遇到非步行步驟，先處理累積的步行步驟
                        if (walkGroup.length > 0) {
                          const totalDistance = walkGroup.reduce((sum, s) => sum + (s.distanceMeters || 0), 0)
                          const totalDuration = walkGroup.reduce((sum, s) => {
                            return sum + (parseInt(s.duration || '0', 10) || 0)
                          }, 0)
                          
                          processedSteps.push({
                            ...walkGroup[0],
                            distanceMeters: totalDistance,
                            duration: totalDuration.toString(),
                            isMergedWalk: true,
                          })
                          walkGroup = []
                        }
                        processedSteps.push(step)
                      }
                    }
                    
                    // 處理最後的步行步驟組
                    if (walkGroup.length > 0) {
                      const totalDistance = walkGroup.reduce((sum, s) => sum + (s.distanceMeters || 0), 0)
                      const totalDuration = walkGroup.reduce((sum, s) => {
                        return sum + (parseInt(s.duration || '0', 10) || 0)
                      }, 0)
                      
                      processedSteps.push({
                        ...walkGroup[0],
                        distanceMeters: totalDistance,
                        duration: totalDuration.toString(),
                        isMergedWalk: true,
                      })
                    }
                    
                    return (
                      <div className="mt-2 pl-2 border-l-2 border-violet-200 space-y-2">
                        {processedSteps.map((step, idx) => {
                          // Transit 步驟
                          if (step.travelMode === 'TRANSIT' || step.transitDetails) {
                            const vehicleTypeMap: Record<string, string> = {
                              'BUS': t.route.vehicleTypeBus,
                              'SUBWAY': t.route.vehicleTypeSubway,
                              'TRAIN': t.route.vehicleTypeTrain,
                              'TRAM': t.route.vehicleTypeTram,
                              'HIGH_SPEED_TRAIN': t.route.vehicleTypeHighSpeedTrain,
                              'FERRY': t.route.vehicleTypeFerry,
                              'HEAVY_RAIL': t.route.vehicleTypeHeavyRail,
                              'LIGHT_RAIL': t.route.vehicleTypeLightRail,
                              'MONORAIL': t.route.vehicleTypeMonorail,
                              'CABLE_CAR': t.route.vehicleTypeCableCar,
                            }
                            const vehicleTypeText = step.transitDetails?.vehicleType 
                              ? (vehicleTypeMap[step.transitDetails.vehicleType] || step.transitDetails.vehicleType)
                              : ''
                            
                            return (
                              <div key={idx} className="text-xs">
                                <div className="flex flex-col gap-1">
                                  {/* 主要資訊：起點站 → 終點站 */}
                                  <span className="font-medium text-slate-800">
                                    {step.transitDetails?.fromStation && step.transitDetails?.toStation
                                      ? `${step.transitDetails.fromStation} → ${step.transitDetails.toStation}`
                                      : step.transitDetails?.lineName || t.route.transit}
                                  </span>
                                  {/* 詳細資訊：交通工具類型、路線名稱、時間 */}
                                  <div className="flex flex-wrap gap-2 text-slate-600">
                                    {vehicleTypeText && (
                                      <span className="font-medium">{vehicleTypeText}</span>
                                    )}
                                    {step.transitDetails?.lineName && (
                                      <span className="font-medium text-violet-600">{step.transitDetails.lineName}</span>
                                    )}
                                    {step.duration && (
                                      <span>
                                        {Math.round(parseInt(step.duration, 10) / 60)}{language === 'zh-TW' ? '分' : ' min'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          }
                          
                          // 步行步驟（已合併）
                          if (step.travelMode === 'WALK') {
                            return (
                              <div key={idx} className="text-xs">
                                <span>
                                  {t.route.walk || 'Walk'} {step.distanceMeters ? (step.distanceMeters < 1000 ? `${step.distanceMeters}m` : `${(step.distanceMeters / 1000).toFixed(1)}km`) : ''}
                                  {step.duration && ` (${Math.round(parseInt(step.duration, 10) / 60)}${language === 'zh-TW' ? '分' : ' min'})`}
                                </span>
                              </div>
                            )
                          }
                          
                          // 其他步驟
                          return (
                            <div key={idx} className="text-xs">
                              <span>{step.instruction || step.travelMode}</span>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <span>{t.route.modeLabel}:</span>
                <select
                  value={hasManualOverride ? 'custom' : savedMode}
                  onChange={async (e) => {
                    const selectedValue = e.target.value
                    if (selectedValue === 'custom') {
                      // Don't allow selecting 'custom' directly
                      return
                    }
                    const newMode = selectedValue as TravelMode
                    onModeChange(newMode)
                    // Save mode to backend and clear manual override if switching from custom
                    try {
                      await updateSegment.mutateAsync({
                        fromActivityId: from.id,
                        toActivityId: to.id,
                        data: { 
                          transportationMode: newMode,
                          isManualOverride: false, // Clear manual override when selecting a mode
                        },
                      })
                    } catch (error) {
                      console.error('Failed to save transportation mode:', error)
                      // Revert on error
                      onModeChange(savedMode as TravelMode)
                    }
                  }}
                  className="border border-violet-200/55 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-violet-400"
                >
                  {hasManualOverride && (
                    <option value="custom">{t.route.custom}</option>
                  )}
                  <option value="driving">{t.route.driving}</option>
                  <option value="walking">{t.route.walking}</option>
                  <option value="bicycling">{t.route.bicycling || 'Bicycling'}</option>
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
      
      {/* Transportation Time Editor Modal */}
      <TransportationTimeEditor
        isOpen={showTimeEditor}
        onClose={() => setShowTimeEditor(false)}
        onSave={async (start, end) => {
          // Combine with current date to create full datetime strings
          const dateStr = from.date.split('T')[0]
          const startDateTime = new Date(`${dateStr}T${start}:00`).toISOString()
          const endDateTime = new Date(`${dateStr}T${end}:00`).toISOString()
          
          try {
            await updateSegment.mutateAsync({
              fromActivityId: from.id,
              toActivityId: to.id,
              data: {
                manualStartTime: startDateTime,
                manualEndTime: endDateTime,
                isManualOverride: true,
              },
            })
            setShowTimeEditor(false)
          } catch (error) {
            console.error('Failed to save transportation time:', error)
            alert(t.route.saveFailed || 'Failed to save transportation time')
          }
        }}
        onReset={async () => {
          try {
            await deleteSegment.mutateAsync({
              fromActivityId: from.id,
              toActivityId: to.id,
            })
            setShowTimeEditor(false)
          } catch (error) {
            console.error('Failed to reset transportation time:', error)
            alert(t.route.resetFailed || 'Failed to reset transportation time')
          }
        }}
        currentStartTime={transportStart ? transportStart.toISOString() : undefined}
        currentEndTime={transportEnd ? transportEnd.toISOString() : undefined}
        hasManualOverride={hasManualOverride}
      />
    </div>
  )
}

function SortableActivityItem({ activity, onEdit, onDelete, canEdit, hasConflict, onUpdateScheduleTime }: {
  activity: Activity
  onEdit: (activity: Activity) => void
  onDelete: (activityId: number) => void
  canEdit: boolean
  hasConflict?: boolean
  onUpdateScheduleTime?: (activityId: number) => Promise<void>
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
          hasConflict={hasConflict}
          onUpdateScheduleTime={onUpdateScheduleTime}
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
  onUpdateActivity,
  canEdit,
  paceBuffer = { prePct: 0.075, postPct: 0.075 },
  initialSegmentModes = {},
  onUpdateScheduleTime,
  onUpdateAllScheduleTimes,
}: ItineraryDayProps) {
  const { t, language } = useLanguage()
  const applyBufferedDurationSec = (baseSec: number) => {
    const pre = Math.round(baseSec * paceBuffer.prePct)
    const post = Math.round(baseSec * paceBuffer.postPct)
    return baseSec + pre + post
  }

  const [segmentModes, setSegmentModes] = useState<Record<string, TravelMode>>(initialSegmentModes)
  const [isUpdatingAllScheduleTimes, setIsUpdatingAllScheduleTimes] = useState(false)
  const updateSegment = useUpdateTransportationSegment()
  
  // Load saved transportation modes from backend for all segments
  useEffect(() => {
    const loadSavedModes = async () => {
      const savedModes: Record<string, TravelMode> = {}
      for (let i = 0; i < activities.length - 1; i++) {
        const from = activities[i]
        const to = activities[i + 1]
        const segmentId = `${from.id}-${to.id}`
        try {
          const response = await api.get(`/activities/transportation/${from.id}/${to.id}`)
          if (response.data?.transportationMode) {
            savedModes[segmentId] = response.data.transportationMode as TravelMode
          }
        } catch (error: any) {
          // 404 is expected if no segment exists, use default
          if (error.response?.status !== 404) {
            console.error('Error loading transportation mode:', error)
          }
        }
      }
      if (Object.keys(savedModes).length > 0) {
        setSegmentModes((prev) => ({ ...prev, ...savedModes }))
      }
    }
    
    if (activities.length > 1) {
      loadSavedModes()
    }
  }, [activities])
  
  // Update segment modes when initialSegmentModes changes (e.g., when a new activity is created with a transport mode)
  useEffect(() => {
    if (Object.keys(initialSegmentModes).length > 0) {
      setSegmentModes((prev) => ({ ...prev, ...initialSegmentModes }))
    }
  }, [initialSegmentModes])
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
    const conflictMap = new Map<number, boolean>() // activityId -> hasConflict
    let totalConflicts = 0

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
        totalConflicts++
        conflictMap.set(to.id, true) // Mark the destination activity as having a conflict
      }
    }

    return { count: totalConflicts, map: conflictMap }
  })()

  // Auto-update subsequent activities' start times when transportation time changes
  const previousRoutesRef = useRef<Record<string, SegmentRouteState>>({})
  useEffect(() => {
    if (!onUpdateActivity || !canEdit) return

    // Compare current routes with previous routes to detect changes
    const hasChanged = Object.keys(segmentRoutes).some((segmentId) => {
      const current = segmentRoutes[segmentId]
      const previous = previousRoutesRef.current[segmentId]
      if (!current || !previous) return false
      // Check if duration changed significantly (more than 1 minute difference)
      if (current.durationValue !== null && previous.durationValue !== null) {
        const diff = Math.abs(current.durationValue - previous.durationValue)
        return diff > 60 // More than 1 minute difference
      }
      return current.durationValue !== previous.durationValue
    })

    if (!hasChanged) {
      previousRoutesRef.current = { ...segmentRoutes }
      return
    }

    // Update subsequent activities' start times based on new transportation times
    const updateSubsequentActivities = async () => {
      for (let i = 0; i < activities.length - 1; i++) {
        const from = activities[i]
        const to = activities[i + 1]
        const segmentId = `${from.id}-${to.id}`
        const route = segmentRoutes[segmentId]

        if (!route || route.durationValue === null) continue

        const departStr = (from.endTime || from.startTime) as string | undefined
        if (!departStr) continue

        const depart = new Date(departStr)
        if (Number.isNaN(depart.getTime())) continue

        // Calculate new arrival time (departure + transportation time + 1 minute buffer)
        const transportTimeMs = (route.durationValue + 60) * 1000
        const newStartTime = new Date(depart.getTime() + transportTimeMs)

        // Only update if the new time is different from current time (more than 1 minute difference)
        if (to.startTime) {
          const currentStartTime = new Date(to.startTime)
          const timeDiff = Math.abs(newStartTime.getTime() - currentStartTime.getTime())
          if (timeDiff < 60000) continue // Less than 1 minute difference, skip update
        }

        try {
          await onUpdateActivity(to.id, {
            startTime: newStartTime.toISOString(),
          })
        } catch (error) {
          console.error('Failed to update activity start time:', error)
        }
      }
    }

    updateSubsequentActivities()
    previousRoutesRef.current = { ...segmentRoutes }
  }, [segmentRoutes, activities, onUpdateActivity, canEdit])

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
            language: language, // 傳遞語言參數以獲取本地化的路線名稱
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
          {scheduleConflicts.count > 0 && (
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              {t.route.scheduleConflicts}: {scheduleConflicts.count}
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
        <div className="flex items-center gap-3">
          {canEdit && onUpdateAllScheduleTimes && activities.length > 0 && (
            <button
              onClick={async () => {
                setIsUpdatingAllScheduleTimes(true)
                try {
                  await onUpdateAllScheduleTimes(date)
                } finally {
                  setIsUpdatingAllScheduleTimes(false)
                }
              }}
              disabled={isUpdatingAllScheduleTimes}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-wait"
              title={t.activity.updateAllScheduleTimes || 'Update All Schedule Times'}
            >
              {isUpdatingAllScheduleTimes ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              {t.activity.updateAllScheduleTimes || 'Update All Times'}
            </button>
          )}
          {canEdit && onAddActivity && (
            <button
              onClick={onAddActivity}
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
            >
              + {t.activity.addActivity}
            </button>
          )}
        </div>
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
                    hasConflict={scheduleConflicts.map.get(activity.id)}
                    onUpdateScheduleTime={onUpdateScheduleTime}
                  />
                  {/* Quick Add Button - Below activity card with margin, centered */}
                  {canEdit && onAddActivity && (
                    <div 
                      className="flex justify-center mt-2"
                      style={{ 
                        marginLeft: 'calc(6rem + 1rem)',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => onAddActivity?.()}
                        className="px-3 py-1 rounded-lg border-2 border-gray-300 bg-white text-gray-600 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition flex items-center justify-center text-sm font-medium shadow-sm"
                        title={t.activity.addActivity}
                      >
                        +
                      </button>
                    </div>
                  )}
                  {index < activities.length - 1 && (
                    (() => {
                      const segmentId = `${activity.id}-${activities[index + 1].id}`
                      return (
                    <RouteSegment
                      from={activity}
                      to={activities[index + 1]}
                      showDragPlaceholder={canEdit}
                      canEdit={canEdit}
                      segmentId={segmentId}
                      mode={segmentModes[segmentId] || 'driving'}
                      onModeChange={async (nextMode) => {
                        setSegmentModes((prev) => ({ ...prev, [segmentId]: nextMode }))
                        // Save mode to backend
                        try {
                          await updateSegment.mutateAsync({
                            fromActivityId: activity.id,
                            toActivityId: activities[index + 1].id,
                            data: { transportationMode: nextMode },
                          })
                        } catch (error) {
                          console.error('Failed to save transportation mode:', error)
                          // Revert on error
                          setSegmentModes((prev) => ({ ...prev, [segmentId]: prev[segmentId] || 'driving' }))
                        }
                      }}
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

