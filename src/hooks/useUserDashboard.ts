import { useState, useEffect, useCallback } from 'react';
import { reportService } from '../services';
import { 
  UserDashboardData, 
  UserDashboardResponse 
} from '../types';

interface UseUserDashboardReturn {
  data: UserDashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useUserDashboard = (): UseUserDashboardReturn => {
  const [data, setData] = useState<UserDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response: UserDashboardResponse = await reportService.getUserDashboard();
      
      if (response.success) {
        setData(response.data);
      } else {
        setError('Failed to fetch user dashboard data');
        setData(null);
      }
    } catch (err: any) {
      console.error('Error fetching user dashboard:', err);
      
      // Handle specific error cases
      if (err?.response?.status === 403) {
        setError('Access denied. This dashboard is for regular users only.');
      } else if (err?.response?.status === 401) {
        setError('Authentication required. Please log in.');
      } else {
        setError(err?.message || 'An unexpected error occurred while loading your dashboard');
      }
      
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchUserDashboard();
  }, [fetchUserDashboard]);

  const refetch = useCallback(() => {
    return fetchUserDashboard();
  }, [fetchUserDashboard]);

  return {
    data,
    loading,
    error,
    refetch
  };
};
