import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { Trip } from '../types'

export interface CreateShareLinkData {
  permission: string
  expiresAt?: string
}

export interface ShareLink {
  id: number
  token: string
  permission: string
  expiresAt?: string
  url: string
}

export function useCreateShareLink() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ tripId, data }: { tripId: number; data: CreateShareLinkData }) => {
      const response = await api.post(`/share/trips/${tripId}/share-links`, data)
      return response.data as ShareLink
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trips', variables.tripId] })
    },
  })
}

export function useSharedTrip(token: string) {
  return useQuery({
    queryKey: ['shared-trips', token],
    queryFn: async () => {
      const response = await api.get(`/share/${token}`)
      return {
        trip: response.data.trip as Trip,
        permission: response.data.permission as string,
        isShared: response.data.isShared as boolean,
      }
    },
    enabled: !!token,
  })
}

