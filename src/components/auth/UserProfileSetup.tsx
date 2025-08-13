import React, { useState } from 'react';
import { CreateUserRequest, ranks } from '../../types';
import { validateRequired, validatePhoneNumber, validatePersonalNumber, sanitizeInput } from '../../utils';

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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onComplete(formData);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#f8f9fa',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: 0,
      padding: '20px',
      zIndex: 1000,
      direction: 'rtl'
    }}>
      <div className="card shadow-lg" style={{ 
        maxWidth: '500px', 
        width: '100%', 
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div className="card-header text-center bg-primary text-white">
          <h2 className="mb-0">השלמת פרטים אישיים</h2>
          <p className="mb-0 mt-2">שלום {userEmail}</p>
          <small>נדרשת השלמת פרטים להמשך השימוש במערכת</small>
        </div>
        
        <div className="card-body">
          {error && (
            <div className="alert alert-danger mb-3">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group mb-3">
              <label className="form-label required">שם מלא</label>
              <input 
                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                name="name" 
                value={formData.name} 
                onChange={e => handleInputChange('name', e.target.value)} 
                required 
                placeholder="הזן את שמך המלא"
              />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>
            
            <div className="form-group mb-3">
              <label className="form-label required">מספר אישי</label>
              <input 
                type="number"
                className={`form-control ${errors.personalNumber ? 'is-invalid' : ''}`}
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
                placeholder="הזן 7 ספרות"
                min="1000000"
                max="9999999"
                required 
                style={{ textAlign: 'right', direction: 'rtl' }}
              />
              {errors.personalNumber && <div className="form-error">{errors.personalNumber}</div>}
            </div>
            
            <div className="form-group mb-3">
              <label className="form-label required">מספר טלפון</label>
              <input 
                className={`form-control ${errors.phoneNumber ? 'is-invalid' : ''}`}
                name="phoneNumber" 
                value={formData.phoneNumber} 
                onChange={e => handleInputChange('phoneNumber', e.target.value)} 
                required 
                placeholder="05xxxxxxxx"
              />
              {errors.phoneNumber && <div className="form-error">{errors.phoneNumber}</div>}
            </div>
            
            <div className="form-group mb-3">
              <label className="form-label required">דרגה</label>
              <select 
                className={`form-control ${errors.rank ? 'is-invalid' : ''}`}
                name="rank" 
                value={formData.rank} 
                onChange={e => handleInputChange('rank', e.target.value)} 
                required
              >
                <option value="">בחר דרגה</option>
                {ranks.map(rank => (
                  <option key={rank} value={rank}>{rank}</option>
                ))}
              </select>
              {errors.rank && <div className="form-error">{errors.rank}</div>}
            </div>
            
            <div className="alert alert-info mb-4" style={{ fontSize: '0.9rem' }}>
              <i className="fas fa-info-circle me-2"></i>
              <strong>הערה:</strong> מיקום יוקצה לך על ידי מנהל המערכת לאחר הרישום.
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary w-100" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  שומר...
                </>
              ) : (
                'השלם רישום'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfileSetup;
