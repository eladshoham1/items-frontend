import React from 'react';
import { useDashboardStats } from '../../hooks';
import ServerError from '../../shared/components/ServerError';

const Dashboard: React.FC = () => {
  const { stats, loading, error } = useDashboardStats();

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <h2>לוח בקרה</h2>
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

  if (!stats) {
    return (
      <div className="card">
        <div className="card-body">
          <h2>לוח בקרה</h2>
          <p className="text-muted">אין נתונים זמינים</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="mb-0">לוח בקרה</h2>
      </div>
      <div className="card-body">
        <div className="stats-grid">
          <div className="card stat-card">
            <div className="card-body">
              <h3>סך הכל משתמשים</h3>
              <div className="stat-value">{stats.totalUsers}</div>
            </div>
          </div>
          <div className="card stat-card">
            <div className="card-body">
              <h3>סך הכל פריטים</h3>
              <div className="stat-value">{stats.totalItems}</div>
            </div>
          </div>
          <div className="card stat-card">
            <div className="card-body">
              <h3>סך הכל קבלות</h3>
              <div className="stat-value">{stats.totalReceipts}</div>
            </div>
          </div>
          <div className="card stat-card">
            <div className="card-body">
              <h3>דיווחים פעילים</h3>
              <div className="stat-value">{stats.activeReports}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
