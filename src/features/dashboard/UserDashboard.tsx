import React, { useState, useMemo } from 'react';
import { useUserDashboard } from '../../hooks';
import { UserDashboardItem } from '../../types';
import { paginate } from '../../utils';
import { UI_CONFIG } from '../../config/app.config';
import {
  DashboardLoadingSpinner,
  DashboardError,
  DashboardSearch,
  DashboardPagination,
  DashboardEmptyState,
  DashboardTableHeader,
  DashboardBadge,
  formatDate,
  getStatusText
} from './DashboardShared';
import '../../shared/styles/components.css';
import './Dashboard.css';

const UserDashboard: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>({ key: 'signedAt', direction: 'desc' });

  // Fetch all data once without pagination/sorting params
  const { data, loading, error, refetch } = useUserDashboard();

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Filter and sort items on the frontend
  const filteredAndSortedItems = useMemo(() => {
    if (!data?.items) return [];

    const normalizedSearchTerm = searchTerm.toLowerCase().normalize('NFC');
    let filtered = data.items.filter(item =>
      item.itemName.toLowerCase().normalize('NFC').includes(normalizedSearchTerm) ||
      (item.itemIdNumber && item.itemIdNumber.toLowerCase().normalize('NFC').includes(normalizedSearchTerm)) ||
      (item.status === 'signed' && 'נחתם'.normalize('NFC').includes(normalizedSearchTerm)) ||
      (item.status === 'pending' && 'ממתין'.normalize('NFC').includes(normalizedSearchTerm)) ||
      item.createdBy.name.toLowerCase().normalize('NFC').includes(normalizedSearchTerm) ||
      item.createdBy.rank.toLowerCase().normalize('NFC').includes(normalizedSearchTerm)
    );

    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case 'itemName':
            aValue = a.itemName;
            bValue = b.itemName;
            break;
          case 'itemIdNumber':
            aValue = a.itemIdNumber || '';
            bValue = b.itemIdNumber || '';
            break;
          case 'createdBy':
            aValue = a.createdBy.name;
            bValue = b.createdBy.name;
            break;
          case 'signedBy':
            aValue = a.status === 'signed' ? 1 : 0; // Signed first when ascending
            bValue = b.status === 'signed' ? 1 : 0;
            break;
          case 'signedAt':
            aValue = a.signedAt ? new Date(a.signedAt).getTime() : 0;
            bValue = b.signedAt ? new Date(b.signedAt).getTime() : 0;
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
    }

    return filtered;
  }, [data?.items, searchTerm, sortConfig]);

  const { paginatedItems, totalPages } = paginate(
    filteredAndSortedItems,
    currentPage,
    UI_CONFIG.TABLE_PAGE_SIZE
  );

  if (loading) {
    return (
      <DashboardLoadingSpinner message="טוען נתוני לוח בקרה אישי..." />
    );
  }

  if (error) {
    return (
      <DashboardError 
        error={error}
        onRetry={() => refetch()}
        title="שגיאה בטעינת נתוני לוח בקרה אישי"
      />
    );
  }

  if (!data) {
    return (
      <DashboardError 
        error="שגיאה בטעינת נתונים"
        onRetry={() => refetch()}
        title="שגיאה בטעינת נתוני לוח בקרה אישי"
      />
    );
  }

  return (
    <div className="page-container">
      {/* Status Legend */}
      <div style={{
        padding: '16px 20px',
        marginBottom: '20px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
          <i className="fas fa-info-circle" style={{ color: 'var(--color-text-secondary)' }}></i>
          <span style={{ fontWeight: '600', color: 'var(--color-text)' }}>מקרא סטטוס:</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            width: '16px', 
            height: '16px', 
            backgroundColor: 'rgba(34, 197, 94, 0.2)', 
            borderRadius: '4px',
            border: '2px solid #22c55e'
          }}></div>
          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>נחתם</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            width: '16px', 
            height: '16px', 
            backgroundColor: 'rgba(245, 158, 11, 0.2)', 
            borderRadius: '4px',
            border: '2px solid #f59e0b'
          }}></div>
          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>ממתין לחתימה</span>
        </div>
      </div>

      {/* Enhanced Search Input - same style as admin dashboard */}
      <DashboardSearch
        value={searchTerm}
        onChange={handleSearch}
        placeholder="הקלד שם פריט לחיפוש..."
        resultsCount={filteredAndSortedItems.length}
        resultsLabel="פריטים"
        id="userDashboardSearch"
      />

      {/* Items Table - same style as admin dashboard */}
      <div className="unified-table-container">
        <div style={{ overflowX: 'auto' }}>
          <table className="unified-table">
            <thead>
              <tr>
                <DashboardTableHeader
                  label="שם פריט"
                  sortKey="itemName"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  title="לחץ למיון לפי שם פריט"
                />
                <DashboardTableHeader
                  label="מספר צ'"
                  sortKey="itemIdNumber"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  title="לחץ למיון לפי מספר צ'"
                />
                <DashboardTableHeader
                  label="מחתים"
                  sortKey="createdBy"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  title="לחץ למיון לפי מחתים"
                />
                <DashboardTableHeader
                  label="חותם"
                  sortKey="signedBy"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  title="לחץ למיון לפי חותם"
                />
                <DashboardTableHeader
                  label="תאריך חתימה"
                  sortKey="signedAt"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  title="לחץ למיון לפי תאריך חתימה"
                />
              </tr>
            </thead>
            <tbody>
              {paginatedItems && Array.isArray(paginatedItems) ? paginatedItems.map((item: UserDashboardItem) => (
                <tr 
                  key={item.id} 
                  className="unified-table-row"
                  style={{
                    borderLeft: `4px solid ${item.status === 'signed' ? '#22c55e' : '#f59e0b'}`,
                    backgroundColor: item.status === 'signed' 
                      ? 'rgba(34, 197, 94, 0.05)' 
                      : 'rgba(245, 158, 11, 0.05)'
                  }}
                >
                  <td className="unified-table-cell">
                    <span style={{ fontWeight: '500' }}>{item.itemName}</span>
                  </td>
                  <td className="unified-table-cell">
                    <DashboardBadge
                      type={item.itemIdNumber ? 'primary' : 'empty'}
                    >
                      {item.itemIdNumber || 'ללא מספר'}
                    </DashboardBadge>
                  </td>
                  <td className="unified-table-cell">
                    <div style={{ fontSize: '13px' }}>
                      <div style={{ fontWeight: '500' }}>{item.createdBy.name}</div>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>
                        {item.createdBy.rank}
                      </div>
                    </div>
                  </td>
                  <td className="unified-table-cell">
                    {item.status === 'signed' ? (
                      <div style={{ fontSize: '13px', color: '#22c55e' }}>
                        <div style={{ fontWeight: '500' }}>✓ נחתם</div>
                        <div style={{ fontSize: '11px' }}>
                          חתימה דיגיטלית
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '13px', color: '#f59e0b' }}>
                        <div style={{ fontWeight: '500' }}>⏳ ממתין</div>
                        <div style={{ fontSize: '11px' }}>
                          ממתין לחתימה
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="unified-table-cell">
                    {item.signedAt ? formatDate(item.signedAt) : '-'}
                  </td>
                </tr>
              )) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination - same style as admin dashboard */}
      <DashboardPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Empty state */}
      {filteredAndSortedItems.length === 0 && (
        <DashboardEmptyState
          icon="📝"
          message="אין פריטים רשומים עליך"
          searchTerm={searchTerm}
        />
      )}
    </div>
  );
};

export default UserDashboard;
