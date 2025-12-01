import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { Trip, CreateTripData, UpdateTripData } from '../types'
import { useAuth } from '../context/AuthContext'

export function useTrips() {
  const { isGuest } = useAuth()
  
  return useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const response = await api.get('/trips')
      return response.data.trips as Trip[]
    },
    enabled: !isGuest, // Only fetch if not a guest
  })
}

export function useTrip(tripId: number) {
  return useQuery({
    queryKey: ['trips', tripId],
    queryFn: async () => {
      const response = await api.get(`/trips/${tripId}`)
      return response.data as Trip
    },
    enabled: !!tripId,
  })
}

export function useCreateTrip() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateTripData) => {
      const response = await api.post('/trips', data)
      return response.data as Trip
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

export function useUpdateTrip() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ tripId, data }: { tripId: number; data: UpdateTripData }) => {
      const response = await api.put(`/trips/${tripId}`, data)
      return response.data as Trip
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      queryClient.invalidateQueries({ queryKey: ['trips', variables.tripId] })
    },
  })
}

export function useDeleteTrip() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (tripId: number) => {
      await api.delete(`/trips/${tripId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

