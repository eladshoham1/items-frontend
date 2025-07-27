import React, { useEffect, useState } from 'react';
import { Item, CreateItemRequest, origins } from '../../types';
import { useItems } from '../../hooks';
import { validateRequired, sanitizeInput } from '../../utils';

interface ItemFormProps {
  item: Item | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormErrors {
  name?: string;
  origin?: string;
  idNumber?: string;
  note?: string;
}

const ItemForm: React.FC<ItemFormProps> = ({ item, onSuccess, onCancel }) => {
  const { createItem, updateItem } = useItems();
  const [formData, setFormData] = useState<CreateItemRequest>({
    name: '',
    origin: origins[0],
    idNumber: '',
    note: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        origin: item.origin,
        idNumber: item.idNumber || '',
        note: item.note || '',
      });
    }
  }, [item]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!validateRequired(formData.name)) {
      newErrors.name = 'שם פריט חובה';
    }

    if (!validateRequired(formData.origin)) {
      newErrors.origin = 'מקור חובה';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CreateItemRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: sanitizeInput(value),
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
      
      if (item?.id) {
        success = await updateItem(item.id, formData);
      } else {
        success = await createItem(formData);
      }

      if (success) {
        onSuccess();
      } else {
        alert('שגיאה בשמירת הפריט');
      }
    } catch (error) {
      console.error('Error submitting item:', error);
      alert('שגיאה בשמירת הפריט');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>{item ? 'ערוך פריט' : 'הוסף פריט חדש'}</h3>
      <label className="input-group">
        שם פריט:
        <input 
          value={formData.name} 
          onChange={(e) => handleInputChange('name', e.target.value)} 
        />
        {errors.name && <span className="error">{errors.name}</span>}
      </label>
      <label className="input-group">
        מקור:
        <select 
          value={formData.origin} 
          onChange={(e) => handleInputChange('origin', e.target.value)}
        >
          <option value="">בחר מקור</option>
          {origins.map(origin => <option key={origin} value={origin}>{origin}</option>)}
        </select>
        {errors.origin && <span className="error">{errors.origin}</span>}
      </label>
      {formData.origin === 'כ"ס' && (
        <label className="input-group">
          מספר צ':
          <input 
            value={formData.idNumber} 
            onChange={(e) => handleInputChange('idNumber', e.target.value)} 
          />
          {errors.idNumber && <span className="error">{errors.idNumber}</span>}
        </label>
      )}
      <label className="input-group">
        הערה:
        <input 
          value={formData.note} 
          onChange={(e) => handleInputChange('note', e.target.value)} 
        />
        {errors.note && <span className="error">{errors.note}</span>}
      </label>
      <div className="modal-actions" style={{ marginTop: '10px' }}>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'שומר...' : 'שמירה'}
        </button>
        <button type="button" onClick={onCancel}>ביטול</button>
      </div>
    </form>
  );
};

export default ItemForm;
