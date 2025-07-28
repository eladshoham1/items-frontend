import React from 'react';
import { useDashboardStats } from '../../hooks';
import ServerError from '../../shared/components/ServerError';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { stats, loading, error, refetch } = useDashboardStats();

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2 className="dashboard-title">לוח בקרה</h2>
        </div>
        <div className="dashboard-content">
          <div className="loading-container">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">טוען...</span>
            </div>
            <span className="loading-text">טוען נתוני לוח בקרה...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return <ServerError />;
  }

  const { matrix, locations, itemNames, totals } = stats;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <h2 className="dashboard-title">לוח בקרה - מטריצת הקצאות</h2>
          <button 
            className="btn btn-outline-primary refresh-btn"
            onClick={refetch}
            title="רענן נתונים"
          >
            <i className="fas fa-sync-alt me-1"></i>
            רענן
          </button>
        </div>
        
        {/* Summary Statistics */}
        <div className="stats-summary">
          <div className="summary-card">
            <div className="summary-icon">
              <i className="fas fa-users"></i>
            </div>
            <div className="summary-info">
              <div className="summary-value">{stats.totalUsers}</div>
              <div className="summary-label">משתמשים</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">
              <i className="fas fa-boxes"></i>
            </div>
            <div className="summary-info">
              <div className="summary-value">{stats.totalItems}</div>
              <div className="summary-label">פריטים</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">
              <i className="fas fa-receipt"></i>
            </div>
            <div className="summary-info">
              <div className="summary-value">{stats.totalReceipts}</div>
              <div className="summary-label">קבלות</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">
              <i className="fas fa-chart-line"></i>
            </div>
            <div className="summary-info">
              <div className="summary-value">{stats.activeReports}</div>
              <div className="summary-label">דיווחים פעילים</div>
            </div>
          </div>
        </div>

        {/* Matrix Details */}
        <div className="matrix-details">
          <div className="detail-item">
            <span className="detail-label">מיקומים:</span>
            <span className="detail-value">{stats.metadata.locationsCount}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">סוגי פריטים:</span>
            <span className="detail-value">{stats.metadata.itemsCount}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">סה"כ הקצאות:</span>
            <span className="detail-value">{stats.metadata.totalAssignments}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="matrix-table-container">
          <table className="matrix-table">
            <thead>
              <tr className="header-row">
                <th className="item-header">פריטים</th>
                {locations.map(location => (
                  <th key={location} className="location-header">
                    {location}
                  </th>
                ))}
                <th className="total-header">סה"כ</th>
              </tr>
            </thead>
            <tbody>
              {itemNames.map((itemName, index) => (
                <tr key={itemName} className={index % 2 === 0 ? 'row-even' : 'row-odd'}>
                  <td className="item-name">{itemName}</td>
                  {locations.map(location => (
                    <td key={`${itemName}-${location}`} className="data-cell">
                      <span className="cell-value">
                        {matrix[location]?.[itemName] || 0}
                      </span>
                    </td>
                  ))}
                  <td className="total-cell">
                    <span className="total-value">
                      {totals.byItem[itemName] || 0}
                    </span>
                  </td>
                </tr>
              ))}
              {/* Totals Row */}
              <tr className="totals-row">
                <td className="total-label">סה"כ</td>
                {locations.map(location => (
                  <td key={`total-${location}`} className="total-cell">
                    <span className="total-value">
                      {totals.byLocation[location] || 0}
                    </span>
                  </td>
                ))}
                <td className="grand-total-cell">
                  <span className="grand-total-value">
                    {totals.grand}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
