import { useState } from 'react'
import { Activity } from '../types'
import { useLanguage } from '../context/LanguageContext'
import ActivityPreferenceButtons from './ActivityPreferenceButtons'
import ActivityCommentsPanel from './ActivityCommentsPanel'
import { useActivityPreferences } from '../hooks/useActivityPreferences'
import { useAuth } from '../context/AuthContext'

interface ActivityCardProps {
  activity: Activity
  onEdit: (activity: Activity) => void
  onDelete: (activityId: number) => void
  canEdit: boolean
  hasConflict?: boolean
}

export default function ActivityCard({ activity, onEdit, onDelete, canEdit, hasConflict = false }: ActivityCardProps) {
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
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

  const currentUserPreference = preferencesData?.preferences.find((p) => p.userId === user?.id)?.preference || null

  return (
    <div className="flex gap-4 items-center">
      {/* Visiting Time - Separate Box/Rectangle */}
      <div className={`flex-shrink-0 w-24 rounded-xl px-2 py-2 flex items-center justify-center min-h-[64px] shadow-sm ${
        isGatheringPoint 
          ? 'bg-gradient-to-b from-green-50/80 to-white border border-green-200/50' 
          : 'bg-gradient-to-b from-sky-50/80 to-white border border-sky-200/50'
      }`}>
        {isGatheringPoint ? (
          // Gathering point: single time only
          start ? (
            <span className="text-sm text-slate-800 font-semibold whitespace-nowrap text-center tabular-nums">{start}</span>
          ) : canEdit ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit(activity)
              }}
              className="text-sm text-indigo-500 hover:text-indigo-700 underline text-center"
            >
              {t.activity.addVisitingTime}
            </button>
          ) : (
            <span className="text-sm text-gray-400 text-center">{t.activity.noAssignedTime}</span>
          )
        ) : start && end ? (
          <div className="text-sm text-slate-800 font-semibold text-center leading-tight flex flex-col items-center justify-center">
            <span className="whitespace-nowrap tabular-nums">{start}</span>
            <span className="text-slate-300 text-xs my-0.5 rotate-90 leading-none">~</span>
            <span className="whitespace-nowrap tabular-nums">{end}</span>
          </div>
        ) : start || end ? (
          <span className="text-sm text-slate-800 font-semibold whitespace-nowrap text-center tabular-nums">{start || end}</span>
        ) : canEdit ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(activity)
            }}
            className="text-sm text-indigo-500 hover:text-indigo-700 underline text-center"
          >
            {t.activity.addVisitingTime}
          </button>
        ) : (
          <span className="text-sm text-gray-400 text-center">{t.activity.noAssignedTime}</span>
        )}
      </div>
      
      {/* Activity Content - Separate Box/Rectangle */}
      <div className={`flex-1 rounded-xl p-4 shadow-sm hover:shadow-md transition ${
        hasConflict
          ? 'bg-gradient-to-b from-white to-yellow-50/35 border-2 border-yellow-400/60 hover:border-yellow-500/60'
          : isGatheringPoint
            ? 'bg-gradient-to-b from-white to-green-50/35 border border-green-200/45 hover:border-green-300/45'
            : 'bg-gradient-to-b from-white to-sky-50/35 border border-sky-200/45 hover:border-sky-300/45'
      }`}>
        <div className="flex gap-4 items-start">
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-lg">{activity.title}</h4>
                  {hasConflict && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium" title={t.route.scheduleConflictWarning || 'Schedule conflict detected'}>
                      ⚠️ {t.route.conflict || 'Conflict'}
                    </span>
                  )}
                  {isGatheringPoint && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                      {t.activity.gatheringPoint || 'Gathering Point'}
                    </span>
                  )}
                </div>
                {activity.createdBy && (
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
            
            {activity.address && (
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
            {activity.participants && activity.participants.length > 0 && (
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
              <div className="text-sm text-gray-700 mb-2">
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
              <p className="text-sm text-gray-700 mt-2">{activity.notes}</p>
            )}
          </div>
        
          {/* Preferences and Action Buttons - Inside Activity Box */}
          <div className="flex-shrink-0 flex items-center gap-2">
            {/* Preferences */}
            <ActivityPreferenceButtons
              activityId={activity.id}
              preferenceCounts={activity.preferenceCounts}
              currentUserPreference={currentUserPreference}
            />
            {/* Action Buttons */}
            {canEdit && (
              <>
                <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(activity)
                }}
                className="text-indigo-600 hover:text-indigo-700 p-1 rounded hover:bg-indigo-50 transition"
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

        {/* Expandable section for comments */}
        {(activity.commentsCount !== undefined && activity.commentsCount > 0) || user ? (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              {isExpanded ? (t.activity.hideComments || 'Hide Comments') : (t.activity.showComments || 'Show Comments')}
            </button>
            {isExpanded && <ActivityCommentsPanel activityId={activity.id} />}
          </div>
        ) : null}
      </div>
    </div>
  )
}

