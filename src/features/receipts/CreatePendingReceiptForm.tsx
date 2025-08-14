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
  requiresReporting?: boolean;
  quantity?: number;
  allocatedLocation?: {
    id: string;
    name: string;
    unit?: { name: string };
  };
}

interface ItemCardProps {
  item: ReceiptItem;
  onRemove: (id: string) => void;
  onUpdateQuantity?: (itemName: string, newQuantity: number, allocatedLocationId?: string) => void;
  maxAvailable?: number;
}

const ItemCard: React.FC<ItemCardProps> = ({ 
  item, 
  onRemove,
  onUpdateQuantity,
  maxAvailable = 0
}) => {
  const isCipherItem = Boolean(item.requiresReporting);
  const currentQuantity = item.quantity || 1;
  
  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, Math.min(maxAvailable, currentQuantity + delta));
    if (onUpdateQuantity && newQuantity !== currentQuantity) {
      onUpdateQuantity(item.name, newQuantity, item.allocatedLocation?.id);
    }
  };

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
            צופן: {item.requiresReporting ? 'כן' : 'לא'}
          </span>
          {item.allocatedLocation && (
            <span className="item-badge" style={{ backgroundColor: '#28a745', color: 'white' }}>
              מיקום: {item.allocatedLocation.name}
            </span>
          )}
          {item.idNumber && (
            <span className="item-badge item-badge-id">
              מספר צ': {item.idNumber}
            </span>
          )}
        </div>
        
        {/* Quantity controls for non-cipher items */}
        {!isCipherItem && onUpdateQuantity && maxAvailable > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => handleQuantityChange(-1)}
              disabled={currentQuantity <= 1}
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
              {currentQuantity}
            </span>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => handleQuantityChange(1)}
              disabled={currentQuantity >= maxAvailable}
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
  requiresReporting?: boolean;
  itemName?: { name: string };
  allocatedLocation?: {
    id: string;
    name: string;
    unit?: { name: string };
  };
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
      requiresReporting: item.item?.requiresReporting || false,
      allocatedLocation: undefined, // Will be populated from server data if available
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
        requiresReporting: receiptItem.item?.requiresReporting || false,
        allocatedLocation: undefined, // Will be populated from server data if available
      })) || [];
      
      // Merge original items with available items, avoiding duplicates
      const mergedItems: AvailableItemForForm[] = [...originalItems];
      serverAvailableItems.forEach((item: any) => {
        if (!mergedItems.find(existing => existing.id === item.id)) {
          mergedItems.push({
            id: item.id,
            idNumber: item.idNumber || undefined,
            itemName: item.itemName || { name: 'Unknown Item' },
            requiresReporting: item.requiresReporting || false,
            allocatedLocation: item.allocatedLocation || undefined,
          });
        }
      });
      
      return mergedItems;
    } else {
      return serverAvailableItems.map((item: any) => ({
        id: item.id,
        idNumber: item.idNumber || undefined,
        itemName: item.itemName || { name: 'Unknown Item' },
        requiresReporting: item.requiresReporting || false,
        allocatedLocation: item.allocatedLocation || undefined,
      }));
    }
  }, [serverAvailableItems, isUpdateMode, originalReceipt]);

  // Helper function to get current used quantity for an item
  const getUsedQuantity = (itemName: string, locationId?: string) => {
    const locationKey = locationId || 'no-location';
    return receiptItems
      .filter(receiptItem => 
        receiptItem.name === itemName && 
        !receiptItem.requiresReporting &&
        (receiptItem.allocatedLocation?.id || 'no-location') === locationKey
      )
      .reduce((sum, receiptItem) => sum + (receiptItem.quantity || 1), 0);
  };

  // Helper function to get total available quantity for an item
  const getTotalAvailable = (itemName: string, locationId?: string) => {
    const locationKey = locationId || 'no-location';
    return availableItems.filter(item =>
      item.itemName?.name === itemName &&
      !item.requiresReporting &&
      (item.allocatedLocation?.id || 'no-location') === locationKey
    ).length;
  };

  // Filter available items based on search query and exclude already selected items
  const filteredAvailableItems = useMemo(() => {
    // First, get items that are not already selected
    const unselectedItems = availableItems.filter(item => {
      // For cipher items (requiresReporting = true), exclude if already used
      if (item.requiresReporting) {
        return !receiptItems.some(receiptItem => receiptItem.id === item.id);
      }
      // For non-cipher items, only filter out if ALL quantities are used
      const usedQuantity = getUsedQuantity(item.itemName?.name || '', item.allocatedLocation?.id);
      const totalAvailable = getTotalAvailable(item.itemName?.name || '', item.allocatedLocation?.id);
      // Show the item if there are still available quantities OR if no items have been used yet
      return usedQuantity < totalAvailable;
    });

    // Then apply search filter - search in item name, ID number, and location name
    let filteredItems = unselectedItems;
    if (itemSearchQuery.trim()) {
      const query = itemSearchQuery.toLowerCase();
      filteredItems = unselectedItems.filter(item => 
        item.itemName?.name?.toLowerCase().includes(query) ||
        item.idNumber?.toLowerCase().includes(query) ||
        item.allocatedLocation?.name?.toLowerCase().includes(query)
      );
    }

    // Sort items: prioritize items allocated to the selected user's location
    const selectedUser = users.find(user => user.id === selectedUserId);
    const userLocationName = selectedUser?.location;

    return filteredItems.sort((a, b) => {
      // First priority: items allocated to the selected user's location
      const aMatchesUserLocation = a.allocatedLocation?.name === userLocationName;
      const bMatchesUserLocation = b.allocatedLocation?.name === userLocationName;
      
      if (aMatchesUserLocation && !bMatchesUserLocation) return -1;
      if (!aMatchesUserLocation && bMatchesUserLocation) return 1;
      
      // Second priority: items with allocated locations come before items without
      const aHasLocation = Boolean(a.allocatedLocation);
      const bHasLocation = Boolean(b.allocatedLocation);
      
      if (aHasLocation && !bHasLocation) return -1;
      if (!aHasLocation && bHasLocation) return 1;
      
      // Third priority: alphabetical by item name
      const aName = a.itemName?.name || '';
      const bName = b.itemName?.name || '';
      return aName.localeCompare(bName, 'he');
    });
  }, [availableItems, itemSearchQuery, receiptItems, users, selectedUserId]);

  // Get selected item details
  const selectedItem = useMemo(() => {
    return filteredAvailableItems.find(item => item.id === selectedItemId);
  }, [filteredAvailableItems, selectedItemId]);

  // Calculate max available quantity for items
  const maxAvailableQuantity = useMemo(() => {
    if (!selectedItem) return 0;
    
    // For cipher items (requiresReporting = true), quantity is always 1
    if (selectedItem.requiresReporting) return 1;
    
    // For non-cipher items, calculate remaining available quantity
    const totalAvailable = getTotalAvailable(selectedItem.itemName?.name || '', selectedItem.allocatedLocation?.id);
    const usedQuantity = getUsedQuantity(selectedItem.itemName?.name || '', selectedItem.allocatedLocation?.id);
    
    const remaining = totalAvailable - usedQuantity;
    // If this item appears in the filtered list, it means there should be at least 1 available
    const isInFilteredList = filteredAvailableItems.some(item => item.id === selectedItem.id);
    return isInFilteredList ? Math.max(1, remaining) : Math.max(0, remaining);
  }, [selectedItem, availableItems, receiptItems, filteredAvailableItems]);

  // Reset selected quantity when item changes or max available changes
  React.useEffect(() => {
    if (selectedItem && maxAvailableQuantity > 0) {
      setSelectedQuantity(prev => Math.min(prev, maxAvailableQuantity));
    } else {
      setSelectedQuantity(1);
    }
  }, [selectedItem, maxAvailableQuantity]);

  // Add item to receipt
  const addItem = () => {
    if (!selectedItem) return;
    
    const isCipherItem = Boolean(selectedItem.requiresReporting);
    
    if (isCipherItem) {
      // For cipher items, add each as individual item
      const sameNameItems = availableItems.filter(availableItem => 
        availableItem.itemName?.name === selectedItem.itemName?.name && 
        availableItem.requiresReporting &&
        !receiptItems.some(receiptItem => receiptItem.id === availableItem.id)
      );
      
      const newReceiptItems: ReceiptItem[] = [];
      for (let i = 0; i < selectedQuantity && i < sameNameItems.length; i++) {
        const itemToAdd = sameNameItems[i];
        newReceiptItems.push({
          id: itemToAdd.id,
          name: itemToAdd.itemName?.name || 'פריט לא ידוע',
          requiresReporting: itemToAdd.requiresReporting || false,
          idNumber: itemToAdd.idNumber || undefined,
          allocatedLocation: itemToAdd.allocatedLocation,
          quantity: 1
        });
      }
      setReceiptItems(prev => [...prev, ...newReceiptItems]);
    } else {
      // For non-cipher items, check if item with same name AND location already exists
      const existingItemIndex = receiptItems.findIndex(receiptItem => 
        receiptItem.name === selectedItem.itemName?.name && 
        !receiptItem.requiresReporting &&
        (receiptItem.allocatedLocation?.id || 'no-location') === (selectedItem.allocatedLocation?.id || 'no-location')
      );
      
      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        const updatedItems = [...receiptItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: (updatedItems[existingItemIndex].quantity || 1) + selectedQuantity
        };
        setReceiptItems(updatedItems);
      } else {
        // Add new item with quantity - use the specific selected item
        const newReceiptItem: ReceiptItem = {
          id: selectedItem.id,
          name: selectedItem.itemName?.name || 'פריט לא ידוע',
          requiresReporting: selectedItem.requiresReporting || false,
          idNumber: selectedItem.idNumber || undefined,
          allocatedLocation: selectedItem.allocatedLocation,
          quantity: selectedQuantity
        };
        setReceiptItems(prev => [...prev, newReceiptItem]);
      }
    }
    
    // Reset selection
    setSelectedItemId('');
    setSelectedQuantity(1);
  };

  // Remove item from receipt
  const removeItem = (itemId: string) => {
    setReceiptItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Handle quantity update for non-cipher items
  const handleUpdateQuantity = (itemName: string, newQuantity: number, allocatedLocationId?: string) => {
    const locationKey = allocatedLocationId || 'no-location';
    setReceiptItems(items => 
      items.map(item => 
        item.name === itemName && 
        !item.requiresReporting &&
        (item.allocatedLocation?.id || 'no-location') === locationKey
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
    // Reset selected item to force dropdown refresh
    setSelectedItemId('');
    setSelectedQuantity(1);
  };

  const getMaxAvailableForItem = (itemName: string, allocatedLocationId?: string): number => {
    // Find the first item with this name and location to check if it's a cipher item
    const locationKey = allocatedLocationId || 'no-location';
    const sampleItem = receiptItems.find(item => 
      item.name === itemName && 
      (item.allocatedLocation?.id || 'no-location') === locationKey
    );
    if (!sampleItem) return 0;
    
    if (sampleItem.requiresReporting) {
      // For cipher items, max is always 1
      return 1;
    }
    
    // For non-cipher items, return total available for this name and location
    return getTotalAvailable(itemName, allocatedLocationId);
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
      // Convert receipt items to server format
      const serverItems: string[] = [];
      
      receiptItems.forEach(item => {
        if (item.requiresReporting) {
          // Cipher items: add each item individually
          serverItems.push(item.id);
        } else {
          // Non-cipher items: find available items of the same name and location and add multiple instances
          const quantity = item.quantity || 1;
          const locationKey = item.allocatedLocation?.id || 'no-location';
          const availableItemsOfSameName = availableItems.filter(availableItem =>
            availableItem.itemName?.name === item.name && 
            !availableItem.requiresReporting &&
            (availableItem.allocatedLocation?.id || 'no-location') === locationKey
          );
          
          // Add item IDs up to the quantity needed
          for (let i = 0; i < quantity && i < availableItemsOfSameName.length; i++) {
            serverItems.push(availableItemsOfSameName[i].id);
          }
        }
      });

      if (isUpdateMode && originalReceipt) {
        // Update existing receipt
        await updateReceipt(originalReceipt.id, {
          signedById: selectedUserId,
          items: serverItems,
        });
      } else {
        // Create new receipt
        await receiptService.create({
          createdById: userProfile.id,
          signedById: selectedUserId,
          items: serverItems,
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
              {filteredAvailableItems.map(item => {
                const itemName = item.itemName?.name || 'ללא שם';
                const cipherSuffix = item.requiresReporting ? ' (צופן)' : '';
                const idSuffix = item.idNumber ? ` - ${item.idNumber}` : '';
                
                return (
                  <option key={item.id} value={item.id}>
                    {itemName}{cipherSuffix}{idSuffix}
                  </option>
                );
              })}
            </select>
          </div>
          
          {/* Quantity selector for items */}
          {selectedItem && !selectedItem.requiresReporting && maxAvailableQuantity > 1 && (
            <div className="quantity-select-row mt-3">
              <label htmlFor="quantity-select" className="form-label">
                <i className="fas fa-sort-numeric-up me-2"></i>
                כמות (זמין: {maxAvailableQuantity})
              </label>
              <select
                id="quantity-select"
                className="form-control"
                value={Math.min(selectedQuantity, maxAvailableQuantity)}
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
              receiptItems
                .reduce((grouped: ReceiptItem[], item) => {
                  // For cipher items (with requiresReporting = true), show each separately
                  if (item.requiresReporting) {
                    grouped.push(item);
                  } else {
                    // For non-cipher items (requiresReporting = false), group by name AND location
                    const locationKey = item.allocatedLocation?.id || 'no-location';
                    const existingIndex = grouped.findIndex(g => 
                      g.name === item.name && 
                      !g.requiresReporting &&
                      (g.allocatedLocation?.id || 'no-location') === locationKey
                    );
                    if (existingIndex >= 0) {
                      // Update quantity of existing grouped item
                      grouped[existingIndex] = {
                        ...grouped[existingIndex],
                        quantity: (grouped[existingIndex].quantity || 1) + (item.quantity || 1)
                      };
                    } else {
                      // Add new grouped item
                      grouped.push({ ...item });
                    }
                  }
                  return grouped;
                }, [])
                .map((groupedItem, index) => (
                  <ItemCard 
                    key={groupedItem.requiresReporting ? `${groupedItem.id}-${index}` : `${groupedItem.name}-${groupedItem.allocatedLocation?.id || 'no-location'}-grouped`}
                    item={groupedItem} 
                    onRemove={(id) => {
                      if (groupedItem.requiresReporting) {
                        // Remove specific cipher item
                        removeItem(groupedItem.id);
                      } else {
                        // Remove all items with the same name and location (non-cipher)
                        const locationKey = groupedItem.allocatedLocation?.id || 'no-location';
                        setReceiptItems(items => 
                          items.filter(item => 
                            !(item.name === groupedItem.name && 
                              !item.requiresReporting &&
                              (item.allocatedLocation?.id || 'no-location') === locationKey)
                          )
                        );
                      }
                    }}
                    onUpdateQuantity={!groupedItem.requiresReporting ? 
                      (itemName: string, newQuantity: number, allocatedLocationId?: string) => {
                        handleUpdateQuantity(itemName, newQuantity, allocatedLocationId);
                      } : undefined}
                    maxAvailable={getMaxAvailableForItem(groupedItem.name, groupedItem.allocatedLocation?.id)}
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
