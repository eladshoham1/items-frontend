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
  onQuantityChange?: (id: string) => void; // simplified signature
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
              onClick={() => onQuantityChange(item.id)}
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
              onClick={() => onQuantityChange(item.id)}
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

// Define a unified interface for available items used in this form
interface AvailableItemForForm {
  id: string;
  idNumber?: string;
  itemName?: { name: string };
  isNeedReport: boolean;
}

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
  const availableItems = useMemo((): AvailableItemForForm[] => {
    if (!Array.isArray(serverAvailableItems)) {
      return [];
    }

    if (isUpdateMode && originalReceipt) {
      const originalItems: AvailableItemForForm[] = originalReceipt.receiptItems?.map(receiptItem => ({
        id: receiptItem.itemId,
        idNumber: receiptItem.item?.idNumber || undefined,
        itemName: receiptItem.item?.itemName || { name: 'פריט לא ידוע' },
        isNeedReport: receiptItem.item?.isNeedReport || false,
      })) || [];
      
      // Merge original items with available items, avoiding duplicates
      const mergedItems: AvailableItemForForm[] = [...originalItems];
      serverAvailableItems.forEach((item: any) => {
        if (!mergedItems.find(existing => existing.id === item.id)) {
          mergedItems.push({
            id: item.id,
            idNumber: item.idNumber || undefined,
            itemName: item.itemName || { name: 'Unknown Item' },
            isNeedReport: item.isNeedReport || false,
          });
        }
      });
      
      return mergedItems;
    } else {
      return serverAvailableItems.map((item: any) => ({
        id: item.id,
        idNumber: item.idNumber || undefined,
        itemName: item.itemName || { name: 'Unknown Item' },
        isNeedReport: item.isNeedReport || false,
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
        idNumber: selectedItem.idNumber || undefined,
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
        idNumber: item.idNumber || undefined,
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
                  {item.itemName?.name || 'ללא שם'} {item.isNeedReport ? '(צופן)' : ''} {item.idNumber && `- ${item.idNumber}`}
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
                disabled={itemsLoading}
              >
                {Array.from({ length: maxAvailableQuantity }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
          )}

          {/* Add button */}
          <div className="add-item-actions mt-3">
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={addItem}
              disabled={!selectedItem || itemsLoading}
            >
              <i className="fas fa-plus me-2"></i>
              הוסף פריט
            </button>
          </div>

          {/* Selected items list */}
          <div className="selected-items-list mt-3">
            {receiptItems.length === 0 ? (
              <div className="alert alert-info">
                לא נבחרו פריטים
              </div>
            ) : (
              receiptItems.map(item => (
                <ItemCard 
                  key={item.id} 
                  item={item} 
                  onRemove={removeItem}
                  onQuantityChange={() => { /* quantity controls simplified */ }}
                  maxAvailable={getMaxAvailableForItem(item.name)}
                />
              ))
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="form-actions mt-4" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>ביטול</button>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isUpdateMode ? 'עדכן קבלה' : 'צור קבלה'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateReceiptForm;
