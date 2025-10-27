// 使用者相關型別
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  createdAt: Date;
}

// 餐廳相關型別
export interface Restaurant {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  description?: string;
  images?: string[];
  tags: string[];
  status: RestaurantStatus;
  averageRating?: number;
  totalVisits: number;
  totalSpent: number;
  createdAt: Date;
  updatedAt: Date;
}

// 餐廳狀態
export const RestaurantStatus = {
  WANT_TO_VISIT: 'want_to_visit',
  VISITED: 'visited',
  FREQUENT: 'frequent'
} as const;

export type RestaurantStatus = typeof RestaurantStatus[keyof typeof RestaurantStatus];

// 拜訪紀錄型別
export interface VisitRecord {
  id: string;
  restaurantId: string;
  userId: string;
  visitDate: Date;
  rating: number;
  comment?: string;
  dishes: Dish[];
  totalSpent: number;
  photos?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// 餐點型別
export interface Dish {
  id: string;
  name: string;
  price: number;
  rating?: number;
  comment?: string;
}

// 標籤型別
export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}

// 地圖標記型別
export interface MapMarker {
  id: string;
  restaurant: Restaurant;
  position: {
    lat: number;
    lng: number;
  };
}

// 篩選選項型別
export interface FilterOptions {
  status?: RestaurantStatus[];
  tags?: string[];
  minRating?: number;
  maxRating?: number;
  searchQuery?: string;
}

// 統計資料型別
export interface RestaurantStats {
  totalRestaurants: number;
  totalVisits: number;
  totalSpent: number;
  averageRating: number;
  monthlyVisits: { month: string; count: number; spent: number }[];
  topRestaurants: Restaurant[];
}

// API 回應型別
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分頁型別
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 分頁回應型別
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
