import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { Activity } from '../types'

export interface CreateActivityData {
  tripId: number
  date: string
  startTime?: string
  endTime?: string
  title: string
  notes?: string
  placeId?: string
  locationName?: string
  address?: string
  lat?: number
  lng?: number
  orderIndex: number
}

export interface UpdateActivityData {
  date?: string
  startTime?: string
  endTime?: string
  title?: string
  notes?: string
  placeId?: string
  locationName?: string
  address?: string
  lat?: number
  lng?: number
  orderIndex?: number
}

export function useCreateActivity() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateActivityData) => {
      const response = await api.post(`/activities/trips/${data.tripId}/activities`, data)
      return response.data as Activity
    },
    onSuccess: (activity, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trips', variables.tripId] })
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      trackEvent('activity_added', { tripId: variables.tripId, activityId: activity.id })
    },
  })
}

export function useUpdateActivity() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ activityId, data }: { activityId: number; data: UpdateActivityData }) => {
      const response = await api.put(`/activities/${activityId}`, data)
      return response.data as Activity
    },
    onSuccess: (activity) => {
      queryClient.invalidateQueries({ queryKey: ['trips', activity.tripId] })
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

export function useDeleteActivity() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ activityId, tripId }: { activityId: number; tripId: number }) => {
      await api.delete(`/activities/${activityId}`)
      return { activityId, tripId }
    },
    onSuccess: ({ tripId }) => {
      queryClient.invalidateQueries({ queryKey: ['trips', tripId] })
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

export function useReorderActivities() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ activityIds, tripId }: { activityIds: number[]; tripId: number }) => {
      await api.patch('/activities/reorder', { activityIds })
      return { tripId }
    },
    onSuccess: ({ tripId }) => {
      queryClient.invalidateQueries({ queryKey: ['trips', tripId] })
    },
  })
}

