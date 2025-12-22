import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { Activity } from '../types'
import { trackEvent } from '../lib/amplitude'

export interface CreateActivityData {
  tripId: number
  date: string
  startTime?: string
  endTime?: string
  title: string
  notes?: string
  body?: string
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
  body?: string
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
    mutationFn: async ({ activityId, data, currentActivity }: { activityId: number; data: UpdateActivityData; currentActivity?: Activity }) => {
      // Include lastModifiedAt for conflict resolution if available
      const updateData = currentActivity?.lastModifiedAt
        ? { ...data, lastModifiedAt: currentActivity.lastModifiedAt }
        : data
      
      try {
        const response = await api.put(`/activities/${activityId}`, updateData)
        return { activity: response.data as Activity, conflict: false }
      } catch (error: any) {
        // Handle 409 Conflict
        if (error.response?.status === 409) {
          return {
            activity: null,
            conflict: true,
            currentVersion: error.response.data.currentVersion as Activity,
            error: error.response.data.detail,
          }
        }
        throw error
      }
    },
    onSuccess: (result, variables) => {
      if (result.activity) {
        queryClient.invalidateQueries({ queryKey: ['trips', result.activity.tripId] })
        queryClient.invalidateQueries({ queryKey: ['trips'] })
      }
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

