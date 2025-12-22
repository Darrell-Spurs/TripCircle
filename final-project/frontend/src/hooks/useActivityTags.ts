import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

export function useActivityTags(activityId: number) {
  return useQuery({
    queryKey: ['activities', activityId, 'tags'],
    queryFn: async () => {
      const response = await api.get(`/activities/${activityId}/tags`)
      return response.data as string[]
    },
    enabled: !!activityId,
  })
}

export function useAddActivityTags() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ activityId, tags }: { activityId: number; tags: string[] }) => {
      const response = await api.post(`/activities/${activityId}/tags`, { tags })
      return response.data as string[]
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activities', variables.activityId, 'tags'] })
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

export function useRemoveActivityTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ activityId, tag }: { activityId: number; tag: string }) => {
      await api.delete(`/activities/${activityId}/tags/${encodeURIComponent(tag)}`)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activities', variables.activityId, 'tags'] })
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

