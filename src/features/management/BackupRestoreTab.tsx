import React, { useState } from 'react';
import { managementService } from '../../services/management.service';
import { Modal } from '../../shared/components';
import { useManagement } from '../../contexts';

const BackupRestoreTab: React.FC = () => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<any | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [override, setOverride] = useState<boolean>(false);

  // Export/Import result details
  const [exportResult, setExportResult] = useState<any | null>(null);
  const [importResult, setImportResult] = useState<any | null>(null);

  const { loadAllData } = useManagement();

  const handleExport = async () => {
    try {
      setBusy(true);
      setError(null);
      setSuccess(null);
      setExportResult(null);
      setImportResult(null);
      
      const resp = await managementService.exportDatabase();
      console.log('Export response:', resp); // Debug log
      
      if (!resp.success) {
        setBusy(false);
        setError(resp.error || 'שגיאה בייצוא');
        return;
      }
      
      // Save export result for display
      setExportResult(resp.data); // Use resp.data instead of resp
      
      // Download the exported data
      const blob = new Blob([
        JSON.stringify(resp.data.data, null, 2) // Download only the data part
      ], { type: 'application/json;charset=utf-8' });
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
      
      setSuccess('ייצוא הושלם והקובץ הורד בהצלחה');
      setBusy(false);
    } catch (e: any) {
      setBusy(false);
      setError(e?.message || 'שגיאה בייצוא');
    }
  };

  const openConfirmImport = async (file: File) => {
    try {
      setError(null);
      setSuccess(null);
      const text = await file.text();
      const payload = JSON.parse(text);
      setPendingPayload(payload);
      setSelectedFileName(file.name || 'backup.json');
      setIsConfirmOpen(true);
    } catch (e: any) {
      setError('קובץ גיבוי לא תקין. ודא שהקובץ הוא JSON תקין.');
    }
  };

  const performImport = async () => {
    if (!pendingPayload) {
      setIsConfirmOpen(false);
      return;
    }
    try {
      setBusy(true);
      setError(null);
      setSuccess(null);
      setExportResult(null);
      setImportResult(null);
      setIsConfirmOpen(false); // Close modal immediately to show progress
      
      // Show a message indicating the import is in progress
      setSuccess('ייבוא החל - אנא המתן, פעולה זו עלולה לקחת זמן רב...');
      
      const resp = await managementService.importDatabase(pendingPayload, override);
      console.log('Import response:', resp); // Debug log
      
      if (!resp.success) {
        setBusy(false);
        setError(resp.error || 'שגיאה בייבוא');
        setSuccess(null);
        return;
      }
      
      // Save import result for display
      setImportResult(resp.data); // Use resp.data instead of resp
      await loadAllData();
      setSuccess('ייבוא הושלם בהצלחה');
      setBusy(false);
    } catch (e: any) {
      setBusy(false);
      setSuccess(null);
      if (e?.name === 'AbortError') {
        setError('הייבוא בוטל - זמן המתנה הסתיים');
      } else {
        setError(e?.message || 'שגיאה בייבוא - ייתכן שהפעולה לקחה זמן רב מדי');
      }
    } finally {
      setPendingPayload(null);
      setSelectedFileName('');
      setOverride(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      openConfirmImport(file);
      e.currentTarget.value = '';
    }
  };

  return (
    <div className="management-container" style={{ direction: 'rtl' }}>
      <div className="management-header">
        <h2>גיבוי ושחזור</h2>
        <div className="management-actions">
          <button className="btn btn-outline-primary" onClick={handleExport} disabled={busy}>
            ⬇️ ייצוא נתונים
          </button>
          <label className="btn btn-outline-secondary" style={{ marginRight: 8 }}>
            ⬆️ ייבוא נתונים
            <input type="file" accept="application/json,.json" onChange={onFileChange} style={{ display: 'none' }} disabled={busy} />
          </label>
        </div>
      </div>

      {error && (
        <div className="error-message" style={{ marginTop: 12 }}>
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {success && (
        <div className="success-message" style={{ marginTop: 12 }}>
          <span className="success-icon">✅</span>
          {success}
        </div>
      )}

      {busy && (
        <div className="saving-indicator" style={{ marginTop: 16 }}>
          <div className="saving-spinner"></div>
          <span style={{ marginRight: 8 }}>
            {importResult ? 'מבצע פעולה...' : success?.includes('ייבוא החל') ? 'מבצע ייבוא - פעולה זו עלולה לקחת מספר דקות...' : 'מבצע פעולה...'}
          </span>
        </div>
      )}

      {/* פרטי ייצוא */}
      {exportResult && (
        <div className="card mt-4 border-0 shadow">
          <div className="card-header bg-primary text-white py-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h4 className="mb-1 fw-bold">
                  <i className="fas fa-download me-2"></i>
                  תוצאות ייצוא נתונים
                </h4>
                <small className="opacity-75">
                  {exportResult.statistics?.summary?.exportedAt ? new Date(exportResult.statistics.summary.exportedAt).toLocaleString('he-IL') : 'לא זמין'} • 
                  {exportResult.statistics?.summary?.totalRecords || 0} רשומות כולל • 
                  {exportResult.statistics?.summary?.totalTables || 0} טבלאות
                </small>
              </div>
              <div className="badge bg-success bg-opacity-20 text-white fs-6 px-3 py-2">
                <i className="fas fa-check-circle me-2"></i>הושלם בהצלחה
              </div>
            </div>
          </div>
          
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-dark">
                  <tr>
                    <th className="border-0 fw-bold py-3 px-4" style={{ width: '25%' }}>
                      <i className="fas fa-table me-2 text-primary"></i>שם הטבלה
                    </th>
                    <th className="border-0 fw-bold text-center py-3" style={{ width: '15%' }}>
                      <i className="fas fa-database me-2 text-info"></i>קיימים ב-DB
                    </th>
                    <th className="border-0 fw-bold text-center py-3" style={{ width: '15%' }}>
                      <i className="fas fa-check-circle me-2 text-success"></i>הצליחו
                    </th>
                    <th className="border-0 fw-bold text-center py-3" style={{ width: '15%' }}>
                      <i className="fas fa-times-circle me-2 text-danger"></i>נכשלו
                    </th>
                    <th className="border-0 fw-bold text-center py-3" style={{ width: '15%' }}>
                      <i className="fas fa-exclamation-triangle me-2 text-warning"></i>שגיאות
                    </th>
                    <th className="border-0 fw-bold text-center py-3" style={{ width: '15%' }}>
                      פעולות
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {exportResult.statistics?.tables ? 
                    Object.entries(exportResult.statistics.tables).map(([tableName, tableStats]) => {
                      const stats = tableStats as { total: number; success: number; failed: number; errors: string[] };
                      return (
                        <tr key={tableName} className="align-middle">
                          <td className="px-4 py-3">
                            <div className="d-flex align-items-center">
                              <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" 
                                   style={{ width: '40px', height: '40px' }}>
                                <i className="fas fa-table text-primary"></i>
                              </div>
                              <div>
                                <div className="fw-semibold text-dark">{tableName}</div>
                                <small className="text-muted">{stats.total} רשומות</small>
                              </div>
                            </div>
                          </td>
                          <td className="text-center py-3">
                            <span className="badge bg-info bg-opacity-15 text-info px-3 py-2 rounded-pill fw-bold">
                              {stats.total}
                            </span>
                          </td>
                          <td className="text-center py-3">
                            <span className="badge bg-success bg-opacity-15 text-success px-3 py-2 rounded-pill fw-bold">
                              {stats.success}
                            </span>
                          </td>
                          <td className="text-center py-3">
                            <span className={`badge px-3 py-2 rounded-pill fw-bold ${stats.failed > 0 ? 'bg-danger bg-opacity-15 text-danger' : 'bg-secondary bg-opacity-15 text-secondary'}`}>
                              {stats.failed}
                            </span>
                          </td>
                          <td className="text-center py-3">
                            <span className={`badge px-3 py-2 rounded-pill fw-bold ${stats.errors && stats.errors.length > 0 ? 'bg-warning bg-opacity-15 text-warning' : 'bg-secondary bg-opacity-15 text-secondary'}`}>
                              {stats.errors ? stats.errors.length : 0}
                            </span>
                          </td>
                          <td className="text-center py-3">
                            <button 
                              className="btn btn-outline-primary btn-sm rounded-pill"
                              onClick={() => {
                                const tableData = exportResult.data?.[tableName as keyof typeof exportResult.data];
                                if (tableData && Array.isArray(tableData) && tableData.length > 0) {
                                  const blob = new Blob([JSON.stringify(tableData, null, 2)], { type: 'application/json' });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `${tableName}-data.json`;
                                  a.click();
                                  URL.revokeObjectURL(url);
                                } else {
                                  alert(`אין נתונים להורדה עבור טבלה ${tableName}`);
                                }
                              }}
                              disabled={!exportResult.data?.[tableName as keyof typeof exportResult.data] || 
                                       (Array.isArray(exportResult.data[tableName as keyof typeof exportResult.data]) && 
                                        (exportResult.data[tableName as keyof typeof exportResult.data] as any[]).length === 0)}
                              title={exportResult.data?.[tableName as keyof typeof exportResult.data] && 
                                     Array.isArray(exportResult.data[tableName as keyof typeof exportResult.data]) && 
                                     (exportResult.data[tableName as keyof typeof exportResult.data] as any[]).length > 0 
                                     ? "הורד נתונים" : "אין נתונים להורדה"}
                            >
                              <i className="fas fa-download me-1"></i>
                              הורד
                            </button>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={6} className="text-center py-5">
                          <div className="text-muted">
                            <i className="fas fa-inbox fa-3x mb-3 opacity-25"></i>
                            <p className="mb-0 fw-medium">אין נתונים להצגה</p>
                          </div>
                        </td>
                      </tr>
                    )
                  }
                </tbody>
              </table>
            </div>
          </div>

          <div className="card-footer bg-light border-0 py-3">
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">
                <i className="fas fa-info-circle me-1"></i>
                {exportResult.message || 'ייצוא הושלם בהצלחה'}
              </small>
              <button 
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  const blob = new Blob([JSON.stringify(exportResult.statistics, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'export-statistics.json';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <i className="fas fa-download me-1"></i>הורד סטטיסטיקות
              </button>
            </div>
          </div>
        </div>
      )}

      {/* פרטי ייבוא */}
      {importResult && (
        <div className="card mt-4 border-0 shadow">
          <div className="card-header bg-success text-white py-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h4 className="mb-1 fw-bold">
                  <i className="fas fa-upload me-2"></i>
                  תוצאות ייבוא נתונים
                </h4>
                <small className="opacity-75">
                  {importResult.importedAt ? new Date(importResult.importedAt).toLocaleString('he-IL') : 'לא זמין'} • 
                  {Object.values(importResult || {}).reduce((sum: number, tableStats: any) => sum + (tableStats?.success || 0) + (tableStats?.updated || 0), 0)} יובאו • 
                  {Object.values(importResult || {}).reduce((sum: number, tableStats: any) => sum + (tableStats?.exist || 0), 0)} קיימים • 
                  {Object.keys(importResult || {}).length} טבלאות
                </small>
              </div>
              <div className="badge bg-light bg-opacity-20 text-white fs-6 px-3 py-2">
                <i className="fas fa-check-circle me-2"></i>הושלם בהצלחה
              </div>
            </div>
          </div>
          
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-dark">
                  <tr>
                    <th className="border-0 fw-bold py-3 px-4" style={{ width: '20%' }}>
                      <i className="fas fa-table me-2 text-primary"></i>שם הטבלה
                    </th>
                    <th className="border-0 fw-bold text-center py-3" style={{ width: '13%' }}>
                      <i className="fas fa-database me-2 text-info"></i>קיימים
                    </th>
                    <th className="border-0 fw-bold text-center py-3" style={{ width: '13%' }}>
                      <i className="fas fa-plus-circle me-2 text-success"></i>נוספו
                    </th>
                    <th className="border-0 fw-bold text-center py-3" style={{ width: '13%' }}>
                      <i className="fas fa-edit me-2 text-primary"></i>עודכנו
                    </th>
                    <th className="border-0 fw-bold text-center py-3" style={{ width: '13%' }}>
                      <i className="fas fa-times-circle me-2 text-danger"></i>נכשלו
                    </th>
                    <th className="border-0 fw-bold text-center py-3" style={{ width: '15%' }}>
                      <i className="fas fa-exclamation-triangle me-2 text-warning"></i>הודעות שגיאה
                    </th>
                    <th className="border-0 fw-bold text-center py-3" style={{ width: '13%' }}>
                      פעולות
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {importResult ? 
                    Object.entries(importResult).map(([tableName, tableStats]) => {
                      const stats = tableStats as { exist: number; success: number; updated: number; failed: number; errors: string[] };
                      const total = stats.exist + stats.success + stats.updated + stats.failed;
                      const hasErrors = stats.errors && stats.errors.length > 0;
                      const cleanTableName = tableName.replace(/[^a-zA-Z0-9]/g, '');
                      
                      return (
                        <tr key={tableName} className="align-middle">
                          <td className="px-4 py-3">
                            <div className="d-flex align-items-center">
                              <div className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${hasErrors ? 'bg-warning bg-opacity-15' : 'bg-success bg-opacity-15'}`} 
                                   style={{ width: '40px', height: '40px' }}>
                                <i className={`fas fa-table ${hasErrors ? 'text-warning' : 'text-success'}`}></i>
                              </div>
                              <div>
                                <div className="fw-semibold text-dark">{tableName}</div>
                                <small className="text-muted">{total} רשומות כולל</small>
                              </div>
                            </div>
                          </td>
                          <td className="text-center py-3">
                            <span className="badge bg-info bg-opacity-15 text-info px-3 py-2 rounded-pill fw-bold">
                              {stats.exist}
                            </span>
                          </td>
                          <td className="text-center py-3">
                            <span className="badge bg-success bg-opacity-15 text-success px-3 py-2 rounded-pill fw-bold">
                              {stats.success}
                            </span>
                          </td>
                          <td className="text-center py-3">
                            <span className="badge bg-primary bg-opacity-15 text-primary px-3 py-2 rounded-pill fw-bold">
                              {stats.updated}
                            </span>
                          </td>
                          <td className="text-center py-3">
                            <span className={`badge px-3 py-2 rounded-pill fw-bold ${stats.failed > 0 ? 'bg-danger bg-opacity-15 text-danger' : 'bg-secondary bg-opacity-15 text-secondary'}`}>
                              {stats.failed}
                            </span>
                          </td>
                          <td className="text-center py-3">
                            {hasErrors ? (
                              <span className="badge bg-danger bg-opacity-15 text-danger px-3 py-2 rounded-pill fw-bold">
                                {stats.errors!.length} שגיאות
                              </span>
                            ) : (
                              <span className="badge bg-secondary bg-opacity-15 text-secondary px-3 py-2 rounded-pill fw-bold">
                                אין שגיאות
                              </span>
                            )}
                          </td>
                          <td className="text-center py-3">
                            {hasErrors && (
                              <button 
                                className="btn btn-outline-warning btn-sm rounded-pill"
                                type="button"
                                data-bs-toggle="modal"
                                data-bs-target={`#errorsModal${cleanTableName}`}
                                title="הצג שגיאות"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={7} className="text-center py-5">
                          <div className="text-muted">
                            <i className="fas fa-inbox fa-3x mb-3 opacity-25"></i>
                            <p className="mb-0 fw-medium">אין נתונים להצגה</p>
                          </div>
                        </td>
                      </tr>
                    )
                  }
                </tbody>
              </table>
            </div>
          </div>

          <div className="card-footer bg-light border-0 py-3">
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">
                <i className="fas fa-info-circle me-1"></i>
                {importResult.message || 'ייבוא הושלם בהצלחה'}
              </small>
              <button 
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  const blob = new Blob([JSON.stringify(importResult, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'import-statistics.json';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <i className="fas fa-download me-1"></i>הורד סטטיסטיקות
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modals */}
      {importResult && Object.entries(importResult).map(([tableName, tableStats]) => {
        const stats = tableStats as { exist: number; success: number; updated: number; failed: number; errors?: string[] };
        const hasErrors = stats.errors && stats.errors.length > 0;
        const cleanTableName = tableName.replace(/[^a-zA-Z0-9]/g, '');
        
        if (!hasErrors) return null;
        
        return (
          <div className="modal fade" id={`errorsModal${cleanTableName}`} key={`modal-${tableName}`} tabIndex={-1}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header bg-warning bg-opacity-10">
                  <h5 className="modal-title">
                    <i className="fas fa-exclamation-triangle text-warning me-2"></i>
                    שגיאות בטבלה: {tableName}
                  </h5>
                  <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-warning border-0 mb-3">
                    <strong>נמצאו {stats.errors!.length} שגיאות בעת ייבוא הטבלה</strong>
                  </div>
                  <div className="list-group list-group-flush" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {stats.errors!.map((error, errorIndex) => (
                      <div key={errorIndex} className="list-group-item border-0 bg-light bg-opacity-50 mb-2 rounded">
                        <div className="d-flex align-items-start">
                          <div className="badge bg-warning text-dark me-3 mt-1">{errorIndex + 1}</div>
                          <div className="flex-grow-1">
                            <div className="text-dark small font-monospace">{error}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-outline-warning"
                    onClick={() => {
                      const blob = new Blob([stats.errors!.join('\n')], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${tableName}-errors.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <i className="fas fa-download me-2"></i>
                    הורד שגיאות
                  </button>
                  <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">סגור</button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <Modal
        isOpen={isConfirmOpen}
        onClose={() => {
          if (!busy) {
            setIsConfirmOpen(false);
            setPendingPayload(null);
            setSelectedFileName('');
            setOverride(false);
          }
        }}
        title="אישור ייבוא נתונים"
        size="sm"
      >
        <div className="mb-3">
          <div className="alert alert-warning d-flex align-items-start">
            <i className="fas fa-exclamation-triangle me-2 mt-1" />
            <div>
              <strong>לפני שממשיכים:</strong>
              <p className="mb-0 mt-2" style={{ whiteSpace: 'pre-line' }}>
                ייבוא לא ישכתב נתונים קיימים כברירת מחדל. ניתן לבחור לשכתב נתונים קיימים באמצעות הסימון הבא.
                {selectedFileName ? `\nקובץ: ${selectedFileName}` : ''}
              </p>
              <p className="mb-0 mt-2 text-warning">
                <strong>שים לב:</strong> ייבוא עלול לקחת זמן רב (מספר דקות) במיוחד עבור קבצים גדולים.
              </p>
            </div>
          </div>

          <div className="form-check mt-2" dir="rtl">
            <input
              className="form-check-input"
              type="checkbox"
              id="overrideExisting"
              checked={override}
              onChange={(e) => setOverride(e.target.checked)}
              disabled={busy}
            />
            <label className="form-check-label" htmlFor="overrideExisting">
              דרוס נתונים קיימים בעת ייבוא (Override)
            </label>
          </div>
        </div>
        <div className="d-flex gap-2 justify-content-start">
          <button className="btn btn-secondary" onClick={() => setIsConfirmOpen(false)} disabled={busy}>
            ביטול
          </button>
          <button className="btn btn-primary" onClick={performImport} disabled={busy}>
            אשר ייבוא
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default BackupRestoreTab;
