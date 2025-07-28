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
        <div className="item-name">
          {item.name}
          {item.origin === 'מרת"ק' && item.quantity && item.quantity > 1 && (
            <span className="item-badge item-badge-quantity ms-2">
              כמות: {item.quantity}
            </span>
          )}
        </div>
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
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [signature, setSignature] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [itemSearchQuery, setItemSearchQuery] = useState<string>('');

  // Use server-side available items and filter out locally selected items
  const availableItems = useMemo(() => {
    return serverAvailableItems.filter(item => 
      !receiptItems.some(receiptItem => receiptItem.id === item.id)
    );
  }, [serverAvailableItems, receiptItems]);

  // Filter available items based on search query
  const filteredAvailableItems = useMemo(() => {
    if (!itemSearchQuery.trim()) {
      return availableItems;
    }
    
    const query = itemSearchQuery.toLowerCase().trim();
    return availableItems.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.origin.toLowerCase().includes(query) ||
      (item.idNumber && item.idNumber.toLowerCase().includes(query))
    );
  }, [availableItems, itemSearchQuery]);

  // Get the selected item details
  const selectedItem = useMemo(() => {
    return filteredAvailableItems.find(item => item.id === selectedItemId);
  }, [filteredAvailableItems, selectedItemId]);

  // Calculate max available quantity for מרת"ק items
  const maxAvailableQuantity = useMemo(() => {
    if (!selectedItem || selectedItem.origin !== 'מרת"ק') {
      return 1;
    }
    
    // Count how many items with the same name are available
    const sameNameItems = availableItems.filter(item => 
      item.name === selectedItem.name && item.origin === 'מרת"ק'
    );
    
    // Subtract quantities already taken for the same item name
    const alreadyTaken = receiptItems
      .filter(receiptItem => receiptItem.name === selectedItem.name && receiptItem.origin === 'מרת"ק')
      .reduce((sum, receiptItem) => sum + (receiptItem.quantity || 1), 0);
    
    return Math.max(1, sameNameItems.length - alreadyTaken);
  }, [selectedItem, availableItems, receiptItems]);

  // Update quantity when item changes
  React.useEffect(() => {
    if (selectedItem && selectedItem.origin === 'מרת"ק') {
      setSelectedQuantity(Math.min(selectedQuantity, maxAvailableQuantity));
    } else {
      setSelectedQuantity(1);
    }
  }, [selectedItem, selectedQuantity, maxAvailableQuantity]);

  const addItem = () => {
    if (!selectedItemId) return;
    
    // Find only from filtered available items
    const item = filteredAvailableItems.find(i => i.id === selectedItemId);
    if (!item) return;

    if (item.origin === 'מרת"ק') {
      // For מרת"ק items, we need to find multiple items with the same name
      const sameNameItems = availableItems.filter(availableItem => 
        availableItem.name === item.name && 
        availableItem.origin === 'מרת"ק' &&
        !receiptItems.some(receiptItem => receiptItem.id === availableItem.id)
      );
      
      // Add the selected quantity as individual items
      const newReceiptItems: ReceiptItem[] = [];
      for (let i = 0; i < selectedQuantity && i < sameNameItems.length; i++) {
        const itemToAdd = sameNameItems[i];
        newReceiptItems.push({
          id: itemToAdd.id,
          name: itemToAdd.name,
          origin: itemToAdd.origin,
          idNumber: itemToAdd.idNumber || '',
          quantity: 1 // Each item has quantity 1, but we track it for display
        });
      }
      
      setReceiptItems([...receiptItems, ...newReceiptItems]);
    } else {
      // For other items, add single item
      const newReceiptItem: ReceiptItem = {
        id: item.id,
        name: item.name,
        origin: item.origin,
        idNumber: item.idNumber || ''
      };
      
      setReceiptItems([...receiptItems, newReceiptItem]);
    }
    
    setSelectedItemId('');
    setSelectedQuantity(1);
    setItemSearchQuery(''); // Clear search when item is added
    
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
                  {/* Search Input */}
                  <div className="item-search-row mb-3">
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="fas fa-search"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="חפש פריטים לפי שם, מקור או מספר צ'..."
                        value={itemSearchQuery}
                        onChange={(e) => setItemSearchQuery(e.target.value)}
                        disabled={itemsLoading}
                      />
                      {itemSearchQuery && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setItemSearchQuery('')}
                          title="נקה חיפוש"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      )}
                    </div>
                    {itemSearchQuery && (
                      <small className="text-muted mt-1 d-block">
                        נמצאו {filteredAvailableItems.length} פריטים מתוך {availableItems.length}
                      </small>
                    )}
                  </div>
                  
                  <div className="item-select-row">
                    <select 
                      className="form-select"
                      value={selectedItemId}
                      onChange={(e) => setSelectedItemId(e.target.value)}
                      disabled={itemsLoading}
                    >
                      <option value="">
                        {itemsLoading ? 'טוען פריטים...' : 
                         itemSearchQuery ? `בחר מתוך ${filteredAvailableItems.length} פריטים שנמצאו...` :
                         'בחר פריט להוספה...'}
                      </option>
                      {!itemsLoading && filteredAvailableItems.length === 0 && itemSearchQuery && (
                        <option value="" disabled>לא נמצאו פריטים התואמים לחיפוש</option>
                      )}
                      {!itemsLoading && availableItems.length === 0 && !itemSearchQuery && (
                        <option value="" disabled>אין פריטים זמינים</option>
                      )}
                      {filteredAvailableItems.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.origin}) {item.idNumber && `- ${item.idNumber}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Quantity selector for מרת"ק items */}
                  {selectedItem && selectedItem.origin === 'מרת"ק' && (
                    <div className="quantity-select-row mt-3">
                      <label htmlFor="quantity-select" className="form-label">
                        <i className="fas fa-sort-numeric-up me-2"></i>
                        כמות (זמין: {maxAvailableQuantity})
                      </label>
                      <select
                        id="quantity-select"
                        className="form-select"
                        value={selectedQuantity}
                        onChange={(e) => setSelectedQuantity(parseInt(e.target.value))}
                        disabled={itemsLoading || maxAvailableQuantity === 0}
                      >
                        {Array.from({ length: maxAvailableQuantity }, (_, i) => i + 1).map(num => (
                          <option key={num} value={num}>
                            {num}
                          </option>
                        ))}
                      </select>
                      {maxAvailableQuantity === 0 && (
                        <small className="text-warning mt-1 d-block">
                          <i className="fas fa-exclamation-triangle me-1"></i>
                          אין כמות זמינה עבור פריט זה
                        </small>
                      )}
                    </div>
                  )}
                  
                  <div className="item-actions-row">
                    <button 
                      type="button" 
                      className="btn btn-success add-item-btn"
                      onClick={addItem}
                      disabled={!selectedItemId || itemsLoading || (selectedItem?.origin === 'מרת"ק' && maxAvailableQuantity === 0)}
                    >
                      <i className="fas fa-plus me-1"></i>
                      {selectedItem && selectedItem.origin === 'מרת"ק' && selectedQuantity > 1 
                        ? `הוסף ${selectedQuantity} פריטים`
                        : 'הוסף פריט'}
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
                    {receiptItems
                      .reduce((grouped: { item: ReceiptItem, count: number }[], item) => {
                        if (item.origin === 'מרת"ק') {
                          const existing = grouped.find(g => g.item.name === item.name && g.item.origin === 'מרת"ק');
                          if (existing) {
                            existing.count++;
                          } else {
                            grouped.push({ item: { ...item, quantity: 1 }, count: 1 });
                          }
                        } else {
                          grouped.push({ item, count: 1 });
                        }
                        return grouped;
                      }, [])
                      .map((groupedItem, index) => (
                        <ItemCard
                          key={`${groupedItem.item.name}-${groupedItem.item.origin}-${index}`}
                          item={{
                            ...groupedItem.item,
                            quantity: groupedItem.item.origin === 'מרת"ק' ? groupedItem.count : undefined
                          }}
                          onRemove={(id) => {
                            if (groupedItem.item.origin === 'מרת"ק') {
                              // Remove all items with the same name for מרת"ק
                              const itemsToRemove = receiptItems
                                .filter(receiptItem => 
                                  receiptItem.name === groupedItem.item.name && 
                                  receiptItem.origin === 'מרת"ק'
                                )
                                .map(item => item.id);
                              
                              setReceiptItems(items => 
                                items.filter(item => !itemsToRemove.includes(item.id))
                              );
                            } else {
                              removeItem(id);
                            }
                            refetchAvailableItems();
                          }}
                        />
                      ))
                    }
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
