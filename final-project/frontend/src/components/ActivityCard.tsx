import { Activity } from '../types'

interface ActivityCardProps {
  activity: Activity
  onEdit: (activity: Activity) => void
  onDelete: (activityId: number) => void
  canEdit: boolean
}

export default function ActivityCard({ activity, onEdit, onDelete, canEdit }: ActivityCardProps) {
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-lg">{activity.title}</h4>
        {canEdit && (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(activity)}
              className="text-indigo-600 hover:text-indigo-700 text-sm"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(activity.id)}
              className="text-red-600 hover:text-red-700 text-sm"
            >
              Delete
            </button>
          </div>
        )}
      </div>
      
      {(activity.startTime || activity.endTime) && (
        <p className="text-sm text-gray-600 mb-2">
          {formatTime(activity.startTime)} - {formatTime(activity.endTime)}
        </p>
      )}
      
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
  )
}

