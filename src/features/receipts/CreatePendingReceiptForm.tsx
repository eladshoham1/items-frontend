import React, { useState, useMemo, useCallback } from 'react';
import { useUsers } from '../../hooks/useUsers';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useAvailableItems } from '../../hooks/useAvailableItems';
import { useReceipts } from '../../hooks/useReceipts';
import { receiptService } from '../../services';
import { User, Receipt } from '../../types';
import './ReceiptsTab.css';
import './CreatePendingReceiptForm.css';

type SortField = 'name' | 'idNumber' | 'location';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

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

interface SelectedItemsTableProps {
  items: ReceiptItem[];
  onRemove: (id: string) => void;
}

const SelectedItemsTable: React.FC<SelectedItemsTableProps> = ({ 
  items, 
  onRemove
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  // Handle sorting
  const handleSort = (field: SortField) => {
    setSortConfig(prev => {
      if (prev?.field === field) {
        // If clicking the same field, toggle direction
        return {
          field,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      } else {
        // If clicking a new field, start with ascending
        return {
          field,
          direction: 'asc'
        };
      }
    });
  };

  // Sort items based on current sort config
  const sortedItems = useMemo(() => {
    if (!sortConfig) return items;

    return [...items].sort((a, b) => {
      let aValue: string;
      let bValue: string;

      switch (sortConfig.field) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'idNumber':
          aValue = a.idNumber || '';
          bValue = b.idNumber || '';
          break;
        case 'location':
          aValue = a.allocatedLocation?.name || '';
          bValue = b.allocatedLocation?.name || '';
          break;
        default:
          return 0;
      }

      const comparison = aValue.localeCompare(bValue, 'he');
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [items, sortConfig]);

  // Get sort icon for a field
  const getSortIcon = (field: SortField) => {
    if (sortConfig?.field !== field) {
      return <i className="fas fa-sort text-muted"></i>;
    }
    return sortConfig.direction === 'asc' 
      ? <i className="fas fa-sort-up text-primary"></i>
      : <i className="fas fa-sort-down text-primary"></i>;
  };

  if (items.length === 0) {
    return (
      <div className="selected-items-empty-state">
        <div className="empty-state-content">
          <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
          <h5 className="text-muted mb-2">לא נבחרו פריטים</h5>
          <p className="text-muted mb-0">השתמש בחיפוש למעלה כדי להוסיף פריטים לקבלה</p>
        </div>
      </div>
    );
  }

  return (
    <div className="selected-items-table-container">
      <div className="table-header">
        <i className="fas fa-list-ul me-2"></i>
        פריטים נבחרים ({items.length})
      </div>
      
      <div className="table-responsive">
        <table className="table table-hover mb-0">
          <thead>
            <tr>
              <th scope="col" style={{ width: '8%' }} className="text-center">#</th>
              <th 
                scope="col" 
                style={{ width: '42%', cursor: 'pointer' }} 
                className="sortable-header"
                onClick={() => handleSort('name')}
                data-sorted={sortConfig?.field === 'name'}
              >
                <div className="d-flex align-items-center justify-content-between">
                  <span>פריט</span>
                  <div className="sort-indicator">{getSortIcon('name')}</div>
                </div>
              </th>
              <th 
                scope="col" 
                style={{ width: '18%', cursor: 'pointer' }} 
                className="text-center sortable-header"
                onClick={() => handleSort('idNumber')}
                data-sorted={sortConfig?.field === 'idNumber'}
              >
                <div className="d-flex align-items-center justify-content-center">
                  <span>מספר צ'</span>
                  <div className="sort-indicator ms-1">{getSortIcon('idNumber')}</div>
                </div>
              </th>
              <th 
                scope="col" 
                style={{ width: '22%', cursor: 'pointer' }} 
                className="text-center sortable-header"
                onClick={() => handleSort('location')}
                data-sorted={sortConfig?.field === 'location'}
              >
                <div className="d-flex align-items-center justify-content-center">
                  <span>הקצאה</span>
                  <div className="sort-indicator ms-1">{getSortIcon('location')}</div>
                </div>
              </th>
              <th scope="col" style={{ width: '10%' }} className="text-center">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((item, index) => (
              <tr key={`${item.id}-${index}`} className="selected-item-row">
                <td className="text-center">
                  <span className="row-number">{index + 1}</span>
                </td>
                <td>
                  <div className="item-name-cell">
                    <span className="item-name">{item.name}</span>
                    {item.requiresReporting && (
                      <span className="cipher-indicator ms-2">
                        <i className="fas fa-shield-alt text-danger" title="פריט צופן"></i>
                      </span>
                    )}
                  </div>
                </td>
                <td className="text-center">
                  {item.idNumber ? (
                    <span className="id-number-badge">{item.idNumber}</span>
                  ) : (
                    <span className="text-muted">ללא</span>
                  )}
                </td>
                <td className="text-center">
                  {item.allocatedLocation?.name ? (
                    <span className="location-badge">{item.allocatedLocation.name}</span>
                  ) : (
                    <span className="text-muted">ללא הקצאה</span>
                  )}
                </td>
                <td className="text-center">
                  <button 
                    type="button" 
                    className="btn btn-outline-danger btn-sm remove-btn-icon"
                    onClick={() => onRemove(item.id)}
                    title="הסר פריט"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="table-footer">
        <small className="text-muted">
          <i className="fas fa-info-circle me-1"></i>
          סה"כ {items.length} פריטים נבחרו
        </small>
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
  const { updateReceipt, receipts } = useReceipts();
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

  // Get items that are already used in other receipts (excluding current receipt in update mode)
  const itemsInOtherReceipts = useMemo(() => {
    if (!Array.isArray(receipts)) return new Set<string>();
    
    const usedItemIds = new Set<string>();
    receipts.forEach(receipt => {
      // Skip current receipt in update mode
      if (isUpdateMode && originalReceipt && receipt.id === originalReceipt.id) {
        return;
      }
      
      receipt.receiptItems?.forEach(receiptItem => {
        if (receiptItem.itemId) {
          usedItemIds.add(receiptItem.itemId);
        }
      });
    });
    
    return usedItemIds;
  }, [receipts, isUpdateMode, originalReceipt]);

  // Calculate available items (include original items for update mode, exclude items in other receipts)
  const availableItems = useMemo((): AvailableItemForForm[] => {
    if (!Array.isArray(serverAvailableItems)) {
      return [];
    }

    // Filter out items that are already in other receipts
    const filteredServerItems = serverAvailableItems.filter((item: any) => 
      !itemsInOtherReceipts.has(item.id)
    );

    if (isUpdateMode && originalReceipt) {
      const originalItems: AvailableItemForForm[] = originalReceipt.receiptItems?.map(receiptItem => ({
        id: receiptItem.itemId,
        idNumber: receiptItem.item?.idNumber || undefined,
        itemName: receiptItem.item?.itemName || { name: 'פריט לא ידוע' },
        requiresReporting: receiptItem.item?.requiresReporting || false,
        allocatedLocation: undefined, // Will be populated from server data if available
      })) || [];
      
      // Merge original items with filtered available items, avoiding duplicates
      const mergedItems: AvailableItemForForm[] = [...originalItems];
      filteredServerItems.forEach((item: any) => {
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
      return filteredServerItems.map((item: any) => ({
        id: item.id,
        idNumber: item.idNumber || undefined,
        itemName: item.itemName || { name: 'Unknown Item' },
        requiresReporting: item.requiresReporting || false,
        allocatedLocation: item.allocatedLocation || undefined,
      }));
    }
  }, [serverAvailableItems, isUpdateMode, originalReceipt, itemsInOtherReceipts]);

  // Helper function to get current used quantity for an item
  const getUsedQuantity = useCallback((itemName: string, locationId?: string) => {
    const locationKey = locationId || 'no-location';
    return receiptItems
      .filter(receiptItem => 
        receiptItem.name === itemName && 
        !receiptItem.requiresReporting &&
        (receiptItem.allocatedLocation?.id || 'no-location') === locationKey
      )
      .reduce((sum, receiptItem) => sum + (receiptItem.quantity || 1), 0);
  }, [receiptItems]);

  const filteredAvailableItems = useMemo(() => {
    // Filter out items that are already used in this receipt
    const unselectedItems = availableItems.filter(item => {
      // For ALL items (both cipher and non-cipher), exclude if THIS SPECIFIC item ID is already used
      return !receiptItems.some(receiptItem => receiptItem.id === item.id);
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

  // Calculate max available quantity for items - not needed anymore since we track individual items
  const maxAvailableQuantity = useMemo(() => {
    // Always return 1 since each item is tracked individually
    return 1;
  }, []);

  // Reset selected quantity when item changes or max available changes
  React.useEffect(() => {
    if (selectedItem && maxAvailableQuantity > 0) {
      setSelectedQuantity(prev => Math.min(prev, maxAvailableQuantity));
    } else {
      setSelectedQuantity(1);
    }
  }, [selectedItem, maxAvailableQuantity]);

  // Add item directly to receipt (used when clicking from dropdown)
  const addItemDirectly = (itemToAdd: AvailableItemForForm, quantity: number = 1) => {
    // Double-check that the item is not in another receipt
    if (itemsInOtherReceipts.has(itemToAdd.id)) {
      setError(`הפריט "${itemToAdd.itemName?.name}" כבר נמצא בקבלה אחרת ולא ניתן להוסיף אותו שוב`);
      return;
    }
    
    // Check if this specific item is already in the receipt
    if (receiptItems.some(receiptItem => receiptItem.id === itemToAdd.id)) {
      setError(`הפריט "${itemToAdd.itemName?.name}" כבר נבחר`);
      return;
    }
    
    // Add the exact item that was clicked (always quantity 1 since each item has unique ID)
    const newReceiptItem: ReceiptItem = {
      id: itemToAdd.id, // Use the exact item ID that was clicked
      name: itemToAdd.itemName?.name || 'פריט לא ידוע',
      requiresReporting: itemToAdd.requiresReporting || false,
      idNumber: itemToAdd.idNumber || undefined,
      allocatedLocation: itemToAdd.allocatedLocation,
      quantity: 1 // Always 1 since each item is unique
    };
    setReceiptItems(prev => [...prev, newReceiptItem]);
    
    // Reset selection and clear any previous errors
    setSelectedItemId('');
    setSelectedQuantity(1);
    setItemSearchQuery('');
    setError(null); // Clear error on successful add
  };

  // Add item to receipt
  const addItem = () => {
    if (!selectedItem) return;
    
    // Double-check that the item is not in another receipt
    if (itemsInOtherReceipts.has(selectedItem.id)) {
      setError(`הפריט "${selectedItem.itemName?.name}" כבר נמצא בקבלה אחרת ולא ניתן להוסיף אותו שוב`);
      return;
    }
    
    const isCipherItem = Boolean(selectedItem.requiresReporting);
    
    if (isCipherItem) {
      // For cipher items, add each as individual item but check availability
      const sameNameItems = availableItems.filter(availableItem => 
        availableItem.itemName?.name === selectedItem.itemName?.name && 
        availableItem.requiresReporting &&
        !receiptItems.some(receiptItem => receiptItem.id === availableItem.id) &&
        !itemsInOtherReceipts.has(availableItem.id) // Additional check for items in other receipts
      );
      
      const newReceiptItems: ReceiptItem[] = [];
      for (let i = 0; i < selectedQuantity && i < sameNameItems.length; i++) {
        const itemToAdd = sameNameItems[i];
        // Final validation before adding
        if (itemsInOtherReceipts.has(itemToAdd.id)) {
          setError(`הפריט "${itemToAdd.itemName?.name}" (${itemToAdd.idNumber}) כבר נמצא בקבלה אחרת`);
          return;
        }
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
        // Update quantity of existing item, but validate individual items first
        const locationKey = selectedItem.allocatedLocation?.id || 'no-location';
        const availableItemsOfSameName = availableItems.filter(availableItem =>
          availableItem.itemName?.name === selectedItem.itemName?.name && 
          !availableItem.requiresReporting &&
          (availableItem.allocatedLocation?.id || 'no-location') === locationKey &&
          !itemsInOtherReceipts.has(availableItem.id) // Check items not in other receipts
        );
        
        const currentUsed = getUsedQuantity(selectedItem.itemName?.name || '', selectedItem.allocatedLocation?.id);
        const requestedTotal = currentUsed + selectedQuantity;
        
        if (requestedTotal > availableItemsOfSameName.length) {
          setError(`לא ניתן להוסיף ${selectedQuantity} פריטים. זמין: ${availableItemsOfSameName.length - currentUsed}`);
          return;
        }
        
        const updatedItems = [...receiptItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: (updatedItems[existingItemIndex].quantity || 1) + selectedQuantity
        };
        setReceiptItems(updatedItems);
      } else {
        // Add new item with quantity - validate availability first
        const locationKey = selectedItem.allocatedLocation?.id || 'no-location';
        const availableItemsOfSameName = availableItems.filter(availableItem =>
          availableItem.itemName?.name === selectedItem.itemName?.name && 
          !availableItem.requiresReporting &&
          (availableItem.allocatedLocation?.id || 'no-location') === locationKey &&
          !itemsInOtherReceipts.has(availableItem.id) // Check items not in other receipts
        );
        
        if (selectedQuantity > availableItemsOfSameName.length) {
          setError(`לא ניתן להוסיף ${selectedQuantity} פריטים. זמין: ${availableItemsOfSameName.length}`);
          return;
        }
        
        // Final validation - make sure the specific selected item is not in another receipt
        if (itemsInOtherReceipts.has(selectedItem.id)) {
          setError(`הפריט "${selectedItem.itemName?.name}" כבר נמצא בקבלה אחרת`);
          return;
        }
        
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
    
    // Reset selection and clear any previous errors
    setSelectedItemId('');
    setSelectedQuantity(1);
    setError(null); // Clear error on successful add
  };

  // Remove item from receipt
  const removeItem = (itemId: string) => {
    setReceiptItems(prev => prev.filter(item => item.id !== itemId));
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
        // For ALL items (both cipher and non-cipher), just add the item ID
        // Since we're now tracking individual items by their unique IDs
        serverItems.push(item.id);
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
          
          {/* Warning about items in other receipts */}
          {!itemsLoading && itemsInOtherReceipts.size > 0 && (
            <div className="alert alert-warning" style={{ fontSize: '14px', marginBottom: '15px' }}>
              <i className="fas fa-exclamation-triangle me-2"></i>
              <strong>שים לב:</strong> חלק מהפריטים אינם זמינים כיוון שהם כבר נמצאים בקבלות אחרות. 
              כל פריט יכול להיות רק בקבלה אחת בכל זמן נתון.
            </div>
          )}
          
          {/* Searchable Item Selection */}
          <div className="item-select-row">
            <div className="input-group">
              <span className="input-group-text">
                <i className={`fas ${selectedItemId ? 'fa-check text-success' : 'fa-search'}`}></i>
              </span>
              <input
                type="text"
                className={`form-control ${selectedItemId ? 'border-success' : ''}`}
                placeholder="חפש ובחר פריט לפי שם או מספר צ'..."
                value={itemSearchQuery}
                onChange={(e) => setItemSearchQuery(e.target.value)}
                disabled={itemsLoading}
                onFocus={() => {
                  // Clear selection when focusing on search to show all filtered results
                  if (selectedItemId) {
                    setSelectedItemId('');
                  }
                }}
              />
              {(itemSearchQuery || selectedItemId) && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setItemSearchQuery('');
                    setSelectedItemId('');
                  }}
                  title={selectedItemId ? "נקה בחירה" : "נקה חיפוש"}
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
            
            {/* Show dropdown results only when there's a search query and no item is selected */}
            {itemSearchQuery && !selectedItemId && (
              <div className="dropdown-results mt-2" style={{
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: 'white',
                maxHeight: '300px',
                overflowY: 'auto',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                {itemsLoading && (
                  <div className="dropdown-item text-center" style={{ padding: '12px', color: '#666' }}>
                    טוען פריטים...
                  </div>
                )}
                
                {!itemsLoading && filteredAvailableItems.length === 0 && itemSearchQuery && (
                  <div className="dropdown-item text-center" style={{ padding: '12px', color: '#e74c3c' }}>
                    לא נמצאו פריטים התואמים לחיפוש "{itemSearchQuery}"
                  </div>
                )}
                
                {!itemsLoading && availableItems.length === 0 && !itemSearchQuery && (
                  <div className="dropdown-item text-center" style={{ padding: '12px', color: '#e74c3c' }}>
                    אין פריטים זמינים
                  </div>
                )}
                
                {!itemsLoading && filteredAvailableItems.length > 0 && (
                  <>
                    <div className="dropdown-header" style={{ 
                      padding: '8px 12px', 
                      backgroundColor: '#f8f9fa', 
                      borderBottom: '1px solid #ddd',
                      fontSize: '12px',
                      color: '#666'
                    }}>
                      {itemSearchQuery ? 
                        `נמצאו ${filteredAvailableItems.length} פריטים מתוך ${availableItems.length}` :
                        `${availableItems.length} פריטים זמינים`
                      }
                    </div>
                    {filteredAvailableItems.map(item => {
                      const itemName = item.itemName?.name || 'ללא שם';
                      const cipherSuffix = item.requiresReporting ? ' (צופן)' : '';
                      const idSuffix = item.idNumber ? ` - ${item.idNumber}` : '';
                      const locationSuffix = item.allocatedLocation?.name ? ` | ${item.allocatedLocation.name}` : '';
                      
                      return (
                        <div
                          key={item.id}
                          className={`dropdown-item ${selectedItemId === item.id ? 'active' : ''}`}
                          style={{
                            padding: '12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f0f0f0',
                            backgroundColor: selectedItemId === item.id ? '#007bff' : 'transparent',
                            color: selectedItemId === item.id ? 'white' : 'black'
                          }}
                          onClick={() => {
                            // Immediately add the item to the receipt
                            const quantityToAdd = item.requiresReporting ? 1 : selectedQuantity;
                            addItemDirectly(item, quantityToAdd);
                          }}
                          onMouseEnter={(e) => {
                            if (selectedItemId !== item.id) {
                              e.currentTarget.style.backgroundColor = '#f8f9fa';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedItemId !== item.id) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          <div style={{ fontWeight: 'bold' }}>
                            {itemName}{cipherSuffix}
                          </div>
                          {idSuffix && (
                            <div style={{ fontSize: '12px', opacity: '0.8' }}>
                              מספר צ': {item.idNumber}
                            </div>
                          )}
                          {locationSuffix && (
                            <div style={{ fontSize: '12px', opacity: '0.8' }}>
                              הקצאה: {item.allocatedLocation?.name}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Add button - only show if an item is selected but not immediately added */}
          {selectedItem && (
            <div className="add-item-actions mt-3">
              <div className="alert alert-info d-flex align-items-center" style={{ fontSize: '14px' }}>
                <i className="fas fa-info-circle me-2"></i>
                <span>פריט נבחר: <strong>{selectedItem.itemName?.name}</strong></span>
                {selectedItem.requiresReporting && <span className="me-2 badge bg-warning">צופן</span>}
              </div>
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
          )}

          {/* Selected items table */}
          <div className="selected-items-section mt-4">
            <SelectedItemsTable 
              items={receiptItems}
              onRemove={(id) => {
                // Remove the specific item by ID
                removeItem(id);
              }}
            />
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
