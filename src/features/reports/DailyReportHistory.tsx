import React, { useState, useEffect } from 'react';
import { ServerError, SmartPagination } from '../../shared/components';
import { useDailyReportHistory } from '../../hooks';
import { DailyReportHistoryItem } from '../../types';
import { reportService } from '../../services';

interface DailyReportHistoryProps {
  userProfile: any;
  isAdmin: boolean;
}

const DailyReportHistory: React.FC<DailyReportHistoryProps> = ({ isAdmin }) => {
  const { history, loading, error, fetchHistory } = useDailyReportHistory();
  const [currentPage, setCurrentPage] = useState(1);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>({ key: 'createdAt', direction: 'desc' });

  useEffect(() => {
    if (isAdmin) {
      fetchHistory(currentPage, 10);
    }
  }, [currentPage, isAdmin, fetchHistory]); // Now safe to include fetchHistory since it's wrapped with useCallback

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <i className="fas fa-sort ms-1" style={{ opacity: 0.5 }}></i>;
    }
    return sortConfig.direction === 'asc' 
      ? <i className="fas fa-sort-up ms-1"></i>
      : <i className="fas fa-sort-down ms-1"></i>;
  };

  const formatDateWithTime = (dateString: string): string => {
    if (!dateString) {
      return 'תאריך לא זמין';
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'תאריך לא תקין';
    }
    
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownloadPDF = async (reportItem: DailyReportHistoryItem) => {
    try {
      setDownloadingId(reportItem.id);
      
      // Use the report service to download the PDF
      const blob = await reportService.downloadReportPDF(reportItem.id);
      
      // Create download link with a more descriptive filename
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Create a more descriptive filename with date
      const reportDate = new Date(reportItem.createdAt);
      const dateStr = reportDate.toLocaleDateString('he-IL').replace(/\//g, '-');
      link.download = `דוח-צ'-${dateStr}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      
      // Handle axios error responses
      if (error.response) {
        const status = error.response.status;
        let errorMessage = 'שגיאה בהורדת הדוח';
        
        if (status === 404) {
          errorMessage = 'דוח לא נמצא במערכת';
        } else if (status === 401 || status === 403) {
          errorMessage = 'אין הרשאה להורדת הדוח - נדרשות הרשאות מנהל';
        } else if (status === 500) {
          errorMessage = 'שגיאה פנימית בשרת בעת יצירת הדוח';
        }
        
        alert(errorMessage);
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        alert('פג הזמן הקצוב לחיבור - הדוח עשוי להיות גדול מדי');
      } else if (error.message?.includes('Network Error')) {
        alert('שגיאה בחיבור לשרת - אנא בדוק את החיבור לאינטרנט');
      } else {
        alert('שגיאה לא צפויה בהורדת הקובץ');
      }
    } finally {
      setDownloadingId(null);
    }
  };

  // Sort history items
  const sortedHistory = history?.reports ? [...history.reports].sort((a, b) => {
    if (!sortConfig) return 0;

    let aValue: any;
    let bValue: any;

    switch (sortConfig.key) {
      case 'createdAt':
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        // Handle invalid dates
        if (isNaN(aValue.getTime())) aValue = new Date(0);
        if (isNaN(bValue.getTime())) bValue = new Date(0);
        break;
      case 'totalItems':
        aValue = a.totalItems;
        bValue = b.totalItems;
        break;
      case 'reportedItems':
        aValue = a.reportedItems;
        bValue = b.reportedItems;
        break;
      case 'completionPercentage':
        aValue = a.totalItems > 0 ? (a.reportedItems / a.totalItems) * 100 : 0;
        bValue = b.totalItems > 0 ? (b.reportedItems / b.totalItems) * 100 : 0;
        break;
      case 'isCompleted':
        aValue = a.isCompleted ? 1 : 0;
        bValue = b.isCompleted ? 1 : 0;
        break;
      default:
        return 0;
    }

    if (sortConfig.direction === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  }) : [];

  if (!isAdmin) {
    return (
      <div className="alert alert-warning">
        <i className="fas fa-exclamation-triangle me-2"></i>
        רק מנהלים יכולים לצפות בהיסטוריית הדוחות היומיים
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h2 className="mb-0">היסטוריית דוחות יומיים</h2>
        </div>
        <div className="card-body">
          <div className="alert alert-info">
            <div className="spinner"></div>
            <span>טוען נתונים...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <ServerError />;
  }

  if (!history || !history.reports?.length) {
    return (
      <div className="card">
        <div className="card-header">
          <h2 className="mb-0">היסטוריית דוחות יומיים</h2>
        </div>
        <div className="card-body">
          <div className="alert alert-info text-center">
            <i className="fas fa-calendar-alt fa-2x mb-3"></i>
            <h4>אין דוחות להצגה</h4>
            <p>עדיין לא נוצרו דוחות יומיים במערכת</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="mb-0">היסטוריית דוחות יומיים</h2>
        <small className="text-muted">
          סה"כ {history.pagination?.total || 0} דוחות
        </small>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th 
                  className="sortable-header text-center"
                  onClick={() => handleSort('createdAt')}
                  title="לחץ למיון לפי תאריך דוח"
                  data-sorted={sortConfig?.key === 'createdAt' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <span>תאריך דוח</span>
                    <div className="sort-indicator">
                      {getSortIcon('createdAt')}
                    </div>
                  </div>
                </th>
                <th className="text-center">נוצר על ידי</th>
                <th className="text-center">הושלם על ידי</th>
                <th 
                  className="sortable-header text-center"
                  onClick={() => handleSort('totalItems')}
                  title="לחץ למיון לפי סהכ פריטים"
                  data-sorted={sortConfig?.key === 'totalItems' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <span>סה"כ פריטים</span>
                    <div className="sort-indicator">
                      {getSortIcon('totalItems')}
                    </div>
                  </div>
                </th>
                <th className="text-center">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {sortedHistory.map(report => {
                return (
                  <tr key={report.id}>
                    <td className="text-center">{formatDateWithTime(report.createdAt)}</td>
                    <td className="text-center">{report.createdBy.name}</td>
                    <td className="text-center">
                      {report.completedBy ? (
                        <span>{report.completedBy.name}</span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className="text-center">
                      <span className="badge bg-secondary">
                        {report.totalItems}
                      </span>
                    </td>
                    <td className="text-center">
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => handleDownloadPDF(report)}
                        disabled={downloadingId === report.id}
                        title="הורד PDF"
                      >
                        {downloadingId === report.id ? (
                          <>
                            <i className="fas fa-spinner fa-spin me-1"></i>
                            מוריד...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-file-pdf me-1"></i>
                            הורד PDF
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {(history.pagination?.pages || 0) > 1 && (
          <SmartPagination
            currentPage={currentPage}
            totalPages={history.pagination?.pages || 1}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
};

export default DailyReportHistory;
