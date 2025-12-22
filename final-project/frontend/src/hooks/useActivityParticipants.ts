import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { ActivityParticipant } from '../types'

export function useActivityParticipants(activityId: number) {
  return useQuery({
    queryKey: ['activities', activityId, 'participants'],
    queryFn: async () => {
      const response = await api.get(`/activities/${activityId}/participants`)
      return response.data as ActivityParticipant[]
    },
    enabled: !!activityId,
  })
}

export function useAddActivityParticipant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ activityId, userIds }: { activityId: number; userIds: number[] }) => {
      const response = await api.post(`/activities/${activityId}/participants`, { userIds })
      return response.data as ActivityParticipant[]
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activities', variables.activityId, 'participants'] })
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

export function useRemoveActivityParticipant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ activityId, userId }: { activityId: number; userId: number }) => {
      await api.delete(`/activities/${activityId}/participants/${userId}`)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activities', variables.activityId, 'participants'] })
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

