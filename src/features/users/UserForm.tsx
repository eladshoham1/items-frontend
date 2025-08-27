import React, { useEffect, useState } from 'react';
import { User, CreateUserRequest, UpdateUserRequest, ranks } from '../../types';
import { useUsers } from '../../hooks';
import { useManagement } from '../../contexts';
import { validateRequired, validatePhoneNumber, validatePersonalNumber, sanitizeInput } from '../../utils';
import { ConflictErrorModal, NotificationModal } from '../../shared/components';
import type { NotificationType } from '../../shared/components/NotificationModal';

interface UserFormProps {
  user: User | null;
  isAdmin?: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormErrors {
  name?: string;
  personalNumber?: string;
  phoneNumber?: string;
  locationId?: string;
  rank?: string;
  isAdmin?: string;
}

interface FormData extends CreateUserRequest {
  isAdmin?: boolean;
}

const UserForm: React.FC<UserFormProps> = ({ user, isAdmin = false, onSuccess, onCancel }) => {
  const { createUser, updateUser } = useUsers();
  const { 
    locations, 
    loading: managementLoading,
    loadLocations
  } = useManagement();
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    personalNumber: 0,
    phoneNumber: '',
    locationId: '',
    rank: '',
    isAdmin: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [showLastAdminModal, setShowLastAdminModal] = useState(false);

  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: NotificationType;
    message: string;
    title?: string;
  }>({
    isOpen: false,
    type: 'info',
    message: ''
  });

  const showNotification = (type: NotificationType, message: string, title?: string) => {
    setNotification({
      isOpen: true,
      type,
      message,
      title
    });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  };

  // All locations are available since we don't filter by unit anymore
  const availableLocations = locations;

  // Load locations when component mounts
  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  useEffect(() => {
    if (user) {
      // Since location is now a string, we need to find the matching location ID
      const matchingLocation = locations.find(loc => loc.name === user.location);
      setFormData({
        name: user.name,
        personalNumber: user.personalNumber,
        phoneNumber: user.phoneNumber,
        locationId: matchingLocation?.id || '',
        rank: user.rank,
        isAdmin: user.isAdmin,
      });
    }
  }, [user, locations]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!validateRequired(formData.name)) {
      newErrors.name = 'שם חובה';
    }

    if (!validatePersonalNumber(formData.personalNumber)) {
      newErrors.personalNumber = 'מספר אישי חייב להיות בדיוק 7 ספרות';
    }

    if (!validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = 'מספר טלפון לא תקין';
    }

    // Only validate location if admin is creating/editing user
    if (isAdmin && (!formData.locationId || !validateRequired(formData.locationId))) {
      newErrors.locationId = 'מיקום חובה';
    }

    if (!validateRequired(formData.rank)) {
      newErrors.rank = 'דרגה חובה';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: field === 'name' ? value : 
                 field === 'personalNumber' ? (value === '' ? 0 : parseInt(value as string, 10) || 0) :
                 field === 'isAdmin' ? value as boolean :
                 sanitizeInput(value as string),
      };
      
