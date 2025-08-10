import React, { useState } from 'react';
import { managementService } from '../../services/management.service';
import { Modal } from '../../shared/components';

const BackupRestoreTab: React.FC = () => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<any | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');

  const handleExport = async () => {
    try {
      setBusy(true);
      setError(null);
      setSuccess(null);
      const result = await managementService.exportDatabase();
      if (!result.success || !result.data) {
        setError(result.error || 'שגיאה בייצוא נתונים');
        return;
      }
      const json = JSON.stringify(result.data, null, 2);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.href = url;
      a.download = `backup-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess('ייצוא הושלם והקובץ הורד בהצלחה');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e?.message || 'שגיאה בייצוא נתונים');
    } finally {
      setBusy(false);
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
      const result = await managementService.importDatabase(pendingPayload);
      if (result.success) {
        setSuccess('ייבוא הושלם בהצלחה. נתונים קיימים נשארו ללא שינוי.');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'שגיאה בייבוא נתונים');
      }
    } catch (e: any) {
      setError(e?.message || 'שגיאה בייבוא נתונים');
    } finally {
      setBusy(false);
      setIsConfirmOpen(false);
      setPendingPayload(null);
      setSelectedFileName('');
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
          <span style={{ marginRight: 8 }}>מבצע פעולה...</span>
        </div>
      )}

      <Modal
        isOpen={isConfirmOpen}
        onClose={() => {
          if (!busy) {
            setIsConfirmOpen(false);
            setPendingPayload(null);
            setSelectedFileName('');
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
                ייבוא לא ישכתב נתונים קיימים. רשומות קיימות יישארו ללא שינוי.
                {selectedFileName ? `\nקובץ: ${selectedFileName}` : ''}
              </p>
            </div>
          </div>
        </div>
        <div className="d-flex gap-2 justify-content-start">
          <button className="btn btn-secondary" onClick={() => setIsConfirmOpen(false)} disabled={busy}>
            ביטול
          </button>
          <button className="btn btn-primary" onClick={performImport} disabled={busy}>
            {busy ? 'מייבא...' : 'אשר ייבוא'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default BackupRestoreTab;
