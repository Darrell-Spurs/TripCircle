import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { ActivityPreference } from '../types'

interface PreferencesResponse {
  preferences: ActivityPreference[]
  counts: {
    interested: number
    not_interested: number
  }
}

export function useActivityPreferences(activityId: number) {
  return useQuery({
    queryKey: ['activities', activityId, 'preferences'],
    queryFn: async () => {
      const response = await api.get(`/activities/${activityId}/preferences`)
      return response.data as PreferencesResponse
    },
    enabled: !!activityId,
  })
}

export function useSetActivityPreference() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      activityId,
      preference,
    }: {
      activityId: number
      preference: 'interested' | 'not_interested'
    }) => {
      const response = await api.post(`/activities/${activityId}/preferences`, { preference })
      return response.data as ActivityPreference
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activities', variables.activityId, 'preferences'] })
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

export function useRemoveActivityPreference() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (activityId: number) => {
      await api.delete(`/activities/${activityId}/preferences`)
    },
    onSuccess: (activityId) => {
      queryClient.invalidateQueries({ queryKey: ['activities', activityId, 'preferences'] })
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

