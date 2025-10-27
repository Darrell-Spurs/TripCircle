import api from './api';

interface StatsOverview {
  totalRestaurants: number;
  totalVisits: number;
  totalSpent: number;
  averageRating: number;
}

interface MonthlyStats {
  month: string;
  count: number;
  spent: number;
}

export const getOverview = async (): Promise<StatsOverview> => {
  const response = await api.get('/api/stats/overview');
  return response.data.data;
};

export const getMonthlyStats = async (): Promise<MonthlyStats[]> => {
  const response = await api.get('/api/stats/monthly');
  return response.data.data || [];
};

export const getTopRestaurants = async (): Promise<any[]> => {
  const response = await api.get('/api/stats/top-restaurants');
  return response.data.data || [];
};
