import { Activity } from '../types'
import { useLanguage } from '../context/LanguageContext'

interface ActivityCardProps {
  activity: Activity
  onEdit: (activity: Activity) => void
  onDelete: (activityId: number) => void
  canEdit: boolean
}

export default function ActivityCard({ activity, onEdit, onDelete, canEdit }: ActivityCardProps) {
  const { t } = useLanguage()
  
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const getDisplayTime = () => {
    if (activity.startTime && activity.endTime) {
      return `${formatTime(activity.startTime)} - ${formatTime(activity.endTime)}`
    } else if (activity.startTime) {
      return formatTime(activity.startTime)
    } else if (activity.endTime) {
      return formatTime(activity.endTime)
    }
    return null
  }

  const displayTime = getDisplayTime()

  return (
    <div className="flex gap-4 items-center">
      {/* Visiting Time - Separate Box/Rectangle */}
      <div className="flex-shrink-0 w-36 bg-gray-50 border border-gray-300 rounded-lg p-3 flex items-center justify-center min-h-[80px]">
        {displayTime ? (
          <span className="text-sm text-gray-700 font-medium whitespace-nowrap text-center">{displayTime}</span>
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
      <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition flex gap-4 items-center">
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-lg">{activity.title}</h4>
          </div>
          
          {activity.locationName && (
            <p className="text-sm text-gray-600 mb-2">
              📍 {activity.locationName}
              {activity.address && <span className="text-gray-500"> - {activity.address}</span>}
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

