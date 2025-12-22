import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { TripComment } from '../types'

export function useTripComments(tripId: number) {
  return useQuery({
    queryKey: ['feed', tripId, 'comments'],
    queryFn: async () => {
      const response = await api.get(`/feed/${tripId}/comments`)
      return response.data as TripComment[]
    },
    enabled: !!tripId,
  })
}

export function useCreateTripComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ tripId, content }: { tripId: number; content: string }) => {
      const response = await api.post(`/feed/${tripId}/comments`, { content })
      return response.data as TripComment
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['feed', variables.tripId, 'comments'] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

export function useUpdateTripComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ commentId, content, tripId }: { commentId: number; content: string; tripId: number }) => {
      const response = await api.put(`/feed/comments/${commentId}`, { content })
      return response.data as TripComment
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['feed', data.tripId, 'comments'] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

export function useDeleteTripComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ commentId, tripId }: { commentId: number; tripId: number }) => {
      await api.delete(`/feed/comments/${commentId}`)
      return { tripId }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['feed', variables.tripId, 'comments'] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

