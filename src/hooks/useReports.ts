import { useState, useEffect } from 'react';
import { reportService } from '../services';
import { ReportItem, ReportStatusUpdate, DashboardStatistics, DailyReportResponse } from '../types';

export const useReports = () => {
  const [reportItems, setReportItems] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReportItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data: DailyReportResponse = await reportService.getDailyReport();
      // Handle the new response structure
      if (data && Array.isArray(data.items)) {
        // Add isReported property for local state management
        const itemsWithReportStatus = data.items.map(item => ({
          ...item,
          isReported: item.hasRecentReport
        }));
        setReportItems(itemsWithReportStatus);
      } else {
        console.warn('getDailyReport returned invalid data:', data);
        setReportItems([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch report items');
      console.error('Failed to fetch report items:', err);
      setReportItems([]); // Ensure empty array on error
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (updates: ReportStatusUpdate[]): Promise<boolean> => {
    try {
      setError(null);
      await reportService.updateReportStatus(updates);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update report status');
      console.error('Failed to update report status:', err);
      return false;
    }
  };

  const toggleReportStatus = (itemId: string) => {
    setReportItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, isReported: !item.isReported } : item
      )
    );
  };

  useEffect(() => {
    fetchReportItems();
  }, []);

  return {
    reportItems,
    loading,
    error,
    refetch: fetchReportItems,
    updateReportStatus,
    toggleReportStatus,
  };
};

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStatistics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportService.getStatistics();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
      console.error('Failed to fetch statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
  };
};
