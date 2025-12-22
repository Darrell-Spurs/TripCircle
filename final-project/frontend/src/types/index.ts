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
  createdByUserId?: number
  createdBy?: User
  cost?: number
  currency?: string
  participants?: ActivityParticipant[]
  comments?: ActivityComment[]
  costShares?: ActivityCostShare[]
  preferences?: ActivityPreference[]
  tags?: string[]
  preferenceCounts?: {
    interested: number
    not_interested: number
  }
  commentsCount?: number
  lastModifiedAt?: string
}

export interface ActivityParticipant {
  id: number
  activityId: number
  userId: number
  user: User
  createdAt: string
}

export interface ActivityComment {
  id: number
  activityId: number
  userId: number
  user: User
  content: string
  createdAt: string
  updatedAt: string
}

export interface ActivityCostShare {
  id: number
  activityId: number
  userId: number
  user: User
  amount: number
  createdAt: string
  updatedAt: string
}

export interface ActivityPreference {
  id: number
  activityId: number
  userId: number
  user: User
  preference: 'interested' | 'not_interested'
  createdAt: string
}

export interface ActivityHistory {
  id: number
  activityId: number
  userId: number
  user: User
  action: string
  changes?: any
  createdAt: string
}

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
  participantIds?: number[]
  cost?: number
  currency?: string
  tags?: string[]
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
  participantIds?: number[]
  cost?: number | null
  currency?: string | null
  tags?: string[]
  lastModifiedAt?: string
  costShares?: { userId: number; amount: number }[]
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

