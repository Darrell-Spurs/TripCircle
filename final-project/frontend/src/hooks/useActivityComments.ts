import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { ActivityComment } from '../types'

export function useActivityComments(activityId: number) {
  return useQuery({
    queryKey: ['activities', activityId, 'comments'],
    queryFn: async () => {
      const response = await api.get(`/activities/${activityId}/comments`)
      return response.data as ActivityComment[]
    },
    enabled: !!activityId,
  })
}

export function useCreateActivityComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ activityId, content }: { activityId: number; content: string }) => {
      const response = await api.post(`/activities/${activityId}/comments`, { content })
      return response.data as ActivityComment
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activities', variables.activityId, 'comments'] })
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

export function useUpdateActivityComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ commentId, content }: { commentId: number; content: string }) => {
      const response = await api.put(`/activities/comments/${commentId}`, { content })
      return response.data as ActivityComment
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activities', data.activityId, 'comments'] })
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

export function useDeleteActivityComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ commentId, activityId }: { commentId: number; activityId: number }) => {
      await api.delete(`/activities/comments/${commentId}`)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activities', variables.activityId, 'comments'] })
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

