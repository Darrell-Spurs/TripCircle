import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { LocationFolder } from '../types'

export function useLocationFolders(includeLocations: boolean = false) {
  return useQuery({
    queryKey: ['locationFolders', includeLocations],
    queryFn: async () => {
      const response = await api.get(`/location-folders?includeLocations=${includeLocations}`)
      return response.data as LocationFolder[]
    },
  })
}

export function useLocationFolder(id: number) {
  return useQuery({
    queryKey: ['locationFolders', id],
    queryFn: async () => {
      const response = await api.get(`/location-folders/${id}`)
      return response.data as LocationFolder
    },
    enabled: !!id,
  })
}

export function useCreateLocationFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { name: string; description?: string; isPublic?: boolean }) => {
      const response = await api.post('/location-folders', data)
      return response.data as LocationFolder
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locationFolders'] })
    },
  })
}

export function useUpdateLocationFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      folderId,
      data,
    }: {
      folderId: number
      data: { name?: string; description?: string; isPublic?: boolean }
    }) => {
      const response = await api.put(`/location-folders/${folderId}`, data)
      return response.data as LocationFolder
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['locationFolders'] })
      queryClient.invalidateQueries({ queryKey: ['locationFolders', variables.folderId] })
    },
  })
}

export function useDeleteLocationFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (folderId: number) => {
      await api.delete(`/location-folders/${folderId}`)
      return { folderId }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locationFolders'] })
    },
  })
}

