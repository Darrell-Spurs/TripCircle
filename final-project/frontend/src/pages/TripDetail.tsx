import { useParams, Link } from 'react-router-dom'
import { useState, useMemo, useEffect } from 'react'
import { useTrip, useUpdateTrip } from '../hooks/useTrips'
import { useAuth } from '../context/AuthContext'
import {
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity,
  useReorderActivities,
} from '../hooks/useActivities'
import { useTripMembers } from '../hooks/useMembers'
import { useCreateShareLink } from '../hooks/useShare'
import { usePublishTrip, useUnpublishTrip } from '../hooks/useFeed'
import ItineraryDay from '../components/ItineraryDay'
import ActivityModal from '../components/ActivityModal'
import MemberList from '../components/MemberList'
import InviteMemberModal from '../components/InviteMemberModal'
import { Activity, CreateActivityData, UpdateActivityData } from '../types'

export default function TripDetail() {
  const { id } = useParams<{ id: string }>()
  const { isGuest } = useAuth()
  const tripId = id ? parseInt(id) : 0
  const { data: trip, isLoading } = useTrip(tripId)
  const [selectedActivity, setSelectedActivity] = useState<Activity | undefined>()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const createActivity = useCreateActivity()
  const updateActivity = useUpdateActivity()
  const deleteActivity = useDeleteActivity()
  const reorderActivities = useReorderActivities()
  const { data: members } = useTripMembers(tripId)
  const createShareLink = useCreateShareLink()
  const updateTrip = useUpdateTrip()
  const publishTrip = usePublishTrip()
  const unpublishTrip = useUnpublishTrip()
  const [tripBody, setTripBody] = useState('')
  const [isEditingBody, setIsEditingBody] = useState(false)

  const canEdit = !isGuest && (trip?.role === 'owner' || trip?.role === 'editor')
  const isOwner = !isGuest && trip?.role === 'owner'

  // Sync trip body with state
  useEffect(() => {
    if (trip?.body !== undefined) {
      setTripBody(trip.body || '')
    }
  }, [trip?.body])

  // Generate days from trip date range
  const days = useMemo(() => {
    if (!trip) return []
    const start = new Date(trip.startDate)
    const end = new Date(trip.endDate)
    const days: string[] = []
    const current = new Date(start)
    
    while (current <= end) {
      days.push(new Date(current).toISOString().split('T')[0])
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
    
    // Sort activities by orderIndex within each day
    Object.keys(grouped).forEach((date) => {
      grouped[date].sort((a, b) => a.orderIndex - b.orderIndex)
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
    if (confirm('Are you sure you want to delete this activity?')) {
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
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Trip not found</h2>
          <Link to="/dashboard" className="text-indigo-600 hover:text-indigo-700">
            Back to Dashboard
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
            ← Back to Dashboard
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
              <span className="font-semibold">Dates:</span>{' '}
              {new Date(trip.startDate).toLocaleDateString()} -{' '}
              {new Date(trip.endDate).toLocaleDateString()}
            </p>
            <p>
              <span className="font-semibold">Status:</span>{' '}
              <span className="capitalize">{trip.status}</span>
            </p>
            {trip.role && (
              <p>
                <span className="font-semibold">Your Role:</span>{' '}
                <span className="capitalize">{trip.role}</span>
              </p>
            )}
          </div>
        </div>

        {(isOwner || (members && members.length > 0)) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Members</h2>
              {isOwner && (
                <button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm"
                >
                  + Invite Member
                </button>
              )}
            </div>
            {members && <MemberList members={members} tripId={tripId} isOwner={isOwner || false} />}
          </div>
        )}

        {isOwner && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Share Trip</h2>
            <button
              onClick={async () => {
                try {
                  const shareLink = await createShareLink.mutateAsync({
                    tripId,
                    data: { permission: 'view' },
                  })
                  const fullUrl = `${window.location.origin}/share/${shareLink.token}`
                  navigator.clipboard.writeText(fullUrl)
                  alert('Share link copied to clipboard!')
                } catch (error: any) {
                  alert(error.response?.data?.detail || 'Failed to create share link')
                }
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Generate Share Link
            </button>
          </div>
        )}

        {/* Publish to Feed Section */}
        {isOwner && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold">Publish to Feed</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Share your trip experience with the community
                </p>
              </div>
              {trip.isPublished ? (
                <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  ✓ Published
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                  Draft
                </span>
              )}
            </div>

            {/* Trip Body Editor */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trip Story (for feed)
              </label>
              {isEditingBody ? (
                <div>
                  <textarea
                    value={tripBody}
                    onChange={(e) => setTripBody(e.target.value)}
                    rows={6}
                    placeholder="Share your trip experience, tips, and highlights..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={async () => {
                        try {
                          await updateTrip.mutateAsync({
                            tripId,
                            data: { body: tripBody },
                          })
                          setIsEditingBody(false)
                        } catch (error: any) {
                          alert(error.response?.data?.detail || 'Failed to save')
                        }
                      }}
                      disabled={updateTrip.isPending}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                      {updateTrip.isPending ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setTripBody(trip.body || '')
                        setIsEditingBody(false)
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingBody(true)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition min-h-[100px]"
                >
                  {tripBody ? (
                    <p className="text-gray-700 whitespace-pre-wrap">{tripBody}</p>
                  ) : (
                    <p className="text-gray-400">Click to add your trip story...</p>
                  )}
                </div>
              )}
            </div>

            {/* Publish/Unpublish Button */}
            <div className="flex gap-3">
              {trip.isPublished ? (
                <>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to unpublish this trip?')) {
                        try {
                          await unpublishTrip.mutateAsync(tripId)
                        } catch (error: any) {
                          alert(error.response?.data?.detail || 'Failed to unpublish')
                        }
                      }
                    }}
                    disabled={unpublishTrip.isPending}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                  >
                    {unpublishTrip.isPending ? 'Unpublishing...' : 'Unpublish'}
                  </button>
                  <Link
                    to={`/feed/${tripId}`}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    View in Feed →
                  </Link>
                </>
              ) : (
                <button
                  onClick={async () => {
                    try {
                      await publishTrip.mutateAsync(tripId)
                      alert('Trip published to feed!')
                    } catch (error: any) {
                      alert(error.response?.data?.detail || 'Failed to publish')
                    }
                  }}
                  disabled={publishTrip.isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {publishTrip.isPending ? 'Publishing...' : 'Publish to Feed'}
                </button>
              )}
            </div>

            {trip.publishedAt && (
              <p className="text-xs text-gray-500 mt-3">
                Published on {new Date(trip.publishedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Itinerary</h2>
          </div>

          {days.map((date) => {
            const activities = activitiesByDate[date] || []

            return (
              <ItineraryDay
                key={date}
                date={date}
                activities={activities}
                onEdit={handleEditActivity}
                onDelete={handleDeleteActivity}
                onReorder={handleReorder}
                onAddActivity={() => handleAddActivity(date)}
                canEdit={canEdit}
              />
            )
          })}
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
