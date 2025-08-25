import React, { useState, useEffect } from 'react';
import { managementService } from '../../services/management.service';
import './ManagementSettingsTab.css';

interface ManagementSettings {
  emailNotificationsEnabled: boolean;
}

const ManagementSettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<ManagementSettings>({ 
    emailNotificationsEnabled: false 
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await managementService.getSettings();
      
      if (result.success && result.data) {
        setSettings(result.data);
      } else {
        setError(result.error || 'שגיאה בטעינת הגדרות');
      }
    } catch (err) {
      setError('שגיאה בטעינת הגדרות');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const result = await managementService.updateSettings(settings);

      if (result.success && result.data) {
        setSettings(result.data);
        setSuccessMessage('הגדרות נשמרו בהצלחה');
        // Immediately refetch to ensure view mirrors server state
        await loadSettings();
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.error || 'שגיאה בשמירת הגדרות');
      }
    } catch (err) {
      setError('שגיאה בשמירת הגדרות');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSwitch = () => {
    setSettings({ ...settings, emailNotificationsEnabled: !settings.emailNotificationsEnabled });
  };

  if (loading) {
    return (
      <div className="management-container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading-spinner"></div>
          <p>טוען הגדרות...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="management-container">
      <div className="management-actions" style={{ marginBottom: '20px' }}>
        <button
          className="btn btn-primary"
          onClick={handleUpdateSettings}
          disabled={saving}
        >
          עדכן
        </button>
        <button
          className="btn btn-ghost"
          onClick={loadSettings}
          disabled={loading}
        >
          רענן
        </button>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {successMessage && (
        <div className="success-message">
          <span className="success-icon">✅</span>
          {successMessage}
        </div>
      )}

      <div className="management-content">
        <div className="settings-section">
          <h3>התראות במייל</h3>
          <p className="section-description">קבל התראות על פעילויות חשובות במערכת</p>
          
          <div className="toggle-container">
            <div className="toggle-wrapper">
              <span className="toggle-label">התראות במייל</span>
              <button
                className={`toggle-switch ${settings.emailNotificationsEnabled ? 'active' : ''}`}
                onClick={handleToggleSwitch}
                disabled={saving}
                aria-label={`${settings.emailNotificationsEnabled ? 'השבת' : 'הפעל'} התראות במייל`}
              >
                <span className="toggle-slider"></span>
              </button>
            </div>
            <p className={`toggle-status ${settings.emailNotificationsEnabled ? 'active' : 'inactive'}`}>
              {settings.emailNotificationsEnabled ? 'פעיל' : 'כבוי'}
            </p>
          </div>
        </div>
      </div>

      {saving && (
        <div className="saving-indicator">
          <div className="saving-spinner"></div>
          <span>שומר הגדרות...</span>
        </div>
      )}
    </div>
  );
};

export default ManagementSettingsTab;
