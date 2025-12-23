import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { TripPhoto } from '../types'

export function useTripPhotos(tripId: number) {
  return useQuery({
    queryKey: ['trips', tripId, 'photos'],
    queryFn: async () => {
      const response = await api.get(`/photos/trips/${tripId}/photos`)
      return response.data as TripPhoto[]
    },
    enabled: !!tripId,
  })
}

export function useAddTripPhoto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      tripId,
      url,
      caption,
      isPublic,
    }: {
      tripId: number
      url: string
      caption?: string
      isPublic?: boolean
    }) => {
      const response = await api.post(`/photos/trips/${tripId}/photos`, {
        url,
        caption,
        isPublic,
      })
      return response.data as TripPhoto
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trips', variables.tripId, 'photos'] })
      queryClient.invalidateQueries({ queryKey: ['trips', variables.tripId] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

export function useUpdateTripPhoto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      photoId,
      tripId: _tripId,
      caption,
      isPublic,
    }: {
      photoId: number
      tripId: number
      caption?: string
      isPublic?: boolean
    }) => {
      const response = await api.put(`/photos/${photoId}`, {
        caption,
        isPublic,
      })
      return response.data as TripPhoto
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trips', variables.tripId, 'photos'] })
      queryClient.invalidateQueries({ queryKey: ['trips', variables.tripId] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

export function useDeleteTripPhoto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ photoId, tripId }: { photoId: number; tripId: number }) => {
      await api.delete(`/photos/${photoId}`)
      return { tripId }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trips', variables.tripId, 'photos'] })
      queryClient.invalidateQueries({ queryKey: ['trips', variables.tripId] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

export function useSetFeedCover() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ tripId, photoId }: { tripId: number; photoId: number }) => {
      const response = await api.post(`/photos/trips/${tripId}/photos/${photoId}/set-feed-cover`)
      return response.data as TripPhoto
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trips', variables.tripId, 'photos'] })
      queryClient.invalidateQueries({ queryKey: ['trips', variables.tripId] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

export function useClearFeedCover() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tripId: number) => {
      await api.delete(`/photos/trips/${tripId}/feed-cover`)
      return { tripId }
    },
    onSuccess: (_, tripId) => {
      queryClient.invalidateQueries({ queryKey: ['trips', tripId, 'photos'] })
      queryClient.invalidateQueries({ queryKey: ['trips', tripId] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

