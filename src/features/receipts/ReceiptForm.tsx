import React, { useState, useMemo } from 'react';
import { useUsers, useItems, useReceipts } from '../../hooks';
import { ReceiptItem } from '../../types';
import { SignaturePad } from './SignaturePad';
import './ReceiptForm.css';

interface ReceiptFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface ItemCardProps {
  item: ReceiptItem;
  onRemove: (id: string) => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ 
  item, 
  onRemove 
}) => {
  return (
    <div className="item-card">
      <div className="item-info">
        <div className="item-name">{item.name}</div>
        <div className="item-details">
          {item.idNumber && (
            <span className="item-badge item-badge-id">
              מספר: {item.idNumber}
            </span>
          )}
          <span className="item-badge item-badge-origin">
            מקור: {item.origin}
          </span>
          <span className="item-badge item-badge-quantity">
            כמות: 1
          </span>
        </div>
      </div>
      <button 
        type="button" 
        className="btn btn-danger btn-sm item-remove-btn"
        onClick={() => onRemove(item.id)}
        title="הסר פריט"
      >
        <i className="fas fa-trash"></i>
      </button>
    </div>
  );
};

const ReceiptForm: React.FC<ReceiptFormProps> = ({ onSuccess, onCancel }) => {
  const { users } = useUsers();
  const { items: allItems } = useItems();
  const { createReceipt } = useReceipts();
  
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [signature, setSignature] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const availableItems = useMemo(() => {
    return allItems.filter(item => 
      !receiptItems.some(receiptItem => receiptItem.id === item.id)
    );
  }, [allItems, receiptItems]);

  const addItem = () => {
    if (!selectedItemId) return;
    
    const item = allItems.find(i => i.id === selectedItemId);
    if (!item) return;

    const newReceiptItem: ReceiptItem = {
      id: item.id,
      name: item.name,
      origin: item.origin,
      quantity: 1, // Always 1 since each item is unique
      subItem: '', // Not used anymore
      idNumber: item.idNumber || ''
    };
    
    setReceiptItems([...receiptItems, newReceiptItem]);
    setSelectedItemId('');
  };

  const removeItem = (id: string) => {
    setReceiptItems(items => items.filter(item => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedUser) {
      setError('יש לבחור משתמש');
      return;
    }

    if (receiptItems.length === 0) {
      setError('יש להוסיף לפחות פריט אחד');
      return;
    }

    if (!signature) {
      setError('יש לחתום על הקבלה');
      return;
    }

    setIsSubmitting(true);

    try {
      const receiptData = {
        userId: selectedUser,
        items: receiptItems,
        signature: signature,
        date: new Date().toISOString()
      };

      const success = await createReceipt(receiptData);
      if (success) {
        onSuccess();
      } else {
        setError('שגיאה ביצירת הקבלה');
      }
    } catch (error) {
      console.error('Error creating receipt:', error);
      setError('שגיאה ביצירת הקבלה');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="receipt-form-container">
      <div className="receipt-form-content">
        <form onSubmit={handleSubmit} className="receipt-form">
          {error && (
            <div className="alert alert-danger mb-4" role="alert">
              <i className="fas fa-exclamation-circle me-2"></i>
              {error}
            </div>
          )}

          {/* Form Sections */}
          <div className="form-sections">
            {/* User Selection Section */}
            <div className="form-section">
              <div className="section-header">
                <h5 className="section-title">
                  <i className="fas fa-user me-2"></i>
                  בחירת משתמש
                </h5>
              </div>
              <div className="section-content">
                <select 
                  className="form-select form-select-lg"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  required
                >
                  <option value="">בחר משתמש...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {user.rank} - {user.location}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Add Item Section */}
            <div className="form-section">
              <div className="section-header">
                <h5 className="section-title">
                  <i className="fas fa-plus-circle me-2"></i>
                  הוספת פריטים
                </h5>
              </div>
              <div className="section-content">
                <div className="add-item-row">
                  <select 
                    className="form-select"
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                  >
                    <option value="">בחר פריט להוספה...</option>
                    {availableItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.origin}) {item.idNumber && `- ${item.idNumber}`}
                      </option>
                    ))}
                  </select>
                  <button 
                    type="button" 
                    className="btn btn-success add-item-btn"
                    onClick={addItem}
                    disabled={!selectedItemId}
                  >
                    <i className="fas fa-plus me-1"></i>
                    הוסף
                  </button>
                </div>
              </div>
            </div>

            {/* Items List Section */}
            {receiptItems.length > 0 && (
              <div className="form-section">
                <div className="section-header">
                  <h5 className="section-title">
                    <i className="fas fa-list me-2"></i>
                    פריטים בקבלה ({receiptItems.length})
                  </h5>
                </div>
                <div className="section-content">
                  <div className="items-list">
                    {receiptItems.map(item => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        onRemove={removeItem}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Signature Section */}
            <div className="form-section">
              <div className="section-header">
                <h5 className="section-title">
                  <i className="fas fa-signature me-2"></i>
                  חתימה (חובה)
                </h5>
              </div>
              <div className="section-content">
                <div className="signature-container">
                  <SignaturePad onSave={setSignature} />
                  {signature && (
                    <div className="signature-success">
                      <i className="fas fa-check me-1"></i>
                      חתימה נשמרה בהצלחה
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-outline-secondary btn-lg"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <i className="fas fa-times me-2"></i>
              ביטול
            </button>
            <button 
              type="submit" 
              className="btn btn-primary btn-lg"
              disabled={isSubmitting || receiptItems.length === 0 || !selectedUser || !signature}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  יוצר קבלה...
                </>
              ) : (
                <>
                  <i className="fas fa-save me-2"></i>
                  צור קבלה
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReceiptForm;
