import { useState } from 'react'
import { Activity } from '../types'
import { useLanguage } from '../context/LanguageContext'
import ActivityPreferenceButtons from './ActivityPreferenceButtons'
import ActivityCommentsPanel from './ActivityCommentsPanel'
import { useActivityPreferences } from '../hooks/useActivityPreferences'
import { useAuth } from '../context/AuthContext'
import { formatCommentText } from '../utils/formatComment'

interface ActivityCardProps {
  activity: Activity
  onEdit: (activity: Activity) => void
  onDelete: (activityId: number) => void
  canEdit: boolean
  hasConflict?: boolean
  onUpdateScheduleTime?: (activityId: number) => Promise<void>
  simpleView?: boolean
  hideParticipants?: boolean
  isViewOnly?: boolean
}

export default function ActivityCard({ activity, onEdit, onDelete, canEdit, hasConflict = false, onUpdateScheduleTime, simpleView = false, hideParticipants = false, isViewOnly = false }: ActivityCardProps) {
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isUpdatingSchedule, setIsUpdatingSchedule] = useState(false)
  const { data: preferencesData } = useActivityPreferences(activity.id)
  
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    if (Number.isNaN(date.getTime())) return ''

    const locale = language === 'zh-TW' ? 'zh-TW' : 'en-US'
    // Always render 24-hour clock (e.g. 13:05)
    return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  const start = activity.startTime ? formatTime(activity.startTime) : ''
  const end = activity.endTime ? formatTime(activity.endTime) : ''
  const isGatheringPoint = activity.activityType === 'gathering_point'
  const isBranchPoint = activity.activityType === 'branch_point'
  const isMergePoint = activity.activityType === 'merge_point'

  const currentUserPreference = preferencesData?.preferences.find((p) => p.userId === user?.id)?.preference || null

  return (
    <div id={`activity-${activity.id}`} className="flex gap-3 sm:gap-4 items-center">
      {/* Visiting Time - Separate Box/Rectangle */}
      <div className={`flex-shrink-0 w-20 rounded-xl px-2 py-2 flex items-center justify-center shadow-sm ${
        isViewOnly 
          ? ((start && end) ? 'min-h-[64px]' : 'min-h-[48px]')
          : 'min-h-[64px]'
      } ${
        isGatheringPoint 
          ? 'bg-gradient-to-b from-green-50/80 to-white border border-green-200/50' 
          : isBranchPoint
            ? 'bg-gradient-to-b from-purple-50/80 to-white border border-purple-200/50'
            : isMergePoint
              ? 'bg-gradient-to-b from-orange-50/80 to-white border border-orange-200/50'
              : 'bg-gradient-to-b from-sky-50/80 to-white border border-sky-200/50'
      }`}>
        {isGatheringPoint ? (
          // Gathering point: single time only
          start ? (
            <span className="text-xs text-slate-800 font-semibold whitespace-nowrap text-center tabular-nums">{start}</span>
          ) : canEdit ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit(activity)
              }}
              className="text-xs text-indigo-500 hover:text-indigo-700 underline text-center"
            >
              {t.activity.addVisitingTime}
            </button>
          ) : (
            <span className="text-xs text-gray-400 text-center">{t.activity.noAssignedTime}</span>
          )
        ) : start && end ? (
          <div className="text-xs text-slate-800 font-semibold text-center leading-tight flex flex-col items-center justify-center">
            <span className="whitespace-nowrap tabular-nums">{start}</span>
            <span className="text-slate-300 text-xs my-0.5 rotate-90 leading-none">~</span>
            <span className="whitespace-nowrap tabular-nums">{end}</span>
          </div>
        ) : start || end ? (
          <span className="text-xs text-slate-800 font-semibold whitespace-nowrap text-center tabular-nums">{start || end}</span>
        ) : canEdit ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(activity)
            }}
            className="text-xs text-indigo-500 hover:text-indigo-700 underline text-center"
          >
            {t.activity.addVisitingTime}
          </button>
        ) : (
          <span className="text-xs text-gray-400 text-center">{t.activity.noAssignedTime}</span>
        )}
      </div>
      
      {/* Activity Content - Separate Box/Rectangle */}
      <div className={`flex-1 rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition ${
        isViewOnly ? 'flex items-center' : ''
      } ${
        hasConflict
          ? 'bg-gradient-to-b from-white to-yellow-50/35 border-2 border-yellow-400/60 hover:border-yellow-500/60'
          : isGatheringPoint
            ? 'bg-gradient-to-b from-white to-green-50/35 border border-green-200/45 hover:border-green-300/45'
            : isBranchPoint
              ? 'bg-gradient-to-b from-white to-purple-50/35 border border-purple-200/45 hover:border-purple-300/45'
              : isMergePoint
                ? 'bg-gradient-to-b from-white to-orange-50/35 border border-orange-200/45 hover:border-orange-300/45'
                : 'bg-gradient-to-b from-white to-sky-50/35 border border-sky-200/45 hover:border-sky-300/45'
      }`}>
        <div className={`flex gap-4 ${isViewOnly ? 'items-center w-full' : 'items-start'} `}>
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm sm:text-base">{activity.title}</h4>
                  {hasConflict && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium" title={t.route.scheduleConflicts || 'Schedule conflict detected'}>
                      ⚠️ {t.route.conflict || 'Conflict'}
                    </span>
                  )}
                  {isGatheringPoint && (
                    <span className={`inline-flex items-center ${isViewOnly ? 'px-1.5 py-0.5 sm:px-2' : 'px-2'} py-0.5 bg-green-100 text-green-800 text-xs rounded-full font-medium`} title={t.activity.gatheringPoint || 'Gathering Point'}>
                      {isViewOnly ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span className="hidden sm:inline">{t.activity.gatheringPoint || 'Gathering Point'}</span>
                        </>
                      ) : (
                        <span>{t.activity.gatheringPoint || 'Gathering Point'}</span>
                      )}
                    </span>
                  )}
                  {isBranchPoint && (
                    <span className={`inline-flex items-center ${isViewOnly ? 'px-1.5 py-0.5 sm:px-2' : 'px-2'} py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full font-medium`} title={t.activity.branchPoint || 'Branch Point'}>
                      {isViewOnly ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          <span className="hidden sm:inline">{t.activity.branchPoint || 'Branch Point'}</span>
                        </>
                      ) : (
                        <span>{t.activity.branchPoint || 'Branch Point'}</span>
                      )}
                    </span>
                  )}
                  {isMergePoint && (
                    <span className={`inline-flex items-center ${isViewOnly ? 'px-1.5 py-0.5 sm:px-2' : 'px-2'} py-0.5 bg-orange-100 text-orange-800 text-xs rounded-full font-medium`} title={t.activity.mergePoint || 'Merge Point'}>
                      {isViewOnly ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4 4m4-4l-4-4m0 6H4m0 0l4-4m-4 4l4 4" />
                          </svg>
                          <span className="hidden sm:inline">{t.activity.mergePoint || 'Merge Point'}</span>
                        </>
                      ) : (
                        <span>{t.activity.mergePoint || 'Merge Point'}</span>
                      )}
                    </span>
                  )}
                  {/* Google Maps link button - paper airplane icon */}
                  {(activity.lat && activity.lng) || activity.placeId || activity.address ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        let url = ''
                        // 優先使用 place_id（能顯示地點資訊）
                        if (activity.placeId) {
                          // 使用新格式（適用於移動設備和桌面）
                          const placeName = activity.title || activity.locationName || 'Location'
                          url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName)}&query_place_id=${activity.placeId}`
                        } else if (activity.lat && activity.lng) {
                          // 如果沒有 place_id，使用座標作為備選
                          url = `https://www.google.com/maps/?q=${activity.lat},${activity.lng}`
                        } else if (activity.address) {
                          url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.address)}`
                        }
                        if (url) {
                          window.open(url, '_blank', 'noopener,noreferrer')
                        }
                      }}
                      className="text-indigo-400 hover:text-indigo-500 p-0.5 rounded hover:bg-indigo-50 transition"
                      title={t.route.openInMaps || 'Open in Google Maps'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ transform: 'rotate(45deg)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  ) : null}
                </div>
                {activity.createdBy && !simpleView && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {t.activity.addedBy || 'Added by'}:
                    </span>
                    {activity.createdBy.avatarUrl ? (
                      <img
                        src={activity.createdBy.avatarUrl}
                        alt={activity.createdBy.name}
                        className="w-4 h-4 rounded-full"
                      />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs">
                        {activity.createdBy.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs text-gray-600">{activity.createdBy.name}</span>
                  </div>
                )}
              </div>
            </div>
            
            {activity.address && !simpleView && (
              <p className="text-sm text-gray-600 mb-2">
                <span className="text-xs text-gray-500">📍{activity.address}</span>
              </p>
            )}
            
            {/* Tags */}
            {activity.tags && activity.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {activity.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Participants */}
            {!hideParticipants && activity.participants && activity.participants.length > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-500">
                  {t.activity.participants || 'Participants'}:
                </span>
                <div className="flex -space-x-2">
                  {activity.participants.slice(0, 5).map((p) =>
                    p.user.avatarUrl ? (
                      <img
                        key={p.id}
                        src={p.user.avatarUrl}
                        alt={p.user.name}
                        className="w-6 h-6 rounded-full border-2 border-white"
                        title={p.user.name}
                      />
                    ) : (
                      <div
                        key={p.id}
                        className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs border-2 border-white"
                        title={p.user.name}
                      >
                        {p.user.name.charAt(0).toUpperCase()}
                      </div>
                    )
                  )}
                  {activity.participants.length > 5 && (
                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 text-xs border-2 border-white">
                      +{activity.participants.length - 5}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cost */}
            {activity.cost && (
              <div className="text-xs text-gray-700 mb-2">
                <span className="font-medium">
                  {activity.currency || 'USD'} {activity.cost.toFixed(2)}
                </span>
                {activity.costShares && activity.costShares.length > 0 && (
                  <span className="text-xs text-gray-500 ml-2">
                    ({t.activity.splitEqually || 'Split equally'})
                  </span>
                )}
              </div>
            )}

            {/* Comments count */}
            {activity.commentsCount !== undefined && activity.commentsCount > 0 && (
              <div className="text-xs text-gray-500 mb-2">
                💬 {activity.commentsCount} {t.activity.comments || 'comments'}
              </div>
            )}
            
            {activity.notes && (
              <p className={`text-xs text-gray-700 whitespace-pre-wrap ${isViewOnly ? 'mt-0' : 'mt-2'}`}>{formatCommentText(activity.notes)}</p>
            )}
          </div>
        
          {/* Preferences and Action Buttons - Inside Activity Box */}
          <div className="flex-shrink-0 flex flex-col items-end gap-2 sm:gap-2">
            {/* Comments button - icon only, aligned to right (view-only mode only) */}
            {isViewOnly && ((activity.commentsCount !== undefined && activity.commentsCount > 0) || user) && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-indigo-600 hover:text-indigo-700 p-0.5 rounded hover:bg-indigo-50 transition"
                title={isExpanded ? (t.activity.hideComments || 'Hide Comments') : (t.activity.showComments || 'Show Comments')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
            )}
            {/* Preferences and Action Buttons */}
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
              {/* Preferences */}
              {!simpleView && (
                <ActivityPreferenceButtons
                  activityId={activity.id}
                  preferenceCounts={activity.preferenceCounts}
                  currentUserPreference={currentUserPreference}
                />
              )}
              {/* Action Buttons */}
              {canEdit && (
                <>
                  {onUpdateScheduleTime && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        setIsUpdatingSchedule(true)
                        try {
                          await onUpdateScheduleTime(activity.id)
                        } catch (error: any) {
                          console.error('Failed to update schedule time:', error)
                          alert(error?.response?.data?.detail || error?.message || t.activity.updateScheduleTimeError || 'Failed to update schedule time')
                        } finally {
                          setIsUpdatingSchedule(false)
                        }
                      }}
                      disabled={isUpdatingSchedule}
                      className="text-blue-600 hover:text-blue-700 p-2 sm:p-1 rounded hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-wait min-h-[44px] sm:min-h-0"
                      title={t.activity.updateScheduleTime || 'Update Schedule Time'}
                    >
                      {isUpdatingSchedule ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      )}
                    </button>
                  )}
                  <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(activity)
                  }}
                  className="text-indigo-600 hover:text-indigo-700 p-2 sm:p-1 rounded hover:bg-indigo-50 transition min-h-[44px] sm:min-h-0"
                  title={t.common.edit}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(activity.id)
                  }}
                  className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50 transition"
                  title={t.common.delete}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Comments button - text button below activity box (edit mode only) */}
        {!isViewOnly && ((activity.commentsCount !== undefined && activity.commentsCount > 0) || user) && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
          >
            {isExpanded ? (t.activity.hideComments || 'Hide Comments') : (t.activity.showComments || 'Show Comments')}
          </button>
        )}

        {/* Expandable section for comments - outside activity box, below the line */}
        {isExpanded && ((activity.commentsCount !== undefined && activity.commentsCount > 0) || user) && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <ActivityCommentsPanel activityId={activity.id} />
          </div>
        )}
      </div>
    </div>
  )
}