      return newData;
    });
    
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      let result: { success: boolean; error?: { status: number; message: string } };
      
      if (user?.id) {
        // For updating, we need to exclude firebaseUid from the request
        const updateData: UpdateUserRequest = {
          name: formData.name,
          personalNumber: formData.personalNumber,
          phoneNumber: formData.phoneNumber,
          rank: formData.rank,
        };
        
        // Only include locationId if admin is making the request and locationId is provided
        if (isAdmin && formData.locationId) {
          updateData.locationId = formData.locationId;
        }
        
        // Only allow admin to update isAdmin
        if (isAdmin && formData.isAdmin !== undefined) {
          updateData.isAdmin = formData.isAdmin;
        }
        
        result = await updateUser(user.id, updateData);
      } else {
        // For creating new users, only include locationId if admin provides it
        const createData: CreateUserRequest = {
          name: formData.name,
          personalNumber: formData.personalNumber,
          phoneNumber: formData.phoneNumber,
          rank: formData.rank,
        };
        
        if (isAdmin && formData.locationId) {
          createData.locationId = formData.locationId;
        }
        
        result = await createUser(createData);
      }

      if (result.success) {
        onSuccess();
      } else if (result.error?.status === 409) {
        // Handle 409 conflict error with modal
        setShowConflictModal(true);
      } else if (result.error?.status === 403) {
        // Handle 403 forbidden error (like last admin demotion)
        setShowLastAdminModal(true);
      } else {
        showNotification('error', 'שגיאה בשמירת המשתמש');
      }
    } catch (error) {
      // Removed console.error to avoid noisy logs
      showNotification('error', 'שגיאה בשמירת המשתמש');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '32px',
        backdropFilter: 'blur(10px)',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '8px'
            }}>
              שם <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input 
              type="text"
              value={formData.name} 
              onChange={e => handleInputChange('name', e.target.value)} 
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: `1px solid ${errors.name ? '#ef4444' : 'rgba(255, 255, 255, 0.2)'}`,
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.name ? '#ef4444' : 'rgba(255, 255, 255, 0.2)';
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            />
            {errors.name && (
              <div style={{
                color: '#ef4444',
                fontSize: '12px',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <i className="fas fa-exclamation-circle"></i>
                {errors.name}
              </div>
            )}
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '8px'
            }}>
              מספר אישי <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input 
              type="number"
              value={formData.personalNumber || ''} 
              onChange={e => {
                const value = e.target.value;
                if (value === '' || (/^[0-9]{1,7}$/.test(value) && value.length <= 7)) {
                  handleInputChange('personalNumber', value);
                }
              }}
              onInput={e => {
                const target = e.target as HTMLInputElement;
                if (target.value.length > 7) {
                  target.value = target.value.slice(0, 7);
                }
              }}
              placeholder="הזן 7 ספרות"
              min="1000000"
              max="9999999"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: `1px solid ${errors.personalNumber ? '#ef4444' : 'rgba(255, 255, 255, 0.2)'}`,
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                outline: 'none',
                textAlign: 'right',
                direction: 'rtl'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.personalNumber ? '#ef4444' : 'rgba(255, 255, 255, 0.2)';
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            />
            {errors.personalNumber && (
              <div style={{
                color: '#ef4444',
                fontSize: '12px',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <i className="fas fa-exclamation-circle"></i>
                {errors.personalNumber}
              </div>
            )}
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '8px'
            }}>
              מספר טלפון <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input 
              type="text"
              value={formData.phoneNumber} 
              onChange={e => handleInputChange('phoneNumber', e.target.value)} 
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: `1px solid ${errors.phoneNumber ? '#ef4444' : 'rgba(255, 255, 255, 0.2)'}`,
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.phoneNumber ? '#ef4444' : 'rgba(255, 255, 255, 0.2)';
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            />
            {errors.phoneNumber && (
              <div style={{
                color: '#ef4444',
                fontSize: '12px',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <i className="fas fa-exclamation-circle"></i>
                {errors.phoneNumber}
              </div>
            )}
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--color-text)',
              marginBottom: '8px'
            }}>
              דרגה <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select 
              value={formData.rank} 
              onChange={e => handleInputChange('rank', e.target.value)} 
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'var(--color-surface)',
                border: `1px solid ${errors.rank ? '#ef4444' : 'var(--color-border)'}`,
                borderRadius: '8px',
                color: 'var(--color-text)',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                outline: 'none',
                appearance: 'none',
                paddingLeft: '16px',
                cursor: 'pointer'
              }}
              onFocus={(e) => {
                (e.target as HTMLSelectElement).style.borderColor = 'var(--color-primary)';
                (e.target as HTMLSelectElement).style.background = 'var(--color-bg-hover)';
              }}
              onBlur={(e) => {
                (e.target as HTMLSelectElement).style.borderColor = errors.rank ? '#ef4444' : 'var(--color-border)';
                (e.target as HTMLSelectElement).style.background = 'var(--color-surface)';
              }}
            >
              <option value="" style={{
                background: 'var(--color-surface)',
                color: 'var(--color-text-muted)'
              }}>
                בחר דרגה
              </option>
              {ranks.map(rank => (
                <option 
                  key={rank} 
                  value={rank}
                  style={{
                    background: 'var(--color-surface)',
                    color: 'var(--color-text)'
                  }}
                >
                  {rank}
                </option>
              ))}
            </select>
            {errors.rank && (
              <div style={{
                color: '#ef4444',
                fontSize: '12px',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <i className="fas fa-exclamation-circle"></i>
                {errors.rank}
              </div>
            )}
          </div>
          
          {isAdmin && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--color-text)',
                marginBottom: '8px'
              }}>
                מיקום
              </label>
              <select 
                value={formData.locationId} 
                onChange={e => handleInputChange('locationId', e.target.value)} 
                disabled={managementLoading}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'var(--color-surface)',
                  border: `1px solid ${errors.locationId ? '#ef4444' : 'var(--color-border)'}`,
                  borderRadius: '8px',
                  color: 'var(--color-text)',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  appearance: 'none',
                  paddingLeft: '16px',
                  cursor: 'pointer'
                }}
                onFocus={(e) => {
                  (e.target as HTMLSelectElement).style.borderColor = 'var(--color-primary)';
                  (e.target as HTMLSelectElement).style.background = 'var(--color-bg-hover)';
                }}
                onBlur={(e) => {
                  (e.target as HTMLSelectElement).style.borderColor = errors.locationId ? '#ef4444' : 'var(--color-border)';
                  (e.target as HTMLSelectElement).style.background = 'var(--color-surface)';
                }}
              >
                <option value="" style={{
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-muted)'
                }}>
                  בחר מיקום
                </option>
                {availableLocations.map(location => (
                  <option 
                    key={location.id} 
                    value={location.id}
                    style={{
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)'
                    }}
                  >
                    {location.name}
                  </option>
                ))}
              </select>
              {errors.locationId && (
                <div style={{
                  color: '#ef4444',
                  fontSize: '12px',
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <i className="fas fa-exclamation-circle"></i>
                  {errors.locationId}
                </div>
              )}
              <div style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '12px',
                marginTop: '4px'
              }}>
                רק מנהלים יכולים להקצות מיקום למשתמשים
              </div>
            </div>
          )}
          
          {!isAdmin && user && user.location && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '8px'
              }}>
                מיקום נוכחי
              </label>
              <input 
                type="text"
                value={user.location}
                disabled
                readOnly
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '14px',
                  cursor: 'not-allowed'
                }}
              />
              <div style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '12px',
                marginTop: '4px'
              }}>
                פנה למנהל המערכת לשינוי מיקום
              </div>
            </div>
          )}
          
          {!isAdmin && user && !user.location && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.05))',
              borderRadius: '12px',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              padding: '16px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <i className="fas fa-exclamation-triangle" style={{ color: '#f59e0b', fontSize: '16px' }}></i>
              <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                לא הוקצה מיקום עדיין. פנה למנהל המערכת להקצאת מיקום.
              </span>
            </div>
          )}
          
          {isAdmin && user && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '16px',
                transition: 'all 0.2s ease'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  gap: '12px'
                }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="checkbox"
                      checked={formData.isAdmin || false}
                      onChange={e => handleInputChange('isAdmin', e.target.checked)}
                      style={{
                        position: 'absolute',
                        opacity: 0,
                        cursor: 'pointer'
                      }}
                    />
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      background: formData.isAdmin ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}>
                      {formData.isAdmin && (
                        <i className="fas fa-check" style={{ 
                          color: 'white', 
                          fontSize: '12px' 
                        }}></i>
                      )}
                    </div>
                  </div>
                  <div>
                    <div style={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}>
                      מנהל מערכת?
                    </div>
                    <div style={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontSize: '12px'
                    }}>
                      האם המשתמש הוא מנהל מערכת?
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <button 
              type="button" 
              onClick={onCancel}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '12px 24px',
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.15)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              ביטול
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              style={{
                background: isSubmitting ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isSubmitting ? 'none' : '0 4px 16px rgba(59, 130, 246, 0.3)'
              }}
            >
              {isSubmitting ? 'שומר...' : 'שמור'}
            </button>
          </div>
        </form>
      </div>

      <ConflictErrorModal 
        isOpen={showConflictModal} 
        onClose={() => setShowConflictModal(false)}
        title="התנגשות נתונים"
        message="משתמש עם מספר אישי זה כבר קיים במערכת או שאין לך הרשאה לעדכון."
        resolutionMessage={`בדוק אם המשתמש כבר קיים במערכת עם אותו מספר אישי.\nבמידת הצורך, פנה למנהל המערכת כדי לקבל הרשאות מתאימות.`}
        type="user"
      />

      <ConflictErrorModal 
        isOpen={showLastAdminModal} 
        onClose={() => setShowLastAdminModal(false)}
        title="שגיאת הרשאות"
        message="לא ניתן להסיר הרשאות מנהל מהמשתמש האחרון בעל הרשאות מנהל במערכת."
        resolutionMessage="חייב להישאר לפחות מנהל אחד במערכת. הוסף מנהל נוסף לפני הסרת ההרשאות מהמשתמש הנוכחי."
        type="user"
      />

      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        type={notification.type}
        message={notification.message}
        title={notification.title}
      />
    </>
  );
};

export default UserForm;
