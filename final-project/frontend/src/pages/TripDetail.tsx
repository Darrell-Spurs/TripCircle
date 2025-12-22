import { useParams, Link } from 'react-router-dom'
import { useState, useMemo, useEffect } from 'react'
import { useTrip, useUpdateTrip } from '../hooks/useTrips'
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
import { usePublishTrip, useUnpublishTrip } from '../hooks/useFeed'
import ItineraryDay from '../components/ItineraryDay'
import ActivityModal from '../components/ActivityModal'
import MemberList from '../components/MemberList'
import InviteMemberModal from '../components/InviteMemberModal'
import TripPhotosTab from '../components/TripPhotosTab'
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
  const [pace, setPace] = useState<'tight' | 'neutral' | 'relaxed'>('neutral')
  const [activeTab, setActiveTab] = useState<'itinerary' | 'photos'>('itinerary')
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
  const [allowImports, setAllowImports] = useState(false)
  
  // Trip details editing state
  const [isEditingDetails, setIsEditingDetails] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCoverImage, setEditCoverImage] = useState('')

  const canEdit = !isGuest && (trip?.role === 'owner' || trip?.role === 'editor')
  const isOwner = !isGuest && trip?.role === 'owner'

  // Pace controls transportation buffer (pre + post), not just a single multiplier.
  // Example: a 5m travel segment with Neutral adds 8% pre + 8% post (~0.8m + 0.8m) -> ~6.6m.
  const paceBuffer =
    pace === 'tight'
      ? { prePct: 0.10, postPct: 0.10 }
      : pace === 'relaxed'
        ? { prePct: 0.20, postPct: 0.20 }
        : { prePct: 0.15, postPct: 0.15 }

  // Sync trip body with state
  useEffect(() => {
    if (trip?.body !== undefined) {
      setTripBody(trip.body || '')
    }
  }, [trip?.body])

  // Sync trip details with edit state when trip loads
  useEffect(() => {
    if (trip) {
      setEditTitle(trip.title)
      setEditDescription(trip.description || '')
      setEditCoverImage(trip.coverImage || '')
    }
  }, [trip])

  const handleSaveDetails = async () => {
    try {
      await updateTrip.mutateAsync({
        tripId,
        data: {
          title: editTitle,
          description: editDescription,
          coverImage: editCoverImage,
        },
      })
      setIsEditingDetails(false)
    } catch (error: any) {
      alert(error.response?.data?.detail || t.common.error)
    }
  }

  const handleCancelEditDetails = () => {
    if (trip) {
      setEditTitle(trip.title)
      setEditDescription(trip.description || '')
      setEditCoverImage(trip.coverImage || '')
    }
    setIsEditingDetails(false)
  }

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

  // Helper to get local date string (YYYY-MM-DD) from a date to avoid timezone issues
  const getLocalDateString = (dateStr: string): string => {
    const d = new Date(dateStr)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Group activities by date
  const activitiesByDate = useMemo(() => {
    if (!trip?.activities) return {}
    const grouped: Record<string, Activity[]> = {}
    
    trip.activities.forEach((activity) => {
      // Use local date parsing to avoid timezone shift issues
      const date = getLocalDateString(activity.date)
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
    // Use local date parsing to avoid timezone shift issues
    setSelectedDate(getLocalDateString(activity.date))
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

        {/* Cover Image */}
        {isEditingDetails ? (
          <div className="mb-6">
            {editCoverImage && (
              <img
                src={editCoverImage}
                alt={t.trip.coverImage}
                className="w-full h-64 object-cover rounded-lg mb-2"
              />
            )}
            <div className="bg-white rounded-lg shadow-md p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.trip.coverImageUrl}
              </label>
              <input
                type="url"
                value={editCoverImage}
                onChange={(e) => setEditCoverImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        ) : (
          trip.coverImage && (
            <img
              src={trip.coverImage}
              alt={trip.title}
              className="w-full h-64 object-cover rounded-lg mb-6"
            />
          )
        )}

        {/* Trip Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {isEditingDetails ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.trip.title} *
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-xl font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.trip.description}
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  placeholder={t.trip.describePlaceholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSaveDetails}
                  disabled={updateTrip.isPending || !editTitle.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {updateTrip.isPending ? t.trip.saving : t.trip.saveChanges}
                </button>
                <button
                  onClick={handleCancelEditDetails}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  {t.common.cancel}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-start mb-2">
                <h1 className="text-3xl font-bold">{trip.title}</h1>
                {canEdit && (
                  <button
                    onClick={() => setIsEditingDetails(true)}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  >
                    {t.trip.editDetails}
                  </button>
                )}
              </div>
              {trip.description && (
                <p className="text-gray-600 mb-4">{trip.description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <p>
                  <span className="font-semibold">{t.trip.dates}:</span>{' '}
                  {new Date(trip.startDate).toLocaleDateString()} -{' '}
                  {new Date(trip.endDate).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-semibold">{t.trip.status}:</span>{' '}
                  <span className="capitalize">{trip.status === 'planning' ? t.trip.planning : trip.status === 'upcoming' ? t.trip.upcoming : trip.status === 'ongoing' ? t.trip.ongoing : trip.status === 'completed' ? t.trip.completed : trip.status === 'cancelled' ? t.trip.cancelled : trip.status}</span>
                </p>
                {trip.role && (
                  <p>
                    <span className="font-semibold">{t.trip.yourRole}:</span>{' '}
                    <span className="capitalize">{trip.role === 'owner' ? t.trip.owner : trip.role === 'editor' ? t.trip.editor : trip.role === 'viewer' ? t.trip.viewer : trip.role}</span>
                  </p>
                )}
              </div>
            </>
          )}
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

        {/* Publish to Feed Section */}
        {isOwner && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold">{t.trip.publishToFeed}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {t.trip.publishDescription}
                </p>
              </div>
              {trip.isPublished ? (
                <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  ✓ {t.trip.published}
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                  {t.trip.draft}
                </span>
              )}
            </div>

            {/* Trip Body Editor */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.trip.tripStory}
              </label>
              {isEditingBody ? (
                <div>
                  <textarea
                    value={tripBody}
                    onChange={(e) => setTripBody(e.target.value)}
                    rows={6}
                    placeholder={t.trip.tripStoryPlaceholder}
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
                          alert(error.response?.data?.detail || t.common.error)
                        }
                      }}
                      disabled={updateTrip.isPending}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                      {updateTrip.isPending ? t.trip.saving : t.common.save}
                    </button>
                    <button
                      onClick={() => {
                        setTripBody(trip.body || '')
                        setIsEditingBody(false)
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      {t.common.cancel}
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
                    <p className="text-gray-400">{t.trip.clickToAddStory}</p>
                  )}
                </div>
              )}
            </div>

            {/* Allow Imports Toggle (before publishing) */}
            {!trip.isPublished && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowImports}
                    onChange={(e) => setAllowImports(e.target.checked)}
                    className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-medium text-gray-700">{t.trip.allowImports}</span>
                    <p className="text-sm text-gray-500">
                      {t.trip.allowImportsDescription}
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* Publish/Unpublish Button */}
            <div className="flex gap-3">
              {trip.isPublished ? (
                <>
                  <button
                    onClick={async () => {
                      if (confirm(t.trip.unpublishConfirm)) {
                        try {
                          await unpublishTrip.mutateAsync(tripId)
                        } catch (error: any) {
                          alert(error.response?.data?.detail || t.common.error)
                        }
                      }
                    }}
                    disabled={unpublishTrip.isPending}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                  >
                    {unpublishTrip.isPending ? t.trip.unpublishing : t.trip.unpublish}
                  </button>
                  <Link
                    to={`/feed/${tripId}`}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    {t.trip.viewInFeed}
                  </Link>
                </>
              ) : (
                <button
                  onClick={async () => {
                    try {
                      await publishTrip.mutateAsync({ tripId, allowImports })
                      alert(t.common.success)
                    } catch (error: any) {
                      alert(error.response?.data?.detail || t.common.error)
                    }
                  }}
                  disabled={publishTrip.isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {publishTrip.isPending ? t.trip.publishing : t.trip.publish}
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
          {/* Tab Header */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('itinerary')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === 'itinerary'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📅 {t.trip?.itinerary || 'Itinerary'}
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === 'photos'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📷 {t.photos?.album || 'Photos'}
            </button>
          </div>

          {/* Itinerary Tab Content */}
          {activeTab === 'itinerary' && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{t.trip.activities}</h2>
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
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

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{t.route.paceLabel}:</span>
                      <div className="inline-flex rounded-lg border border-gray-200 bg-white overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setPace('tight')}
                          className={`px-3 py-1.5 text-sm font-medium transition ${
                            pace === 'tight' ? 'bg-violet-600 text-white' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {t.route.paceTight}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPace('neutral')}
                          className={`px-3 py-1.5 text-sm font-medium transition border-l border-gray-200 ${
                            pace === 'neutral' ? 'bg-violet-600 text-white' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {t.route.paceNeutral}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPace('relaxed')}
                          className={`px-3 py-1.5 text-sm font-medium transition border-l border-gray-200 ${
                            pace === 'relaxed' ? 'bg-violet-600 text-white' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {t.route.paceRelaxed}
                        </button>
                      </div>
                    </div>
                  </div>
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
                    paceBuffer={paceBuffer}
                  />
                )
              })}
            </>
          )}

          {/* Photos Tab Content */}
          {activeTab === 'photos' && (
            <TripPhotosTab tripId={tripId} canEdit={canEdit} />
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
          existingActivities={activitiesByDate[selectedDate] || []}
          members={
            trip && trip.owner
              ? (() => {
                  // Check if owner is already in members list
                  const ownerInMembers = members?.some((m) => m.userId === trip.owner!.id)
                  const allMembers = members || []
                  
                  if (ownerInMembers) {
                    // Owner already in list, just return members
                    return allMembers
                  } else {
                    // Add owner to the beginning of the list
                    return [
                      {
                        id: -1, // Temporary ID for owner
                        userId: trip.owner.id,
                        role: 'owner',
                        user: trip.owner,
                      },
                      ...allMembers,
                    ]
                  }
                })()
              : members || []
          }
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
