import React, { useState } from 'react';
import { ServerError } from '../../shared/components';
import { useReports } from '../../hooks';
import { getCurrentDate } from '../../utils';
import { ReportStatusUpdate } from '../../types';

const DailyReport: React.FC = () => {
  const { reportItems, loading, error, updateReportStatus, toggleReportStatus } = useReports();
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
    if (!sortConfig) return reportItems;

    return [...reportItems].sort((a, b) => {
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
              {sortedReportItems.map(item => (
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
