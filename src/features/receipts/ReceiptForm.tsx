import React, { useState, useMemo } from 'react';
import { useUsers, useAvailableItems, useReceipts } from '../../hooks';
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
              מספר צ': {item.idNumber}
            </span>
          )}
          <span className="item-badge item-badge-origin">
            מקור: {item.origin}
          </span>
        </div>
      </div>
      <button 
        type="button" 
        className="btn btn-outline-danger btn-sm item-remove-btn"
        onClick={() => onRemove(item.id)}
        title="הסר פריט"
      >
        <i className="fas fa-times"></i>
        <span className="remove-text">הסר</span>
      </button>
    </div>
  );
};

const ReceiptForm: React.FC<ReceiptFormProps> = ({ onSuccess, onCancel }) => {
  const { users } = useUsers();
  const { 
    availableItems: serverAvailableItems, 
    loading: itemsLoading, 
    error: itemsError, 
    refetch: refetchAvailableItems 
  } = useAvailableItems();
  const { createReceipt } = useReceipts();
  
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [signature, setSignature] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  // Use server-side available items and filter out locally selected items
  const availableItems = useMemo(() => {
    return serverAvailableItems.filter(item => 
      !receiptItems.some(receiptItem => receiptItem.id === item.id)
    );
  }, [serverAvailableItems, receiptItems]);

  const addItem = () => {
    if (!selectedItemId) return;
    
    // Find only from available items (no fallback to all items)
    const item = availableItems.find(i => i.id === selectedItemId);
    if (!item) return;

    const newReceiptItem: ReceiptItem = {
      id: item.id,
      name: item.name,
      origin: item.origin,
      idNumber: item.idNumber || ''
    };
    
    setReceiptItems([...receiptItems, newReceiptItem]);
    setSelectedItemId('');
    
    // Refresh available items to ensure real-time updates
    refetchAvailableItems();
  };

  const removeItem = (id: string) => {
    setReceiptItems(items => items.filter(item => item.id !== id));
    // Refresh available items when removing an item
    refetchAvailableItems();
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
        // Refresh available items after successful receipt creation
        refetchAvailableItems();
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
                <div className="user-selection-row">
                  <select 
                    className="form-select"
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
                {itemsError && (
                  <div className="alert alert-warning mb-3" role="alert">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    שגיאה בטעינת פריטים: {itemsError}
                  </div>
                )}
                <div className="add-item-section">
                  <div className="item-select-row">
                    <select 
                      className="form-select"
                      value={selectedItemId}
                      onChange={(e) => setSelectedItemId(e.target.value)}
                      disabled={itemsLoading}
                    >
                      <option value="">
                        {itemsLoading ? 'טוען פריטים...' : 'בחר פריט להוספה...'}
                      </option>
                      {!itemsLoading && availableItems.length === 0 && (
                        <option value="" disabled>אין פריטים זמינים</option>
                      )}
                      {availableItems.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.origin}) {item.idNumber && `- ${item.idNumber}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="item-actions-row">
                    <button 
                      type="button" 
                      className="btn btn-success add-item-btn"
                      onClick={addItem}
                      disabled={!selectedItemId || itemsLoading}
                    >
                      <i className="fas fa-plus me-1"></i>
                      הוסף פריט
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-outline-primary refresh-btn"
                      onClick={refetchAvailableItems}
                      disabled={itemsLoading}
                      title="רענן רשימת פריטים זמינים"
                    >
                      <i className={`fas fa-sync-alt me-1 ${itemsLoading ? 'fa-spin' : ''}`}></i>
                      {itemsLoading ? 'מרענן...' : 'רענן רשימה'}
                    </button>
                  </div>
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
                  חתימה
                </h5>
              </div>
              <div className="section-content">
                <div className="signature-selection-row">
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
