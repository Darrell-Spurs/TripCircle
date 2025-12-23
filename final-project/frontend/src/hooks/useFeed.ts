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
  appliedFilters?: {
    q: string | null
    startDate: string | null
    endDate: string | null
  }
}

interface FeedOptions {
  page?: number
  limit?: number
  q?: string
  startDate?: string
  endDate?: string
}

export function useFeed(options: FeedOptions = {}) {
  const { page = 1, limit = 20, q, startDate, endDate } = options

  return useQuery({
    queryKey: ['feed', page, limit, q, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', limit.toString())
      if (q) params.append('q', q)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await api.get(`/feed?${params.toString()}`)
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
    mutationFn: async ({ tripId, allowImports }: { tripId: number; allowImports: boolean }) => {
      const response = await api.post(`/feed/${tripId}/publish`, { allowImports })
      return response.data
    },
    onSuccess: (_, { tripId }) => {
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

export function useImportFeedTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tripId: number) => {
      const response = await api.post(`/feed/${tripId}/import`)
      return response.data as { message: string; tripId: number; title: string }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

