import React, { useState, useMemo, useEffect } from 'react';
import { useUsers, useAvailableItems, useReceipts } from '../../hooks';
import { ReceiptItem, Receipt } from '../../types';
import { SignaturePad } from './SignaturePad';
import './ReceiptForm.css';

interface ReceiptFormProps {
  receipt?: Receipt | null;
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
          {item.quantity && item.quantity > 1 && (
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
            צופן: {item.idNumber ? 'כן' : 'לא'}
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

const ReceiptForm: React.FC<ReceiptFormProps> = ({ receipt, onSuccess, onCancel }) => {
  const { users } = useUsers();
  const { 
    availableItems: serverAvailableItems, 
    loading: itemsLoading, 
    error: itemsError, 
    refetch: refetchAvailableItems 
  } = useAvailableItems();
  const { createReceipt, updateReceipt } = useReceipts();
  
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [signature, setSignature] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [itemSearchQuery, setItemSearchQuery] = useState<string>('');

  // Initialize form with existing receipt data when editing
  useEffect(() => {
    if (receipt) {
      setSelectedUser(receipt.signedById);
      // Convert Receipt items to ReceiptItem format
      const convertedItems: ReceiptItem[] = receipt.items?.map(item => ({
        id: item.id,
        name: item.item?.itemName?.name || 'פריט לא ידוע',
        isNeedReport: false, // Default to false since this info is not available
        quantity: 1, // Default quantity since Receipt items don't have quantity
        note: item.item?.note
      })) || [];
      setReceiptItems(convertedItems);
      setSignature(''); // Reset signature for re-signing
    }
  }, [receipt]);
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
      (item.itemName?.name && item.itemName.name.toLowerCase().includes(query)) ||
      (item.idNumber && item.idNumber.toLowerCase().includes(query))
    );
  }, [availableItems, itemSearchQuery]);

  // Get the selected item details
  const selectedItem = useMemo(() => {
    return filteredAvailableItems.find(item => item.id === selectedItemId);
  }, [filteredAvailableItems, selectedItemId]);

  // Calculate max available quantity for items
  const maxAvailableQuantity = useMemo(() => {
    if (!selectedItem) {
      return 1;
    }
    
    // Count how many items with the same name are available
    const sameNameItems = availableItems.filter(item =>
      item.itemName?.name === selectedItem.itemName?.name
    );    // Subtract quantities already taken for the same item name
    const alreadyTaken = receiptItems
      .filter(receiptItem => receiptItem.name === selectedItem.itemName?.name)
      .reduce((sum, receiptItem) => sum + (receiptItem.quantity || 1), 0);
    
    return Math.max(1, sameNameItems.length - alreadyTaken);
  }, [selectedItem, availableItems, receiptItems]);

