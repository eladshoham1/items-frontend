import React from 'react';
import { LoadingSpinner, SearchInput, SmartPagination } from '../../shared/components';
import '../../shared/styles/components.css';
import './Dashboard.css';

// Common Dashboard Loading Component
export const DashboardLoadingSpinner: React.FC<{ message: string }> = ({ message }) => (
  <LoadingSpinner message={message} />
);

// Common Dashboard Error Component
export const DashboardError: React.FC<{ 
  error: string; 
  onRetry: () => void;
  title?: string;
}> = ({ error, onRetry, title = "שגיאה בטעינת נתונים" }) => (
  <div className="card">
    <div className="card-header">
      <h2 className="mb-0">לוח בקרה</h2>
    </div>
    <div className="card-body">
      <div className="alert alert-danger">
        <h4>{title}</h4>
        <p>{error}</p>
        <button 
          className="btn btn-primary mt-2"
          onClick={onRetry}
        >
          נסה שוב
        </button>
      </div>
    </div>
  </div>
);

// Common Dashboard Search Component
export const DashboardSearch: React.FC<{
  value: string;
  onChange: (term: string) => void;
  placeholder: string;
  resultsCount: number;
  resultsLabel: string;
  id: string;
}> = ({ value, onChange, placeholder, resultsCount, resultsLabel, id }) => (
  <SearchInput
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    resultsCount={resultsCount}
    resultsLabel={resultsLabel}
    id={id}
  />
);

// Common Dashboard Pagination Component
export const DashboardPagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => (
  totalPages > 1 ? (
    <SmartPagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={onPageChange}
    />
  ) : null
);

// Common Dashboard Empty State Component
export const DashboardEmptyState: React.FC<{
  icon: string;
  message: string;
  searchTerm?: string;
}> = ({ icon, message, searchTerm }) => (
  <div style={{ 
    padding: '60px 24px',
    textAlign: 'center',
    backgroundColor: 'var(--color-bg, #1a1a1a)',
    color: 'var(--color-text-muted, #8e8e93)',
    fontSize: '18px',
    fontWeight: '500'
  }}>
    <div style={{ marginBottom: '16px', fontSize: '48px' }}>{icon}</div>
    {searchTerm ? 'לא נמצאו תוצאות עבור החיפוש' : message}
  </div>
);

// Common Dashboard Table Header Component
export const DashboardTableHeader: React.FC<{
  label: string;
  sortKey: string;
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  onSort: (key: string) => void;
  title: string;
}> = ({ label, sortKey, sortConfig, onSort, title }) => (
  <th 
    className="unified-table-header unified-table-header-regular sortable"
    onClick={() => onSort(sortKey)}
    title={title}
    data-sorted={sortConfig?.key === sortKey ? 'true' : 'false'}
  >
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span>{label}</span>
    </div>
  </th>
);

// Common Dashboard Badge Component
export const DashboardBadge: React.FC<{
  type: 'signed' | 'pending' | 'primary' | 'empty' | 'info';
  children: React.ReactNode;
  title?: string;
  style?: React.CSSProperties;
}> = ({ type, children, title, style }) => {
  const getBadgeClass = () => {
    switch (type) {
      case 'signed':
        return 'dashboard-badge-signed';
      case 'pending':
        return 'dashboard-badge-waiting';
      case 'primary':
        return 'dashboard-badge-primary';
      case 'empty':
        return 'dashboard-badge-empty';
      case 'info':
        return 'dashboard-badge-info';
      default:
        return 'dashboard-badge-primary';
    }
  };

  return (
    <span 
      className={`dashboard-badge ${getBadgeClass()}`}
      title={title}
      style={style}
    >
      {children}
    </span>
  );
};

// Common formatting utilities
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getStatusText = (status: 'signed' | 'pending') => {
  return status === 'signed' ? 'חתום' : 'ממתין לחתימה';
};
