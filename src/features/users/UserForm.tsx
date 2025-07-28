import React, { useEffect, useState } from 'react';
import { User, CreateUserRequest, ranks, locations } from '../../types';
import { useUsers } from '../../hooks';
import { validateRequired, validatePhoneNumber, validatePersonalNumber, sanitizeInput } from '../../utils';
import { ConflictErrorModal } from '../../shared/components';

interface UserFormProps {
  user: User | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormErrors {
  name?: string;
  personalNumber?: string;
  phoneNumber?: string;
  rank?: string;
  location?: string;
}

const UserForm: React.FC<UserFormProps> = ({ user, onSuccess, onCancel }) => {
  const { createUser, updateUser } = useUsers();
  const [formData, setFormData] = useState<CreateUserRequest>({
    name: '',
    personalNumber: 0,
    phoneNumber: '',
    rank: ranks[0],
    location: locations[0],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        personalNumber: user.personalNumber,
        phoneNumber: user.phoneNumber,
        rank: user.rank,
        location: user.location,
      });
    }
  }, [user]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!validateRequired(formData.name)) {
      newErrors.name = 'שם חובה';
    }

    if (!validatePersonalNumber(formData.personalNumber)) {
      newErrors.personalNumber = 'מספר אישי לא תקין';
    }

    if (!validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = 'מספר טלפון לא תקין';
    }

    if (!validateRequired(formData.rank)) {
      newErrors.rank = 'דרגה חובה';
    }

    if (!validateRequired(formData.location)) {
      newErrors.location = 'מיקום חובה';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CreateUserRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'name' ? value : 
               field === 'personalNumber' ? (value === '' ? 0 : parseInt(value, 10) || 0) :
               sanitizeInput(value),
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

    setIsSubmitting(true);

    try {
      let result: { success: boolean; error?: { status: number; message: string } };
      
      if (user?.id) {
        result = await updateUser(user.id, formData);
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
      console.error('Error submitting user:', error);
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
            onChange={e => handleInputChange('personalNumber', e.target.value)} 
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
            {ranks.map(rank => (
              <option key={rank} value={rank}>{rank}</option>
            ))}
          </select>
          {errors.rank && <div className="form-error">{errors.rank}</div>}
        </div>
        
        <div className="form-group">
          <label className="form-label">מיקום</label>
          <select 
            className={`form-control ${errors.location ? 'is-invalid' : ''}`}
            name="location" 
            value={formData.location} 
            onChange={e => handleInputChange('location', e.target.value)} 
            required
          >
            {locations.map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
          {errors.location && <div className="form-error">{errors.location}</div>}
        </div>
        
        <div className="btn-group btn-group-end">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            ביטול
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'שומר...' : (user ? 'עדכן' : 'צור')}
          </button>
        </div>
      </form>

      <ConflictErrorModal
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        title="משתמש כבר קיים"
        message={`משתמש עם מספר אישי ${formData.personalNumber} כבר קיים במערכת.`}
        resolutionMessage="אנא בדוק את המספר האישי ונסה שוב עם מספר אחר."
        type="user"
      />
    </>
  );
};

export default UserForm;
