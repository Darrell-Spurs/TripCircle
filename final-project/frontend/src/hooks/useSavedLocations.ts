import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { SavedLocation } from '../types'

export function useSaveLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      folderId,
      data,
    }: {
      folderId: number
      data: {
        name: string
        address: string
        lat: number
        lng: number
        placeId: string
        notes?: string
        tags?: string[]
      }
    }) => {
      const response = await api.post(`/location-folders/${folderId}/locations`, data)
      return response.data as SavedLocation
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['locationFolders'] })
      queryClient.invalidateQueries({ queryKey: ['locationFolders', variables.folderId] })
    },
  })
}

export function useUpdateSavedLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      folderId,
      locationId,
      data,
    }: {
      folderId: number
      locationId: number
      data: { notes?: string; tags?: string[] }
    }) => {
      const response = await api.put(`/location-folders/${folderId}/locations/${locationId}`, data)
      return response.data as SavedLocation
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['locationFolders'] })
      queryClient.invalidateQueries({ queryKey: ['locationFolders', variables.folderId] })
    },
  })
}

export function useDeleteSavedLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ folderId, locationId }: { folderId: number; locationId: number }) => {
      await api.delete(`/location-folders/${folderId}/locations/${locationId}`)
      return { folderId, locationId }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['locationFolders'] })
      queryClient.invalidateQueries({ queryKey: ['locationFolders', variables.folderId] })
    },
  })
}

