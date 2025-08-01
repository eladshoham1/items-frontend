import React, { useState, useMemo } from 'react';
import { useUsers } from '../../hooks/useUsers';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useAvailableItems } from '../../hooks/useAvailableItems';
import { useReceipts } from '../../hooks/useReceipts';
import { receiptService } from '../../services';
import { User, Receipt } from '../../types';
import './ReceiptsTab.css';

interface CreateReceiptFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  originalReceipt?: Receipt | null; // Optional prop for updating existing receipt
}

interface ReceiptItem {
  id: string;
  name: string;
  idNumber?: string;
  isNeedReport: boolean;
  quantity?: number;
}

interface ItemCardProps {
  item: ReceiptItem;
  onRemove: (id: string) => void;
  onQuantityChange?: (id: string, newQuantity: number) => void;
  maxAvailable?: number;
}

const ItemCard: React.FC<ItemCardProps> = ({ 
  item, 
  onRemove,
  onQuantityChange,
  maxAvailable = 0
}) => {
  return (
    <div className="item-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="item-info" style={{ flex: 1 }}>
        <div className="item-name">
          {item.name}
          {item.quantity && item.quantity > 1 && (
            <span className="item-badge item-badge-quantity ms-2">
              כמות: {item.quantity}
            </span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="item-badge item-badge-origin">
            צופן: {item.isNeedReport ? 'כן' : 'לא'}
          </span>
          {item.idNumber && (
            <span className="item-badge item-badge-id">
              מספר צ': {item.idNumber}
            </span>
          )}
        </div>
        
        {/* Quantity controls for non-cipher items */}
        {!item.isNeedReport && onQuantityChange && maxAvailable > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => onQuantityChange(item.id, Math.max(1, (item.quantity || 1) - 1))}
              disabled={(item.quantity || 1) <= 1}
              style={{ 
                padding: '4px 8px', 
                minWidth: '30px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
              title="הקטן כמות"
            >
              −
            </button>
            <span style={{ 
              minWidth: '25px', 
              textAlign: 'center', 
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#495057'
            }}>
              {item.quantity || 1}
            </span>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => onQuantityChange(item.id, Math.min(maxAvailable, (item.quantity || 1) + 1))}
              disabled={(item.quantity || 1) >= maxAvailable}
              style={{ 
                padding: '4px 8px', 
                minWidth: '30px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
              title="הגדל כמות"
            >
              +
            </button>
          </div>
        )}
        
        <button 
          type="button" 
          className="btn btn-outline-danger btn-sm item-remove-btn"
          onClick={() => onRemove(item.id)}
          title="הסר פריט"
          style={{ minWidth: 'auto', padding: '2px 8px' }}
        >
          <i className="fas fa-times"></i>
          <span className="remove-text">הסר</span>
        </button>
      </div>
    </div>
  );
};

const CreateReceiptForm: React.FC<CreateReceiptFormProps> = ({
  onSuccess,
  onCancel,
  originalReceipt = null,
}) => {
  const { users } = useUsers();
  const { userProfile } = useUserProfile();
  const { availableItems: serverAvailableItems, loading: itemsLoading, error: itemsError } = useAvailableItems();
  const { updateReceipt } = useReceipts();
  const [selectedUserId, setSelectedUserId] = useState<string>(originalReceipt?.signedById || '');

  // Debug logging
  console.log('CreateReceiptForm - users:', users);
  console.log('CreateReceiptForm - userProfile:', userProfile);
  console.log('CreateReceiptForm - serverAvailableItems:', serverAvailableItems);
  
  // Item selection state
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>(
    originalReceipt?.receiptItems?.map(item => ({
      id: item.itemId,
      name: item.item?.itemName?.name || 'פריט לא ידוע',
      idNumber: item.item?.idNumber || undefined,
      isNeedReport: item.item?.isNeedReport || false,
      quantity: 1
    })) || []
  );
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [itemSearchQuery, setItemSearchQuery] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUpdateMode = !!originalReceipt;

  // Calculate available items (include original items for update mode)
  const availableItems = useMemo(() => {
    if (!Array.isArray(serverAvailableItems)) {
      return [];
    }

    if (isUpdateMode && originalReceipt) {
      const originalItems = originalReceipt.receiptItems?.map(receiptItem => ({
        id: receiptItem.itemId,
        idNumber: receiptItem.item?.idNumber || undefined,
        itemName: receiptItem.item?.itemName || { name: 'פריט לא ידוע' },
        isNeedReport: receiptItem.item?.isNeedReport || false
      })) || [];
      
      // Merge original items with available items, avoiding duplicates
      const mergedItems = [...originalItems];
      serverAvailableItems.forEach(item => {
        if (!mergedItems.find(existing => existing.id === item.id)) {
          mergedItems.push({
            id: item.id,
            idNumber: item.idNumber,
            itemName: item.itemName,
            isNeedReport: item.isNeedReport || false
          });
        }
      });
      
      return mergedItems;
    } else {
      return serverAvailableItems.map(item => ({
        id: item.id,
        idNumber: item.idNumber,
        itemName: item.itemName,
        isNeedReport: item.isNeedReport || false
      }));
    }
  }, [serverAvailableItems, isUpdateMode, originalReceipt]);

  // Filter available items based on search query and exclude already selected items
  const filteredAvailableItems = useMemo(() => {
    // First, get items that are not already selected
    const unselectedItems = availableItems.filter(item => {
      // Check if this item is already in the receipt
      const isAlreadySelected = receiptItems.some(receiptItem => receiptItem.id === item.id);
      return !isAlreadySelected;
    });

    // Then apply search filter
    if (!itemSearchQuery.trim()) {
      return unselectedItems;
    }
    
    const query = itemSearchQuery.toLowerCase();
    return unselectedItems.filter(item => 
      item.itemName?.name?.toLowerCase().includes(query) ||
      item.idNumber?.toLowerCase().includes(query)
    );
  }, [availableItems, itemSearchQuery, receiptItems]);

  // Get selected item details
  const selectedItem = useMemo(() => {
    return filteredAvailableItems.find(item => item.id === selectedItemId);
  }, [filteredAvailableItems, selectedItemId]);

  // Calculate max available quantity for items
  const maxAvailableQuantity = useMemo(() => {
    if (!selectedItem) return 0;
    
    // For cipher items (isNeedReport = true), quantity is always 1
    if (selectedItem.isNeedReport) return 1;
    
    // For non-cipher items, count how many of the same name are available and not already selected
    const sameNameItems = availableItems.filter(item =>
      item.itemName?.name === selectedItem.itemName?.name &&
      !receiptItems.some(receiptItem => receiptItem.id === item.id)
    );
    
    return sameNameItems.length;
  }, [selectedItem, availableItems, receiptItems]);

  // Add item to receipt
  const addItem = () => {
    if (!selectedItem) return;
    
    const quantityToAdd = selectedItem.isNeedReport ? 1 : selectedQuantity;
    
    // For cipher items (isNeedReport = true), add the specific item
    if (selectedItem.isNeedReport) {
      const newItem: ReceiptItem = {
        id: selectedItem.id,
        name: selectedItem.itemName?.name || 'פריט לא ידוע',
        idNumber: selectedItem.idNumber,
        isNeedReport: selectedItem.isNeedReport,
        quantity: 1
      };
      setReceiptItems(prev => [...prev, newItem]);
    } else {
      // For non-cipher items, find available items of the same name
      const sameNameItems = availableItems.filter(item =>
        item.itemName?.name === selectedItem.itemName?.name &&
        !receiptItems.some(receiptItem => receiptItem.id === item.id)
      );
      
      const itemsToAdd = sameNameItems.slice(0, quantityToAdd).map(item => ({
        id: item.id,
        name: item.itemName?.name || 'פריט לא ידוע',
        idNumber: item.idNumber,
        isNeedReport: item.isNeedReport,
        quantity: 1
      }));
      
      setReceiptItems(prev => [...prev, ...itemsToAdd]);
    }
    
    // Reset selection
    setSelectedItemId('');
    setSelectedQuantity(1);
  };

  // Remove item from receipt
  const removeItem = (itemId: string) => {
    setReceiptItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Change quantity of existing item (for non-cipher items only)
  const changeItemQuantity = (itemId: string, newQuantity: number) => {
    setReceiptItems(prev => 
      prev.map(item => 
        item.id === itemId && !item.isNeedReport 
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  // Calculate max available quantity for existing items
  const getMaxAvailableForItem = (itemName: string): number => {
    const sameNameItems = availableItems.filter(item =>
      item.itemName?.name === itemName &&
      !receiptItems.some(receiptItem => receiptItem.id === item.id)
    );
    
    // Add the current selected items of the same name to the total
    const currentItemsOfSameName = receiptItems.filter(receiptItem => 
      receiptItem.name === itemName && !receiptItem.isNeedReport
    );
    
    return sameNameItems.length + currentItemsOfSameName.length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId) {
      setError('Please select a user');
      return;
    }

    if (receiptItems.length === 0) {
      setError('Please select at least one item');
      return;
    }

    if (!userProfile?.id) {
      setError('User profile not loaded');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isUpdateMode && originalReceipt) {
        // Update existing receipt
        await updateReceipt(originalReceipt.id, {
          signedById: selectedUserId,
          items: receiptItems.map(item => item.id), // Convert to array of item IDs
        });
      } else {
        // Create new receipt
        await receiptService.create({
          createdById: userProfile.id,
          signedById: selectedUserId,
          items: receiptItems.map(item => item.id), // Convert to array of item IDs
        });
      }
      onSuccess();
    } catch (err) {
      console.error(isUpdateMode ? 'Failed to update receipt:' : 'Failed to create receipt:', err);
      setError(err instanceof Error ? err.message : (isUpdateMode ? 'Failed to update receipt' : 'Failed to create receipt'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="receipts-modal" style={{ direction: 'rtl', padding: '20px' }}>
      <h3 style={{ marginBottom: '20px', color: '#2980b9' }}>
        {isUpdateMode ? 'עדכון קבלה' : 'יצירת קבלה חדשה'}
      </h3>
      
      {(error || itemsError) && (
        <div className="alert alert-danger">
          {error || itemsError}
        </div>
      )}

      {itemsLoading && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          טוען פריטים זמינים...
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* User Selection */}
        <div className="form-group">
          <label className="form-label required">בחר משתמש:</label>
          <select
            className="form-control"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            required
          >
            <option value="">בחר משתמש...</option>
            {users
              .filter(user => user.id !== userProfile?.id) // Exclude current admin user
              .map((user: User) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.personalNumber})
                </option>
              ))}
          </select>
          {users.length === 0 && (
            <small style={{ color: '#e74c3c', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              לא נמצאו משתמשים זמינים
            </small>
          )}
          {users.length > 0 && users.filter(user => user.id !== userProfile?.id).length === 0 && (
            <small style={{ color: '#e74c3c', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              אין משתמשים אחרים זמינים
            </small>
          )}
        </div>

        {/* Items Selection */}
        <div className="form-group">
          <label className="form-label required">הוסף פריטים:</label>
          
          {/* Search Input */}
          <div className="item-search-row mb-3">
            <div className="input-group">
              <span className="input-group-text">
                <i className="fas fa-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="חפש פריטים לפי שם או מספר צ'..."
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
                  style={{ color: '#6c757d', borderColor: '#6c757d' }}
                >
                  איפוס
                </button>
              )}
            </div>
            {itemSearchQuery && (
              <small className="text-muted mt-1 d-block">
                נמצאו {filteredAvailableItems.length} פריטים זמינים מתוך {availableItems.filter(item => 
                  !receiptItems.some(receiptItem => receiptItem.id === item.id)
                ).length} סה"כ זמינים
              </small>
            )}
          </div>
          
          {/* Item Selection Dropdown */}
          <div className="item-select-row">
            <select 
              className="form-control"
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
                  {item.itemName?.name || 'ללא שם'} {item.isNeedReport ? '(צופן)' : ''} {item.idNumber && `- ${item.idNumber}`}
                </option>
              ))}
            </select>
          </div>
          
          {/* Quantity selector for non-cipher items */}
          {selectedItem && !selectedItem.isNeedReport && maxAvailableQuantity > 1 && (
            <div className="quantity-select-row mt-3">
              <label htmlFor="quantity-select" className="form-label">
                <i className="fas fa-sort-numeric-up me-2"></i>
                כמות (זמין: {maxAvailableQuantity})
              </label>
              <select
                id="quantity-select"
                className="form-control"
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
          
          {/* Add Item Button */}
          <div className="item-actions-row mt-3">
            <button 
              type="button" 
              className="btn btn-success add-item-btn"
              onClick={addItem}
              disabled={!selectedItemId || itemsLoading || maxAvailableQuantity === 0}
            >
              <i className="fas fa-plus me-1"></i>
              {selectedItem && !selectedItem.isNeedReport && selectedQuantity > 1 
                ? `הוסף ${selectedQuantity} פריטים`
                : 'הוסף פריט'}
            </button>
          </div>
        </div>

        {/* Receipt Items List */}
        {receiptItems.length > 0 && (
          <div className="form-group">
            <label className="form-label">פריטים בקבלה ({receiptItems.length}):</label>
            <div className="items-list" style={{ 
              maxHeight: '300px', 
              overflowY: 'auto', 
              border: '1px solid #ddd', 
              borderRadius: '6px',
              padding: '12px',
              background: '#f8f9fa'
            }}>
              {receiptItems
                .reduce((grouped: { item: ReceiptItem, count: number, items: ReceiptItem[] }[], item) => {
                  // For cipher items, each item should be displayed separately
                  if (item.isNeedReport) {
                    grouped.push({ 
                      item: { ...item, quantity: 1 }, 
                      count: 1, 
                      items: [item] 
                    });
                  } else {
                    // For non-cipher items, group by name
                    const existing = grouped.find(g => 
                      g.item.name === item.name && !g.item.isNeedReport
                    );
                    if (existing) {
                      existing.count++;
                      existing.items.push(item);
                    } else {
                      grouped.push({ 
                        item: { ...item, quantity: 1 }, 
                        count: 1, 
                        items: [item] 
                      });
                    }
                  }
                  return grouped;
                }, [])
                .map((groupedItem, index) => (
                  <ItemCard
                    key={groupedItem.item.isNeedReport 
                      ? `cipher-${groupedItem.item.id}-${index}` 
                      : `${groupedItem.item.name}-${index}`
                    }
                    item={{
                      ...groupedItem.item,
                      quantity: groupedItem.item.isNeedReport ? 1 : groupedItem.count
                    }}
                    onRemove={(id) => {
                      if (groupedItem.item.isNeedReport) {
                        // For cipher items, remove only the specific item
                        removeItem(groupedItem.item.id);
                      } else {
                        // For non-cipher items, remove all items with the same name
                        const itemsToRemove = receiptItems
                          .filter(receiptItem => 
                            receiptItem.name === groupedItem.item.name
                          )
                          .map(item => item.id);
                        
                        itemsToRemove.forEach(itemId => removeItem(itemId));
                      }
                    }}
                    onQuantityChange={groupedItem.item.isNeedReport ? undefined : (id, newQuantity) => {
                      const currentCount = groupedItem.count;
                      const difference = newQuantity - currentCount;
                      
                      if (difference > 0) {
                        // Add more items of the same name
                        const sameNameItems = availableItems.filter(item =>
                          item.itemName?.name === groupedItem.item.name &&
                          !receiptItems.some(receiptItem => receiptItem.id === item.id)
                        );
                        
                        const itemsToAdd = sameNameItems.slice(0, difference).map(item => ({
                          id: item.id,
                          name: item.itemName?.name || 'פריט לא ידוע',
                          idNumber: item.idNumber,
                          isNeedReport: item.isNeedReport,
                          quantity: 1
                        }));
                        
                        setReceiptItems(prev => [...prev, ...itemsToAdd]);
                      } else if (difference < 0) {
                        // Remove items of the same name
                        const itemsToRemove = receiptItems
                          .filter(receiptItem => receiptItem.name === groupedItem.item.name)
                          .slice(0, Math.abs(difference))
                          .map(item => item.id);
                        
                        itemsToRemove.forEach(itemId => removeItem(itemId));
                      }
                    }}
                    maxAvailable={groupedItem.item.isNeedReport ? 1 : getMaxAvailableForItem(groupedItem.item.name)}
                  />
                ))}
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            ביטול
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || !selectedUserId || receiptItems.length === 0 || !userProfile?.id}
          >
            {isLoading ? (isUpdateMode ? 'מעדכן...' : 'יוצר...') : (isUpdateMode ? 'עדכן קבלה' : 'צור קבלה חדשה')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateReceiptForm;
