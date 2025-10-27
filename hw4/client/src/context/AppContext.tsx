import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, Restaurant, VisitRecord, Tag, FilterOptions } from '../types';
import { RestaurantStatus } from '../types';
import * as authService from '../services/auth.service';
import * as restaurantService from '../services/restaurant.service';
import * as visitService from '../services/visit.service';
import * as tagService from '../services/tag.service';

interface AppContextType {
  user: User | null;
  restaurants: Restaurant[];
  visitRecords: VisitRecord[];
  tags: Tag[];
  filteredRestaurants: Restaurant[];
  filterOptions: FilterOptions;
  selectedRestaurant: Restaurant | null;
  loading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setRestaurants: (restaurants: Restaurant[]) => void;
  setVisitRecords: (records: VisitRecord[]) => void;
  setTags: (tags: Tag[]) => void;
  setFilterOptions: (options: FilterOptions) => void;
  setSelectedRestaurant: (restaurant: Restaurant | null) => void;
  addRestaurant: (restaurant: Partial<Restaurant>) => Promise<Restaurant>;
  updateRestaurant: (id: string, updates: Partial<Restaurant>) => void;
  deleteRestaurant: (id: string) => void;
  addVisitRecord: (record: VisitRecord) => void;
  updateVisitRecord: (id: string, updates: Partial<VisitRecord>) => void;
  deleteVisitRecord: (id: string) => void;
  addTag: (tag: Tag) => void;
  filterRestaurants: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchData: () => Promise<void>;
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
  const [user, setUser] = useState<User | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [visitRecords, setVisitRecords] = useState<VisitRecord[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({});
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const storedUser = authService.getStoredUser();
    if (storedUser && authService.isAuthenticated()) {
      setUser(storedUser);
      fetchData();
    }
  }, []);

  // Fetch all data from backend
  const fetchData = async () => {
    if (!authService.isAuthenticated()) return;
    
    setLoading(true);
    setError(null);
    try {
      // Fetch user profile
      const userProfile = await authService.getProfile();
      setUser(userProfile);

      // Fetch restaurants
      const restaurantsData = await restaurantService.getRestaurants();
      setRestaurants(restaurantsData);
      setFilteredRestaurants(restaurantsData);

      // Fetch visit records
      const visitsData = await visitService.getVisits();
      setVisitRecords(visitsData);

      // Fetch tags
      const tagsData = await tagService.getTags();
      setTags(tagsData);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.error || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(email, password);
      setUser(response.user);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.register(username, email, password);
      setUser(response.user);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setRestaurants([]);
    setVisitRecords([]);
    setTags([]);
    setFilteredRestaurants([]);
  };

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

  const addRestaurant = async (restaurant: Partial<Restaurant>): Promise<Restaurant> => {
    setLoading(true);
    setError(null);
    try {
      const newRestaurant = await restaurantService.createRestaurant(restaurant);
      // Refresh all data to ensure consistency
      await fetchData();
      return newRestaurant;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add restaurant');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateRestaurant = async (id: string, updates: Partial<Restaurant>) => {
    setLoading(true);
    setError(null);
    try {
      await restaurantService.updateRestaurant(id, updates);
      setRestaurants(prev =>
        prev.map(restaurant =>
          restaurant.id === id ? { ...restaurant, ...updates } : restaurant
        )
      );
      filterRestaurants();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update restaurant');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteRestaurant = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await restaurantService.deleteRestaurant(id);
      setRestaurants(prev => prev.filter(restaurant => restaurant.id !== id));
      setVisitRecords(prev => prev.filter(record => record.restaurantId !== id));
      filterRestaurants();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete restaurant');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addVisitRecord = async (record: VisitRecord) => {
    setLoading(true);
    setError(null);
    try {
      const newRecord = await visitService.createVisit(record);
      setVisitRecords(prev => [...prev, newRecord]);
      
      // Refresh restaurant data to update statistics
      await fetchData();
      
      return newRecord;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add visit record');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateVisitRecord = async (id: string, updates: Partial<VisitRecord>) => {
    setLoading(true);
    setError(null);
    try {
      await visitService.updateVisit(id, updates);
      setVisitRecords(prev =>
        prev.map(record =>
          record.id === id ? { ...record, ...updates } : record
        )
      );
      
      // Refresh restaurant data to update statistics
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update visit record');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteVisitRecord = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await visitService.deleteVisit(id);
      setVisitRecords(prev => prev.filter(r => r.id !== id));
      
      // Refresh restaurant data to update statistics
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete visit record');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addTag = async (tag: Tag) => {
    setLoading(true);
    setError(null);
    try {
      const newTag = await tagService.createTag(tag);
      setTags(prev => [...prev, newTag]);
      return newTag;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add tag');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 當篩選選項改變時自動重新篩選
  useEffect(() => {
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
    loading,
    error,
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
    login,
    register,
    logout,
    fetchData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
