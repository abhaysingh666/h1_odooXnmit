import api from '../lib/api';

export async function getDashboardAnalytics() {
  const response = await api.get('/analytics/dashboard');
  return response.data;
}
