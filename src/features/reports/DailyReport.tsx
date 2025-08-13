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
  const { dailyReportData, loading, error, createDailyReport, updateDailyReport, completeDailyReport, toggleReportStatus, setReportStatusBulk, updateItemNotes } = useDailyReports();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [completing, setCompleting] = useState(false);
  const [creatingReport, setCreatingReport] = useState(false);
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
    if (!dailyReportData || !dailyReportData.items) return [];
    
    // Role-based filtering: users see only their items, admins see all
    let filteredItems = dailyReportData.items;
    if (!isAdmin && userProfile) {
      // Note: Need to add user filtering logic based on the new data structure
      // For now, showing all items as the server should handle the filtering
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

    const reportUpdates: UpdateDailyReportItemRequest[] = sortedReportItems.map(item => ({
      itemId: item.id,
      isReported: item.isReported || false,
      notes: item.notes || undefined,
    }));

    const success = await updateDailyReport(dailyReportData.report.id, { reportItems: reportUpdates });
    
    if (success) {
      alert('דיווח עודכן בהצלחה');
    } else {
      alert('שגיאה בעדכון הדיווח');
    }
  };

  const handleCompleteReport = async () => {
    if (!dailyReportData || !isAdmin) return;

    setCompleting(true);
    try {
      // First save current changes
      const reportUpdates: UpdateDailyReportItemRequest[] = sortedReportItems.map(item => ({
        itemId: item.id,
        isReported: item.isReported || false,
        notes: item.notes || undefined,
      }));

      await updateDailyReport(dailyReportData.report.id, { reportItems: reportUpdates });

      // Then complete the report
      const success = await completeDailyReport({
        reportId: dailyReportData.report.id,
      });

      if (success) {
        alert('הדוח הושלם בהצלחה! דוח חדש נוצר למחר');
      } else {
        alert('שגיאה בהשלמת הדוח');
      }
    } finally {
      setCompleting(false);
    }
  };

  const handleCreateReport = async () => {
    if (!isAdmin) return;

    setCreatingReport(true);
    try {
      const success = await createDailyReport({});

      if (success) {
        alert('דוח חדש נוצר בהצלחה');
      } else {
        alert('שגיאה ביצירת דוח חדש');
      }
    } catch (error) {
      console.error('Error creating report:', error);
      alert('שגיאה ביצירת דוח חדש');
    } finally {
      setCreatingReport(false);
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
            <nav className="nav nav-tabs card-header-tabs d-flex" role="tablist">
              {availableReportTabs.map(tab => (
                <button
                  key={tab}
                  className={`nav-link ${activeReportTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveReportTab(tab)}
                  type="button"
                  role="tab"
                  style={{ whiteSpace: 'nowrap' }}
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
        {/* Sub-navigation */}
        <div className="card">
          <div className="card-header">
            <nav className="nav nav-tabs card-header-tabs d-flex" role="tablist">
              {availableReportTabs.map(tab => (
                <button
                  key={tab}
                  className={`nav-link ${activeReportTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveReportTab(tab)}
                  type="button"
                  role="tab"
                  style={{ whiteSpace: 'nowrap' }}
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
            <nav className="nav nav-tabs card-header-tabs d-flex" role="tablist">
              {availableReportTabs.map(tab => (
                <button
                  key={tab}
                  className={`nav-link ${activeReportTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveReportTab(tab)}
                  type="button"
                  role="tab"
                  style={{ whiteSpace: 'nowrap' }}
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
          <nav className="nav nav-tabs card-header-tabs d-flex" role="tablist">
            {availableReportTabs.map(tab => (
              <button
                key={tab}
                className={`nav-link ${activeReportTab === tab ? 'active' : ''}`}
                onClick={() => setActiveReportTab(tab)}
                type="button"
                role="tab"
                style={{ whiteSpace: 'nowrap' }}
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
          {dailyReportData?.report?.isCompleted && (
            <span className="badge bg-success fs-6">
              <i className="fas fa-check-circle me-1"></i>
              דוח הושלם
            </span>
          )}
        </div>
        <div className="card-body">
          {/* Handle case when no daily report exists or report has no items */}
          {(!dailyReportData || !dailyReportData.items || dailyReportData.items.length === 0) && (
            <div>
              {isAdmin ? (
                /* Admin can create a new report */
                <div className="text-center">
                  <div className="alert alert-info">
                    <h4><i className="fas fa-plus-circle me-2"></i>אין דוח יומי פעיל</h4>
                    <p>לא קיים דוח יומי פעיל כרגע או שהדוח ריק. בתור מנהל, אתה יכול ליצור דוח חדש עבור היום.</p>
                  </div>
                  
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0"><i className="fas fa-file-plus me-2"></i>יצירת דוח יומי חדש</h5>
                    </div>
                    <div className="card-body">
                      <div className="row justify-content-center">
                        <div className="col-md-6">
                          <p className="text-center mb-4">לחץ על הכפתור למטה כדי ליצור דוח יומי חדש עבור היום.</p>
                          
                          <button
                            type="button"
                            className="btn btn-primary btn-lg w-100"
                            onClick={handleCreateReport}
                            disabled={creatingReport}
                          >
                            {creatingReport ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                יוצר דוח...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-plus me-2"></i>
                                צור דוח יומי חדש
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Regular users see a message */
                <div className="alert alert-warning text-center">
                  <h4><i className="fas fa-clock me-2"></i>אין דוח יומי פעיל</h4>
                  <p>כרגע אין דוח יומי פעיל. אנא חכה שהמנהל יתחיל דוח חדש.</p>
                </div>
              )}
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
                    onClick={() => handleSort('itemName')}
                    title="לחץ למיון לפי שם פריט"
                    data-sorted={sortConfig?.key === 'itemName' ? 'true' : 'false'}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <span>שם פריט</span>
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
                      <span>האם דיווח</span>
                      <div className="d-flex align-items-center gap-2">
                        <input
                          type="checkbox"
                          ref={headerCheckboxRef}
                          onChange={handleHeaderCheckboxChange}
                          title="סמן/נקה הכל בכל הדפים"
                          className="form-check-input"
                          onClick={(e) => e.stopPropagation()}
                          disabled={dailyReportData?.report?.isCompleted}
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
                        disabled={dailyReportData?.report?.isCompleted}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.notes || ''}
                        onChange={(e) => {
                          if (!dailyReportData?.report?.isCompleted) {
                            updateItemNotes(item.id, e.target.value);
                          }
                        }}
                        className="form-control form-control-sm"
                        placeholder="הערות..."
                        disabled={dailyReportData?.report?.isCompleted}
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
                  disabled={dailyReportData?.report?.isCompleted}
                >
                  <i className="fas fa-save me-1"></i>
                  שמור דיווח
                </button>
                
                {isAdmin && !dailyReportData?.report?.isCompleted && (
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
              
              {dailyReportData?.report?.isCompleted && (
                <div className="alert alert-success d-inline-flex align-items-center mb-0">
                  <i className="fas fa-check-circle me-2"></i>
                  הדוח הושלם
                </div>
              )}
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
      </div>
    </div>
  );
};

export default DailyReport;
