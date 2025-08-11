import React, { useState, useEffect } from 'react';
import { ServerError, SmartPagination } from '../../shared/components';
import { useDailyReportHistory } from '../../hooks';
import { DailyReportHistoryItem, DailyReport } from '../../types';
import { formatDateString } from '../../utils';
import { generateDailyReportPDF } from '../../utils/pdfGenerator';

interface DailyReportHistoryProps {
  userProfile: any;
  isAdmin: boolean;
}

const DailyReportHistory: React.FC<DailyReportHistoryProps> = ({ isAdmin }) => {
  const { history, loading, error, fetchHistory, getDailyReportById } = useDailyReportHistory();
  const [currentPage, setCurrentPage] = useState(1);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>({ key: 'reportDate', direction: 'desc' });

  useEffect(() => {
    if (isAdmin) {
      fetchHistory(currentPage, 10);
    }
  }, [currentPage, isAdmin]);

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

  const handleDownloadPDF = async (reportItem: DailyReportHistoryItem) => {
    try {
      setDownloadingId(reportItem.id);
      
      // Fetch the full report data
      const fullReport = await getDailyReportById(reportItem.id);
      
      if (!fullReport) {
        alert('שגיאה בטעינת נתוני הדוח');
        return;
      }

      // Generate PDF
      const reportData = {
        reportDate: fullReport.reportDate,
        totalItems: fullReport.totalItems,
        reportedItems: fullReport.reportedItems,
        completedAt: fullReport.completedAt,
        items: fullReport.items.map(item => ({ // Changed from reportItems to items
          name: item.name,
          idNumber: item.idNumber || '',
          isReported: item.isReported,
          reportedAt: item.reportedAt ? new Date(item.reportedAt).toLocaleDateString('he-IL', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }).replace(',', '') : '',
          notes: item.notes || '',
          unit: '', // TODO: Add unit data from backend if available
          location: '' // TODO: Add location data from backend if available
        }))
      };

      generateDailyReportPDF(reportData);
      
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('שגיאה בהורדת הקובץ');
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
      case 'reportDate':
        aValue = new Date(a.reportDate);
        bValue = new Date(b.reportDate);
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

  if (!history || !history.reports.length) {
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
          סה"כ {history.totalCount} דוחות
        </small>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th 
                  className="sortable-header"
                  onClick={() => handleSort('reportDate')}
                  title="לחץ למיון לפי תאריך דוח"
                  data-sorted={sortConfig?.key === 'reportDate' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <span>תאריך דוח</span>
                    <div className="sort-indicator">
                      {getSortIcon('reportDate')}
                    </div>
                  </div>
                </th>
                <th 
                  className="sortable-header"
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
                <th 
                  className="sortable-header"
                  onClick={() => handleSort('reportedItems')}
                  title="לחץ למיון לפי פריטים שדווחו"
                  data-sorted={sortConfig?.key === 'reportedItems' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <span>דווחו</span>
                    <div className="sort-indicator">
                      {getSortIcon('reportedItems')}
                    </div>
                  </div>
                </th>
                <th 
                  className="sortable-header"
                  onClick={() => handleSort('completionPercentage')}
                  title="לחץ למיון לפי אחוז השלמה"
                  data-sorted={sortConfig?.key === 'completionPercentage' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <span>אחוז השלמה</span>
                    <div className="sort-indicator">
                      {getSortIcon('completionPercentage')}
                    </div>
                  </div>
                </th>
                <th 
                  className="sortable-header"
                  onClick={() => handleSort('isCompleted')}
                  title="לחץ למיון לפי סטטוס השלמה"
                  data-sorted={sortConfig?.key === 'isCompleted' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <span>סטטוס</span>
                    <div className="sort-indicator">
                      {getSortIcon('isCompleted')}
                    </div>
                  </div>
                </th>
                <th>נוצר על ידי</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {sortedHistory.map(report => {
                const completionPercentage = report.totalItems > 0 
                  ? Math.round((report.reportedItems / report.totalItems) * 100) 
                  : 0;
                
                return (
                  <tr key={report.id}>
                    <td>{formatDateString(report.reportDate)}</td>
                    <td>
                      <span className="badge bg-secondary">
                        {report.totalItems}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-primary">
                        {report.reportedItems}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div 
                          className="progress me-2" 
                          style={{ width: '60px', height: '20px' }}
                        >
                          <div 
                            className={`progress-bar ${
                              completionPercentage === 100 ? 'bg-success' :
                              completionPercentage >= 70 ? 'bg-warning' : 'bg-danger'
                            }`}
                            style={{ width: `${completionPercentage}%` }}
                          />
                        </div>
                        <span className="small">
                          {completionPercentage}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        report.isCompleted ? 'bg-success' : 'bg-warning'
                      }`}>
                        {report.isCompleted ? '✅ הושלם' : '⏳ בעבודה'}
                      </span>
                    </td>
                    <td>{report.createdBy.name}</td>
                    <td>
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

        {history.totalPages > 1 && (
          <SmartPagination
            currentPage={currentPage}
            totalPages={history.totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
};

export default DailyReportHistory;
