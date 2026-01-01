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
  activityType?: 'regular' | 'gathering_point'
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

export interface RouteStep {
  instruction: string
  travelMode: string
  distanceMeters?: number
  duration?: string
  transitDetails?: {
    lineName?: string
    fromStation?: string
    toStation?: string
    vehicleType?: string // BUS, SUBWAY, TRAIN, TRAM, etc.
  }
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

export interface TripComment {
  id: number
  tripId: number
  userId: number
  user: {
    id: number
    name: string
    avatarUrl?: string
  }
  content: string
  createdAt: string
  updatedAt: string
}

export interface TripPhoto {
  id: number
  tripId: number
  url: string
  caption?: string
  isPublic: boolean
  isFeedCover: boolean
  addedBy: {
    id: number
    name: string
    avatarUrl?: string
  }
  createdAt: string
  updatedAt: string
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
  activityType?: 'regular' | 'gathering_point'
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
  activityType?: 'regular' | 'gathering_point'
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
  feedCoverImage?: string | null
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
  commentsCount: number
  publicPhotosCount: number
  activitiesPreview: {
    id: number
    title: string
    locationName?: string
  }[]
}

export interface FeedTripPhoto {
  id: number
  url: string
  caption?: string
  isFeedCover: boolean
  addedBy: {
    id: number
    name: string
    avatarUrl?: string
  }
  createdAt: string
}

export interface FeedTripDetail {
  id: number
  title: string
  description?: string
  body?: string
  coverImage?: string
  feedCoverImage?: string | null
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
  publicPhotos: FeedTripPhoto[]
}

export interface LocationFolder {
  id: number
  userId: number
  name: string
  description?: string
  isPublic: boolean
  locationsCount?: number
  locations?: SavedLocation[]
  owner?: User
  createdAt: string
  updatedAt: string
}

export interface SavedLocation {
  id: number
  folderId: number
  name: string
  address: string
  lat: number
  lng: number
  placeId: string
  notes?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface LocationFolderShareLink {
  id: number
  folderId: number
  token: string
  permission: string
  expiresAt?: string
  url: string
}

