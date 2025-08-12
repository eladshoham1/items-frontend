import React, { useState, useEffect } from 'react';
import { User, UpdateUserRequest, ranks } from '../../types';
import { useManagement } from '../../contexts';
import { useColdStartLoader } from '../../hooks';
import { validateRequired, validatePhoneNumber, validatePersonalNumber, sanitizeInput } from '../../utils';

interface UserProfileFormProps {
  userProfile: User;
  onUpdate: (updates: UpdateUserRequest) => Promise<boolean>;
  onCancel: () => void;
  isUpdating: boolean;
  showRoleField: boolean;
  isAdmin?: boolean; // Add isAdmin prop to control location editing
}

interface FormErrors {
  name?: string;
  personalNumber?: string;
  phoneNumber?: string;
  locationId?: string;
  rank?: string;
}

const UserProfileForm: React.FC<UserProfileFormProps> = ({ 
  userProfile, 
  onUpdate, 
  onCancel, 
  isUpdating, 
  showRoleField,
  isAdmin = false // Default to false
}) => {
  const { locations, loading: managementLoading, loadLocations } = useManagement();
  const { showColdStartMessage } = useColdStartLoader();
  
  const [formData, setFormData] = useState({
    name: userProfile.name,
    personalNumber: userProfile.personalNumber,
    phoneNumber: userProfile.phoneNumber,
    locationId: '',
    rank: userProfile.rank,
  });
  
  const [errors, setErrors] = useState<FormErrors>({});

  // Load locations when component mounts
  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  // Find the current location ID when locations are loaded
  useEffect(() => {
    if (locations.length > 0 && userProfile.location) {
      const matchingLocation = locations.find(loc => loc.name === userProfile.location);
      if (matchingLocation) {
        setFormData(prev => ({
          ...prev,
          locationId: matchingLocation.id
        }));
      }
    }
  }, [locations, userProfile.location]);

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

    // Only validate location if user is admin
    if (isAdmin && !validateRequired(formData.locationId)) {
      newErrors.locationId = 'מיקום חובה';
    }

    if (!validateRequired(formData.rank)) {
      newErrors.rank = 'דרגה חובה';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'name' ? value : 
               field === 'personalNumber' ? (typeof value === 'string' && value === '' ? 0 : Number(value) || 0) :
               typeof value === 'string' ? sanitizeInput(value) : value,
    }));
    
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

    // Only send fields that have changed
    const updates: UpdateUserRequest = {};
    
    if (formData.name !== userProfile.name) updates.name = formData.name;
    if (formData.personalNumber !== userProfile.personalNumber) updates.personalNumber = formData.personalNumber;
    if (formData.phoneNumber !== userProfile.phoneNumber) updates.phoneNumber = formData.phoneNumber;
    if (formData.rank !== userProfile.rank) updates.rank = formData.rank;
    // Only include locationId if user is admin and locationId is provided
    if (isAdmin && formData.locationId) updates.locationId = formData.locationId;

    await onUpdate(updates);
  };

  return (
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
          className={`form-control ${errors.personalNumber ? 'is-invalid' : ''}`}
          name="personalNumber" 
          type="number"
          value={formData.personalNumber} 
          onChange={e => handleInputChange('personalNumber', e.target.value)} 
          required 
          placeholder="1234567"
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
      
      {isAdmin ? (
        <div className="form-group mb-4">
          <label className="form-label required">מיקום</label>
          <select 
            className={`form-control ${errors.locationId ? 'is-invalid' : ''}`}
            name="locationId" 
            value={formData.locationId} 
            onChange={e => handleInputChange('locationId', e.target.value)} 
            required
            disabled={managementLoading}
          >
            <option value="">בחר מיקום</option>
            {locations.map(location => (
              <option key={location.id} value={location.id}>{location.name}</option>
            ))}
          </select>
          {errors.locationId && <div className="form-error">{errors.locationId}</div>}
        </div>
      ) : (
        <div className="form-group mb-4">
          <label className="form-label">מיקום נוכחי</label>
          <input 
            type="text"
            className="form-control"
            value={userProfile.location || 'לא הוקצה מיקום'}
            disabled
            readOnly
          />
          <small className="form-text text-muted">פנה למנהל המערכת לשינוי מיקום</small>
        </div>
      )}

      <div className="d-flex justify-content-end gap-2">
        <button 
          type="button" 
          className="btn btn-secondary" 
          onClick={onCancel}
          disabled={isUpdating}
        >
          ביטול
        </button>
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={isUpdating}
        >
          {isUpdating ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {showColdStartMessage ? 'מעורר את השרת...' : 'שומר...'}
            </>
          ) : (
            'שמור שינויים'
          )}
        </button>
      </div>
    </form>
  );
};

export default UserProfileForm;
