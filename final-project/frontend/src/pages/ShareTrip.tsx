import { useParams } from 'react-router-dom'
import { useSharedTrip } from '../hooks/useShare'
import { Link } from 'react-router-dom'

export default function ShareTrip() {
  const { token } = useParams<{ token: string }>()
  const { data, isLoading } = useSharedTrip(token || '')

  useEffect(() => {
    if (token && data) {
      trackEvent('share_link_opened', { token, tripId: data.trip.id })
    }
  }, [token, data])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Trip not found</h2>
          <Link to="/" className="text-indigo-600 hover:text-indigo-700">
            Go to Home
          </Link>
        </div>
      </div>
    )
  }

  const { trip } = data

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <p className="text-sm text-gray-600">Shared Trip - Read Only</p>
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
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Itinerary</h2>
          {trip.activities && trip.activities.length > 0 ? (
            <div className="space-y-4">
              {trip.activities.map((activity) => (
                <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-lg mb-2">{activity.title}</h4>
                  {activity.startTime && activity.endTime && (
                    <p className="text-sm text-gray-600 mb-2">
                      {new Date(activity.startTime).toLocaleTimeString()} -{' '}
                      {new Date(activity.endTime).toLocaleTimeString()}
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
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No activities planned yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
