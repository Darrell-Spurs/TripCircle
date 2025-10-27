import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, Restaurant, VisitRecord, Tag, FilterOptions } from '../types';
import { RestaurantStatus } from '../types';
import { mockUser, mockRestaurants, mockVisitRecords, mockTags } from '../data/mockData';

interface AppContextType {
  user: User | null;
  restaurants: Restaurant[];
  visitRecords: VisitRecord[];
  tags: Tag[];
  filteredRestaurants: Restaurant[];
  filterOptions: FilterOptions;
  selectedRestaurant: Restaurant | null;
  setUser: (user: User | null) => void;
  setRestaurants: (restaurants: Restaurant[]) => void;
  setVisitRecords: (records: VisitRecord[]) => void;
  setTags: (tags: Tag[]) => void;
  setFilterOptions: (options: FilterOptions) => void;
  setSelectedRestaurant: (restaurant: Restaurant | null) => void;
  addRestaurant: (restaurant: Restaurant) => void;
  updateRestaurant: (id: string, updates: Partial<Restaurant>) => void;
  deleteRestaurant: (id: string) => void;
  addVisitRecord: (record: VisitRecord) => void;
  updateVisitRecord: (id: string, updates: Partial<VisitRecord>) => void;
  deleteVisitRecord: (id: string) => void;
  addTag: (tag: Tag) => void;
  filterRestaurants: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(mockUser);
  const [restaurants, setRestaurants] = useState<Restaurant[]>(mockRestaurants);
  const [visitRecords, setVisitRecords] = useState<VisitRecord[]>(mockVisitRecords);
  const [tags, setTags] = useState<Tag[]>(mockTags);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>(mockRestaurants);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({});
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  const filterRestaurants = () => {
    let filtered = [...restaurants];

    // 搜尋篩選
    if (filterOptions.searchQuery) {
      const query = filterOptions.searchQuery.toLowerCase();
      filtered = filtered.filter(restaurant =>
        restaurant.name.toLowerCase().includes(query) ||
        restaurant.address.toLowerCase().includes(query) ||
        restaurant.description?.toLowerCase().includes(query) ||
        restaurant.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // 狀態篩選
    if (filterOptions.status && filterOptions.status.length > 0) {
      filtered = filtered.filter(restaurant =>
        filterOptions.status!.includes(restaurant.status)
      );
    }

    // 標籤篩選
    if (filterOptions.tags && filterOptions.tags.length > 0) {
      filtered = filtered.filter(restaurant =>
        filterOptions.tags!.some(tag => restaurant.tags.includes(tag))
      );
    }

    // 評分篩選
    if (filterOptions.minRating !== undefined) {
      filtered = filtered.filter(restaurant =>
        (restaurant.averageRating || 0) >= filterOptions.minRating!
      );
    }

    if (filterOptions.maxRating !== undefined) {
      filtered = filtered.filter(restaurant =>
        (restaurant.averageRating || 0) <= filterOptions.maxRating!
      );
    }

    setFilteredRestaurants(filtered);
  };

  const addRestaurant = (restaurant: Restaurant) => {
    setRestaurants(prev => [...prev, restaurant]);
  };

  const updateRestaurant = (id: string, updates: Partial<Restaurant>) => {
    setRestaurants(prev =>
      prev.map(restaurant =>
        restaurant.id === id ? { ...restaurant, ...updates } : restaurant
      )
    );
  };

  const deleteRestaurant = (id: string) => {
    setRestaurants(prev => prev.filter(restaurant => restaurant.id !== id));
    setVisitRecords(prev => prev.filter(record => record.restaurantId !== id));
  };

  const addVisitRecord = (record: VisitRecord) => {
    setVisitRecords(prev => [...prev, record]);
    
    // 更新餐廳統計資料
    const restaurant = restaurants.find(r => r.id === record.restaurantId);
    if (restaurant) {
      const newTotalVisits = restaurant.totalVisits + 1;
      const newTotalSpent = restaurant.totalSpent + record.totalSpent;
      const existingRecords = visitRecords.filter(r => r.restaurantId === record.restaurantId);
      const newAverageRating = existingRecords.length > 0 
        ? (existingRecords.reduce((sum, r) => sum + r.rating, 0) + record.rating) / (existingRecords.length + 1)
        : record.rating;
      
      updateRestaurant(record.restaurantId, {
        totalVisits: newTotalVisits,
        totalSpent: newTotalSpent,
        averageRating: newAverageRating,
        status: newTotalVisits >= 5 ? RestaurantStatus.FREQUENT : RestaurantStatus.VISITED
      });
    }
  };

  const updateVisitRecord = (id: string, updates: Partial<VisitRecord>) => {
    setVisitRecords(prev =>
      prev.map(record =>
        record.id === id ? { ...record, ...updates } : record
      )
    );
  };

  const deleteVisitRecord = (id: string) => {
    const record = visitRecords.find(r => r.id === id);
    if (record) {
      setVisitRecords(prev => prev.filter(r => r.id !== id));
      
      // 更新餐廳統計資料
      const restaurant = restaurants.find(r => r.id === record.restaurantId);
      if (restaurant) {
        const newTotalVisits = Math.max(0, restaurant.totalVisits - 1);
        const newTotalSpent = Math.max(0, restaurant.totalSpent - record.totalSpent);
        const remainingRecords = visitRecords.filter(r => r.restaurantId === record.restaurantId && r.id !== id);
        const newAverageRating = remainingRecords.length > 0 
          ? remainingRecords.reduce((sum, r) => sum + r.rating, 0) / remainingRecords.length
          : 0;
        
        updateRestaurant(record.restaurantId, {
          totalVisits: newTotalVisits,
          totalSpent: newTotalSpent,
          averageRating: newAverageRating,
          status: newTotalVisits >= 5 ? RestaurantStatus.FREQUENT : 
                 newTotalVisits > 0 ? RestaurantStatus.VISITED : RestaurantStatus.WANT_TO_VISIT
        });
      }
    }
  };

  const addTag = (tag: Tag) => {
    setTags(prev => [...prev, tag]);
  };

  // 當篩選選項改變時自動重新篩選
  React.useEffect(() => {
    filterRestaurants();
  }, [filterOptions, restaurants]);

  const value: AppContextType = {
    user,
    restaurants,
    visitRecords,
    tags,
    filteredRestaurants,
    filterOptions,
    selectedRestaurant,
    setUser,
    setRestaurants,
    setVisitRecords,
    setTags,
    setFilterOptions,
    setSelectedRestaurant,
    addRestaurant,
    updateRestaurant,
    deleteRestaurant,
    addVisitRecord,
    updateVisitRecord,
    deleteVisitRecord,
    addTag,
    filterRestaurants,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