  // Update quantity when item changes
  React.useEffect(() => {
    if (selectedItem) {
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

    // Find multiple items with the same name for quantity handling
    const sameNameItems = availableItems.filter(availableItem => 
      availableItem.itemName?.name === item.itemName?.name && 
      !receiptItems.some(receiptItem => receiptItem.id === availableItem.id)
    );
    
    // Add the selected quantity as individual items
    const newReceiptItems: ReceiptItem[] = [];
    for (let i = 0; i < selectedQuantity && i < sameNameItems.length; i++) {
      const itemToAdd = sameNameItems[i];
      newReceiptItems.push({
        id: itemToAdd.id,
        name: itemToAdd.itemName?.name || '',
        idNumber: itemToAdd.idNumber || '',
        quantity: 1 // Each item has quantity 1, but we track it for display
      });
    }
    
    setReceiptItems([...receiptItems, ...newReceiptItems]);
    
    setSelectedItemId('');
    setSelectedQuantity(1);
    setItemSearchQuery(''); // Clear search when item is added
    
    // Refresh available items to ensure real-time updates
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
        createdById: '', // Will be set by backend based on current user
        signedById: selectedUser,
        items: receiptItems.map(item => item.id), // Convert to array of item IDs
        signature: signature,
        date: new Date().toISOString()
      };

      if (receipt) {
        // For editing, use the update method
        await updateReceipt(receipt.id, receiptData);
        refetchAvailableItems();
        onSuccess();
      } else {
        // Create new receipt
        await createReceipt(receiptData);
        refetchAvailableItems();
        onSuccess();
      }
    } catch (error: any) {
      // Handle 409 conflict error specifically
      if (error?.response?.status === 409 || error?.status === 409) {
        const conflictMessage = error?.response?.data?.message || error?.message || '';
        
        if (conflictMessage.includes('Items are not available') || conflictMessage.includes('already signed for')) {
          // Extract unavailable items from the error message
          const match = conflictMessage.match(/already signed for\): (.+)$/);
          const unavailableItems = match ? match[1] : 'פריטים מסוימים';
          
          setError(
            `שגיאה: חלק מהפריטים כבר נחתמו על ידי משתמש אחר ולא זמינים יותר.\n\n` +
            `פריטים לא זמינים: ${unavailableItems}\n\n` +
            `אנא רענן את רשימת הפריטים הזמינים והסר את הפריטים שכבר נלקחו.`
          );
          
          // Automatically refresh available items to show current state
          refetchAvailableItems();
        } else {
          // Any 409 error, even if message doesn't match expected pattern
          setError(
            `שגיאה: פריטים אינם זמינים (409 Conflict)\n\n` +
            `הודעת השרת: ${conflictMessage}\n\n` +
            `אנא רענן את רשימת הפריטים הזמינים ונסה שוב.`
          );
          refetchAvailableItems();
        }
      } else {
        // Handle other types of errors
        const errorMessage = error?.response?.data?.message || error?.message || '';
        setError(receipt ? `שגיאה בעדכון הקבלה: ${errorMessage}` : `שגיאה ביצירת הקבלה: ${errorMessage}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="receipt-form-container">
      <div className="receipt-form-content">
        <form onSubmit={handleSubmit} className="receipt-form">
          {error && (
            <div className={`alert ${error.includes('כבר נחתמו על ידי משתמש אחר') || error.includes('409 Conflict') ? 'alert-warning' : 'alert-danger'} mb-4`} role="alert">
              <div className="d-flex align-items-start">
                <i className={`fas ${error.includes('כבר נחתמו על ידי משתמש אחר') || error.includes('409 Conflict') ? 'fa-exclamation-triangle' : 'fa-exclamation-circle'} me-2 mt-1`}></i>
                <div className="flex-grow-1">
                  <div style={{ whiteSpace: 'pre-line' }}>{error}</div>
                  {(error.includes('כבר נחתמו על ידי משתמש אחר') || error.includes('409 Conflict')) && (
                    <div className="mt-3">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => {
                          refetchAvailableItems();
                          setError('');
                        }}
                      >
                        <i className="fas fa-sync-alt me-1"></i>
                        רענן פריטים זמינים
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => {
                          // Clear items that might not be available anymore
                          setReceiptItems([]);
                          setSelectedItemId('');
                          setItemSearchQuery('');
                          refetchAvailableItems();
                          setError('');
                        }}
                      >
                        <i className="fas fa-trash-alt me-1"></i>
                        נקה את כל הפריטים והתחל מחדש
                      </button>
                    </div>
                  )}
                </div>
              </div>
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
                        {user.name} - {user.unit} - {user.location}
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
                          {item.itemName?.name || 'ללא שם'} {item.idNumber ? '(צופן)' : ''} {item.idNumber && `- ${item.idNumber}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Quantity selector for items */}
                  {selectedItem && maxAvailableQuantity > 1 && (
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
                      disabled={!selectedItemId || itemsLoading || maxAvailableQuantity === 0}
                    >
                      <i className="fas fa-plus me-1"></i>
                      {selectedItem && selectedQuantity > 1 
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
                        // Group all items by name for quantity handling
                        const existing = grouped.find(g => g.item.name === item.name);
                        if (existing) {
                          existing.count++;
                        } else {
                          grouped.push({ item: { ...item, quantity: 1 }, count: 1 });
                        }
                        return grouped;
                      }, [])
                      .map((groupedItem, index) => (
                        <ItemCard
                          key={`${groupedItem.item.name}-${index}`}
                          item={{
                            ...groupedItem.item,
                            quantity: groupedItem.count
                          }}
                          onRemove={(id) => {
                            // Remove all items with the same name
                            const itemsToRemove = receiptItems
                              .filter(receiptItem => 
                                receiptItem.name === groupedItem.item.name
                              )
                              .map(item => item.id);
                            
                            setReceiptItems(items => 
                              items.filter(item => !itemsToRemove.includes(item.id))
                            );
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
                {receipt && (
                  <small className="text-muted">
                    * נדרשת חתימה חדשה לאישור השינויים
                  </small>
                )}
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
                  {receipt ? 'מעדכן קבלה...' : 'יוצר קבלה...'}
                </>
              ) : (
                <>
                  <i className={`fas ${receipt ? 'fa-edit' : 'fa-save'} me-2`}></i>
                  {receipt ? 'עדכן קבלה' : 'צור קבלה'}
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
