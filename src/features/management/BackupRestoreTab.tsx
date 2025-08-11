import React, { useEffect, useRef, useState } from 'react';
import { managementService } from '../../services/management.service';
import { Modal } from '../../shared/components';
import { useManagement } from '../../contexts';

const POLL_INTERVAL_MS = 800; // poll every 0.8s

// Map server status to Hebrew and badge style
const statusToHebrew = (s?: string) => {
  switch (s) {
    case 'pending':
      return 'ממתין';
    case 'running':
      return 'בתהליך';
    case 'completed':
      return 'הושלם';
    case 'failed':
      return 'נכשל';
    default:
      return s || '';
  }
};
const statusBadgeClass = (s?: string) => {
  switch (s) {
    case 'completed':
      return 'badge rounded-pill bg-success';
    case 'running':
      return 'badge rounded-pill bg-info text-dark';
    case 'pending':
      return 'badge rounded-pill bg-secondary';
    case 'failed':
      return 'badge rounded-pill bg-danger';
    default:
      return 'badge rounded-pill bg-light text-dark';
  }
};

const BackupRestoreTab: React.FC = () => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<any | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [override, setOverride] = useState<boolean>(false);

  // Progress state
  const [progress, setProgress] = useState<number>(0);
  const [processId, setProcessId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'import' | 'export' | null>(null);
  const pollRef = useRef<number | null>(null);

  const { loadAllData } = useManagement();

  // New state for export and import details
  const [exportDetails, setExportDetails] = useState<{ tables?: any[]; totalStatistics?: any; message?: string; status?: string; result?: any } | null>(null);
  const [importDetails, setImportDetails] = useState<{ tables?: any[]; totalStatistics?: any; message?: string; status?: string } | null>(null);

  useEffect(() => {
    return () => {
      // cleanup polling on unmount
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
      }
    };
  }, []);

  const startPolling = (type: 'import' | 'export', id: string) => {
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = window.setInterval(async () => {
      try {
        const status = type === 'import'
          ? await managementService.getImportStatus(id)
          : await managementService.getExportStatus(id);
        if (status.success && status.data) {
          const pct = Math.max(0, Math.min(100, Math.round(status.data.progress)));
          setProgress(pct);

          if (type === 'export') {
            const next = (status as any).data || {};
            setExportDetails(prev => ({
              tables: next.tables && next.tables.length ? next.tables : (prev?.tables || []),
              totalStatistics: next.totalStatistics ?? prev?.totalStatistics,
              message: next.message ?? prev?.message,
              status: next.status ?? prev?.status,
              result: next.result ?? prev?.result,
            }));
          } else {
            const next = (status as any).data || {};
            setImportDetails(prev => ({
              tables: next.tables && next.tables.length ? next.tables : (prev?.tables || []),
              totalStatistics: next.totalStatistics ?? prev?.totalStatistics,
              message: next.message ?? prev?.message,
              status: next.status ?? prev?.status,
            }));
          }

          // When export is done and a downloadUrl or inline data is available
          if (type === 'export' && ((status as any).data?.done || pct === 100)) {
            const url = (status as any).data?.downloadUrl as string | undefined;
            const result = (status as any).data?.result as any | undefined;
            if (url) {
              const a = document.createElement('a');
              a.href = url;
              a.download = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              setSuccess('ייצוא הושלם והקובץ הורד בהצלחה');
            } else if (result) {
              // Download the full result JSON (including metadata like compressed/version/size/data)
              const blob = new Blob([
                JSON.stringify(result, null, 2)
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
            }
          }

          if ((status as any).data?.done || pct === 100) {
            stopPolling();
            if (type === 'import') {
              await loadAllData();
              setSuccess('ייבוא הושלם בהצלחה.');
            }
            setBusy(false);
            setProcessId(null);
            setActiveType(null);
          }
        }
      } catch (e: any) {
        // stop polling on errors and surface message
        stopPolling();
        setBusy(false);
        setProcessId(null);
        setActiveType(null);
        setError(e?.message || 'שגיאה בעדכון התקדמות התהליך');
      }
    }, POLL_INTERVAL_MS);
  };

  const stopPolling = () => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const handleExport = async () => {
    try {
      setBusy(true);
      setError(null);
      setSuccess(null);
      setProgress(0);
      setExportDetails(null);
      setImportDetails(null);
      setActiveType('export');
      const resp = await managementService.startExport();
      if (!resp.success || !resp.data) {
        setBusy(false);
        setError(resp.error || 'שגיאה בתחילת ייצוא');
        setActiveType(null);
        return;
      }
      const id = resp.data.id;
      setProcessId(id);
      startPolling('export', id);
    } catch (e: any) {
      setBusy(false);
      setActiveType(null);
      setError(e?.message || 'שגיאה בתחילת ייצוא');
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
      setProgress(0);
      setImportDetails(null);
      setExportDetails(null);
      setActiveType('import');
      const resp = await managementService.startImport(pendingPayload, override);
      if (!resp.success || !resp.data) {
        setBusy(false);
        setError(resp.error || 'שגיאה בתחילת ייבוא');
        setActiveType(null);
        return;
      }
      const id = resp.data.id;
      setProcessId(id);
      setIsConfirmOpen(false); // close modal once started
      startPolling('import', id);
    } catch (e: any) {
      setBusy(false);
      setActiveType(null);
      setError(e?.message || 'שגיאה בתחילת ייבוא');
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

      {busy && !processId && (
        <div className="saving-indicator" style={{ marginTop: 16 }}>
          <div className="saving-spinner"></div>
          <span style={{ marginRight: 8 }}>מבצע פעולה...</span>
        </div>
      )}

      {/* פרטי ייצוא */}
      {(activeType === 'export' || exportDetails) ? (
        <div className="card mt-3">
          <div className="card-header d-flex align-items-center justify-content-between">
            <div>פרטי ייצוא</div>
            <div className="d-flex align-items-center gap-2">
              {exportDetails?.status && (
                <span className={statusBadgeClass(exportDetails.status)}>{statusToHebrew(exportDetails.status)}</span>
              )}
              <small className="text-muted">התקדמות: {progress}%</small>
            </div>
          </div>
          <div className="card-body">
            {exportDetails?.message && (
              <div className="mb-2 text-muted">{exportDetails.message}</div>
            )}
            <div className="table-responsive">
              <table className="table table-sm table-striped table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>טבלה</th>
                    <th className="text-end">סה"כ</th>
                    <th className="text-end">הצליחו</th>
                    <th className="text-end">קיימים</th>
                    <th className="text-end">נכשלו</th>
                    <th className="text-end">אחוז</th>
                    <th>סטטוס</th>
                  </tr>
                </thead>
                <tbody>
                  {(exportDetails?.tables?.length ? exportDetails.tables : []).map((t: any) => (
                    <tr key={t.tableName}>
                      <td>{t.tableName}</td>
                      <td className="text-end">{t.total}</td>
                      <td className="text-end">{t.success}</td>
                      <td className="text-end">{t.existing}</td>
                      <td className="text-end">{t.failed}</td>
                      <td className="text-end">{t.percentage}%</td>
                      <td>
                        <span className={statusBadgeClass(t.status)}>{statusToHebrew(t.status)}</span>
                      </td>
                    </tr>
                  ))}
                  {(!exportDetails || !exportDetails.tables || exportDetails.tables.length === 0) && (
                    <tr>
                      <td colSpan={7} className="text-center text-muted py-4">
                        <div className="spinner-border spinner-border-sm me-2" role="status" />
                        מכין טבלאות... (התקדמות {progress}%)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {exportDetails?.totalStatistics && (
              <div className="row g-3 mt-2 text-muted">
                <div className="col-auto">רשומות בכלל: <strong>{exportDetails.totalStatistics.totalRecords}</strong></div>
                <div className="col-auto">הצליחו: <strong>{exportDetails.totalStatistics.totalSuccess}</strong></div>
                <div className="col-auto">קיימים: <strong>{exportDetails.totalStatistics.totalExisting}</strong></div>
                <div className="col-auto">נכשלו: <strong>{exportDetails.totalStatistics.totalFailed}</strong></div>
                <div className="col-auto">אחוז כולל: <strong>{exportDetails.totalStatistics.overallPercentage}%</strong></div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* פרטי ייבוא */}
      {(activeType === 'import' || importDetails) ? (
        <div className="card mt-3">
          <div className="card-header d-flex align-items-center justify-content-between">
            <div>פרטי ייבוא</div>
            <div className="d-flex align-items-center gap-2">
              {importDetails?.status && (
                <span className={statusBadgeClass(importDetails.status)}>{statusToHebrew(importDetails.status)}</span>
              )}
              <small className="text-muted">התקדמות: {progress}%</small>
            </div>
          </div>
          <div className="card-body">
            {importDetails?.message && (
              <div className="mb-2 text-muted">{importDetails.message}</div>
            )}
            <div className="table-responsive">
              <table className="table table-sm table-striped table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>טבלה</th>
                    <th className="text-end">סה"כ</th>
                    <th className="text-end">הצליחו</th>
                    <th className="text-end">קיימים</th>
                    <th className="text-end">נכשלו</th>
                    <th className="text-end">אחוז</th>
                    <th>סטטוס</th>
                  </tr>
                </thead>
                <tbody>
                  {(importDetails?.tables?.length ? importDetails.tables : []).map((t: any) => (
                    <tr key={t.tableName}>
                      <td>{t.tableName}</td>
                      <td className="text-end">{t.total}</td>
                      <td className="text-end">{t.success}</td>
                      <td className="text-end">{t.existing}</td>
                      <td className="text-end">{t.failed}</td>
                      <td className="text-end">{t.percentage}%</td>
                      <td>
                        <span className={statusBadgeClass(t.status)}>{statusToHebrew(t.status)}</span>
                      </td>
                    </tr>
                  ))}
                  {(!importDetails || !importDetails.tables || importDetails.tables.length === 0) && (
                    <tr>
                      <td colSpan={7} className="text-center text-muted py-4">
                        <div className="spinner-border spinner-border-sm me-2" role="status" />
                        מכין טבלאות... (התקדמות {progress}%)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {importDetails?.totalStatistics && (
              <div className="row g-3 mt-2 text-muted">
                <div className="col-auto">רשומות בכלל: <strong>{importDetails.totalStatistics.totalRecords}</strong></div>
                <div className="col-auto">הצליחו: <strong>{importDetails.totalStatistics.totalSuccess}</strong></div>
                <div className="col-auto">קיימים: <strong>{importDetails.totalStatistics.totalExisting}</strong></div>
                <div className="col-auto">נכשלו: <strong>{importDetails.totalStatistics.totalFailed}</strong></div>
                <div className="col-auto">אחוז כולל: <strong>{importDetails.totalStatistics.overallPercentage}%</strong></div>
              </div>
            )}
          </div>
        </div>
      ) : null}

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
