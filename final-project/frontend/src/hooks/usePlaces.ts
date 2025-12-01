import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'

export interface Place {
  placeId: string
  name: string
  address: string
  lat: number
  lng: number
  rating?: number
  photoReference?: string
}

export interface SearchPlacesParams {
  keyword: string
  location?: string
  lat?: number
  lng?: number
}

export function useSearchPlaces(params: SearchPlacesParams, enabled: boolean = true) {
  return useQuery({
    queryKey: ['places', 'search', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      queryParams.append('keyword', params.keyword)
      if (params.location) queryParams.append('location', params.location)
      if (params.lat) queryParams.append('lat', params.lat.toString())
      if (params.lng) queryParams.append('lng', params.lng.toString())
      
      const response = await api.get(`/places/search?${queryParams.toString()}`)
      return response.data.places as Place[]
    },
    enabled: enabled && !!params.keyword,
  })
}

