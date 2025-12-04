import { useParams, Link } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { useTrip } from '../hooks/useTrips'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import {
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity,
  useReorderActivities,
  CreateActivityData,
  UpdateActivityData,
} from '../hooks/useActivities'
import { useTripMembers } from '../hooks/useMembers'
import { useCreateShareLink } from '../hooks/useShare'
import ItineraryDay from '../components/ItineraryDay'
import ActivityModal from '../components/ActivityModal'
import MemberList from '../components/MemberList'
import InviteMemberModal from '../components/InviteMemberModal'
import { Activity } from '../types'

export default function TripDetail() {
  const { id } = useParams<{ id: string }>()
  const { isGuest } = useAuth()
  const { t } = useLanguage()
  const tripId = id ? parseInt(id) : 0
  const { data: trip, isLoading } = useTrip(tripId)
  const [selectedActivity, setSelectedActivity] = useState<Activity | undefined>()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const createActivity = useCreateActivity()
  const updateActivity = useUpdateActivity()
  const deleteActivity = useDeleteActivity()
  const reorderActivities = useReorderActivities()
  const { data: members } = useTripMembers(tripId)
  const createShareLink = useCreateShareLink()

  const canEdit = !isGuest && (trip?.role === 'owner' || trip?.role === 'editor')
  const isOwner = !isGuest && trip?.role === 'owner'

  // Generate days from trip date range
  const days = useMemo(() => {
    if (!trip) return []
    // Parse dates using local timezone to avoid date shifting
    const start = new Date(trip.startDate)
    const end = new Date(trip.endDate)
    
    // Get local date components
    const startYear = start.getFullYear()
    const startMonth = start.getMonth()
    const startDay = start.getDate()
    
    const endYear = end.getFullYear()
    const endMonth = end.getMonth()
    const endDay = end.getDate()
    
    const days: string[] = []
    const current = new Date(startYear, startMonth, startDay)
    const endDate = new Date(endYear, endMonth, endDay)
    
    // Include both start and end dates
    while (current <= endDate) {
      const year = current.getFullYear()
      const month = String(current.getMonth() + 1).padStart(2, '0')
      const day = String(current.getDate()).padStart(2, '0')
      days.push(`${year}-${month}-${day}`)
      current.setDate(current.getDate() + 1)
    }
    
    return days
  }, [trip])

  // Group activities by date
  const activitiesByDate = useMemo(() => {
    if (!trip?.activities) return {}
    const grouped: Record<string, Activity[]> = {}
    
    trip.activities.forEach((activity) => {
      const date = new Date(activity.date).toISOString().split('T')[0]
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(activity)
    })
    
    // Sort activities by time (activities with time first, then by orderIndex)
    Object.keys(grouped).forEach((date) => {
      grouped[date].sort((a, b) => {
        // Activities with startTime come first
        const aHasTime = !!a.startTime
        const bHasTime = !!b.startTime
        
        if (aHasTime && !bHasTime) return -1
        if (!aHasTime && bHasTime) return 1
        
        // If both have time or both don't have time, sort by time or orderIndex
        if (aHasTime && bHasTime) {
          // Both have time - sort by startTime
          const aTime = a.startTime ? new Date(a.startTime).getTime() : 0
          const bTime = b.startTime ? new Date(b.startTime).getTime() : 0
          return aTime - bTime
        } else {
          // Neither has time - sort by orderIndex
          return a.orderIndex - b.orderIndex
        }
      })
    })
    
    return grouped
  }, [trip?.activities])

  const handleAddActivity = (date: string) => {
    setSelectedDate(date)
    setSelectedActivity(undefined)
    setIsModalOpen(true)
  }

  const handleEditActivity = (activity: Activity) => {
    setSelectedDate(new Date(activity.date).toISOString().split('T')[0])
    setSelectedActivity(activity)
    setIsModalOpen(true)
  }

  const handleDeleteActivity = async (activityId: number) => {
    if (confirm(t.activity.deleteActivity + '?')) {
      await deleteActivity.mutateAsync({ activityId, tripId })
    }
  }

  const handleSaveActivity = async (data: CreateActivityData | UpdateActivityData) => {
    if (selectedActivity) {
      await updateActivity.mutateAsync({
        activityId: selectedActivity.id,
        data: data as UpdateActivityData,
      })
    } else {
      await createActivity.mutateAsync(data as CreateActivityData)
    }
  }

  const handleReorder = async (activityIds: number[]) => {
    await reorderActivities.mutateAsync({ activityIds, tripId })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">{t.common.loading}</div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{t.trip.tripDetails} {t.common.error}</h2>
          <Link to="/dashboard" className="text-indigo-600 hover:text-indigo-700">
            {t.common.back} {t.nav.dashboard}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            to="/dashboard"
            className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block"
          >
            ← {t.common.back} {t.nav.dashboard}
          </Link>
        </div>

        {trip.coverImage && (
          <img
            src={trip.coverImage}
            alt={trip.title}
            className="w-full h-64 object-cover rounded-lg mb-6"
          />
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">{trip.title}</h1>
          {trip.description && (
            <p className="text-gray-600 mb-4">{trip.description}</p>
          )}
          <div className="flex gap-4 text-sm text-gray-500">
            <p>
              <span className="font-semibold">{t.trip.startDate} - {t.trip.endDate}:</span>{' '}
              {(() => {
                const start = new Date(trip.startDate)
                const end = new Date(trip.endDate)
                const startYear = start.getFullYear()
                const startMonth = start.getMonth() + 1
                const startDay = start.getDate()
                const endYear = end.getFullYear()
                const endMonth = end.getMonth() + 1
                const endDay = end.getDate()
                return `${startYear}/${startMonth}/${startDay} - ${endYear}/${endMonth}/${endDay}`
              })()}
            </p>
            <p>
              <span className="font-semibold">{t.trip.status}:</span>{' '}
              <span className="capitalize">
                {trip.status === 'planning' ? t.trip.planning :
                 trip.status === 'upcoming' ? t.trip.upcoming :
                 trip.status === 'ongoing' ? t.trip.ongoing :
                 trip.status === 'completed' ? t.trip.completed :
                 trip.status === 'cancelled' ? t.trip.cancelled : trip.status}
              </span>
            </p>
            {trip.role && (
              <p>
                <span className="font-semibold">{t.dashboard.role}:</span>{' '}
                <span className="capitalize">
                  {trip.role === 'owner' ? t.trip.owner :
                   trip.role === 'editor' ? t.trip.editor :
                   trip.role === 'viewer' ? t.trip.viewer : trip.role}
                </span>
              </p>
            )}
          </div>
        </div>

        {(isOwner || (members && members.length > 0)) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{t.trip.members}</h2>
              {isOwner && (
                <button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm"
                >
                  + {t.members.inviteMember}
                </button>
              )}
            </div>
            {members && <MemberList members={members} tripId={tripId} isOwner={isOwner || false} />}
          </div>
        )}

        {isOwner && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">{t.share.shareTrip}</h2>
            <button
              onClick={async () => {
                try {
                  const shareLink = await createShareLink.mutateAsync({
                    tripId,
                    data: { permission: 'view' },
                  })
                  const fullUrl = `${window.location.origin}/share/${shareLink.token}`
                  navigator.clipboard.writeText(fullUrl)
                  alert(t.share.linkCopied)
                } catch (error: any) {
                  alert(error.response?.data?.detail || t.share.createShareLink + ' ' + t.common.error)
                }
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              {t.share.createShareLink}
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{t.trip.activities}</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  viewMode === 'list'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t.trip.listView}
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  viewMode === 'calendar'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t.trip.calendarView}
              </button>
            </div>
          </div>

          {viewMode === 'list' ? (
            // List View
            days.map((date) => {
              const activities = activitiesByDate[date] || []
              const defaultOrderIndex = activities.length

              return (
                <div key={date}>
                  <div className="flex justify-between items-center mb-2">
                    {canEdit && (
                      <button
                        onClick={() => handleAddActivity(date)}
                        className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                      >
                        + {t.activity.addActivity}
                      </button>
                    )}
                  </div>
                  <ItineraryDay
                    date={date}
                    activities={activities}
                    onEdit={handleEditActivity}
                    onDelete={handleDeleteActivity}
                    onReorder={handleReorder}
                    canEdit={canEdit}
                  />
                </div>
              )
            })
          ) : (
            // Calendar View
            <div className="grid grid-cols-7 gap-2">
              {/* Calendar Header */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center font-semibold text-gray-700 py-2">
                  {day}
                </div>
              ))}
              {/* Calendar Days */}
              {(() => {
                if (!trip) return null
                // Parse dates using local timezone
                const start = new Date(trip.startDate)
                const end = new Date(trip.endDate)
                
                // Get local date components
                const startYear = start.getFullYear()
                const startMonth = start.getMonth()
                const startDay = start.getDate()
                
                const endYear = end.getFullYear()
                const endMonth = end.getMonth()
                const endDay = end.getDate()
                
                const startDate = new Date(startYear, startMonth, startDay)
                const endDate = new Date(endYear, endMonth, endDay)
                const startDayOfWeek = startDate.getDay()
                const calendarDays: (string | null)[] = []
                
                // Add empty cells for days before trip starts
                for (let i = 0; i < startDayOfWeek; i++) {
                  calendarDays.push(null)
                }
                
                // Add trip days
                const current = new Date(startDate)
                while (current <= endDate) {
                  const year = current.getFullYear()
                  const month = String(current.getMonth() + 1).padStart(2, '0')
                  const day = String(current.getDate()).padStart(2, '0')
                  calendarDays.push(`${year}-${month}-${day}`)
                  current.setDate(current.getDate() + 1)
                }
                
                return calendarDays.map((date, idx) => {
                  if (!date) {
                    return <div key={`empty-${idx}`} className="aspect-square"></div>
                  }
                  const dayActivities = activitiesByDate[date] || []
                  const dateObj = new Date(date)
                  const dayNumber = dateObj.getDate()
                  const isToday = date === new Date().toISOString().split('T')[0]
                  
                  return (
                    <div
                      key={date}
                      className={`aspect-square border border-gray-200 rounded p-2 ${
                        isToday ? 'bg-indigo-50 border-indigo-300' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm font-medium ${isToday ? 'text-indigo-600' : 'text-gray-700'}`}>
                          {dayNumber}
                        </span>
                        {canEdit && (
                          <button
                            onClick={() => handleAddActivity(date)}
                            className="text-indigo-600 hover:text-indigo-700 text-xs"
                            title={t.activity.addActivity}
                          >
                            +
                          </button>
                        )}
                      </div>
                      <div className="space-y-1 overflow-y-auto max-h-20">
                        {dayActivities.slice(0, 3).map((activity) => (
                          <div
                            key={activity.id}
                            className="text-xs bg-indigo-100 text-indigo-800 rounded px-1 py-0.5 truncate cursor-pointer hover:bg-indigo-200"
                            onClick={() => handleEditActivity(activity)}
                            title={activity.title}
                          >
                            {activity.title}
                          </div>
                        ))}
                        {dayActivities.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{dayActivities.length - 3} {t.activity.more}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          )}
        </div>

        <ActivityModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedActivity(undefined)
          }}
          onSave={handleSaveActivity}
          activity={selectedActivity}
          tripId={tripId}
          date={selectedDate}
          defaultOrderIndex={activitiesByDate[selectedDate]?.length || 0}
        />

        <InviteMemberModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          tripId={tripId}
        />
      </div>
    </div>
  )
}
