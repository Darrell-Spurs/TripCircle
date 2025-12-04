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
  body?: string
  coverImage?: string
  startDate: string
  endDate: string
  status: string
  isPublished?: boolean
  publishedAt?: string | null
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
  body?: string
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
  body?: string
  coverImage?: string
  startDate: string
  endDate: string
  status?: string
}

export interface UpdateTripData {
  title?: string
  description?: string
  body?: string
  coverImage?: string
  startDate?: string
  endDate?: string
  status?: string
}

// Feed types
export interface FeedTrip {
  id: number
  title: string
  description?: string
  body?: string
  coverImage?: string
  startDate: string
  endDate: string
  status: string
  publishedAt?: string
  owner: {
    id: number
    name: string
    avatarUrl?: string
  }
  activitiesCount: number
  activitiesPreview: {
    id: number
    title: string
    locationName?: string
  }[]
}

export interface FeedTripDetail {
  id: number
  title: string
  description?: string
  body?: string
  coverImage?: string
  startDate: string
  endDate: string
  status: string
  publishedAt?: string
  shareToken?: string | null
  owner: {
    id: number
    name: string
    avatarUrl?: string
  }
  activities: Activity[]
}

