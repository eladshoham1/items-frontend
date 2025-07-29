import React, { useState, useEffect } from 'react';
import { Item, CreateItemRequest } from '../../types';
import { useItems } from '../../hooks';
import { useManagement } from '../../contexts';
import { validateRequired, sanitizeInput, getConflictResolutionMessage } from '../../utils';
import { ConflictErrorModal } from '../../shared/components';

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
  const { 
    origins, 
    itemNames, 
    loading: managementLoading
  } = useManagement();
  
  const [formData, setFormData] = useState<CreateItemRequest>({
    name: '',
    idNumber: '',
    note: '',
    origin: '',
    isAvailable: true,
  });
  const [quantity, setQuantity] = useState<number>(1);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState<{
    isOpen: boolean;
    message: string;
    itemName: string;
  }>({
    isOpen: false,
    message: '',
    itemName: ''
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        idNumber: item.idNumber || '',
        note: item.note || '',
        origin: item.origin,
        isAvailable: item.isAvailable,
      });
      // Reset quantity to 1 when editing existing item
      setQuantity(1);
    } else {
      // Reset quantity when creating new item
      setQuantity(1);
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
      [field]: field === 'note' || field === 'name' ? value : sanitizeInput(value),
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
      if (item?.id) {
        // For updates, exclude isAvailable and quantity from the request body
        const { isAvailable, quantity: _, ...updateData } = formData;
        const result = await updateItem(item.id, updateData);
        
        if (result.success) {
          onSuccess();
        } else if (result.isConflict) {
          setConflictError({
            isOpen: true,
            message: result.error || 'פריט עם מספר צ\' זה כבר קיים במערכת',
            itemName: formData.name
          });
        } else {
          alert(result.error || 'שגיאה בעדכון הפריט');
        }
      } else {
        // For creating new items, include quantity for מרת"ק items and exclude idNumber for מרת"ק items
        const baseData = { ...formData };
        
        // Remove idNumber for מרת"ק items
        if (formData.origin === 'מרת"ק') {
          delete baseData.idNumber;
        }
        
        const requestData: CreateItemRequest = {
          ...baseData,
          ...(formData.origin === 'מרת"ק' && quantity > 1 ? { quantity } : {})
        };
        
        const result = await createItem(requestData);
        
        if (result.success) {
          if (formData.origin === 'מרת"ק' && quantity > 1) {
            alert(`נוצרו בהצלחה ${quantity} פריטים`);
          }
          onSuccess();
        } else if (result.isConflict) {
          setConflictError({
            isOpen: true,
            message: result.error || 'פריט עם מספר צ\' זה כבר קיים במערכת',
            itemName: formData.name
          });
        } else {
          alert(result.error || 'שגיאה בשמירת הפריט');
        }
      }
    } catch (error) {
      console.error('Error submitting item:', error);
      alert('שגיאה בשמירת הפריט');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">שם פריט</label>
          <select 
            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
            name="name" 
            value={formData.name} 
            onChange={e => handleInputChange('name', e.target.value)} 
            required
            disabled={managementLoading}
          >
            <option value="">בחר שם פריט</option>
            {itemNames.map(itemName => (
              <option key={itemName.id} value={itemName.name}>{itemName.name}</option>
            ))}
          </select>
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
            disabled={managementLoading}
          >
            <option value="">בחר מקור</option>
            {origins.map(origin => (
              <option key={origin.id} value={origin.name}>{origin.name}</option>
            ))}
          </select>
        </div>

        {/* Quantity selector - only for new מרת"ק items */}
        {!item && formData.origin === 'מרת"ק' && (
          <div className="form-group">
            <label className="form-label">כמות ליצירה</label>
            <div className="d-flex align-items-center gap-3">
              <input
                type="number"
                className="form-control"
                value={quantity}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  setQuantity(Math.max(1, Math.min(100, value)));
                }}
                min="1"
                max="100"
                style={{ 
                  direction: 'ltr',
                  width: '100px'
                }}
                placeholder="1"
              />
              <span className="text-muted" style={{ fontSize: '13px' }}>
                פריטים (1-100)
              </span>
            </div>
          </div>
        )}
        
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
            {isSubmitting ? 'שומר...' : (
              item ? 'עדכן' : (
                formData.origin === 'מרת"ק' && quantity > 1 ? `צור ${quantity} פריטים` : 'צור פריט'
              )
            )}
          </button>
        </div>
      </form>

      <ConflictErrorModal
        isOpen={conflictError.isOpen}
        onClose={() => setConflictError({ isOpen: false, message: '', itemName: '' })}
        title={`לא ניתן לשמור את הפריט "${conflictError.itemName}"`}
        message={conflictError.message}
        resolutionMessage={getConflictResolutionMessage('item')}
        type="item"
      />
    </>
  );
};

export default ItemForm;
