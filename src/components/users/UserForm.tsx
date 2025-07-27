import React, { useEffect, useState } from 'react';
import { User, CreateUserRequest, ranks, locations } from '../../types';
import { useUsers } from '../../hooks';
import { validateRequired, validatePhoneNumber, validatePersonalNumber, sanitizeInput } from '../../utils';

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
      let success: boolean;
      
      if (user?.id) {
        success = await updateUser(user.id, formData);
      } else {
        success = await createUser(formData);
      }

      if (success) {
        onSuccess();
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
    <form onSubmit={handleSubmit} className="user-form">
      <h2>{user ? 'עדכון משתמש' : 'יצירת משתמש'}</h2>
      
      <div className="input-group">
        <label>שם</label>
        <input 
          name="name" 
          value={formData.name} 
          onChange={e => handleInputChange('name', e.target.value)} 
          required 
        />
        {errors.name && <span className="error">{errors.name}</span>}
      </div>
      
      <div className="input-group">
        <label>מספר אישי</label>
        <input 
          type="number"
          name="personalNumber" 
          value={formData.personalNumber || ''} 
          onChange={e => handleInputChange('personalNumber', e.target.value)} 
          required 
        />
        {errors.personalNumber && <span className="error">{errors.personalNumber}</span>}
      </div>
      
      <div className="input-group">
        <label>מספר טלפון</label>
        <input 
          name="phoneNumber" 
          value={formData.phoneNumber} 
          onChange={e => handleInputChange('phoneNumber', e.target.value)} 
          required 
        />
        {errors.phoneNumber && <span className="error">{errors.phoneNumber}</span>}
      </div>
      
      <div className="input-group">
        <label>דרגה</label>
        <select 
          name="rank" 
          value={formData.rank} 
          onChange={e => handleInputChange('rank', e.target.value)} 
          required
        >
          {ranks.map(rank => (
            <option key={rank} value={rank}>{rank}</option>
          ))}
        </select>
        {errors.rank && <span className="error">{errors.rank}</span>}
      </div>
      
      <div className="input-group">
        <label>מיקום</label>
        <select 
          name="location" 
          value={formData.location} 
          onChange={e => handleInputChange('location', e.target.value)} 
          required
        >
          {locations.map(location => (
            <option key={location} value={location}>{location}</option>
          ))}
        </select>
        {errors.location && <span className="error">{errors.location}</span>}
      </div>
      
      <div className="button-group">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'שומר...' : (user ? 'עדכן' : 'צור')}
        </button>
        <button type="button" onClick={onCancel}>
          ביטול
        </button>
      </div>
    </form>
  );
};

export default UserForm;
