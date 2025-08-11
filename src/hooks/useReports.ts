import { useState, useEffect } from 'react';
import { reportService } from '../services';
import { 
  ReportItem, 
  ReportStatusUpdate, 
  DashboardStatistics, 
  DailyReportResponse,
  DailyReport,
  DailyReportHistoryResponse,
  CreateDailyReportRequest,
  UpdateDailyReportRequest,
  CompleteDailyReportRequest
} from '../types';

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
        setReportItems([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch report items');
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

  // New: bulk set status for multiple items
  const setReportStatusBulk = (ids: string[], status: boolean) => {
    setReportItems(prev => prev.map(item => ids.includes(item.id) ? { ...item, isReported: status } : item));
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
    setReportStatusBulk,
  };
};

// New hook for daily reports
export const useDailyReports = () => {
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTodaysDailyReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportService.getTodaysDailyReport();
      setDailyReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch today\'s daily report');
      setDailyReport(null);
    } finally {
      setLoading(false);
    }
  };

  const createDailyReport = async (data: CreateDailyReportRequest): Promise<boolean> => {
    try {
      setError(null);
      const newReport = await reportService.createDailyReport(data);
      setDailyReport(newReport);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create daily report');
      return false;
    }
  };

  const updateDailyReport = async (id: string, data: UpdateDailyReportRequest): Promise<boolean> => {
    try {
      setError(null);
      const updatedReport = await reportService.updateDailyReport(id, data);
      setDailyReport(updatedReport);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update daily report');
      return false;
    }
  };

  const completeDailyReport = async (data: CompleteDailyReportRequest): Promise<boolean> => {
    try {
      setError(null);
      const completedReport = await reportService.completeDailyReport(data);
      setDailyReport(completedReport);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete daily report');
      return false;
    }
  };

  const toggleReportStatus = (itemId: string) => {
    if (!dailyReport) return;
    
    setDailyReport(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map(item => // Changed from reportItems to items
          item.id === itemId ? { ...item, isReported: !item.isReported } : item
        )
      };
    });
  };

  const setReportStatusBulk = (itemIds: string[], status: boolean) => {
    if (!dailyReport) return;
    
    setDailyReport(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map(item => // Changed from reportItems to items
          itemIds.includes(item.id) ? { ...item, isReported: status } : item
        )
      };
    });
  };

  const updateItemNotes = (itemId: string, notes: string) => {
    if (!dailyReport) return;
    
    setDailyReport(prev => {
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
    fetchTodaysDailyReport();
  }, []);

  return {
    dailyReport,
    loading,
    error,
    refetch: fetchTodaysDailyReport,
    createDailyReport,
    updateDailyReport,
    completeDailyReport,
    toggleReportStatus,
    setReportStatusBulk,
    updateItemNotes, // Add this new function
  };
};

// Hook for daily report history
export const useDailyReportHistory = () => {
  const [history, setHistory] = useState<DailyReportHistoryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async (page: number = 1, limit: number = 10) => {
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
  };

  const getDailyReportById = async (id: string): Promise<DailyReport | null> => {
    try {
      setError(null);
      return await reportService.getDailyReportById(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch daily report');
      return null;
    }
  };

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
