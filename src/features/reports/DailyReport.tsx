import React, { useState } from 'react';
import { ServerError, SmartPagination } from '../../shared/components';
import { useReports } from '../../hooks';
import { getCurrentDate, paginate } from '../../utils';
import { ReportStatusUpdate, User } from '../../types';
import { UI_CONFIG } from '../../config/app.config';

interface DailyReportProps {
  userProfile: User | null;
  isAdmin: boolean;
}

const DailyReport: React.FC<DailyReportProps> = ({ userProfile, isAdmin }) => {
  const { reportItems, loading, error, updateReportStatus, toggleReportStatus } = useReports();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

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

  // Sort items based on sort config
  const sortedReportItems = (() => {
    // Role-based filtering: users see only their items, admins see all
    let filteredItems = reportItems;
    if (!isAdmin && userProfile) {
      filteredItems = reportItems.filter(item => 
        item.userName === userProfile.name
      );
    }

    if (!sortConfig) return filteredItems;

    return [...filteredItems].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'idNumber':
          aValue = a.idNumber || '';
          bValue = b.idNumber || '';
          break;
        case 'userName':
          aValue = a.userName;
          bValue = b.userName;
          break;
        case 'phoneNumber':
          aValue = a.phoneNumber || '';
          bValue = b.phoneNumber || '';
          break;
        case 'isReported':
          aValue = a.isReported ? 1 : 0;
          bValue = b.isReported ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue, 'he') 
          : bValue.localeCompare(aValue, 'he');
      }

      if (sortConfig.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  })();

  // Get paginated items for display
  const { paginatedItems, totalPages } = paginate(sortedReportItems, currentPage, UI_CONFIG.TABLE_PAGE_SIZE);

  const handleCheckboxChange = (id: string) => {
    toggleReportStatus(id);
  };

  const handleSubmitReport = async () => {
    const reportUpdates: ReportStatusUpdate[] = reportItems.map(item => ({
      id: item.id,
      status: item.isReported || false,
    }));

    const success = await updateReportStatus(reportUpdates);
    
    if (success) {
      alert('דיווח נשלח בהצלחה');
    } else {
      alert('שגיאה בשליחת הדיווח');
    }
  };

  // Calculate reporting percentage for all users (admin sees all, users see only their items)
  const getReportingStats = () => {
    // Use sortedReportItems which already has the correct filtering applied
    const filteredItems = sortedReportItems;
    
    if (filteredItems.length === 0) return { percentage: 0, reported: 0, total: 0 };
    
    const reportedCount = filteredItems.filter(item => item.isReported).length;
    const percentage = Math.round((reportedCount / filteredItems.length) * 100);
    
    return {
      percentage,
      reported: reportedCount,
      total: filteredItems.length
    };
  };

  const reportingStats = getReportingStats();

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h2 className="mb-0">דוח יומי - {getCurrentDate()}</h2>
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

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="mb-0">דוח יומי - {getCurrentDate()}</h2>
      </div>
      <div className="card-body">
        {/* Reporting Progress Indicator - For All Users */}
        <div className="mb-4 p-3" style={{ 
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          borderRadius: '15px',
          border: '2px solid #dee2e6'
        }}>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h5 className="mb-0" style={{ color: '#495057', fontWeight: '600' }}>
              📊 {isAdmin ? 'סטטוס דיווח יומי' : 'הדיווח שלי היום'}
            </h5>
            <span className="badge" style={{ 
              background: reportingStats.percentage === 100 ? '#28a745' : 
                         reportingStats.percentage >= 70 ? '#ffc107' : '#dc3545',
              color: 'white',
              fontSize: '16px',
              padding: '8px 12px',
              borderRadius: '20px'
            }}>
              {reportingStats.total} / {reportingStats.reported}
            </span>
          </div>
          
          {/* Visual Pipe Progress */}
          <div className="d-flex align-items-center mb-2">
            <div style={{ 
              width: '100%',
              height: '40px',
              backgroundColor: '#e9ecef',
              borderRadius: '25px',
              overflow: 'hidden',
              border: '3px solid #dee2e6',
              position: 'relative',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                width: `${reportingStats.percentage}%`,
                height: '100%',
                background: reportingStats.percentage === 100 ? 
                  'linear-gradient(90deg, #28a745 0%, #20c997 100%)' :
                  reportingStats.percentage >= 70 ?
                  'linear-gradient(90deg, #ffc107 0%, #fd7e14 100%)' :
                  'linear-gradient(90deg, #dc3545 0%, #e83e8c 100%)',
                transition: 'width 0.8s ease-in-out',
                borderRadius: '25px',
                position: 'relative',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}>
                {/* Shine effect */}
                <div style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  right: '0',
                  height: '50%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)',
                  borderRadius: '25px 25px 0 0'
                }}></div>
              </div>
              
              {/* Percentage text overlay */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#495057',
                textShadow: '1px 1px 2px rgba(255,255,255,0.8)',
                zIndex: 10
              }}>
                {reportingStats.percentage}%
              </div>
            </div>
          </div>
          
          <div className="d-flex justify-content-between align-items-center">
            <small style={{ color: '#6c757d', fontWeight: '500' }}>
              {reportingStats.percentage === 100 ? 
                '🎉 כל הפריטים דווחו!' : 
                `נותרו ${reportingStats.total - reportingStats.reported} פריטים לדיווח`
              }
            </small>
            <small style={{ 
              color: reportingStats.percentage >= 70 ? '#28a745' : 
                     reportingStats.percentage >= 30 ? '#ffb000' : '#dc3545',
              fontWeight: 'bold'
            }}>
              {reportingStats.percentage >= 70 ? '✅ סטטוס מעולה' : 
               reportingStats.percentage >= 30 ? '⚠️ סטטוס בינוני' : '🚨 דרושה תשומת לב'}
            </small>
          </div>
        </div>
        
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th 
                  className="sortable-header"
                  onClick={() => handleSort('name')}
                  title="לחץ למיון לפי שם פריט"
                  data-sorted={sortConfig?.key === 'name' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <span>שם פריט</span>
                    <div className="sort-indicator">
                      {getSortIcon('name')}
                    </div>
                  </div>
                </th>
                <th 
                  className="sortable-header"
                  onClick={() => handleSort('idNumber')}
                  title="לחץ למיון לפי מספר צ'"
                  data-sorted={sortConfig?.key === 'idNumber' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <span>מספר צ'</span>
                    <div className="sort-indicator">
                      {getSortIcon('idNumber')}
                    </div>
                  </div>
                </th>
                <th 
                  className="sortable-header"
                  onClick={() => handleSort('userName')}
                  title="לחץ למיון לפי שם החותם"
                  data-sorted={sortConfig?.key === 'userName' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <span>שם החותם</span>
                    <div className="sort-indicator">
                      {getSortIcon('userName')}
                    </div>
                  </div>
                </th>
                <th 
                  className="sortable-header"
                  onClick={() => handleSort('phoneNumber')}
                  title="לחץ למיון לפי מספר טלפון"
                  data-sorted={sortConfig?.key === 'phoneNumber' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <span>מספר טלפון</span>
                    <div className="sort-indicator">
                      {getSortIcon('phoneNumber')}
                    </div>
                  </div>
                </th>
                <th 
                  className="sortable-header"
                  onClick={() => handleSort('isReported')}
                  title="לחץ למיון לפי סטטוס דיווח"
                  data-sorted={sortConfig?.key === 'isReported' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <span>האם דיווח</span>
                    <div className="sort-indicator">
                      {getSortIcon('isReported')}
                    </div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map(item => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.idNumber}</td>
                  <td>{item.userName}</td>
                  <td>{item.phoneNumber}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={item.isReported || false}
                      onChange={() => handleCheckboxChange(item.id)}
                      className="form-check-input"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <SmartPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
        
        {sortedReportItems.length > 0 && (
          <div className="d-flex justify-content-end mt-4">
            <button className="btn btn-primary" onClick={handleSubmitReport}>
              עדכן דיווח
            </button>
          </div>
        )}
        {sortedReportItems.length === 0 && (
          <div className="alert alert-info text-center">
            אין פריטים לדיווח
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyReport;
