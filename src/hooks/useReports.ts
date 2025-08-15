import { useState, useEffect, useCallback } from 'react';
import { reportService } from '../services';
import { 
  DashboardStatistics, 
  CurrentReportingStatusResponse,
  UpdateReportItemsRequest,
  ReportCompletionHistoryResponse
} from '../types';

// New simplified hook for reports using the new API
export const useReports = () => {
  const [currentStatus, setCurrentStatus] = useState<CurrentReportingStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportService.getCurrentReportingStatus();
      setCurrentStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch current reporting status');
      setCurrentStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const updateReportItems = async (items: { itemId: string; notes?: string }[]): Promise<boolean> => {
    try {
      setError(null);
      const request: UpdateReportItemsRequest = { items };
      await reportService.updateReportItems(request);
      // Refetch the current status after update
      await fetchCurrentStatus();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update report items');
      return false;
    }
  };

  const completeReportCycle = async (): Promise<boolean> => {
    try {
      setError(null);
      await reportService.completeReportCycle();
      // Refetch the current status after completion
      await fetchCurrentStatus();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete report cycle');
      return false;
    }
  };

  const toggleReportStatus = (itemId: string) => {
    if (!currentStatus) return;
    
    setCurrentStatus(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map(item =>
          item.id === itemId ? { ...item, isReported: !item.isReported } : item
        ),
        reportedItems: prev.items.map(item =>
          item.id === itemId ? { ...item, isReported: !item.isReported } : item
        ).filter(item => item.isReported).length
      };
    });
  };

  const setReportStatusBulk = (itemIds: string[], status: boolean) => {
    if (!currentStatus) return;
    
    setCurrentStatus(prev => {
      if (!prev) return prev;
      const updatedItems = prev.items.map(item =>
        itemIds.includes(item.id) ? { ...item, isReported: status } : item
      );
      return {
        ...prev,
        items: updatedItems,
        reportedItems: updatedItems.filter(item => item.isReported).length
      };
    });
  };

  const updateItemNotes = (itemId: string, notes: string) => {
    if (!currentStatus) return;
    
    setCurrentStatus(prev => {
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
    fetchCurrentStatus();
  }, []);

  return {
    currentStatus,
    loading,
    error,
    refetch: fetchCurrentStatus,
    updateReportItems,
    completeReportCycle,
    toggleReportStatus,
    setReportStatusBulk,
    updateItemNotes,
  };
};

// Legacy hook for backward compatibility - maps new API to old structure
export const useDailyReports = () => {
  const { 
    currentStatus, 
    loading, 
    error, 
    refetch, 
    updateReportItems, 
    completeReportCycle, 
    toggleReportStatus, 
    setReportStatusBulk, 
    updateItemNotes 
  } = useReports();

  // Map new structure to legacy structure
  const dailyReportData = currentStatus ? {
    report: {
      id: 'current',
      createdBy: { id: '', name: '', rank: '' },
      totalItems: currentStatus.totalItems,
      reportedItems: currentStatus.reportedItems,
      isCompleted: false, // New API doesn't track completion status the same way
      createdAt: new Date().toISOString()
    },
    items: currentStatus.items.map(item => ({
      ...item,
      itemId: item.id,
      createdAt: new Date().toISOString()
    })),
    userLocation: currentStatus.userLocation || '',
    isAdmin: currentStatus.isAdmin
  } : null;

  const createDailyReport = async (): Promise<boolean> => {
    // Not needed in new API - reports are automatically managed
    return false;
  };

  const updateDailyReport = async (id: string, data: any): Promise<boolean> => {
    // Convert legacy update format to new format
    const items = data.reportItems?.map((item: any) => ({
      itemId: item.itemId,
      notes: item.notes
    })) || [];
    
    return updateReportItems(items);
  };

  const completeDailyReport = async (): Promise<boolean> => {
    return completeReportCycle();
  };

  return {
    dailyReportData,
    loading,
    error,
    refetch,
    createDailyReport,
    updateDailyReport,
    completeDailyReport,
    toggleReportStatus,
    setReportStatusBulk,
    updateItemNotes,
  };
};

// Hook for report completion history
export const useReportHistory = () => {
  const [history, setHistory] = useState<ReportCompletionHistoryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (page: number = 1, limit: number = 10) => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportService.getCompletionHistory(page, limit);
      
      // Ensure the response has the expected structure
      if (data && typeof data === 'object') {
        // Server returns 'completions' - store as is
        setHistory(data);
      } else {
        // If data is not in expected format, set empty structure
        setHistory({
          completions: [],
          pagination: { page: 1, limit: 10, total: 0, pages: 0 }
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch report completion history');
      setHistory({
        completions: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 }
      });
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    history,
    loading,
    error,
    fetchHistory,
  };
};

// Legacy hook for backward compatibility
export const useDailyReportHistory = () => {
  const { history, loading, error, fetchHistory } = useReportHistory();

  // Map new structure to legacy structure for compatibility
  const legacyHistory = history && Array.isArray(history.completions) ? {
    reports: history.completions.map((completion: any) => ({
      id: completion.id,
      createdById: completion.completedById, // Use completedById since that's what we have
      completedAt: completion.completedAt,
      completedById: completion.completedById,
      isActive: false,
      isCompleted: true, // All items in history are completed
      totalItems: completion.totalItems,
      reportedItems: completion.reportedItems,
      createdAt: completion.completedAt, // Use completedAt as createdAt since we don't have createdAt
      updatedAt: completion.completedAt,
      createdBy: completion.completedBy, // Use completedBy as createdBy since we don't have createdBy
      completedBy: completion.completedBy,
      downloadUrl: completion.downloadUrl,
    })),
    pagination: history.pagination || { page: 1, limit: 10, total: 0, pages: 0 }
  } : {
    reports: [],
    pagination: { page: 1, limit: 10, total: 0, pages: 0 }
  };

  const getDailyReportById = useCallback(async (id: string) => {
    // This functionality is not available in the new API
    // Return null for compatibility
    return null;
  }, []);

  return {
    history: legacyHistory,
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
