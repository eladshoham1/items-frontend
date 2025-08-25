import React, { useState } from 'react';
import { CreateUserRequest, ranks } from '../../types';
import { validateRequired, validatePhoneNumber, validatePersonalNumber, sanitizeInput } from '../../utils';
import './UserProfileSetup.css';

interface UserProfileSetupProps {
  onComplete: (profileData: Omit<CreateUserRequest, 'firebaseUid'>) => void;
  userEmail: string;
  isAdmin: boolean;
  isLoading?: boolean;
  error?: string | null;
}

interface FormErrors {
  name?: string;
  personalNumber?: string;
  phoneNumber?: string;
  rank?: string;
}

const UserProfileSetup: React.FC<UserProfileSetupProps> = ({ 
  onComplete, 
  userEmail,
  isAdmin,
  isLoading = false,
  error = null 
}) => {
  const [formData, setFormData] = useState<Omit<CreateUserRequest, 'firebaseUid'>>({
    name: '',
    personalNumber: 0,
    phoneNumber: '',
    rank: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [completedFields, setCompletedFields] = useState<Set<string>>(new Set());

  // Calculate form progress
  const totalFields = 4;
  const filledFields = [
    formData.name,
    formData.personalNumber,
    formData.phoneNumber,
    formData.rank
  ].filter(field => field && field.toString().trim() !== '').length;
  const progress = (filledFields / totalFields) * 100;

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

    if (!validateRequired(formData.rank)) {
      newErrors.rank = 'דרגה חובה';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: field === 'name' ? value : 
                 field === 'personalNumber' ? (value === '' ? 0 : parseInt(value, 10) || 0) :
                 sanitizeInput(value),
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
    
    // Track completed fields
    if (value && value.toString().trim() !== '') {
      setCompletedFields(prev => {
        const newSet = new Set(prev);
        newSet.add(field);
        return newSet;
      });
    } else {
      setCompletedFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(field);
        return newSet;
      });
    }
  };

  const handleFocus = (field: string) => {
    setFocusedField(field);
  };

  const handleBlur = () => {
    setFocusedField(null);
  };

  const getFieldIcon = (field: string) => {
    if (completedFields.has(field)) {
      return <span className="success-checkmark"></span>;
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onComplete(formData);
  };

  return (
    <div className="profile-setup-container">
      <div className="profile-setup-card">
        <div className="profile-setup-header">
          <h1 className="profile-setup-title">ברוכים הבאים למערכת</h1>
          <p className="profile-setup-subtitle">שלום {userEmail}</p>
          <p className="profile-setup-email">נדרש להשלים את הפרטים האישיים להמשך השימוש</p>
        </div>
        
        <div className="profile-setup-body">
          {/* Progress Indicator */}
          <div className="progress-indicator">
            {[...Array(totalFields)].map((_, index) => (
              <div
                key={index}
                className={`progress-dot ${index < filledFields ? 'active' : ''}`}
              />
            ))}
          </div>
          
          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-triangle"></i>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className={`form-group ${focusedField === 'name' ? 'focused' : ''}`}>
              <label className="form-label required">שם מלא</label>
              <div style={{ position: 'relative' }}>
                <input 
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  name="name" 
                  value={formData.name} 
                  onChange={e => handleInputChange('name', e.target.value)}
                  onFocus={() => handleFocus('name')}
                  onBlur={handleBlur}
                  required 
                  placeholder="הזן את שמך המלא"
                />
                {getFieldIcon('name')}
              </div>
              {errors.name && (
                <div className="form-error">
                  <i className="fas fa-exclamation-circle"></i>
                  {errors.name}
                </div>
              )}
            </div>
            
            <div className={`form-group ${focusedField === 'personalNumber' ? 'focused' : ''}`}>
              <label className="form-label required">מספר אישי</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number"
                  className={`form-input ${errors.personalNumber ? 'error' : ''}`}
                  name="personalNumber" 
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
                  onFocus={() => handleFocus('personalNumber')}
                  onBlur={handleBlur}
                  placeholder="הזן 7 ספרות"
                  min="1000000"
                  max="9999999"
                  required 
                />
                {getFieldIcon('personalNumber')}
              </div>
              {errors.personalNumber && (
                <div className="form-error">
                  <i className="fas fa-exclamation-circle"></i>
                  {errors.personalNumber}
                </div>
              )}
            </div>
            
            <div className={`form-group ${focusedField === 'phoneNumber' ? 'focused' : ''}`}>
              <label className="form-label required">מספר טלפון</label>
              <div style={{ position: 'relative' }}>
                <input 
                  className={`form-input ${errors.phoneNumber ? 'error' : ''}`}
                  name="phoneNumber" 
                  value={formData.phoneNumber} 
                  onChange={e => handleInputChange('phoneNumber', e.target.value)}
                  onFocus={() => handleFocus('phoneNumber')}
                  onBlur={handleBlur}
                  required 
                  placeholder="05xxxxxxxx"
                />
                {getFieldIcon('phoneNumber')}
              </div>
              {errors.phoneNumber && (
                <div className="form-error">
                  <i className="fas fa-exclamation-circle"></i>
                  {errors.phoneNumber}
                </div>
              )}
            </div>
            
            <div className={`form-group ${focusedField === 'rank' ? 'focused' : ''}`}>
              <label className="form-label required">דרגה</label>
              <div style={{ position: 'relative' }}>
                <select 
                  className={`form-select ${errors.rank ? 'error' : ''}`}
                  name="rank" 
                  value={formData.rank} 
                  onChange={e => handleInputChange('rank', e.target.value)}
                  onFocus={() => handleFocus('rank')}
                  onBlur={handleBlur}
                  required
                >
                  <option value="">בחר דרגה</option>
                  {ranks.map(rank => (
                    <option key={rank} value={rank}>{rank}</option>
                  ))}
                </select>
                {getFieldIcon('rank')}
              </div>
              {errors.rank && (
                <div className="form-error">
                  <i className="fas fa-exclamation-circle"></i>
                  {errors.rank}
                </div>
              )}
            </div>
            
            <div className="info-message">
              <i className="fas fa-info-circle info-icon"></i>
              <div>
                <strong>הערה חשובה:</strong> מיקום יוקצה לך על ידי מנהל המערכת לאחר השלמת הרישום.
                <br />
                הפרטים ניתנים לעדכון בעתיד דרך הגדרות המשתמש.
              </div>
            </div>
            
            <button 
              type="submit" 
              className="submit-button" 
              disabled={isLoading || progress < 100}
            >
              {isLoading ? (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  שומר פרטים...
                </div>
              ) : (
                <>
                  השלם רישום
                  <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfileSetup;
