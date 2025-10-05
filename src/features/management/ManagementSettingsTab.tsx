import React, { useState, useEffect } from 'react';
import { managementService } from '../../services/management.service';
import { LoadingSpinner } from '../../shared/components';
import './ManagementSettingsTab.css';

interface ManagementSettings {
  emailNotificationsEnabled: boolean;
}

interface NotificationSettings {
  enabled: boolean;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
}

const ManagementSettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<ManagementSettings>({ 
    emailNotificationsEnabled: false 
  });
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    enabled: false,
    dayOfWeek: 0 // Default to Sunday
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
      
      // Load both general settings and notification settings
      const [settingsResult, notificationResult] = await Promise.all([
        managementService.getSettings(),
        managementService.getNotificationSettings()
      ]);
      
      if (settingsResult.success && settingsResult.data) {
        setSettings(settingsResult.data);
      } else {
        setError(settingsResult.error || 'שגיאה בטעינת הגדרות');
      }

      if (notificationResult.success && notificationResult.data) {
        setNotificationSettings(notificationResult.data);
      } else {
        console.warn('Failed to load notification settings:', notificationResult.error);
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

      // Update both general settings and notification settings
      const [settingsResult, notificationResult] = await Promise.all([
        managementService.updateSettings(settings),
        managementService.updateNotificationSettings(notificationSettings)
      ]);

      if (settingsResult.success && settingsResult.data && notificationResult.success && notificationResult.data) {
        setSettings(settingsResult.data);
        setNotificationSettings(notificationResult.data);
        setSuccessMessage('הגדרות נשמרו בהצלחה');
        // Immediately refetch to ensure view mirrors server state
        await loadSettings();
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(settingsResult.error || notificationResult.error || 'שגיאה בשמירת הגדרות');
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

  const handleNotificationToggle = () => {
    setNotificationSettings({ ...notificationSettings, enabled: !notificationSettings.enabled });
  };

  const handleDayChange = (dayOfWeek: number) => {
    setNotificationSettings({ ...notificationSettings, dayOfWeek });
  };

  // Day names in Hebrew (Sunday to Saturday)
  const dayNames = [
    'ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'
  ];

  if (loading) {
    return (
      <LoadingSpinner message="טוען הגדרות..." />
    );
  }

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
            <i className="fas fa-cog" style={{ fontSize: '16px' }}></i>
            <span>הגדרות ניהול</span>
          </div>
        </div>
        
        <div className="management-actions-compact">
          <button
            className="btn btn-primary btn-sm"
            onClick={handleUpdateSettings}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '0 16px'
            }}
          >
            {saving ? (
              <div className="saving-spinner" style={{ width: '13px', height: '13px' }}></div>
            ) : (
              <i className="fas fa-save" style={{ fontSize: '13px' }}></i>
            )}
            <span style={{ fontSize: '13px', fontWeight: '600' }}>
              {saving ? 'שומר...' : 'שמור'}
            </span>
          </button>
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

      {successMessage && (
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
          <span>{successMessage}</span>
        </div>
      )}

      {/* Settings Content */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        padding: '0',
        overflow: 'hidden'
      }}>
        {/* Settings Section */}
        <div style={{
          padding: '24px 28px',
          borderBottom: '1px solid var(--color-border)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '6px'
              }}>
                <i className="fas fa-envelope" style={{ 
                  color: 'var(--color-text-secondary)', 
                  fontSize: '18px' 
                }}></i>
                <span style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'var(--color-text)'
                }}>
                  התראות במייל
                </span>
              </div>
              <p style={{
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                margin: '0',
                paddingRight: '30px'
              }}>
                קבל התראות על פעילויות חשובות במערכת
              </p>
            </div>

            {/* Modern Toggle Switch */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                fontSize: '13px',
                fontWeight: '500',
                color: settings.emailNotificationsEnabled ? '#22c55e' : 'var(--color-text-muted)'
              }}>
                {settings.emailNotificationsEnabled ? 'פעיל' : 'כבוי'}
              </span>
              
              <button
                onClick={handleToggleSwitch}
                disabled={saving}
                style={{
                  position: 'relative',
                  width: '48px',
                  height: '24px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  background: settings.emailNotificationsEnabled 
                    ? 'linear-gradient(45deg, #22c55e, #16a34a)' 
                    : 'var(--color-surface-alt)',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  opacity: saving ? 0.6 : 1
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  left: settings.emailNotificationsEnabled ? '26px' : '2px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                }} />
              </button>
            </div>
          </div>
        </div>

        {/* Notification Schedule Settings Section */}
        <div style={{
          padding: '24px 28px',
          borderBottom: '1px solid var(--color-border)'
        }}>
          {/* Header with title and toggle - responsive layout */}
          <div style={{
            display: 'flex',
            flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
            alignItems: window.innerWidth <= 768 ? 'flex-start' : 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '6px'
              }}>
                <i className="fas fa-calendar-alt" style={{ 
                  color: 'var(--color-text-secondary)', 
                  fontSize: '18px' 
                }}></i>
                <span style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'var(--color-text)'
                }}>
                  תזמון התראות שבועיות
                </span>
              </div>
              <p style={{
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                margin: '0 0 8px 0',
                paddingRight: window.innerWidth <= 768 ? '0' : '30px'
              }}>
                בחר את היום בשבוע בו כל המשתמשים יקבלו התראת מייל
              </p>
            </div>

            {/* Toggle Switch - responsive positioning */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              alignSelf: window.innerWidth <= 768 ? 'flex-start' : 'flex-start',
              marginTop: window.innerWidth <= 768 ? '0' : '4px'
            }}>
              <span style={{
                fontSize: '13px',
                fontWeight: '500',
                color: notificationSettings.enabled ? '#22c55e' : 'var(--color-text-muted)'
              }}>
                {notificationSettings.enabled ? 'פעיל' : 'כבוי'}
              </span>
              
              <button
                onClick={handleNotificationToggle}
                disabled={saving}
                style={{
                  position: 'relative',
                  width: '48px',
                  height: '24px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  background: notificationSettings.enabled 
                    ? 'linear-gradient(45deg, #22c55e, #16a34a)' 
                    : 'var(--color-surface-alt)',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  opacity: saving ? 0.6 : 1
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  left: notificationSettings.enabled ? '26px' : '2px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                }} />
              </button>
            </div>
          </div>

          {/* Day Selection - responsive grid */}
          <div style={{ 
            paddingRight: window.innerWidth <= 768 ? '0' : '30px',
            marginTop: '16px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: window.innerWidth <= 480 
                ? 'repeat(2, 1fr)' 
                : window.innerWidth <= 768 
                ? 'repeat(3, 1fr)' 
                : 'repeat(auto-fit, minmax(100px, 1fr))',
              gap: '8px'
            }}>
              {dayNames.map((dayName, index) => (
                <button
                  key={index}
                  onClick={() => handleDayChange(index)}
                  disabled={saving || !notificationSettings.enabled}
                  style={{
                    padding: window.innerWidth <= 480 ? '10px 8px' : '8px 12px',
                    border: '2px solid',
                    borderColor: notificationSettings.dayOfWeek === index 
                      ? '#3b82f6' 
                      : 'var(--color-border)',
                    borderRadius: '8px',
                    background: notificationSettings.dayOfWeek === index 
                      ? '#3b82f6' 
                      : 'var(--color-surface)',
                    color: notificationSettings.dayOfWeek === index 
                      ? '#ffffff' 
                      : 'var(--color-text)',
                    fontSize: window.innerWidth <= 480 ? '12px' : '13px',
                    fontWeight: '500',
                    cursor: (saving || !notificationSettings.enabled) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: !notificationSettings.enabled ? 0.5 : 1,
                    minHeight: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {dayName}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Settings Section (placeholder for future settings) */}
        <div style={{
          padding: '20px 28px',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          fontSize: '14px'
        }}>
          <i className="fas fa-plus-circle" style={{ 
            marginLeft: '8px', 
            fontSize: '16px',
            opacity: 0.6 
          }}></i>
          הגדרות נוספות יתווספו בעתיד
        </div>
      </div>
    </>
  );
};

export default ManagementSettingsTab;
