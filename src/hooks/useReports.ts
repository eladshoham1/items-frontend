import { useState, useEffect, useCallback } from 'react';
import { reportService } from '../services';
import { 
  DashboardStatistics, 
  DailyReportResponse,
  DailyReportHistoryResponse,
  CreateDailyReportRequest,
  UpdateDailyReportRequest,
  CompleteDailyReportRequest,
  DetailedDailyReportResponse
} from '../types';

// New hook for daily reports
export const useDailyReports = () => {
  const [dailyReportData, setDailyReportData] = useState<DailyReportResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentDailyReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportService.getCurrentDailyReport();
      setDailyReportData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch current daily report');
      setDailyReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const createDailyReport = async (data: CreateDailyReportRequest): Promise<boolean> => {
    try {
      setError(null);
      const newReport = await reportService.createDailyReport(data);
      setDailyReportData(newReport);
      // Refetch to ensure we have the complete data structure
      await fetchCurrentDailyReport();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create daily report');
      return false;
    }
  };

  const updateDailyReport = async (id: string, data: UpdateDailyReportRequest): Promise<boolean> => {
    try {
      setError(null);
      // Note: The server response structure might be different, we may need to adjust this
      await reportService.updateDailyReport(id, data);
      // Refetch the current report after update
      await fetchCurrentDailyReport();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update daily report');
      return false;
    }
  };

  const completeDailyReport = async (data: CompleteDailyReportRequest): Promise<boolean> => {
    try {
      setError(null);
      // Note: The server response structure might be different, we may need to adjust this
      await reportService.completeDailyReport(data);
      // Refetch the current report after completion
      await fetchCurrentDailyReport();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete daily report');
      return false;
    }
  };

  const toggleReportStatus = (itemId: string) => {
    if (!dailyReportData) return;
    
    setDailyReportData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map(item =>
          item.id === itemId ? { ...item, isReported: !item.isReported } : item
        )
      };
    });
  };

  const setReportStatusBulk = (itemIds: string[], status: boolean) => {
    if (!dailyReportData) return;
    
    setDailyReportData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map(item =>
          itemIds.includes(item.id) ? { ...item, isReported: status } : item
        )
      };
    });
  };

  const updateItemNotes = (itemId: string, notes: string) => {
    if (!dailyReportData) return;
    
    setDailyReportData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map(item =>
          item.id === itemId ? { ...item, notes } : item
        )
      };
    });
  };

  useEffect(() => {
    fetchCurrentDailyReport();
  }, []);

  return {
    dailyReportData,
    loading,
    error,
    refetch: fetchCurrentDailyReport,
    createDailyReport,
    updateDailyReport,
    completeDailyReport,
    toggleReportStatus,
    setReportStatusBulk,
    updateItemNotes,
  };
};

// Hook for daily report history
export const useDailyReportHistory = () => {
  const [history, setHistory] = useState<DailyReportHistoryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (page: number = 1, limit: number = 10) => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportService.getDailyReportHistory(page, limit);
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch daily report history');
      setHistory(null);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since this function doesn't depend on any props or state

  const getDailyReportById = useCallback(async (id: string): Promise<DetailedDailyReportResponse | null> => {
    try {
      setError(null);
      return await reportService.getDailyReportById(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch daily report');
      return null;
    }
  }, []);

  return {
    history,
    loading,
    error,
    fetchHistory,
    getDailyReportById,
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
