import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { ActivityHistory } from '../types'

export function useActivityHistory(activityId: number) {
  return useQuery({
    queryKey: ['activities', activityId, 'history'],
    queryFn: async () => {
      const response = await api.get(`/activities/${activityId}/history`)
      return response.data as ActivityHistory[]
    },
    enabled: !!activityId,
  })
}

