import api from './api';
import type { Restaurant } from '../types';

interface SearchFilters {
  status?: string;
  search?: string;
  tag?: string;
}

export const getRestaurants = async (filters?: SearchFilters): Promise<Restaurant[]> => {
  const response = await api.get('/api/restaurants', { params: filters });
  return response.data.data;
};

export const getRestaurant = async (id: string): Promise<Restaurant> => {
  const response = await api.get(`/api/restaurants/${id}`);
  return response.data.data;
};

export const createRestaurant = async (data: Partial<Restaurant>): Promise<Restaurant> => {
  const response = await api.post('/api/restaurants', data);
  return response.data.data;
};

export const updateRestaurant = async (id: string, data: Partial<Restaurant>): Promise<void> => {
  await api.put(`/api/restaurants/${id}`, data);
};

export const deleteRestaurant = async (id: string): Promise<void> => {
  await api.delete(`/api/restaurants/${id}`);
};

export const searchPlaces = async (query: string, location?: { lat: number; lng: number }): Promise<any[]> => {
  const queryParams = location ? { lat: location.lat.toString(), lng: location.lng.toString() } : {};
  const response = await api.post('/api/restaurants/search', { query }, { params: queryParams });
  console.log('searchPlaces response:', response.data);
  return response.data?.data || [];
};
