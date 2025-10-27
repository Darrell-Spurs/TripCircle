import api from './api';
import type { VisitRecord } from '../types';

interface VisitFilters {
  restaurantId?: string;
  startDate?: string;
  endDate?: string;
}

export const getVisits = async (filters?: VisitFilters): Promise<VisitRecord[]> => {
  const response = await api.get('/api/visits', { params: filters });
  return response.data.data;
};

export const getVisit = async (id: string): Promise<VisitRecord> => {
  const response = await api.get(`/api/visits/${id}`);
  return response.data.data;
};

export const createVisit = async (data: Partial<VisitRecord>): Promise<VisitRecord> => {
  const response = await api.post('/api/visits', data);
  return response.data.data;
};

export const updateVisit = async (id: string, data: Partial<VisitRecord>): Promise<void> => {
  await api.put(`/api/visits/${id}`, data);
};

export const deleteVisit = async (id: string): Promise<void> => {
  await api.delete(`/api/visits/${id}`);
};
