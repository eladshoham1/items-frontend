import React from 'react';
import { useDashboardStats } from '../hooks';
import '../style/theme.css';
import ServerError from './ServerError';

const Dashboard: React.FC = () => {
  const { stats, loading, error } = useDashboardStats();

  if (loading) {
    return (
      <div className="surface dashboard-container">
        <h2>לוח בקרה</h2>
        <p className="loading-message">טוען נתונים...</p>
      </div>
    );
  }

  if (error) {
    return <ServerError />;
  }

  if (!stats) {
    return (
      <div className="surface dashboard-container">
        <h2>לוח בקרה</h2>
        <p className="muted">אין נתונים זמינים</p>
      </div>
    );
  }

  return (
    <div className="surface dashboard-container">
      <h2>לוח בקרה</h2>
      <div className="stats-grid">
        <div className="surface stat-card">
          <h3>סך הכל משתמשים</h3>
          <div className="stat-value">{stats.totalUsers}</div>
        </div>
        <div className="surface stat-card">
          <h3>סך הכל פריטים</h3>
          <div className="stat-value">{stats.totalItems}</div>
        </div>
        <div className="surface stat-card">
          <h3>סך הכל קבלות</h3>
          <div className="stat-value">{stats.totalReceipts}</div>
        </div>
        <div className="surface stat-card">
          <h3>דיווחים פעילים</h3>
          <div className="stat-value">{stats.activeReports}</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
