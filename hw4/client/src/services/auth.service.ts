import api from './api';
import type { User } from '../types';

interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
}

interface RegisterResponse {
  success: boolean;
  token: string;
  user: User;
}

export const register = async (username: string, email: string, password: string): Promise<LoginResponse> => {
  const response = await api.post('/api/auth/register', { username, email, password });
  const data = response.data;
  
  // 儲存 token 和 user
  if (data.token) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }
  
  return data;
};

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await api.post('/api/auth/login', { email, password });
  const data = response.data;
  
  // 儲存 token 和 user
  if (data.token) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }
  
  return data;
};

export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getProfile = async (): Promise<User> => {
  const response = await api.get('/api/auth/profile');
  const user = response.data.user || response.data;
  localStorage.setItem('user', JSON.stringify(user));
  return user;
};

export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

export const setToken = (token: string): void => {
  localStorage.setItem('token', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getStoredUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};
