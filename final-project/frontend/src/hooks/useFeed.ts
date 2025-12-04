import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { FeedTrip, FeedTripDetail } from '../types'

interface FeedResponse {
  trips: FeedTrip[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function useFeed(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: ['feed', page, limit],
    queryFn: async () => {
      const response = await api.get(`/feed?page=${page}&limit=${limit}`)
      return response.data as FeedResponse
    },
  })
}

export function useFeedTrip(tripId: number) {
  return useQuery({
    queryKey: ['feed', 'trip', tripId],
    queryFn: async () => {
      const response = await api.get(`/feed/${tripId}`)
      return response.data as FeedTripDetail
    },
    enabled: !!tripId,
  })
}

export function usePublishTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tripId: number) => {
      const response = await api.post(`/feed/${tripId}/publish`)
      return response.data
    },
    onSuccess: (_, tripId) => {
      queryClient.invalidateQueries({ queryKey: ['trips', tripId] })
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

export function useUnpublishTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tripId: number) => {
      const response = await api.post(`/feed/${tripId}/unpublish`)
      return response.data
    },
    onSuccess: (_, tripId) => {
      queryClient.invalidateQueries({ queryKey: ['trips', tripId] })
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

