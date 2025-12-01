import * as amplitude from '@amplitude/analytics-browser'

const AMPLITUDE_API_KEY = import.meta.env.VITE_AMPLITUDE_API_KEY

if (AMPLITUDE_API_KEY) {
  amplitude.init(AMPLITUDE_API_KEY, undefined, {
    defaultTracking: {
      pageViews: true,
      sessions: true,
    },
  })
}

export const trackEvent = (eventName: string, eventProperties?: Record<string, any>) => {
  if (AMPLITUDE_API_KEY) {
    amplitude.track(eventName, eventProperties)
  }
  
  // Also log to backend
  if (typeof window !== 'undefined') {
    const api = import('../lib/api').then((m) => m.default)
    api.then((apiClient) => {
      apiClient.post('/events', {
        eventType: eventName,
        metadata: eventProperties,
      }).catch(() => {
        // Silently fail if backend is not available
      })
    })
  }
}

export default amplitude

