import React, { useState, useEffect } from 'react';
import { User, UpdateUserRequest, ranks } from '../../types';
import { useUserProfile, useAuth } from '../../hooks';
import { useManagement } from '../../contexts';
import { sanitizeInput } from '../../utils';
import './SettingsTab.css';

interface SettingsTabProps {
  userProfile: User | null;
  isAdmin: boolean;
}

interface EditingField {
  field: string;
  value: string;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ userProfile, isAdmin }) => {
  const { updateUserProfile } = useUserProfile();
  const { user: firebaseUser } = useAuth();
  const { loadLocations } = useManagement();
  const [editingField, setEditingField] = useState<EditingField | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  // Clear message after 3 seconds
  useEffect(() => {
    if (updateMessage) {
      const timer = setTimeout(() => {
        setUpdateMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [updateMessage]);

  if (!userProfile) {
    return (
      <div className="settings-loading">
        <div className="loading-spinner"></div>
        <p>טוען פרטי משתמש...</p>
      </div>
    );
  }

  const validateField = (field: string, value: string): string => {
    if (field === 'name') {
      return value.trim().length === 0 ? 'שם חובה' : '';
    } else if (field === 'personalNumber') {
      const numberValue = parseInt(value);
      if (isNaN(numberValue)) return 'מספר אישי חייב להיות מספר';
      if (value.length !== 7) return 'מספר אישי חייב להיות 7 ספרות';
      return '';
    } else if (field === 'phoneNumber') {
      const phoneRegex = /^[0-9]{10}$/;
      const cleanPhone = value.replace(/\D/g, '');
      return phoneRegex.test(cleanPhone) ? '' : 'מספר טלפון חייב להיות 10 ספרות';
    }
    return '';
  };

  const handleStartEdit = (field: string, currentValue: string) => {
    setEditingField({ field, value: currentValue });
  };

  const handleCancelEdit = () => {
    setEditingField(null);
  };

  const handleSaveField = async () => {
    if (!editingField) return;

    const { field, value } = editingField;
    
    // Validation
    const error = validateField(field, value);

    if (error) {
      setUpdateMessage({ type: 'error', text: error });
      return;
    }

    setIsUpdating(true);
    setUpdateMessage(null);
    
    try {
      let updates: Partial<UpdateUserRequest> = {};
      
      if (field === 'personalNumber') {
        updates = { personalNumber: parseInt(value) };
      } else {
        updates = { [field]: sanitizeInput(value) };
      }
      
      const success = await updateUserProfile(updates as UpdateUserRequest);
      if (success) {
        setUpdateMessage({ type: 'success', text: 'הפרטים עודכנו בהצלחה!' });
        setEditingField(null);
      } else {
        setUpdateMessage({ type: 'error', text: 'שגיאה בעדכון הפרטים' });
      }
    } catch (error) {
      setUpdateMessage({ type: 'error', text: 'שגיאה בעדכון הפרטים' });
    } finally {
      setIsUpdating(false);
    }
  };

  const renderEditableField = (
    label: string,
    field: string,
    value: string,
    type: 'text' | 'select' = 'text',
    options?: { value: string; label: string }[]
  ) => {
    const isEditing = editingField?.field === field;
    
    return (
      <div className="settings-field">
        <label className="field-label">{label}</label>
        {isEditing ? (
          <div className="field-edit-container">
            {type === 'select' ? (
              <select
                className="field-input"
                value={editingField.value}
                onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                disabled={isUpdating}
              >
                {options?.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={type}
                className="field-input"
                value={editingField.value}
                onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                disabled={isUpdating}
                autoFocus
              />
            )}
            <div className="field-actions">
              <button
                className="btn btn-sm btn-primary"
                onClick={handleSaveField}
                disabled={isUpdating}
              >
                {isUpdating ? 'שומר...' : 'שמור'}
              </button>
              <button
                className="btn btn-sm btn-ghost"
                onClick={handleCancelEdit}
                disabled={isUpdating}
              >
                ביטול
              </button>
            </div>
          </div>
        ) : (
          <div className="field-display">
            <span className="field-value">{value}</span>
            <button
              className="btn btn-sm btn-ghost field-edit-btn"
              onClick={() => handleStartEdit(field, value)}
              title={`עריכת ${label}`}
            >
              עריכה
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="settings-tab">
      <div className="settings-header">
        <h1 className="settings-title">הגדרות חשבון</h1>
      </div>

      {updateMessage && (
        <div className={`settings-alert ${updateMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {updateMessage.text}
        </div>
      )}

      <div className="settings-section">
        <h2 className="section-title">מידע אישי</h2>
        <div className="settings-form">
          {renderEditableField('שם מלא', 'name', userProfile.name)}
          {renderEditableField('מספר אישי', 'personalNumber', userProfile.personalNumber.toString())}
        </div>
      </div>

      <div className="settings-section">
        <h2 className="section-title">פרטי התקשרות</h2>
        <div className="settings-form">
          <div className="settings-field">
            <label className="field-label">כתובת אימייל</label>
            <div className="field-display">
              <span className="field-value">{firebaseUser?.email || 'לא זמין'}</span>
            </div>
          </div>
          {renderEditableField('מספר טלפון', 'phoneNumber', userProfile.phoneNumber)}
        </div>
      </div>

      <div className="settings-section">
        <h2 className="section-title">פרטי תפקיד</h2>
        <div className="settings-form">
          {renderEditableField('דרגה', 'rank', userProfile.rank, 'select', ranks.map((rank: string) => ({ value: rank, label: rank })))}
          
          <div className="settings-field">
            <label className="field-label">מיקום</label>
            <div className="field-display">
              <span className="field-value">{userProfile.location}</span>
            </div>
          </div>

          <div className="settings-field">
            <label className="field-label">יחידה</label>
            <div className="field-display">
              <span className="field-value">{userProfile.unit}</span>
            </div>
          </div>

          <div className="settings-field">
            <label className="field-label">סוג משתמש</label>
            <div className="field-display">
              <span className="field-value role-badge" data-role={userProfile.isAdmin ? 'admin' : 'user'}>
                {userProfile.isAdmin ? 'מנהל מערכת' : 'משתמש רגיל'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
