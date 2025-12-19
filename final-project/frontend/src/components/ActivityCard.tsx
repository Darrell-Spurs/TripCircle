import { Activity } from '../types'
import { useLanguage } from '../context/LanguageContext'

interface ActivityCardProps {
  activity: Activity
  onEdit: (activity: Activity) => void
  onDelete: (activityId: number) => void
  canEdit: boolean
}

export default function ActivityCard({ activity, onEdit, onDelete, canEdit }: ActivityCardProps) {
  const { t, language } = useLanguage()
  
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

  return (
    <div className="flex gap-4 items-center">
      {/* Visiting Time - Separate Box/Rectangle */}
      <div className="flex-shrink-0 w-24 bg-gradient-to-b from-sky-50/80 to-white border border-sky-200/50 rounded-xl px-2 py-2 flex items-center justify-center min-h-[64px] shadow-sm">
        {start && end ? (
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
      <div className="flex-1 bg-gradient-to-b from-white to-sky-50/35 border border-sky-200/45 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-sky-300/45 transition flex gap-4 items-center">
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-lg">{activity.title}</h4>
          </div>
          
          {activity.address && (
            <p className="text-sm text-gray-600 mb-2">
              {activity.address && <span className="text-xs text-gray-500">📍{activity.address}</span>}
            </p>
          )}
          
          {activity.notes && (
            <p className="text-sm text-gray-700 mt-2">{activity.notes}</p>
          )}
        </div>
        
        {/* Action Buttons - Inside Activity Box */}
        {canEdit && (
          <div className="flex-shrink-0 flex items-center gap-2">
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
          </div>
        )}
      </div>
    </div>
  )
}

