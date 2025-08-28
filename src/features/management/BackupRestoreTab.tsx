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
      
      if (!resp.success) {
        setBusy(false);
        setError(resp.error || 'שגיאה בייצוא');
        return;
      }
      
      setExportResult(resp.data);
      
      const blob = new Blob([
        JSON.stringify(resp.data.data, null, 2)
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

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      openConfirmImport(file);
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
      setIsConfirmOpen(false);
      
      setSuccess('ייבוא החל - אנא המתן, פעולה זו עלולה לקחת זמן רב...');
      
      const resp = await managementService.importDatabase(pendingPayload, override);
      
      if (!resp.success) {
        setBusy(false);
        setError(resp.error || 'שגיאה בייבוא');
        setSuccess(null);
        return;
      }
      
      setImportResult(resp.data);
      setSuccess('ייבוא הושלם בהצלחה');
      setBusy(false);
      
      await loadAllData();
      
    } catch (e: any) {
      setBusy(false);
      setError(e?.message || 'שגיאה בייבוא');
      setSuccess(null);
    } finally {
      setPendingPayload(null);
      setSelectedFileName('');
      setOverride(false);
    }
  };

  return (
    <>
      {/* Compact Header with Actions */}
      <div className="management-header-compact">
        <div className="management-search-section">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px',
            color: 'var(--color-text-secondary)',
            fontSize: '14px'
          }}>
            <i className="fas fa-database" style={{ fontSize: '16px' }}></i>
            <span>גיבוי ושחזור מסד נתונים</span>
          </div>
        </div>
        
        <div className="management-actions-compact">
          <button 
            className="btn btn-primary btn-sm"
            onClick={handleExport} 
            disabled={busy}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '0 16px'
            }}
          >
            <i className="fas fa-download" style={{ fontSize: '13px' }}></i>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>ייצוא</span>
          </button>
          
          <label 
            className="btn btn-secondary btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '0 16px',
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.6 : 1,
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!busy) {
                e.currentTarget.style.background = 'var(--color-bg-hover)';
                e.currentTarget.style.borderColor = 'var(--color-border-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (!busy) {
                e.currentTarget.style.background = 'var(--color-surface)';
                e.currentTarget.style.borderColor = 'var(--color-border)';
              }
            }}
          >
            <i className="fas fa-upload" style={{ fontSize: '13px' }}></i>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>ייבוא</span>
            <input 
              type="file" 
              accept="application/json,.json" 
              onChange={onFileChange} 
              style={{ display: 'none' }} 
              disabled={busy} 
            />
          </label>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div style={{ 
          padding: '12px 16px',
          margin: '16px 0',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '8px',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <i className="fas fa-exclamation-triangle"></i>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ 
          padding: '12px 16px',
          margin: '16px 0',
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          borderRadius: '8px',
          color: '#22c55e',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <i className="fas fa-check-circle"></i>
          <span>{success}</span>
        </div>
      )}

      {busy && (
        <div style={{ 
          padding: '16px',
          margin: '16px 0',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: 'var(--color-text-secondary)'
        }}>
          <div className="saving-spinner"></div>
          <span>
            {importResult ? 'מבצע פעולה...' : success?.includes('ייבוא החל') ? 'מבצע ייבוא - פעולה זו עלולה לקחת מספר דקות...' : 'מבצע פעולה...'}
          </span>
        </div>
      )}

      {/* Export Results */}
      {exportResult && (
        <div style={{ 
          margin: '20px 0',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <div style={{ 
            padding: '16px 20px',
            background: 'rgba(34, 197, 94, 0.15)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-download" style={{ color: '#22c55e', fontSize: '16px' }}></i>
              <span style={{ color: 'var(--color-text)', fontWeight: '600', fontSize: '14px' }}>ייצוא הושלם</span>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                {exportResult.statistics?.summary?.totalRecords || 0} רשומות • {exportResult.statistics?.summary?.totalTables || 0} טבלאות
              </span>
            </div>
            <div style={{ 
              background: 'rgba(34, 197, 94, 0.2)',
              color: '#22c55e',
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              <i className="fas fa-check-circle" style={{ marginLeft: '4px' }}></i>
              הצלחה
            </div>
          </div>
          
          <div style={{ padding: '16px 20px', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-info-circle" style={{ color: 'var(--color-text-muted)' }}></i>
              <span>הנתונים יוצאו בהצלחה והורדו כקובץ JSON</span>
            </div>
          </div>
        </div>
      )}

      {/* Import Results */}
      {importResult && (
        <div style={{ 
          margin: '20px 0',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <div style={{ 
            padding: '16px 20px',
            background: 'rgba(59, 130, 246, 0.15)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-upload" style={{ color: '#3b82f6', fontSize: '16px' }}></i>
              <span style={{ color: 'var(--color-text)', fontWeight: '600', fontSize: '14px' }}>ייבוא הושלם</span>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                {Object.values(importResult || {}).reduce((sum: number, tableStats: any) => sum + (tableStats?.success || 0), 0)} יובאו • 
                {Object.keys(importResult || {}).length} טבלאות
              </span>
            </div>
            <div style={{ 
              background: 'rgba(59, 130, 246, 0.2)',
              color: '#3b82f6',
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              <i className="fas fa-check-circle" style={{ marginLeft: '4px' }}></i>
              הצלחה
            </div>
          </div>
          
          <div style={{ padding: '16px 20px', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-info-circle" style={{ color: 'var(--color-text-muted)' }}></i>
              <span>הנתונים יובאו בהצלחה למסד הנתונים</span>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
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
        size="md"
      >
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ 
              padding: '12px 16px',
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.2)',
              borderRadius: '8px',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px'
            }}>
              <i className="fas fa-exclamation-triangle" style={{ marginTop: '2px' }}></i>
              <div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>אזהרה</div>
                <div style={{ fontSize: '13px' }}>
                  פעולת ייבוא עלולה לשנות נתונים קיימים במערכת.
                  {selectedFileName && (
                    <div style={{ marginTop: '8px' }}>
                      <strong>קובץ:</strong> {selectedFileName}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              <input
                type="checkbox"
                checked={override}
                onChange={(e) => setOverride(e.target.checked)}
                disabled={busy}
              />
              <span>החלף נתונים קיימים (אם רלוונטי)</span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => setIsConfirmOpen(false)} 
              disabled={busy}
            >
              ביטול
            </button>
            <button 
              className="btn btn-primary" 
              onClick={performImport} 
              disabled={busy}
            >
              {busy ? 'מבצע ייבוא...' : 'אשר ייבוא'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default BackupRestoreTab;
