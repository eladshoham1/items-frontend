import React, { useState, useEffect } from 'react';
import { User, UpdateUserRequest } from '../../types';
import { useUserProfile } from '../../hooks';
import { Modal } from '../../shared/components';
import { UserProfileForm } from './';
import './SettingsTab.css';

interface SettingsTabProps {
  userProfile: User | null;
  isAdmin: boolean;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ userProfile, isAdmin }) => {
  const { updateUserProfile } = useUserProfile();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Clear message after 5 seconds
  useEffect(() => {
    if (updateMessage) {
      const timer = setTimeout(() => {
        setUpdateMessage(null);
      }, 5000);
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

  const handleUpdateProfile = async (updates: UpdateUserRequest): Promise<boolean> => {
    setIsUpdating(true);
    setUpdateMessage(null);
    
    try {
      const success = await updateUserProfile(updates);
      if (success) {
        setUpdateMessage({ type: 'success', text: 'הפרטים עודכנו בהצלחה!' });
        setIsEditModalOpen(false);
        return true;
      } else {
        setUpdateMessage({ type: 'error', text: 'שגיאה בעדכון הפרטים' });
        return false;
      }
    } catch (error) {
      setUpdateMessage({ type: 'error', text: 'שגיאה בעדכון הפרטים' });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="settings-tab">
      <div className="settings-header">
        <h1 className="settings-title">
          <span className="settings-icon">🔧</span>
          הגדרות אישיות
        </h1>
        <p className="settings-subtitle">נהל את הפרטים האישיים שלך</p>
      </div>
      
      {updateMessage && (
        <div className={`alert ${updateMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {updateMessage.text}
        </div>
      )}
      
      <div className="profile-card">
        <div className="profile-card-header">
          <div className="profile-avatar">
            <span className="avatar-icon">👤</span>
          </div>
          <div className="profile-header-info">
            <h2 className="profile-name">{userProfile.name}</h2>
            <span className="profile-role-badge" data-role={userProfile.isAdmin ? 'admin' : 'user'}>
              {userProfile.isAdmin ? '👑 מנהל' : '👤 משתמש'}
            </span>
          </div>
          <button
            className="edit-profile-btn"
            onClick={() => setIsEditModalOpen(true)}
            title="עדכן פרטים"
          >
            <span className="edit-icon">✏️</span>
            עדכן פרטים
          </button>
        </div>

        <div className="profile-details">
          <div className="details-grid">
            <div className="detail-item">
              <div className="detail-icon">🆔</div>
              <div className="detail-content">
                <label className="detail-label">מספר אישי</label>
                <span className="detail-value">{userProfile.personalNumber}</span>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">📱</div>
              <div className="detail-content">
                <label className="detail-label">מספר טלפון</label>
                <span className="detail-value">{userProfile.phoneNumber}</span>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">🎖️</div>
              <div className="detail-content">
                <label className="detail-label">דרגה</label>
                <span className="detail-value">{userProfile.rank}</span>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">📍</div>
              <div className="detail-content">
                <label className="detail-label">מיקום</label>
                <span className="detail-value">{userProfile.location}</span>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">🏢</div>
              <div className="detail-content">
                <label className="detail-label">יחידה</label>
                <span className="detail-value">{userProfile.unit}</span>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">📅</div>
              <div className="detail-content">
                <label className="detail-label">תאריך הצטרפות</label>
                <span className="detail-value">
                  {new Date(userProfile.createdAt).toLocaleDateString('he-IL')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="עדכון פרטים אישיים"
      >
        <UserProfileForm
          userProfile={userProfile}
          onUpdate={handleUpdateProfile}
          onCancel={() => setIsEditModalOpen(false)}
          isUpdating={isUpdating}
          showRoleField={false} // Users cannot change their role
        />
      </Modal>
    </div>
  );
};

export default SettingsTab;
