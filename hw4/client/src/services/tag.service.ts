import api from './api';
import type { Tag } from '../types';

export const getTags = async (): Promise<Tag[]> => {
  const response = await api.get('/api/tags');
  return response.data.data || [];
};

export const createTag = async (data: Partial<Tag>): Promise<Tag> => {
  const response = await api.post('/api/tags', data);
  return response.data.data;
};

export const deleteTag = async (id: string): Promise<void> => {
  await api.delete(`/api/tags/${id}`);
};
