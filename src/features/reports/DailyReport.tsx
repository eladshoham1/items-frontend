import React, { useState, useEffect, useRef } from 'react';
import { ServerError, SmartPagination, ErrorNotificationModal, TabNavigation, LoadingSpinner, SearchInput } from '../../shared/components';
import { useDailyReports } from '../../hooks';
import { getCurrentDate, paginate } from '../../utils';
import { User } from '../../types';
import { UI_CONFIG } from '../../config/app.config';
import DailyReportHistory from './DailyReportHistory';
import './DailyReport.css';

interface DailyReportProps {
  userProfile: User | null;
  isAdmin: boolean;
}

type ReportTab = 'current' | 'history';

const DailyReport: React.FC<DailyReportProps> = ({ userProfile, isAdmin }) => {
  const [activeReportTab, setActiveReportTab] = useState<ReportTab>('current');
  const { dailyReportData, loading, error, updateDailyReport, completeDailyReport, toggleReportStatus, setReportStatusBulk, updateItemNotes } = useDailyReports();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [completing, setCompleting] = useState(false);
  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: ''
  });

  // If not admin, hide history tab
  const availableReportTabs = isAdmin 
    ? [
        { 
          id: 'current', 
          label: 'דוח נוכחי', 
          icon: (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
            </svg>
          )
        },
        { 
          id: 'history', 
          label: 'היסטוריית דוחות', 
          icon: (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
            </svg>
          )
        }
      ]
    : [
        { 
          id: 'current', 
          label: 'דוח נוכחי', 
          icon: (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
            </svg>
          )
        }
      ];

  const handleTabChange = (tabId: string) => {
    setActiveReportTab(tabId as ReportTab);
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sort items based on sort config
  const sortedReportItems = (() => {
    if (!dailyReportData || !dailyReportData.items) return [];
    
    // Role-based filtering: users see only their items, admins see all
    let filteredItems = dailyReportData.items;
    if (!isAdmin && userProfile) {
      // Note: Need to add user filtering logic based on the new data structure
      // For now, showing all items as the server should handle the filtering
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim().normalize('NFC');
      filteredItems = filteredItems.filter(item => 
        (item.itemName?.toLowerCase().normalize('NFC') || '').includes(searchLower) ||
        (item.idNumber?.toLowerCase().normalize('NFC') || '').includes(searchLower) ||
        (item.signedBy?.name?.toLowerCase().normalize('NFC') || '').includes(searchLower) ||
        (item.signedBy?.location?.name?.toLowerCase().normalize('NFC') || '').includes(searchLower) ||
        (item.reportedBy?.name?.toLowerCase().normalize('NFC') || '').includes(searchLower) ||
        (item.reportedBy?.rank?.toLowerCase().normalize('NFC') || '').includes(searchLower) ||
        (item.reportNotes?.toLowerCase().normalize('NFC') || '').includes(searchLower)
      );
    }

    if (!sortConfig) return filteredItems;

    return [...filteredItems].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'itemName':
          aValue = a.itemName;
          bValue = b.itemName;
          break;
        case 'idNumber':
          aValue = a.idNumber || '';
          bValue = b.idNumber || '';
          break;
        case 'isReported':
          aValue = a.isReported ? 1 : 0;
          bValue = b.isReported ? 1 : 0;
          break;
        case 'reportedAt':
          aValue = a.reportedAt ? new Date(a.reportedAt) : new Date(0);
          bValue = b.reportedAt ? new Date(b.reportedAt) : new Date(0);
          break;
        case 'reportedBy':
          aValue = a.reportedBy?.name || '';
          bValue = b.reportedBy?.name || '';
          break;
        case 'signedBy':
          aValue = a.signedBy?.name || '';
          bValue = b.signedBy?.name || '';
          break;
        case 'location':
          aValue = a.signedBy?.location?.name || '';
          bValue = b.signedBy?.location?.name || '';
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

  // Header checkbox (tri-state) to set all across ALL pages (filtered set)
  const handleHeaderCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const allIds = sortedReportItems.map(i => i.id);
    setReportStatusBulk(allIds, e.target.checked);
  };

  // Keep header checkbox state in sync (checked/indeterminate) across ALL pages
  useEffect(() => {
    if (!headerCheckboxRef.current) return;
    const total = sortedReportItems.length;
    const checkedCount = sortedReportItems.filter(i => i.isReported).length;
    headerCheckboxRef.current.indeterminate = checkedCount > 0 && checkedCount < total;
    headerCheckboxRef.current.checked = total > 0 && checkedCount === total;
  }, [sortedReportItems]);

  const handleSubmitReport = async () => {
    if (!dailyReportData) return;

    // Convert current state to new API format
    const reportItems = sortedReportItems
      .filter(item => item.isReported) // Only send reported items
      .map(item => ({
        itemId: item.id, // Use item.id as itemId for the API
        notes: item.reportNotes || undefined,
      }));

    const success = await updateDailyReport('', { reportItems }); // ID not needed in new API
    
    if (!success) {
      setErrorModal({
        isOpen: true,
        title: 'שגיאה בעדכון דיווח',
        message: 'אירעה שגיאה בעת עדכון הדיווח. אנא נסה שוב.'
      });
    }
  };

  const handleCompleteReport = async () => {
    if (!dailyReportData || !isAdmin) return;

    setCompleting(true);
    try {
      // First save current changes
      const reportItems = sortedReportItems
        .filter(item => item.isReported) // Only send reported items
        .map(item => ({
          itemId: item.id, // Use item.id as itemId for the API
          notes: item.reportNotes || undefined,
        }));

      await updateDailyReport('', { reportItems }); // Save current state

      // Then complete the report cycle
      const success = await completeDailyReport();

      if (!success) {
        setErrorModal({
          isOpen: true,
          title: 'שגיאה בהשלמת הדוח',
          message: 'אירעה שגיאה בעת השלמת הדוח. אנא נסה שוב.'
        });
      }
    } finally {
      setCompleting(false);
    }
  };

  // Calculate reporting percentage for all users (admin sees all, users see only their items)
  const getReportingStats = () => {
    // Use the raw dailyReportData items for calculation, not filtered by search
    const allItems = dailyReportData?.items || [];
    
    if (allItems.length === 0) return { percentage: 0, reported: 0, total: 0 };
    
    const reportedCount = allItems.filter(item => item.isReported).length;
    const percentage = Math.round((reportedCount / allItems.length) * 100);
    
    return {
      percentage,
      reported: reportedCount,
      total: allItems.length
    };
  };

  const reportingStats = getReportingStats();

  // Check if all items are reported (for completion validation)
  const allItemsReported = sortedReportItems.length > 0 && sortedReportItems.every(item => item.isReported);

  // Render history tab
  if (activeReportTab === 'history') {
    return (
      <div>
        {/* Tab Navigation */}
        <TabNavigation
          tabs={availableReportTabs}
          activeTab={activeReportTab}
          onTabChange={handleTabChange}
          variant="primary"
          size="md"
        />
        <DailyReportHistory userProfile={userProfile} isAdmin={isAdmin} />
      </div>
    );
  }

  // Check if user has a location assigned
  if (userProfile && !userProfile.location) {
    return (
      <div className="card">
        <div className="card-header">
          <h2 className="mb-0">דוח יומי</h2>
        </div>
        <div className="card-body">
          <div className="alert alert-warning">
            <h4>אין לך גישה למערכת</h4>
            <p>המשתמש שלך לא שוייך למיקום. אנא פנה למנהל המערכת כדי לשייך אותך למיקום.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        {/* Tab Navigation */}
        <TabNavigation
          tabs={availableReportTabs}
          activeTab={activeReportTab}
          onTabChange={handleTabChange}
          variant="primary"
          size="md"
        />
        
        <LoadingSpinner message="טוען נתוני דוח יומי..." />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        {/* Tab Navigation */}
        <TabNavigation
          tabs={availableReportTabs}
          activeTab={activeReportTab}
          onTabChange={handleTabChange}
          variant="primary"
          size="md"
        />
        <ServerError />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Tab Navigation */}
      <TabNavigation
        tabs={availableReportTabs}
        activeTab={activeReportTab}
        onTabChange={handleTabChange}
        variant="primary"
        size="md"
      />

      {activeReportTab === 'current' ? (
        <div className="daily-report-container">
          {/* Handle case when no daily report exists or report has no items */}
          {(!dailyReportData || !dailyReportData.items || dailyReportData.items.length === 0) ? (
            <div className="daily-report-empty-state">
              <div className="daily-report-empty-icon">
                <i className="fas fa-clipboard-check"></i>
              </div>
              <h3 className="daily-report-empty-title">
                אין פריטים לדיווח
              </h3>
              <p className="daily-report-empty-description">
                כרגע אין פריטים הדורשים דיווח או שהם כבר דווחו.
                הפריטים מתעדכנים אוטומטית כאשר יש צורך בדיווח.
              </p>
            </div>
          ) : (
            <>
              {/* Progress Card Section */}
              <div className="daily-report-progress-card">
                <div className="daily-report-progress-header">
                  <div className="daily-report-progress-info">
                    <div className="daily-report-progress-icon">
                      <i className="fas fa-chart-line"></i>
                    </div>
                    <div>
                      <h3 className="daily-report-progress-title">
                        {isAdmin ? 'סטטוס דיווח יומי' : 'הדיווח שלי היום'}
                      </h3>
                      <p className="daily-report-progress-date">
                        {getCurrentDate()}
                      </p>
                    </div>
                  </div>
                  
                  <div className={`daily-report-progress-badge ${
                    reportingStats.percentage === 100 ? 'success' :
                    reportingStats.percentage >= 70 ? 'warning' : 'danger'
                  }`}>
                    {reportingStats.total} / {reportingStats.reported}
                  </div>
                </div>
                
                <div className="daily-report-progress-bar">
                  <div 
                    className={`daily-report-progress-fill ${
                      reportingStats.percentage === 100 ? 'success' :
                      reportingStats.percentage >= 70 ? 'warning' : 'danger'
                    }`}
                    style={{ width: `${reportingStats.percentage}%` }}
                  >
                  </div>
                </div>
                
                <div className="daily-report-progress-footer">
                  <div className="daily-report-progress-percentage">
                    {reportingStats.percentage.toFixed(1)}% הושלם
                  </div>
                  <div className="daily-report-progress-status">
                    {reportingStats.percentage === 100 ? (
                      <>
                        <i className="fas fa-check-circle daily-report-progress-status-icon success"></i>
                        <span className="daily-report-progress-status-text success">מוכן להשלמה</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-clock daily-report-progress-status-icon warning"></i>
                        <span className="daily-report-progress-status-text">נותרו {reportingStats.total - reportingStats.reported} פריטים</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Search Input */}
              <SearchInput
                value={searchTerm}
                onChange={(value) => {
                  setSearchTerm(value);
                  setCurrentPage(1);
                }}
                placeholder="חיפוש לפי שם פריט, מספר צ', חתימה, מיקום, מי דיווח או הערות..."
                resultsCount={sortedReportItems.length}
                resultsLabel="תוצאות"
              />

              {/* Table Section */}
              <div className="daily-report-table-section">
                <div className="unified-table-container">
                  <div style={{ overflowX: 'auto' }}>
                  <table className="unified-table">
                    <thead>
                      <tr>
                        <th 
                          className="unified-table-header unified-table-header-regular sortable"
                          onClick={() => handleSort('itemName')}
                          title="לחץ למיון לפי שם פריט"
                          data-sorted={sortConfig?.key === 'itemName' ? 'true' : 'false'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span>פריט</span>
                          </div>
                        </th>
                        <th 
                          className="unified-table-header unified-table-header-regular sortable"
                          onClick={() => handleSort('idNumber')}
                          title="לחץ למיון לפי מספר צ'"
                          data-sorted={sortConfig?.key === 'idNumber' ? 'true' : 'false'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span>מספר צ'</span>
                          </div>
                        </th>
                        <th 
                          className="unified-table-header unified-table-header-regular sortable"
                          onClick={() => handleSort('signedBy')}
                          title="לחץ למיון לפי מי חתם על הפריט"
                          data-sorted={sortConfig?.key === 'signedBy' ? 'true' : 'false'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span>חתום על ידי</span>
                          </div>
                        </th>
                        <th 
                          className="unified-table-header unified-table-header-regular sortable"
                          onClick={() => handleSort('location')}
                          title="לחץ למיון לפי מיקום"
                          data-sorted={sortConfig?.key === 'location' ? 'true' : 'false'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span>מיקום</span>
                          </div>
                        </th>
                        <th 
                          className="unified-table-header unified-table-header-regular sortable"
                          onClick={() => handleSort('reportedAt')}
                          title="לחץ למיון לפי תאריך דיווח"
                          data-sorted={sortConfig?.key === 'reportedAt' ? 'true' : 'false'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span>תאריך דיווח</span>
                          </div>
                        </th>
                        <th 
                          className="unified-table-header unified-table-header-regular sortable"
                          onClick={() => handleSort('reportedBy')}
                          title="לחץ למיון לפי מי דיווח"
                          data-sorted={sortConfig?.key === 'reportedBy' ? 'true' : 'false'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span>מי דיווח</span>
                          </div>
                        </th>
                        <th 
                          className="unified-table-header unified-table-header-regular sortable"
                          onClick={() => handleSort('isReported')}
                          title="לחץ למיון לפי סטטוס דיווח"
                          data-sorted={sortConfig?.key === 'isReported' ? 'true' : 'false'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span>דיווח</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="checkbox"
                                ref={headerCheckboxRef}
                                onChange={handleHeaderCheckboxChange}
                                title="סמן/נקה הכל בכל הדפים"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  accentColor: '#3b82f6',
                                  cursor: 'pointer'
                                }}
                              />
                            </div>
                          </div>
                        </th>
                        <th className="unified-table-header unified-table-header-regular">
                          הערות
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedItems.map((item, index) => (
                        <tr key={item.id} className="unified-table-row">
                          <td className="unified-table-cell">
                            {item.itemName}
                          </td>
                          <td className="unified-table-cell">
                            {item.idNumber || '-'}
                          </td>
                          <td className="unified-table-cell">
                            {item.signedBy?.name || '-'}
                          </td>
                          <td className="unified-table-cell">
                            {item.signedBy?.location?.name || '-'}
                          </td>
                          <td className="unified-table-cell">
                            {item.reportedAt ? (() => {
                              const date = new Date(item.reportedAt);
                              return !isNaN(date.getTime()) ? date.toLocaleDateString('he-IL') : 'תאריך לא תקין';
                            })() : '-'}
                          </td>
                          <td className="unified-table-cell">
                            {item.reportedBy ? `${item.reportedBy.name} (${item.reportedBy.rank})` : '-'}
                          </td>
                          <td className="unified-table-cell">
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                              <input
                                type="checkbox"
                                checked={item.isReported || false}
                                onChange={() => handleCheckboxChange(item.id)}
                                style={{
                                  accentColor: '#3b82f6',
                                  cursor: 'pointer',
                                  transform: 'scale(1.2)'
                                }}
                              />
                            </div>
                          </td>
                          <td className="unified-table-cell">
                            <input
                              type="text"
                              value={item.reportNotes || ''}
                              onChange={(e) => updateItemNotes(item.id, e.target.value)}
                              placeholder="הערות..."
                              style={{
                                background: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                color: 'var(--color-text)',
                                fontSize: '14px',
                                minWidth: '150px',
                                transition: 'all 0.2s ease'
                              }}
                              onFocus={(e) => {
                                e.target.style.background = 'var(--color-surface-hover)';
                                e.target.style.borderColor = 'var(--color-primary)';
                              }}
                              onBlur={(e) => {
                                e.target.style.background = 'var(--color-surface)';
                                e.target.style.borderColor = 'var(--color-border)';
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="daily-report-pagination">
                  <SmartPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}

              {/* Action Buttons Section */}
              {sortedReportItems.length > 0 && (
                <div className="daily-report-actions-section">
                  <div className="daily-report-actions">
                    <div className="daily-report-actions-buttons">
                      <button 
                        onClick={handleSubmitReport}
                        className="daily-report-btn daily-report-btn-primary"
                      >
                        <i className="fas fa-save"></i>
                        שמור דיווח
                      </button>
                      
                      {isAdmin && (
                        <div className="daily-report-admin-controls">
                          <button 
                            onClick={handleCompleteReport}
                            disabled={completing || !allItemsReported}
                            title={!allItemsReported ? "לא ניתן להשלים דוח כאשר יש פריטים שלא דווחו" : "השלם מחזור דיווח נוכחי"}
                            className={`daily-report-btn ${
                              completing || !allItemsReported ? 'daily-report-btn-disabled' : 'daily-report-btn-success'
                            }`}
                          >
                            {completing ? (
                              <>
                                <i className="fas fa-spinner fa-spin"></i>
                                מושלם...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-check-circle"></i>
                                השלם מחזור דיווח
                              </>
                            )}
                          </button>
                          {!allItemsReported && (
                            <div className="daily-report-warning">
                              <i className="fas fa-exclamation-triangle"></i>
                              יש לדווח על כל הפריטים לפני השלמת המחזור
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Empty Search State */}
              {sortedReportItems.length === 0 && searchTerm && (
                <div className="daily-report-empty-state">
                  <div className="daily-report-empty-icon">
                    <i className="fas fa-search"></i>
                  </div>
                  <h3 className="daily-report-empty-title">
                    לא נמצאו תוצאות
                  </h3>
                  <p className="daily-report-empty-description">
                    לא נמצאו פריטים התואמים לחיפוש "{searchTerm}"
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        activeReportTab === 'history' && <div>History reports would go here</div>
      )}

      {/* Error Notification Modal */}
      <ErrorNotificationModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, title: '', message: '' })}
        title={errorModal.title}
        message={errorModal.message}
      />
    </div>
  );
};

export default DailyReport;
