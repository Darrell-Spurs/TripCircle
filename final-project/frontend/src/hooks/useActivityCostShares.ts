import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { ActivityCostShare } from '../types'

export function useActivityCostShares(activityId: number) {
  return useQuery({
    queryKey: ['activities', activityId, 'cost-shares'],
    queryFn: async () => {
      const response = await api.get(`/activities/${activityId}/cost-shares`)
      return response.data as ActivityCostShare[]
    },
    enabled: !!activityId,
  })
}

export function useSetActivityCostShares() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      activityId,
      shares,
    }: {
      activityId: number
      shares: { userId: number; amount: number }[]
    }) => {
      const response = await api.post(`/activities/${activityId}/cost-shares`, { shares })
      return response.data as ActivityCostShare[]
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activities', variables.activityId, 'cost-shares'] })
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

export function useClearActivityCostShares() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (activityId: number) => {
      await api.delete(`/activities/${activityId}/cost-shares`)
    },
    onSuccess: (activityId) => {
      queryClient.invalidateQueries({ queryKey: ['activities', activityId, 'cost-shares'] })
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

