import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const isGuest = localStorage.getItem('guest') === 'true'
      localStorage.removeItem('token')
      // Only redirect to login if not a guest
      if (!isGuest) {
        window.location.href = '/auth/login'
      }
    }
    // Don't reject 404 for transportation segments - it's expected when no manual override exists
    // Check both the URL path (relative) and full URL (absolute)
    const url = error.config?.url || ''
    const fullUrl = error.config?.baseURL ? `${error.config.baseURL}${url}` : url
    const isTransportationSegment = 
      url.includes('/activities/transportation/') || 
      fullUrl.includes('/activities/transportation/')
    
    if (isTransportationSegment && error.response?.status === 404) {
      // Return a response with null data instead of rejecting
      // This prevents the error from being logged and makes React Query treat it as success
      // Create a proper axios response object
      const response = {
        data: null,
        status: 200,
        statusText: 'OK',
        headers: error.response?.headers || {},
        config: error.config || {},
        request: error.request,
      }
      return Promise.resolve(response)
    }
    return Promise.reject(error)
  }
)

export default api

