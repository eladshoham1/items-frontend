import React, { useState, useEffect, useRef } from 'react';
import { ServerError, SmartPagination, ErrorNotificationModal, TabNavigation, LoadingSpinner } from '../../shared/components';
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
        (item.signedByUserName?.toLowerCase().normalize('NFC') || '').includes(searchLower) ||
        (item.location?.toLowerCase().normalize('NFC') || '').includes(searchLower) ||
        (item.reportedBy?.name?.toLowerCase().normalize('NFC') || '').includes(searchLower) ||
        (item.reportedBy?.rank?.toLowerCase().normalize('NFC') || '').includes(searchLower) ||
        (item.notes?.toLowerCase().normalize('NFC') || '').includes(searchLower)
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
        
        <div className="management-container">
          <LoadingSpinner message="טוען נתוני דוח יומי..." />
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
        <div className="management-container">
          {/* Handle case when no daily report exists or report has no items */}
          {(!dailyReportData || !dailyReportData.items || dailyReportData.items.length === 0) ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '400px',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '40px'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
                boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)'
              }}>
                <i className="fas fa-clipboard-check" style={{ 
                  fontSize: '32px', 
                  color: 'white'
                }}></i>
              </div>
              <h3 style={{ 
                color: 'rgba(255, 255, 255, 0.9)', 
                marginBottom: '12px',
                fontWeight: '600',
                fontSize: '24px'
              }}>
                אין פריטים לדיווח
              </h3>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.7)', 
                fontSize: '16px',
                lineHeight: '1.5',
                maxWidth: '400px'
              }}>
                כרגע אין פריטים הדורשים דיווח או שהם כבר דווחו.
                הפריטים מתעדכנים אוטומטית כאשר יש צורך בדיווח.
              </p>
            </div>
          ) : (
            <>
              {/* Modern Progress Card */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(29, 78, 216, 0.05))',
                borderRadius: '16px',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                padding: '24px',
                marginBottom: '24px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)'
                    }}>
                      <i className="fas fa-chart-line" style={{ 
                        color: 'white', 
                        fontSize: '20px' 
                      }}></i>
                    </div>
                    <div>
                      <h3 style={{ 
                        color: 'rgba(255, 255, 255, 0.9)', 
                        margin: '0',
                        fontSize: '20px',
                        fontWeight: '600'
                      }}>
                        {isAdmin ? 'סטטוס דיווח יומי' : 'הדיווח שלי היום'}
                      </h3>
                      <p style={{ 
                        color: 'rgba(255, 255, 255, 0.6)', 
                        margin: '4px 0 0 0',
                        fontSize: '14px'
                      }}>
                        {getCurrentDate()}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{
                    background: reportingStats.percentage === 100 ? 
                      'linear-gradient(135deg, #10b981, #059669)' : 
                      reportingStats.percentage >= 70 ? 
                      'linear-gradient(135deg, #f59e0b, #d97706)' : 
                      'linear-gradient(135deg, #ef4444, #dc2626)',
                    borderRadius: '12px',
                    padding: '8px 16px',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '16px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                  }}>
                    {reportingStats.total} / {reportingStats.reported}
                  </div>
                </div>
                
                {/* Modern Progress Bar */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  height: '12px',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{
                    width: `${reportingStats.percentage}%`,
                    height: '100%',
                    background: reportingStats.percentage === 100 ? 
                      'linear-gradient(90deg, #10b981, #059669)' :
                      reportingStats.percentage >= 70 ?
                      'linear-gradient(90deg, #f59e0b, #d97706)' :
                      'linear-gradient(90deg, #ef4444, #dc2626)',
                    borderRadius: '12px',
                    transition: 'width 0.8s ease-in-out',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '0',
                      left: '0',
                      right: '0',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                      animation: 'shimmer 2s infinite'
                    }}></div>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '16px'
                }}>
                  <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                    {reportingStats.percentage.toFixed(1)}% הושלם
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {reportingStats.percentage === 100 ? (
                      <>
                        <i className="fas fa-check-circle" style={{ color: '#10b981' }}></i>
                        <span style={{ color: '#10b981' }}>מוכן להשלמה</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-clock" style={{ color: '#f59e0b' }}></i>
                        <span>נותרו {reportingStats.total - reportingStats.reported} פריטים</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Modern Search Bar */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '4px',
                  transition: 'all 0.2s ease'
                }}>
                  <i className="fas fa-search" style={{
                    color: 'rgba(255, 255, 255, 0.5)',
                    paddingLeft: '12px'
                  }}></i>
                  <input
                    type="text"
                    placeholder="חיפוש לפי שם פריט, מספר צ', חתימה, מיקום, מי דיווח או הערות..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      outline: 'none',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '14px',
                      flex: 1,
                      padding: '12px 8px',
                      direction: 'rtl'
                    }}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
                        setCurrentPage(1);
                      }}
                      title="נקה חיפוש"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255, 255, 255, 0.7)',
                        cursor: 'pointer',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLButtonElement).style.background = 'none';
                      }}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
                {searchTerm && (
                  <div style={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '14px',
                    marginTop: '8px'
                  }}>
                    נמצאו {sortedReportItems.length} תוצאות עבור "{searchTerm}"
                  </div>
                )}
              </div>

              {/* Modern Table */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                overflow: 'hidden',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    margin: 0
                  }}>
                    <thead>
                      <tr style={{
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(29, 78, 216, 0.1))',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <th 
                          className="sortable-header"
                          onClick={() => handleSort('itemName')}
                          title="לחץ למיון לפי שם פריט"
                          data-sorted={sortConfig?.key === 'itemName' ? 'true' : 'false'}
                          style={{
                            padding: '16px',
                            textAlign: 'right',
                            color: 'rgba(255, 255, 255, 0.9)',
                            fontWeight: '600',
                            fontSize: '14px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span>פריט</span>
                          </div>
                        </th>
                        <th 
                          className="sortable-header"
                          onClick={() => handleSort('idNumber')}
                          title="לחץ למיון לפי מספר צ'"
                          data-sorted={sortConfig?.key === 'idNumber' ? 'true' : 'false'}
                          style={{
                            padding: '16px',
                            textAlign: 'right',
                            color: 'rgba(255, 255, 255, 0.9)',
                            fontWeight: '600',
                            fontSize: '14px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span>מספר צ'</span>
                          </div>
                        </th>
                        <th 
                          className="sortable-header"
                          onClick={() => handleSort('signedBy')}
                          title="לחץ למיון לפי מי חתם על הפריט"
                          data-sorted={sortConfig?.key === 'signedBy' ? 'true' : 'false'}
                          style={{
                            padding: '16px',
                            textAlign: 'right',
                            color: 'rgba(255, 255, 255, 0.9)',
                            fontWeight: '600',
                            fontSize: '14px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span>חתום על ידי</span>
                          </div>
                        </th>
                        <th 
                          className="sortable-header"
                          onClick={() => handleSort('location')}
                          title="לחץ למיון לפי מיקום"
                          data-sorted={sortConfig?.key === 'location' ? 'true' : 'false'}
                          style={{
                            padding: '16px',
                            textAlign: 'right',
                            color: 'rgba(255, 255, 255, 0.9)',
                            fontWeight: '600',
                            fontSize: '14px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span>מיקום</span>
                          </div>
                        </th>
                        <th 
                          className="sortable-header"
                          onClick={() => handleSort('reportedAt')}
                          title="לחץ למיון לפי תאריך דיווח"
                          data-sorted={sortConfig?.key === 'reportedAt' ? 'true' : 'false'}
                          style={{
                            padding: '16px',
                            textAlign: 'right',
                            color: 'rgba(255, 255, 255, 0.9)',
                            fontWeight: '600',
                            fontSize: '14px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span>תאריך דיווח</span>
                          </div>
                        </th>
                        <th 
                          className="sortable-header"
                          onClick={() => handleSort('reportedBy')}
                          title="לחץ למיון לפי מי דיווח"
                          data-sorted={sortConfig?.key === 'reportedBy' ? 'true' : 'false'}
                          style={{
                            padding: '16px',
                            textAlign: 'right',
                            color: 'rgba(255, 255, 255, 0.9)',
                            fontWeight: '600',
                            fontSize: '14px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span>מי דיווח</span>
                          </div>
                        </th>
                        <th 
                          className="sortable-header"
                          onClick={() => handleSort('isReported')}
                          title="לחץ למיון לפי סטטוס דיווח"
                          data-sorted={sortConfig?.key === 'isReported' ? 'true' : 'false'}
                          style={{
                            padding: '16px',
                            textAlign: 'right',
                            color: 'rgba(255, 255, 255, 0.9)',
                            fontWeight: '600',
                            fontSize: '14px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
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
                        <th style={{
                          padding: '16px',
                          textAlign: 'right',
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontWeight: '600',
                          fontSize: '14px',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          הערות
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedItems.map((item, index) => (
                        <tr key={item.id} style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                          background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                          transition: 'all 0.2s ease'
                        }}>
                          <td style={{
                            padding: '16px',
                            color: 'rgba(255, 255, 255, 0.9)',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                          }}>
                            {item.itemName}
                          </td>
                          <td style={{
                            padding: '16px',
                            color: 'rgba(255, 255, 255, 0.7)',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                          }}>
                            {item.idNumber || '-'}
                          </td>
                          <td style={{
                            padding: '16px',
                            color: 'rgba(255, 255, 255, 0.7)',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                          }}>
                            {item.signedByUserName || '-'}
                          </td>
                          <td style={{
                            padding: '16px',
                            color: 'rgba(255, 255, 255, 0.7)',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                          }}>
                            {item.location || '-'}
                          </td>
                          <td style={{
                            padding: '16px',
                            color: 'rgba(255, 255, 255, 0.7)',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                          }}>
                            {item.reportedAt ? (() => {
                              const date = new Date(item.reportedAt);
                              return !isNaN(date.getTime()) ? date.toLocaleDateString('he-IL') : 'תאריך לא תקין';
                            })() : '-'}
                          </td>
                          <td style={{
                            padding: '16px',
                            color: 'rgba(255, 255, 255, 0.7)',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                          }}>
                            {item.reportedBy ? `${item.reportedBy.name} (${item.reportedBy.rank})` : '-'}
                          </td>
                          <td style={{
                            padding: '16px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                          }}>
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
                          </td>
                          <td style={{
                            padding: '16px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                          }}>
                            <input
                              type="text"
                              value={item.notes || ''}
                              onChange={(e) => updateItemNotes(item.id, e.target.value)}
                              placeholder="הערות..."
                              style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                color: 'rgba(255, 255, 255, 0.9)',
                                fontSize: '14px',
                                minWidth: '150px',
                                transition: 'all 0.2s ease'
                              }}
                              onFocus={(e) => {
                                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                                e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                              }}
                              onBlur={(e) => {
                                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
                  <SmartPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}

              {/* Action Buttons */}
              {sortedReportItems.length > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '24px',
                  padding: '20px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={handleSubmitReport}
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px 24px',
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)'
                      }}
                    >
                      <i className="fas fa-save" style={{ marginLeft: '8px' }}></i>
                      שמור דיווח
                    </button>
                    
                    {isAdmin && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button 
                          onClick={handleCompleteReport}
                          disabled={completing || !allItemsReported}
                          title={!allItemsReported ? "לא ניתן להשלים דוח כאשר יש פריטים שלא דווחו" : "השלם מחזור דיווח נוכחי"}
                          style={{
                            background: completing || !allItemsReported ? 
                              'rgba(255, 255, 255, 0.1)' : 
                              'linear-gradient(135deg, #10b981, #059669)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px 24px',
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '14px',
                            cursor: completing || !allItemsReported ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: completing || !allItemsReported ? 'none' : '0 4px 16px rgba(16, 185, 129, 0.3)'
                          }}
                        >
                          {completing ? (
                            <>
                              <i className="fas fa-spinner fa-spin" style={{ marginLeft: '8px' }}></i>
                              מושלם...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-check-circle" style={{ marginLeft: '8px' }}></i>
                              השלם מחזור דיווח
                            </>
                          )}
                        </button>
                        {!allItemsReported && (
                          <div style={{
                            color: '#f59e0b',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <i className="fas fa-exclamation-triangle"></i>
                            יש לדווח על כל הפריטים לפני השלמת המחזור
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {sortedReportItems.length === 0 && searchTerm && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '300px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '40px'
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '24px'
                  }}>
                    <i className="fas fa-search" style={{ fontSize: '32px', color: 'white' }}></i>
                  </div>
                  <h3 style={{ 
                    color: 'rgba(255, 255, 255, 0.9)', 
                    marginBottom: '12px',
                    fontWeight: '600',
                    fontSize: '24px'
                  }}>
                    לא נמצאו תוצאות
                  </h3>
                  <p style={{ 
                    color: 'rgba(255, 255, 255, 0.7)', 
                    fontSize: '16px',
                    lineHeight: '1.5'
                  }}>
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
