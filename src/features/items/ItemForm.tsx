import React, { useState, useEffect } from 'react';
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
  idNumber?: string;
  note?: string;
}

const ItemForm: React.FC<ItemFormProps> = ({ item, onSuccess, onCancel }) => {
  const { createItem, updateItem } = useItems();
  const [formData, setFormData] = useState<CreateItemRequest>({
    name: '',
    idNumber: '',
    note: '',
    origin: 'מרת"ק',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        idNumber: item.idNumber || '',
        note: item.note || '',
        origin: item.origin,
      });
    }
  }, [item]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!validateRequired(formData.name)) {
      newErrors.name = 'שם פריט חובה';
    }

    if (formData.origin === 'כ"ס' && !validateRequired(formData.idNumber || '')) {
      newErrors.idNumber = 'מספר צ\' חובה עבור כ"ס';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CreateItemRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'note' ? value : sanitizeInput(value),
    }));
    
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
      <div className="form-group">
        <label className="form-label">שם פריט</label>
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
        <label className="form-label">מקור</label>
        <select 
          className="form-control"
          name="origin" 
          value={formData.origin} 
          onChange={e => handleInputChange('origin', e.target.value)} 
          required
        >
          {origins.map(origin => (
            <option key={origin} value={origin}>{origin}</option>
          ))}
        </select>
      </div>
      
      {formData.origin === 'כ"ס' && (
        <div className="form-group">
          <label className="form-label">מספר צ'</label>
          <input 
            className={`form-control ${errors.idNumber ? 'is-invalid' : ''}`}
            name="idNumber" 
            value={formData.idNumber} 
            onChange={e => handleInputChange('idNumber', e.target.value)} 
            required
          />
          {errors.idNumber && <div className="form-error">{errors.idNumber}</div>}
        </div>
      )}
      
      <div className="form-group">
        <label className="form-label">הערה</label>
        <textarea 
          className={`form-control ${errors.note ? 'is-invalid' : ''}`}
          name="note" 
          value={formData.note} 
          onChange={e => handleInputChange('note', e.target.value)} 
          rows={3}
        />
        {errors.note && <div className="form-error">{errors.note}</div>}
      </div>
      
      <div className="btn-group btn-group-end">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          ביטול
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'שומר...' : (item ? 'עדכן' : 'צור')}
        </button>
      </div>
    </form>
  );
};

export default ItemForm;
