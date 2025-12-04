import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateTrip } from '../hooks/useTrips'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function CreateTrip() {
  const navigate = useNavigate()
  const { isGuest } = useAuth()
  const { t } = useLanguage()
  const createTrip = useCreateTrip()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverImage: '',
    startDate: '',
    endDate: '',
    status: 'planning',
  })

  useEffect(() => {
    if (isGuest) {
      navigate('/dashboard')
    }
  }, [isGuest, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isGuest) {
      alert(t.auth.loginFailed)
      navigate('/auth/login')
      return
    }
    try {
      // Convert date strings to ISO datetime format (add time component at midnight UTC)
      // Date input gives YYYY-MM-DD, we need to convert to ISO 8601 datetime
      // Convert date strings to ISO datetime format (add time component)
      // Date input gives YYYY-MM-DD, we need to convert to ISO 8601 datetime
      const submitData = {
        ...formData,
        startDate: formData.startDate 
          ? new Date(formData.startDate + 'T00:00:00.000Z').toISOString() 
          : '',
        endDate: formData.endDate 
          ? new Date(formData.endDate + 'T23:59:59.999Z').toISOString() 
          : '',
        status: formData.status || 'planning',
      }
      
      const trip = await createTrip.mutateAsync(submitData)
      navigate(`/trips/${trip.id}`)
    } catch (error: any) {
      alert(error.response?.data?.detail || t.trip.createTrip + ' ' + t.common.error)
    }
  }

  if (isGuest) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">{t.trip.createTrip}</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.trip.title} *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.trip.description}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.trip.coverImage}
            </label>
            <input
              type="url"
              value={formData.coverImage}
              onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.trip.startDate} *
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.trip.endDate} *
              </label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.trip.status}
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="planning">{t.trip.planning}</option>
              <option value="upcoming">{t.trip.upcoming}</option>
              <option value="ongoing">{t.trip.ongoing}</option>
              <option value="completed">{t.trip.completed}</option>
              <option value="cancelled">{t.trip.cancelled}</option>
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={createTrip.isPending}
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {createTrip.isPending ? t.common.loading : t.trip.createTrip}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              {t.common.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

