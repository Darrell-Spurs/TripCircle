export interface User {
  id: number
  email: string
  name: string
  avatarUrl?: string
  provider: string
}

export interface Trip {
  id: number
  title: string
  description?: string
  coverImage?: string
  startDate: string
  endDate: string
  status: string
  ownerId: number
  isOwner?: boolean
  role?: string
  owner?: User
  members?: TripMember[]
  activities?: Activity[]
  createdAt: string
  updatedAt: string
}

export interface TripMember {
  id: number
  userId: number
  role: string
  user: User
}

export interface Activity {
  id: number
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

export interface CreateTripData {
  title: string
  description?: string
  coverImage?: string
  startDate: string
  endDate: string
  status?: string
}

export interface UpdateTripData {
  title?: string
  description?: string
  coverImage?: string
  startDate?: string
  endDate?: string
  status?: string
}

