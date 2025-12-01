import { Link } from 'react-router-dom'
import { useTrips, useDeleteTrip } from '../hooks/useTrips'
import { useAuth } from '../context/AuthContext'
import { Trip } from '../types'

export default function Dashboard() {
  const { user, isGuest } = useAuth()
  const { data: trips, isLoading } = useTrips()
  const deleteTrip = useDeleteTrip()

  const handleDelete = async (tripId: number) => {
    if (confirm('Are you sure you want to delete this trip?')) {
      await deleteTrip.mutateAsync(tripId)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">My Trips</h1>
            {isGuest && (
              <p className="text-sm text-gray-500 mt-1">
                Browsing as guest - <Link to="/auth/login" className="text-indigo-600 hover:underline">Login</Link> to save your trips
              </p>
            )}
          </div>
          {!isGuest && (
            <Link
              to="/trips/new"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              + New Trip
            </Link>
          )}
        </div>

        {isGuest ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-600 mb-4 text-lg">
              Welcome! You're browsing as a guest.
            </p>
            <p className="text-gray-500 mb-6">
              To create and save trips, please sign up or log in.
            </p>
            <div className="space-x-4">
              <Link
                to="/auth/login"
                className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
              >
                Login
              </Link>
              <Link
                to="/auth/register"
                className="inline-block bg-white text-indigo-600 px-6 py-3 rounded-lg hover:bg-gray-50 transition border-2 border-indigo-600"
              >
                Sign Up
              </Link>
            </div>
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-500 mb-4">You can still explore:</p>
              <div className="space-x-4">
                <Link
                  to="/explore"
                  className="inline-block text-indigo-600 hover:text-indigo-700 underline"
                >
                  Explore Places
                </Link>
                <Link
                  to="/admin/analytics"
                  className="inline-block text-indigo-600 hover:text-indigo-700 underline"
                >
                  View Analytics
                </Link>
              </div>
            </div>
          </div>
        ) : !trips || trips.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No trips yet. Create your first trip!</p>
            <Link
              to="/trips/new"
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
            >
              Create Trip
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip: Trip) => (
              <div
                key={trip.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
              >
                {trip.coverImage && (
                  <img
                    src={trip.coverImage}
                    alt={trip.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2">{trip.title}</h3>
                  {trip.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {trip.description}
                    </p>
                  )}
                  <div className="text-sm text-gray-500 mb-3">
                    <p>
                      {new Date(trip.startDate).toLocaleDateString()} -{' '}
                      {new Date(trip.endDate).toLocaleDateString()}
                    </p>
                    <p className="mt-1">
                      Status: <span className="capitalize">{trip.status}</span>
                    </p>
                    {trip.role && (
                      <p className="mt-1">
                        Role: <span className="capitalize">{trip.role}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/trips/${trip.id}`}
                      className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded text-center hover:bg-indigo-700 transition"
                    >
                      View
                    </Link>
                    {trip.isOwner && (
                      <button
                        onClick={() => handleDelete(trip.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
