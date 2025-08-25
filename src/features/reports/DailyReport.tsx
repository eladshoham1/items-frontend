import React, { useState, useEffect, useRef } from 'react';
import { ServerError, SmartPagination, ErrorNotificationModal, TabNavigation } from '../../shared/components';
import { useDailyReports } from '../../hooks';
import { getCurrentDate, paginate } from '../../utils';
import { User } from '../../types';
import { UI_CONFIG } from '../../config/app.config';
import DailyReportHistory from './DailyReportHistory';

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
        { id: 'current', label: 'דוח נוכחי', icon: 'fas fa-calendar-day' },
        { id: 'history', label: 'היסטוריית דוחות', icon: 'fas fa-history' }
      ]
    : [
        { id: 'current', label: 'דוח נוכחי', icon: 'fas fa-calendar-day' }
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
    if (!dailyReportData || !dailyReportData.items) return [];
    
    // Role-based filtering: users see only their items, admins see all
    let filteredItems = dailyReportData.items;
    if (!isAdmin && userProfile) {
      // Note: Need to add user filtering logic based on the new data structure
      // For now, showing all items as the server should handle the filtering
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filteredItems = filteredItems.filter(item => 
        (item.itemName?.toLowerCase() || '').includes(searchLower) ||
        (item.idNumber?.toLowerCase() || '').includes(searchLower) ||
        (item.signedByUserName?.toLowerCase() || '').includes(searchLower) ||
        (item.location?.toLowerCase() || '').includes(searchLower) ||
        (item.reportedBy?.name?.toLowerCase() || '').includes(searchLower) ||
        (item.reportedBy?.rank?.toLowerCase() || '').includes(searchLower) ||
        (item.notes?.toLowerCase() || '').includes(searchLower)
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
          aValue = a.signedByUserName || '';
          bValue = b.signedByUserName || '';
          break;
        case 'location':
          aValue = a.location || '';
          bValue = b.location || '';
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
        itemId: item.itemId,
        notes: item.notes || undefined,
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
          itemId: item.itemId,
          notes: item.notes || undefined,
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
    <>
      {/* Tab Navigation */}
      <TabNavigation
        tabs={availableReportTabs}
        activeTab={activeReportTab}
        onTabChange={handleTabChange}
        variant="primary"
        size="md"
      />

      <div style={{ padding: '20px 0' }}>
        {/* Handle case when no daily report exists or report has no items */}
        {(!dailyReportData || !dailyReportData.items || dailyReportData.items.length === 0) && (
          <div>
            <div className="alert alert-info text-center">
              <h4><i className="fas fa-clock me-2"></i>אין פריטים לדיווח</h4>
              <p>כרגע אין פריטים הדורשים דיווח או שהם כבר דווחו.</p>
                <p>הפריטים מתעדכנים אוטומטית כאשר יש צורך בדיווח.</p>
              </div>
            </div>
          )}

          {/* Show report content only when dailyReportData exists and has items */}
          {dailyReportData && dailyReportData.items && dailyReportData.items.length > 0 && (
            <>
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
          
          {/* Search Bar */}
          <div className="mb-4">
            <div className="row">
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fas fa-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="חיפוש לפי שם פריט, מספר צ', חתימה, מיקום, מי דיווח או הערות..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1); // Reset to first page when searching
                    }}
                    style={{ direction: 'rtl' }}
                  />
                  {searchTerm && (
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
                        setCurrentPage(1);
                      }}
                      title="נקה חיפוש"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
                {searchTerm && (
                  <small className="text-muted mt-1 d-block">
                    נמצאו {sortedReportItems.length} תוצאות עבור "{searchTerm}"
                  </small>
                )}
              </div>
            </div>
          </div>
          
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('itemName')}
                    title="לחץ למיון לפי שם פריט"
                    data-sorted={sortConfig?.key === 'itemName' ? 'true' : 'false'}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <span>פריט</span>
                      <div className="sort-indicator">
                        {getSortIcon('itemName')}
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
                    onClick={() => handleSort('signedBy')}
                    title="לחץ למיון לפי מי חתם על הפריט"
                    data-sorted={sortConfig?.key === 'signedBy' ? 'true' : 'false'}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <span>חתום על ידי</span>
                      <div className="sort-indicator">
                        {getSortIcon('signedBy')}
                      </div>
                    </div>
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('location')}
                    title="לחץ למיון לפי מיקום"
                    data-sorted={sortConfig?.key === 'location' ? 'true' : 'false'}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <span>מיקום</span>
                      <div className="sort-indicator">
                        {getSortIcon('location')}
                      </div>
                    </div>
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('reportedAt')}
                    title="לחץ למיון לפי תאריך דיווח"
                    data-sorted={sortConfig?.key === 'reportedAt' ? 'true' : 'false'}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <span>תאריך דיווח</span>
                      <div className="sort-indicator">
                        {getSortIcon('reportedAt')}
                      </div>
                    </div>
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('reportedBy')}
                    title="לחץ למיון לפי מי דיווח"
                    data-sorted={sortConfig?.key === 'reportedBy' ? 'true' : 'false'}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <span>מי דיווח</span>
                      <div className="sort-indicator">
                        {getSortIcon('reportedBy')}
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
                      <span>דיווח</span>
                      <div className="d-flex align-items-center gap-2">
                        <input
                          type="checkbox"
                          ref={headerCheckboxRef}
                          onChange={handleHeaderCheckboxChange}
                          title="סמן/נקה הכל בכל הדפים"
                          className="form-check-input"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="sort-indicator">{getSortIcon('isReported')}</div>
                      </div>
                    </div>
                  </th>
                  <th>הערות</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map(item => (
                  <tr key={item.id}>
                    <td>{item.itemName}</td>
                    <td>{item.idNumber || '-'}</td>
                    <td>{item.signedByUserName || '-'}</td>
                    <td>{item.location || '-'}</td>
                    <td>{item.reportedAt ? (() => {
                      const date = new Date(item.reportedAt);
                      return !isNaN(date.getTime()) ? date.toLocaleDateString('he-IL') : 'תאריך לא תקין';
                    })() : '-'}</td>
                    <td>{item.reportedBy ? `${item.reportedBy.name} (${item.reportedBy.rank})` : '-'}</td>
                    <td>
                      <input
                        type="checkbox"
                        checked={item.isReported || false}
                        onChange={() => handleCheckboxChange(item.id)}
                        className="form-check-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.notes || ''}
                        onChange={(e) => {
                          updateItemNotes(item.id, e.target.value);
                        }}
                        className="form-control form-control-sm"
                        placeholder="הערות..."
                        style={{ minWidth: '150px' }}
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
          
          {/* Action Buttons */}
          {sortedReportItems.length > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-4">
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-primary" 
                  onClick={handleSubmitReport}
                >
                  <i className="fas fa-save me-1"></i>
                  שמור דיווח
                </button>
                
                {isAdmin && (
                  <div className="d-flex flex-column gap-2">
                    <button 
                      className="btn btn-success" 
                      onClick={handleCompleteReport}
                      disabled={completing || !allItemsReported}
                      title={!allItemsReported ? "לא ניתן להשלים דוח כאשר יש פריטים שלא דווחו" : "השלם מחזור דיווח נוכחי"}
                    >
                      {completing ? (
                        <>
                          <i className="fas fa-spinner fa-spin me-1"></i>
                          מושלם...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check-circle me-1"></i>
                          השלם מחזור דיווח
                        </>
                      )}
                    </button>
                    {!allItemsReported && (
                      <small className="text-warning">
                        <i className="fas fa-exclamation-triangle me-1"></i>
                        יש לדווח על כל הפריטים לפני השלמת המחזור
                      </small>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {sortedReportItems.length === 0 && (
            <div className="alert alert-info text-center">
              <i className="fas fa-calendar-alt fa-2x mb-3"></i>
              <h4>אין פריטים לדיווח</h4>
              <p>לא נמצאו פריטים בדוח היומי</p>
            </div>
          )}
            </>
          )}
        </div>

      {/* Error Notification Modal */}
      <ErrorNotificationModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, title: '', message: '' })}
        title={errorModal.title}
        message={errorModal.message}
      />
    </>
  );
};

export default DailyReport;
