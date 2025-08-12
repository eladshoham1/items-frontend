import React, { useState, useEffect } from 'react';
import { Item, CreateItemRequest, User } from '../../types';
import { useItems } from '../../hooks';
import { useManagement } from '../../contexts';
import { validateRequired, sanitizeInput, getConflictResolutionMessage } from '../../utils';
import { ConflictErrorModal } from '../../shared/components';
import './ItemForm.css';

interface ItemFormProps {
  item: Item | null;
  userProfile: User;
  isAdmin: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormErrors {
  name?: string;
  idNumber?: string;
  note?: string;
}

const ItemForm: React.FC<ItemFormProps> = ({ item, userProfile, isAdmin, onSuccess, onCancel }) => {
  const { createItem, updateItem } = useItems();
  const { 
    itemNames, 
    loading: managementLoading,
    loadItemNames
  } = useManagement();
  
  const [formData, setFormData] = useState<CreateItemRequest>({
    name: '',
    idNumber: '',
    note: '',
    isNeedReport: false,
    isOperational: true,
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

  // Load item names when component mounts
  useEffect(() => {
    loadItemNames();
  }, [loadItemNames]);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.itemName?.name || '',
        idNumber: item.idNumber || '',
        note: item.note || '',
        isNeedReport: item.isNeedReport || false,
        isOperational: item.isOperational ?? true,
      });
      // Reset quantity to 1 when editing existing item
      setQuantity(1);
    } else {
      // Reset quantity when creating new item
      setQuantity(1);
    }
  }, [item]);

  // Clear idNumber when isNeedReport becomes false, and reset quantity when isNeedReport becomes true
  useEffect(() => {
    if (!formData.isNeedReport && formData.idNumber) {
      setFormData(prev => ({ ...prev, idNumber: '' }));
    }
    if (formData.isNeedReport && quantity > 1) {
      setQuantity(1);
    }
  }, [formData.isNeedReport, formData.idNumber, quantity]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!validateRequired(formData.name || '')) {
      newErrors.name = 'שם פריט חובה';
    }

    if (formData.isNeedReport && !validateRequired(formData.idNumber || '')) {
      newErrors.idNumber = 'מספר צ\' חובה עבור פריטים בצופן';
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
        // For updates, exclude quantity from the request body
        const { quantity: _, ...updateData } = formData;
        // Remove idNumber if isNeedReport is false
        if (!formData.isNeedReport) {
          delete updateData.idNumber;
        }
        const result = await updateItem(item.id, updateData);
        
        if (result.success) {
          onSuccess();
        } else if (result.isConflict) {
          // Show translated error (403/409) in modal
          setConflictError({
            isOpen: true,
            message: result.error || 'לא ניתן לעדכן פריט הקשור לקבלה חתומה',
            itemName: formData.name || 'פריט לא ידוע'
          });
        } else {
          alert(result.error || 'שגיאה בעדכון הפריט');
        }
      } else {
        // Validate admin permissions for creating new items
        if (!isAdmin) {
          alert('רק מנהלים יכולים ליצור פריטים חדשים');
          setIsSubmitting(false);
          return;
        }

        // For creating new items, prepare the request data
        const requestData = {
          ...formData,
          ...(quantity > 1 ? { quantity } : {})
        };
        // Remove idNumber if isNeedReport is false
        if (!formData.isNeedReport) {
          delete requestData.idNumber;
        }
        
        const result = await createItem(requestData as CreateItemRequest);
        
        if (result.success) {
          if (quantity > 1) {
            alert(`נוצרו בהצלחה ${quantity} פריטים`);
          }
          onSuccess();
        } else if (result.isConflict) {
          setConflictError({
            isOpen: true,
            message: result.error || 'פריט עם מספר צ\' זה כבר קיים במערכת',
            itemName: formData.name || 'פריט לא ידוע'
          });
        } else {
          alert(result.error || 'שגיאה בשמירת הפריט');
        }
      }
    } catch (error) {
      // Removed console.error to avoid noisy logs
      alert('שגיאה בשמירת הפריט');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="item-form-container">
        {!item && !isAdmin && (
          <div className="alert alert-warning mb-4" style={{ fontSize: '0.9rem' }}>
            <i className="fas fa-exclamation-triangle me-2"></i>
            <strong>הערה:</strong> רק מנהלי מערכת יכולים ליצור פריטים חדשים.
          </div>
        )}
        
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
          <div className="custom-checkbox-wrapper">
            <label className="custom-checkbox">
              <input
                type="checkbox"
                className="custom-checkbox-input"
                checked={formData.isNeedReport}
                onChange={e => setFormData(prev => ({ ...prev, isNeedReport: e.target.checked }))}
              />
              <span className="custom-checkbox-checkmark">
                <svg className="checkmark-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path 
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                    fill="currentColor"
                  />
                </svg>
              </span>
              <span className="custom-checkbox-label">
                <strong>צופן?</strong>
                <small className="checkbox-description">סמן אם הפריט דורש דיווח מיוחד</small>
              </span>
            </label>
          </div>
        </div>

        <div className="form-group">
          <div className="custom-checkbox-wrapper">
            <label className="custom-checkbox">
              <input
                type="checkbox"
                className="custom-checkbox-input"
                checked={formData.isOperational}
                onChange={e => setFormData(prev => ({ ...prev, isOperational: e.target.checked }))}
              />
              <span className="custom-checkbox-checkmark">
                <svg className="checkmark-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path 
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                    fill="currentColor"
                  />
                </svg>
              </span>
              <span className="custom-checkbox-label">
                <strong>תקין?</strong>
                <small className="checkbox-description">האם הפריט תקין?</small>
              </span>
            </label>
          </div>
        </div>

        {/* Quantity selector - only for new items when NOT צופן */}
        {!item && !formData.isNeedReport && (
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
        
        {/* ID Number field - only when isNeedReport is true */}
        {formData.isNeedReport && (
          <div className="form-group conditional-field">
            <label className="form-label">מספר צ'</label>
            <input 
              className={`form-control ${errors.idNumber ? 'is-invalid' : ''}`}
              name="idNumber" 
              value={formData.idNumber || ''} 
              onChange={e => handleInputChange('idNumber', e.target.value)} 
              placeholder="הזן מספר צ'"
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
            value={formData.note || ''} 
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
                  quantity > 1 ? `צור ${quantity} פריטים` : 'צור פריט'
                )
              )}
            </button>
          </div>
        </form>
      </div>

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
