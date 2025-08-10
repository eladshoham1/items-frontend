import React, { useEffect, useState } from 'react';
import { User, CreateUserRequest, UpdateUserRequest, ranks } from '../../types';
import { useUsers } from '../../hooks';
import { useManagement } from '../../contexts';
import { validateRequired, validatePhoneNumber, validatePersonalNumber, sanitizeInput } from '../../utils';
import { ConflictErrorModal } from '../../shared/components';

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
    loading: managementLoading
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

  // All locations are available since we don't filter by unit anymore
  const availableLocations = locations;

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

    if (!validateRequired(formData.locationId)) {
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
          locationId: formData.locationId,
          rank: formData.rank,
        };
        
        // Only allow admin to update isAdmin
        if (isAdmin && formData.isAdmin !== undefined) {
          updateData.isAdmin = formData.isAdmin;
        }
        
        result = await updateUser(user.id, updateData);
      } else {
        result = await createUser(formData);
      }

      if (result.success) {
        onSuccess();
      } else if (result.error?.status === 409) {
        // Handle 409 conflict error with modal
        setShowConflictModal(true);
      } else {
        alert('שגיאה בשמירת המשתמש');
      }
    } catch (error) {
      // Removed console.error to avoid noisy logs
      alert('שגיאה בשמירת המשתמש');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">שם</label>
          <input 
            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
            name="name" 
            value={formData.name} 
            onChange={e => handleInputChange('name', e.target.value)} 
            required 
          />
          {errors.name && <div className="form-error">{errors.name}</div>}
        </div>
        
        <div className="form-group">
          <label className="form-label">מספר אישי</label>
          <input 
            type="number"
            className={`form-control ${errors.personalNumber ? 'is-invalid' : ''}`}
            name="personalNumber" 
            value={formData.personalNumber || ''} 
            onChange={e => {
              const value = e.target.value;
              // Only allow exactly 7 digits
              if (value === '' || (/^[0-9]{1,7}$/.test(value) && value.length <= 7)) {
                handleInputChange('personalNumber', value);
              }
            }}
            onInput={e => {
              const target = e.target as HTMLInputElement;
              // Prevent input of more than 7 characters
              if (target.value.length > 7) {
                target.value = target.value.slice(0, 7);
              }
            }}
            placeholder="הזן 7 ספרות"
            min="1000000"
            max="9999999"
            required 
          />
          {errors.personalNumber && <div className="form-error">{errors.personalNumber}</div>}
        </div>
        
        <div className="form-group">
          <label className="form-label">מספר טלפון</label>
          <input 
            className={`form-control ${errors.phoneNumber ? 'is-invalid' : ''}`}
            name="phoneNumber" 
            value={formData.phoneNumber} 
            onChange={e => handleInputChange('phoneNumber', e.target.value)} 
            required 
          />
          {errors.phoneNumber && <div className="form-error">{errors.phoneNumber}</div>}
        </div>
        
        <div className="form-group">
          <label className="form-label">דרגה</label>
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
        
        <div className="form-group">
          <label className="form-label">מיקום</label>
          <select 
            className={`form-control ${errors.locationId ? 'is-invalid' : ''}`}
            name="locationId" 
            value={formData.locationId} 
            onChange={e => handleInputChange('locationId', e.target.value)} 
            required
            disabled={managementLoading}
          >
            <option value="">בחר מיקום</option>
            {availableLocations.map(location => (
              <option key={location.id} value={location.id}>{location.name}</option>
            ))}
          </select>
          {errors.locationId && <div className="form-error">{errors.locationId}</div>}
        </div>
        
        {isAdmin && user && (
          <div className="form-group">
            <label className="form-label">
              <input 
                type="checkbox"
                className="form-checkbox"
                name="isAdmin" 
                checked={formData.isAdmin || false}
                onChange={e => handleInputChange('isAdmin', e.target.checked)} 
              />
              <span className="ms-2">מנהל מערכת</span>
            </label>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'שומר...' : 'שמור'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            ביטול
          </button>
        </div>
      </form>

      <ConflictErrorModal 
        isOpen={showConflictModal} 
        onClose={() => setShowConflictModal(false)}
        title="התנגשות נתונים"
        message="משתמש עם מספר אישי זה כבר קיים במערכת או שאין לך הרשאה לעדכון."
        resolutionMessage={`בדוק אם המשתמש כבר קיים במערכת עם אותו מספר אישי.\nבמידת הצורך, פנה למנהל המערכת כדי לקבל הרשאות מתאימות.`}
        type="user"
      />
    </>
  );
};

export default UserForm;
