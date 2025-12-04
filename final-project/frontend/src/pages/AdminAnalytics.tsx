import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface Metrics {
  totalUsers: number
  totalTrips: number
  tripsOverTime: Array<{ date: string; count: number }>
  dailyActiveUsers: Record<string, number>
  exploreUsage: number
  shareLinkStats: {
    total: number
    active: number
  }
  mostActiveTrips: Array<{
    tripId: number
    title: string
    activityCount: number
  }>
  eventTypeBreakdown: Record<string, number>
}

export default function AdminAnalytics() {
  const { isGuest } = useAuth()
  const { t } = useLanguage()
  const { data: metrics, isLoading } = useQuery<Metrics>({
    queryKey: ['admin', 'metrics'],
    queryFn: async () => {
      const response = await api.get('/admin/metrics')
      return response.data
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">{t.common.loading}</div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{t.common.error}</h2>
        </div>
      </div>
    )
  }

  // Process trips over time data
  const tripsChartData = Object.entries(
    metrics.tripsOverTime.reduce((acc, item) => {
      acc[item.date] = (acc[item.date] || 0) + item.count
      return acc
    }, {} as Record<string, number>)
  ).map(([date, count]) => ({ date, count }))

  // Process daily active users
  const dauChartData = Object.entries(metrics.dailyActiveUsers).map(([date, count]) => ({
    date,
    count,
  }))

  // Process event type breakdown
  const eventTypeData = Object.entries(metrics.eventTypeBreakdown).map(([type, count]) => ({
    type,
    count,
  }))

  if (isGuest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-md p-8 max-w-md">
          <h2 className="text-2xl font-bold mb-4">{t.admin.authenticationRequired}</h2>
          <p className="text-gray-600 mb-6">
            {t.admin.authRequiredDesc}
          </p>
          <div className="space-x-4">
            <Link
              to="/auth/login"
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
            >
              {t.nav.login}
            </Link>
            <Link
              to="/dashboard"
              className="inline-block bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
            >
              {t.admin.goBack}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{t.admin.analytics}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">{t.admin.totalUsers}</h3>
            <p className="text-3xl font-bold">{metrics.totalUsers}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">{t.admin.totalTrips}</h3>
            <p className="text-3xl font-bold">{metrics.totalTrips}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">{t.admin.exploreUsage}</h3>
            <p className="text-3xl font-bold">{metrics.exploreUsage}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">{t.admin.shareLinkStats} ({t.admin.active})</h3>
            <p className="text-3xl font-bold">{metrics.shareLinkStats.active}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">{t.admin.tripsOverTime}</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tripsChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#4F46E5" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Daily Active Users (Last 7 Days)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dauChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#4F46E5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">{t.admin.eventTypeBreakdown}</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={eventTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">{t.admin.mostActiveTrips}</h2>
            <div className="space-y-3">
              {metrics.mostActiveTrips.map((trip) => (
                <div key={trip.tripId} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">{trip.title}</span>
                  <span className="text-indigo-600 font-semibold">{trip.activityCount} {t.trip.activities}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
