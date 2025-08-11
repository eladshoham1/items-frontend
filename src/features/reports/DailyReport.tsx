import React, { useState, useEffect, useRef } from 'react';
import { ServerError, SmartPagination } from '../../shared/components';
import { useDailyReports } from '../../hooks';
import { getCurrentDate, paginate } from '../../utils';
import { UpdateDailyReportItemRequest, User } from '../../types';
import { UI_CONFIG } from '../../config/app.config';
import DailyReportHistory from './DailyReportHistory';

interface DailyReportProps {
  userProfile: User | null;
  isAdmin: boolean;
}

type ReportTab = 'current' | 'history';

const DailyReport: React.FC<DailyReportProps> = ({ userProfile, isAdmin }) => {
  const [activeReportTab, setActiveReportTab] = useState<ReportTab>('current');
  const { dailyReport, loading, error, updateDailyReport, completeDailyReport, toggleReportStatus, setReportStatusBulk, updateItemNotes } = useDailyReports();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [completing, setCompleting] = useState(false);
  const [notes, setNotes] = useState('');
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  // If not admin, hide history tab
  const availableReportTabs: ReportTab[] = isAdmin ? ['current', 'history'] : ['current'];

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
    if (!dailyReport) return [];
    
    // Role-based filtering: users see only their items, admins see all
    let filteredItems = dailyReport.items; // Changed from reportItems to items
    if (!isAdmin && userProfile) {
      // Note: Need to add user filtering logic based on the new data structure
      // For now, showing all items as the server should handle the filtering
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
        case 'isReported':
          aValue = a.isReported ? 1 : 0;
          bValue = b.isReported ? 1 : 0;
          break;
        case 'reportedAt':
          aValue = a.reportedAt ? new Date(a.reportedAt) : new Date(0);
          bValue = b.reportedAt ? new Date(b.reportedAt) : new Date(0);
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
    if (!dailyReport) return;

    const reportUpdates: UpdateDailyReportItemRequest[] = sortedReportItems.map(item => ({
      itemId: item.id,
      isReported: item.isReported || false,
      notes: item.notes || undefined,
    }));

    const success = await updateDailyReport(dailyReport.id, { reportItems: reportUpdates });
    
    if (success) {
      alert('דיווח עודכן בהצלחה');
    } else {
      alert('שגיאה בעדכון הדיווח');
    }
  };

  const handleCompleteReport = async () => {
    if (!dailyReport || !isAdmin) return;

    setCompleting(true);
    try {
      // First save current changes
      const reportUpdates: UpdateDailyReportItemRequest[] = sortedReportItems.map(item => ({
        itemId: item.id,
        isReported: item.isReported || false,
        notes: item.notes || undefined,
      }));

      await updateDailyReport(dailyReport.id, { reportItems: reportUpdates });

      // Then complete the report
      const success = await completeDailyReport({
        reportId: dailyReport.id,
        notes: notes || undefined,
      });

      if (success) {
        alert('הדוח הושלם בהצלחה! דוח חדש נוצר למחר');
        setNotes('');
      } else {
        alert('שגיאה בהשלמת הדוח');
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

  // Render history tab
  if (activeReportTab === 'history') {
    return (
      <div>
        {/* Sub-navigation */}
        <div className="card">
          <div className="card-header">
            <nav className="nav nav-tabs card-header-tabs" role="tablist">
              {availableReportTabs.map(tab => (
                <button
                  key={tab}
                  className={`nav-link ${activeReportTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveReportTab(tab)}
                  type="button"
                  role="tab"
                >
                  <i className={`fas ${tab === 'current' ? 'fa-calendar-day' : 'fa-history'} me-1`}></i>
                  {tab === 'current' ? 'דוח נוכחי' : 'היסטוריית דוחות'}
                </button>
              ))}
            </nav>
          </div>
        </div>
        <DailyReportHistory userProfile={userProfile} isAdmin={isAdmin} />
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        {/* Sub-navigation */}
        <div className="card">
          <div className="card-header">
            <nav className="nav nav-tabs card-header-tabs" role="tablist">
              {availableReportTabs.map(tab => (
                <button
                  key={tab}
                  className={`nav-link ${activeReportTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveReportTab(tab)}
                  type="button"
                  role="tab"
                >
                  <i className={`fas ${tab === 'current' ? 'fa-calendar-day' : 'fa-history'} me-1`}></i>
                  {tab === 'current' ? 'דוח נוכחי' : 'היסטוריית דוחות'}
                </button>
              ))}
            </nav>
          </div>
        </div>
        
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
        {/* Sub-navigation */}
        <div className="card">
          <div className="card-header">
            <nav className="nav nav-tabs card-header-tabs" role="tablist">
              {availableReportTabs.map(tab => (
                <button
                  key={tab}
                  className={`nav-link ${activeReportTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveReportTab(tab)}
                  type="button"
                  role="tab"
                >
                  <i className={`fas ${tab === 'current' ? 'fa-calendar-day' : 'fa-history'} me-1`}></i>
                  {tab === 'current' ? 'דוח נוכחי' : 'היסטוריית דוחות'}
                </button>
              ))}
            </nav>
          </div>
        </div>
        <ServerError />
      </div>
    );
  }

  return (
    <div>
      {/* Sub-navigation */}
      <div className="card">
        <div className="card-header">
          <nav className="nav nav-tabs card-header-tabs" role="tablist">
            {availableReportTabs.map(tab => (
              <button
                key={tab}
                className={`nav-link ${activeReportTab === tab ? 'active' : ''}`}
                onClick={() => setActiveReportTab(tab)}
                type="button"
                role="tab"
              >
                <i className={`fas ${tab === 'current' ? 'fa-calendar-day' : 'fa-history'} me-1`}></i>
                {tab === 'current' ? 'דוח נוכחי' : 'היסטוריית דוחות'}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h2 className="mb-0">דוח יומי - {getCurrentDate()}</h2>
          {dailyReport?.isCompleted && (
            <span className="badge bg-success fs-6">
              <i className="fas fa-check-circle me-1"></i>
              דוח הושלם
            </span>
          )}
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
                {reportingStats.reported} / {reportingStats.total}
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
                    onClick={() => handleSort('isReported')}
                    title="לחץ למיון לפי סטטוס דיווח"
                    data-sorted={sortConfig?.key === 'isReported' ? 'true' : 'false'}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <span>האם דיווח</span>
                      <div className="d-flex align-items-center gap-2">
                        <input
                          type="checkbox"
                          ref={headerCheckboxRef}
                          onChange={handleHeaderCheckboxChange}
                          title="סמן/נקה הכל בכל הדפים"
                          className="form-check-input"
                          onClick={(e) => e.stopPropagation()}
                          disabled={dailyReport?.isCompleted}
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
                    <td>{item.name}</td>
                    <td>{item.idNumber || '-'}</td>
                    <td>{item.reportedAt ? new Date(item.reportedAt).toLocaleDateString('he-IL') : '-'}</td>
                    <td>
                      <input
                        type="checkbox"
                        checked={item.isReported || false}
                        onChange={() => handleCheckboxChange(item.id)}
                        className="form-check-input"
                        disabled={dailyReport?.isCompleted}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.notes || ''}
                        onChange={(e) => {
                          if (!dailyReport?.isCompleted) {
                            updateItemNotes(item.id, e.target.value);
                          }
                        }}
                        className="form-control form-control-sm"
                        placeholder="הערות..."
                        disabled={dailyReport?.isCompleted}
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
                  disabled={dailyReport?.isCompleted}
                >
                  <i className="fas fa-save me-1"></i>
                  שמור דיווח
                </button>
                
                {isAdmin && !dailyReport?.isCompleted && (
                  <button 
                    className="btn btn-success" 
                    onClick={handleCompleteReport}
                    disabled={completing}
                  >
                    {completing ? (
                      <>
                        <i className="fas fa-spinner fa-spin me-1"></i>
                        מושלם...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check-circle me-1"></i>
                        השלם דוח וצור דוח חדש למחר
                      </>
                    )}
                  </button>
                )}
              </div>
              
              {dailyReport?.isCompleted && (
                <div className="alert alert-success d-inline-flex align-items-center mb-0">
                  <i className="fas fa-check-circle me-2"></i>
                  דוח הושלם ב: {dailyReport.completedAt ? new Date(dailyReport.completedAt).toLocaleDateString('he-IL') : ''}
                </div>
              )}
            </div>
          )}
          
          {/* Admin Notes Section */}
          {isAdmin && !dailyReport?.isCompleted && (
            <div className="mt-4">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="fas fa-sticky-note me-2"></i>
                    הערות מנהל (אופציונלי)
                  </h5>
                </div>
                <div className="card-body">
                  <textarea
                    className="form-control"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="הכנס הערות להשלמת הדוח..."
                    style={{ direction: 'rtl' }}
                  />
                  <small className="text-muted">
                    ההערות יתווספו לדוח המושלם ויהיו זמינות בהיסטוריה
                  </small>
                </div>
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
        </div>
      </div>
    </div>
  );
};

export default DailyReport;
