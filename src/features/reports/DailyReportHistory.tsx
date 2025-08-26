import React, { useState, useEffect } from 'react';
import { ServerError, SmartPagination, NotificationModal } from '../../shared/components';
import { useDailyReportHistory } from '../../hooks';
import { DailyReportHistoryItem } from '../../types';
import { reportService } from '../../services';
import { NotificationType } from '../../shared/components/NotificationModal';

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
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    message: string;
    type: NotificationType;
  }>({
    isOpen: false,
    message: '',
    type: 'error',
  });

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
        
        setNotification({
          isOpen: true,
          message: errorMessage,
          type: 'error',
        });
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        setNotification({
          isOpen: true,
          message: 'פג הזמן הקצוב לחיבור - הדוח עשוי להיות גדול מדי',
          type: 'error',
        });
      } else if (error.message?.includes('Network Error')) {
        setNotification({
          isOpen: true,
          message: 'שגיאה בחיבור לשרת - אנא בדוק את החיבור לאינטרנט',
          type: 'error',
        });
      } else {
        setNotification({
          isOpen: true,
          message: 'שגיאה לא צפויה בהורדת הקובץ',
          type: 'error',
        });
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
      <div className="alert alert-warning" style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #f59e0b' }}>
        <i className="fas fa-exclamation-triangle me-2"></i>
        רק מנהלים יכולים לצפות בהיסטוריית הדוחות היומיים
      </div>
    );
  }

  if (loading) {
    return (
      <div className="unified-table-container">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div className="spinner" style={{ marginBottom: '16px' }}></div>
          <span style={{ color: '#e9ecef', fontSize: '16px' }}>טוען נתונים...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <ServerError />;
  }

  if (!history || !history.reports?.length) {
    return (
      <div className="unified-table-container">
        <div style={{ padding: '60px 24px', textAlign: 'center' }}>
          <i className="fas fa-calendar-alt" style={{ fontSize: '48px', color: '#6b7280', marginBottom: '24px', display: 'block' }}></i>
          <h4 style={{ color: '#e9ecef', marginBottom: '12px', fontSize: '20px' }}>אין דוחות להצגה</h4>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>עדיין לא נוצרו דוחות יומיים במערכת</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      
      {/* Main table container with improved design */}
      <div className="unified-table-container" style={{ marginTop: '0' }}>
        <table className="unified-table">
          <thead>
            <tr>
              <th 
                className="unified-table-header unified-table-header-regular sortable text-center"
                onClick={() => handleSort('createdAt')}
                title="לחץ למיון לפי תאריך דוח"
                data-sorted={sortConfig?.key === 'createdAt' ? 'true' : 'false'}
                style={{ color: '#ffffff', padding: '12px 8px' }}
              >
                <div className="d-flex align-items-center justify-content-center">
                  <i className="fas fa-calendar-day me-2" style={{ fontSize: '13px' }}></i>
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>תאריך דוח</span>
                  {sortConfig?.key === 'createdAt' && (
                    <i className={`fas fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'} ms-2`} style={{ fontSize: '11px' }}></i>
                  )}
                </div>
              </th>
              <th className="unified-table-header unified-table-header-regular text-center" style={{ color: '#ffffff', padding: '12px 8px' }}>
                <div className="d-flex align-items-center justify-content-center">
                  <i className="fas fa-user-plus me-2" style={{ fontSize: '13px' }}></i>
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>נוצר על ידי</span>
                </div>
              </th>
              <th className="unified-table-header unified-table-header-regular text-center" style={{ color: '#ffffff', padding: '12px 8px' }}>
                <div className="d-flex align-items-center justify-content-center">
                  <i className="fas fa-user-check me-2" style={{ fontSize: '13px' }}></i>
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>הושלם על ידי</span>
                </div>
              </th>
              <th 
                className="unified-table-header unified-table-header-regular sortable text-center"
                onClick={() => handleSort('totalItems')}
                title="לחץ למיון לפי סהכ פריטים"
                data-sorted={sortConfig?.key === 'totalItems' ? 'true' : 'false'}
                style={{ color: '#ffffff', padding: '12px 8px' }}
              >
                <div className="d-flex align-items-center justify-content-center">
                  <i className="fas fa-boxes me-2" style={{ fontSize: '13px' }}></i>
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>סה"כ פריטים</span>
                  {sortConfig?.key === 'totalItems' && (
                    <i className={`fas fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'} ms-2`} style={{ fontSize: '11px' }}></i>
                  )}
                </div>
              </th>
              <th className="unified-table-header unified-table-header-regular text-center" style={{ width: '120px', color: '#ffffff', padding: '12px 8px' }}>
                <div className="d-flex align-items-center justify-content-center">
                  <i className="fas fa-download me-2" style={{ fontSize: '13px' }}></i>
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>הורדה</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedHistory.map(report => {
              return (
                <tr key={report.id} className="unified-table-row" style={{ transition: 'all 0.2s ease' }}>
                  <td className="unified-table-cell text-center" style={{ color: '#e9ecef', padding: '12px 8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '500' }}>
                      {formatDateWithTime(report.createdAt)}
                    </div>
                  </td>
                  <td className="unified-table-cell text-center" style={{ color: '#e9ecef', padding: '12px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <div style={{ 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%', 
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <i className="fas fa-user" style={{ color: '#ffffff', fontSize: '10px' }}></i>
                      </div>
                      <span style={{ fontSize: '13px' }}>{report.createdBy.name}</span>
                    </div>
                  </td>
                  <td className="unified-table-cell text-center" style={{ color: '#e9ecef', padding: '12px 8px' }}>
                    {report.completedBy ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <div style={{ 
                          width: '24px', 
                          height: '24px', 
                          borderRadius: '50%', 
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <i className="fas fa-check" style={{ color: '#ffffff', fontSize: '10px' }}></i>
                        </div>
                        <span style={{ fontSize: '13px' }}>{report.completedBy.name}</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <div style={{ 
                          width: '24px', 
                          height: '24px', 
                          borderRadius: '50%', 
                          background: '#6b7280',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <i className="fas fa-minus" style={{ color: '#ffffff', fontSize: '10px' }}></i>
                        </div>
                        <span style={{ color: '#9ca3af', fontSize: '13px' }}>לא הושלם</span>
                      </div>
                    )}
                  </td>
                  <td className="unified-table-cell text-center" style={{ padding: '12px 8px' }}>
                    <span 
                      className="unified-badge unified-badge-primary" 
                      style={{ 
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        padding: '4px 10px',
                        fontSize: '12px',
                        fontWeight: '600',
                        borderRadius: '6px',
                        boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                      }}
                    >
                      {report.totalItems}
                    </span>
                  </td>
                  <td className="unified-table-cell text-center" style={{ padding: '12px 8px' }}>
                    <button
                      className="btn btn-info unified-action-btn"
                      onClick={() => handleDownloadPDF(report)}
                      disabled={downloadingId === report.id}
                      title="הורד PDF"
                    >
                      {downloadingId === report.id ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          מוריד...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-download"></i>
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

      {/* Pagination */}
      {(history.pagination?.pages || 0) > 1 && (
        <div style={{ marginTop: '24px' }}>
          <SmartPagination
            currentPage={currentPage}
            totalPages={history.pagination?.pages || 1}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ isOpen: false, message: '', type: 'error' })}
        message={notification.message}
        type={notification.type}
      />
    </div>
  );
};

export default DailyReportHistory;
