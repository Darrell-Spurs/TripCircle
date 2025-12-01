import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { TripMember } from '../types'

export interface InviteMemberData {
  email: string
  role: string
}

export interface UpdateMemberRoleData {
  role: string
}

export function useTripMembers(tripId: number) {
  return useQuery({
    queryKey: ['trips', tripId, 'members'],
    queryFn: async () => {
      const response = await api.get(`/members/trips/${tripId}/members`)
      return response.data.members as TripMember[]
    },
    enabled: !!tripId,
  })
}

export function useInviteMember() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ tripId, data }: { tripId: number; data: InviteMemberData }) => {
      const response = await api.post(`/members/trips/${tripId}/members`, data)
      return response.data as TripMember
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trips', variables.tripId, 'members'] })
      queryClient.invalidateQueries({ queryKey: ['trips', variables.tripId] })
    },
  })
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ memberId, data }: { memberId: number; data: UpdateMemberRoleData }) => {
      const response = await api.patch(`/members/${memberId}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

export function useRemoveMember() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ memberId, tripId }: { memberId: number; tripId: number }) => {
      await api.delete(`/members/${memberId}`)
      return { tripId }
    },
    onSuccess: ({ tripId }) => {
      queryClient.invalidateQueries({ queryKey: ['trips', tripId, 'members'] })
      queryClient.invalidateQueries({ queryKey: ['trips', tripId] })
    },
  })
}

