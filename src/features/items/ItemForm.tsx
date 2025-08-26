import React, { useState, useEffect } from 'react';
import { Item, CreateItemRequest } from '../../types';
import { useItems } from '../../hooks';
import { useManagement } from '../../contexts';
import { validateRequired, sanitizeInput, getConflictResolutionMessage } from '../../utils';
import { ConflictErrorModal, NotificationModal } from '../../shared/components';
import type { NotificationType } from '../../shared/components/NotificationModal';
import './ItemForm.css';

interface ItemFormProps {
  item: Item | null;
  isAdmin: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormErrors {
  name?: string;
  idNumber?: string;
  note?: string;
}

const ItemForm: React.FC<ItemFormProps> = ({ item, isAdmin, onSuccess, onCancel }) => {
  const { createItem, updateItem } = useItems();
  const { 
    itemNames, 
    locations,
    loading: managementLoading,
    loadItemNames,
    loadLocations
  } = useManagement();
  
  const [formData, setFormData] = useState<CreateItemRequest>({
    name: '',
    idNumber: '',
    note: '',
    isOperational: true,
    requiresReporting: false,
    allocatedLocationId: '',
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

  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: NotificationType;
    message: string;
    title?: string;
  }>({
    isOpen: false,
    type: 'info',
    message: ''
  });

  const showNotification = (type: NotificationType, message: string, title?: string) => {
    setNotification({
      isOpen: true,
      type,
      message,
      title
    });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  };

  // Load item names and locations when component mounts
  useEffect(() => {
    loadItemNames();
    loadLocations();
  }, [loadItemNames, loadLocations]);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.itemName?.name || '',
        idNumber: item.idNumber || '',
        note: item.note || '',
        isOperational: item.isOperational ?? true,
        requiresReporting: item.requiresReporting ?? false,
        allocatedLocationId: item.allocatedLocationId || '',
      });
      // Reset quantity to 1 when editing existing item
      setQuantity(1);
    } else {
      // Reset form data when creating new item
      setFormData({
        name: '',
        idNumber: '',
        note: '',
        isOperational: true,
        requiresReporting: false,
        allocatedLocationId: '',
      });
      // Reset quantity when creating new item
      setQuantity(1);
    }
  }, [item]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!validateRequired(formData.name || '')) {
      newErrors.name = 'שם פריט חובה';
    }

    if (formData.requiresReporting && !validateRequired(formData.idNumber || '')) {
      newErrors.idNumber = 'מספר צ\' חובה עבור פריטים הדורשים דיווח';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CreateItemRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'note' || field === 'name' || field === 'allocatedLocationId' ? value : sanitizeInput(value),
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
        // For updates, exclude quantity from the request body and handle idNumber properly
        const { quantity: _, ...updateData } = formData;
        
        // If requiresReporting is false, remove idNumber entirely from the request body
        if (!updateData.requiresReporting) {
          delete updateData.idNumber;
        }
        
        // Convert empty allocatedLocationId to null
        if (updateData.allocatedLocationId === '') {
          updateData.allocatedLocationId = null;
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
          showNotification('error', result.error || 'שגיאה בעדכון הפריט');
        }
      } else {
        // Validate admin permissions for creating new items
        if (!isAdmin) {
          showNotification('error', 'רק מנהלים יכולים ליצור פריטים חדשים');
          setIsSubmitting(false);
          return;
        }

        // For creating new items, prepare the request data
        const requestData = {
          ...formData,
          // Only include quantity if requiresReporting is false and quantity > 1
          ...(!formData.requiresReporting && quantity > 1 ? { quantity } : {})
        };
        
        // If requiresReporting is false, remove idNumber entirely from the request body
        if (!requestData.requiresReporting) {
          delete requestData.idNumber;
        }
        
        // Convert empty allocatedLocationId to null
        if (requestData.allocatedLocationId === '') {
          requestData.allocatedLocationId = null;
        }
        
        const result = await createItem(requestData as CreateItemRequest);
        
        if (result.success) {
          if (!formData.requiresReporting && quantity > 1) {
            showNotification('success', `נוצרו בהצלחה ${quantity} פריטים`);
          }
          onSuccess();
        } else if (result.isConflict) {
          setConflictError({
            isOpen: true,
            message: result.error || 'פריט עם מספר צ\' זה כבר קיים במערכת',
            itemName: formData.name || 'פריט לא ידוע'
          });
        } else {
          showNotification('error', result.error || 'שגיאה בשמירת הפריט');
        }
      }
    } catch (error) {
      // Removed console.error to avoid noisy logs
      showNotification('error', 'שגיאה בשמירת הפריט');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '32px',
        backdropFilter: 'blur(10px)',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        {!item && !isAdmin && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.05))',
            borderRadius: '12px',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <i className="fas fa-exclamation-triangle" style={{ color: '#f59e0b', fontSize: '16px' }}></i>
            <div>
              <strong style={{ color: 'rgba(255, 255, 255, 0.9)' }}>הערה:</strong>
              <span style={{ color: 'rgba(255, 255, 255, 0.8)', marginRight: '8px' }}>
                רק מנהלי מערכת יכולים ליצור פריטים חדשים.
              </span>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '8px'
            }}>
              שם פריט <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select 
              value={formData.name} 
              onChange={e => handleInputChange('name', e.target.value)} 
              required
              disabled={managementLoading}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: `1px solid ${errors.name ? '#ef4444' : 'rgba(255, 255, 255, 0.2)'}`,
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                outline: 'none',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='rgba(255,255,255,0.5)' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'left 12px center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '16px 16px',
                paddingLeft: '40px',
                cursor: 'pointer'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.name ? '#ef4444' : 'rgba(255, 255, 255, 0.2)';
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <option value="" style={{
                background: '#1f2937',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                בחר שם פריט
              </option>
              {itemNames.map(itemName => (
                <option 
                  key={itemName.id} 
                  value={itemName.name}
                  style={{
                    background: '#1f2937',
                    color: 'rgba(255, 255, 255, 0.9)'
                  }}
                >
                  {itemName.name}
                </option>
              ))}
            </select>
            {errors.name && (
              <div style={{
                color: '#ef4444',
                fontSize: '12px',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <i className="fas fa-exclamation-circle"></i>
                {errors.name}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '8px'
            }}>
              מיקום מוקצה (אופציונלי)
            </label>
            <select 
              value={formData.allocatedLocationId || ''} 
              onChange={e => handleInputChange('allocatedLocationId', e.target.value)} 
              disabled={managementLoading}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                outline: 'none',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='rgba(255,255,255,0.5)' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'left 12px center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '16px 16px',
                paddingLeft: '40px',
                cursor: 'pointer'
              }}
              onFocus={(e) => {
                (e.target as HTMLSelectElement).style.borderColor = 'rgba(59, 130, 246, 0.5)';
                (e.target as HTMLSelectElement).style.background = 'rgba(255, 255, 255, 0.15)';
              }}
              onBlur={(e) => {
                (e.target as HTMLSelectElement).style.borderColor = 'rgba(255, 255, 255, 0.2)';
                (e.target as HTMLSelectElement).style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <option value="" style={{
                background: '#1f2937',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                ללא מיקום מוקצה
              </option>
              {locations.map(location => (
                <option 
                  key={location.id} 
                  value={location.id}
                  style={{
                    background: '#1f2937',
                    color: 'rgba(255, 255, 255, 0.9)'
                  }}
                >
                  {location.name}
                </option>
              ))}
            </select>
          </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '16px',
            transition: 'all 0.2s ease'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              gap: '12px'
            }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="checkbox"
                  checked={formData.isOperational}
                  onChange={e => setFormData(prev => ({ ...prev, isOperational: e.target.checked }))}
                  style={{
                    position: 'absolute',
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                />
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  background: formData.isOperational ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}>
                  {formData.isOperational && (
                    <i className="fas fa-check" style={{ 
                      color: 'white', 
                      fontSize: '12px' 
                    }}></i>
                  )}
                </div>
              </div>
              <div>
                <div style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  תקין?
                </div>
                <div style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '12px'
                }}>
                  האם הפריט תקין?
                </div>
              </div>
            </label>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '16px',
            transition: 'all 0.2s ease'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              gap: '12px'
            }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="checkbox"
                  checked={formData.requiresReporting}
                  onChange={e => setFormData(prev => ({ 
                    ...prev, 
                    requiresReporting: e.target.checked,
                    idNumber: e.target.checked ? prev.idNumber : ''
                  }))}
                  style={{
                    position: 'absolute',
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                />
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  background: formData.requiresReporting ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}>
                  {formData.requiresReporting && (
                    <i className="fas fa-check" style={{ 
                      color: 'white', 
                      fontSize: '12px' 
                    }}></i>
                  )}
                </div>
              </div>
              <div>
                <div style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  צופן?
                </div>
                <div style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '12px'
                }}>
                  האם הפריט דורש דיווח?
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* ID Number field - only when requiresReporting is true */}
        {formData.requiresReporting && (
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '8px'
            }}>
              מספר צ' <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input 
              type="text"
              value={formData.idNumber || ''} 
              onChange={e => handleInputChange('idNumber', e.target.value)} 
              placeholder="הזן מספר צ'"
              required={formData.requiresReporting}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: `1px solid ${errors.idNumber ? '#ef4444' : 'rgba(255, 255, 255, 0.2)'}`,
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.idNumber ? '#ef4444' : 'rgba(255, 255, 255, 0.2)';
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            />
            {errors.idNumber && (
              <div style={{
                color: '#ef4444',
                fontSize: '12px',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <i className="fas fa-exclamation-circle"></i>
                {errors.idNumber}
              </div>
            )}
          </div>
        )}

        {/* Quantity selector - only for new items and when requiresReporting is false */}
        {!item && !formData.requiresReporting && (
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '8px'
            }}>
              כמות ליצירה
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="number"
                value={quantity}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  setQuantity(Math.max(1, Math.min(100, value)));
                }}
                min="1"
                max="100"
                placeholder="1"
                style={{
                  width: '100px',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  textAlign: 'center',
                  direction: 'ltr'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
              />
              <span style={{ 
                color: 'rgba(255, 255, 255, 0.6)', 
                fontSize: '13px' 
              }}>
                פריטים (1-100)
              </span>
            </div>
          </div>
        )}
        
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '8px'
          }}>
            הערה
          </label>
          <textarea 
            value={formData.note || ''} 
            onChange={e => handleInputChange('note', e.target.value)} 
            rows={3}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: `1px solid ${errors.note ? '#ef4444' : 'rgba(255, 255, 255, 0.2)'}`,
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '14px',
              transition: 'all 0.2s ease',
              outline: 'none',
              resize: 'vertical',
              minHeight: '80px',
              maxHeight: '120px',
              fontFamily: 'inherit'
            }}
            onFocus={(e) => {
              (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(59, 130, 246, 0.5)';
              (e.target as HTMLTextAreaElement).style.background = 'rgba(255, 255, 255, 0.15)';
            }}
            onBlur={(e) => {
              (e.target as HTMLTextAreaElement).style.borderColor = errors.note ? '#ef4444' : 'rgba(255, 255, 255, 0.2)';
              (e.target as HTMLTextAreaElement).style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          />
          {errors.note && (
            <div style={{
              color: '#ef4444',
              fontSize: '12px',
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <i className="fas fa-exclamation-circle"></i>
              {errors.note}
            </div>
          )}
        </div>
        
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <button 
              type="button" 
              onClick={onCancel}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '12px 24px',
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.15)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              ביטול
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              style={{
                background: isSubmitting ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isSubmitting ? 'none' : '0 4px 16px rgba(59, 130, 246, 0.3)'
              }}
            >
              {isSubmitting ? 'שומר...' : (
                item ? 'עדכן' : (
                  (!formData.requiresReporting && quantity > 1) ? `צור ${quantity} פריטים` : 'צור פריט'
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

      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        type={notification.type}
        message={notification.message}
        title={notification.title}
      />
    </>
  );
};

export default ItemForm;
