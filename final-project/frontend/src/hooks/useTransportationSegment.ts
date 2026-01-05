import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

interface TransportationSegment {
  id: number
  fromActivityId: number
  toActivityId: number
  manualStartTime: string | null
  manualEndTime: string | null
  isManualOverride: boolean
  transportationMode?: string // 'driving', 'walking', 'bicycling', 'transit' (optional for backward compatibility, defaults to 'driving' if null/undefined)
  note?: string | null // Note for this transportation segment
}

interface UpdateTransportationSegmentData {
  manualStartTime?: string | null
  manualEndTime?: string | null
  isManualOverride?: boolean
  transportationMode?: string // 'driving', 'walking', 'bicycling', 'transit'
  note?: string | null // Note for this transportation segment
}

export function useTransportationSegment(fromActivityId: number, toActivityId: number) {
  return useQuery<TransportationSegment | null>({
    queryKey: ['transportationSegment', fromActivityId, toActivityId],
    queryFn: async () => {
      try {
        // Axios interceptor handles 404 and returns null, so we can directly use the response
        const response = await api.get(
          `/activities/transportation/${fromActivityId}/${toActivityId}`
        )
        return response.data // Will be null if no segment exists (404 handled by interceptor)
      } catch (error: any) {
        // Fallback: if interceptor didn't catch it, handle 404 here
        if (error.response?.status === 404) {
          return null // No segment exists, use auto-calculated time
        }
        // Re-throw other errors
        throw error
      }
    },
    enabled: fromActivityId > 0 && toActivityId > 0,
    retry: false, // Don't retry - 404 is expected, other errors shouldn't be retried
  })
}

export function useUpdateTransportationSegment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      fromActivityId,
      toActivityId,
      data,
    }: {
      fromActivityId: number
      toActivityId: number
      data: UpdateTransportationSegmentData
    }) => {
      const response = await api.put(
        `/activities/transportation/${fromActivityId}/${toActivityId}`,
        data
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['transportationSegment', variables.fromActivityId, variables.toActivityId],
      })
    },
  })
}

export function useDeleteTransportationSegment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      fromActivityId,
      toActivityId,
    }: {
      fromActivityId: number
      toActivityId: number
    }) => {
      await api.delete(`/activities/transportation/${fromActivityId}/${toActivityId}`)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['transportationSegment', variables.fromActivityId, variables.toActivityId],
      })
    },
  })
}

