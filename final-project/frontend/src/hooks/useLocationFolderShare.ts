import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { LocationFolder, LocationFolderShareLink } from '../types'

export function useCreateLocationFolderShareLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      folderId,
      data,
    }: {
      folderId: number
      data: { permission: string; expiresAt?: string }
    }) => {
      const response = await api.post(`/location-folders/${folderId}/share-links`, data)
      return response.data as LocationFolderShareLink
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['locationFolders', variables.folderId] })
    },
  })
}

export function useSharedLocationFolder(token: string) {
  return useQuery({
    queryKey: ['locationFolders', 'shared', token],
    queryFn: async () => {
      const response = await api.get(`/location-folders/shared/${token}`)
      return response.data as { folder: LocationFolder; permission: string; isShared: boolean }
    },
    enabled: !!token,
  })
}

export function useImportLocationFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (folderId: number) => {
      const response = await api.post(`/location-folders/${folderId}/import`)
      return response.data as LocationFolder
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locationFolders'] })
    },
  })
}

