import React, { useState, useMemo, useCallback } from 'react';
import { useUsers } from '../../hooks/useUsers';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useAvailableItems } from '../../hooks/useAvailableItems';
import { useReceipts } from '../../hooks/useReceipts';
import { receiptService } from '../../services';
import { User, Receipt } from '../../types';
import './ReceiptsTab.css';

type SortField = 'name' | 'idNumber' | 'location';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

interface ReceiptFormProps {
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

  if (items.length === 0) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '32px',
        textAlign: 'center',
        marginTop: '16px'
      }}>
        <i className="fas fa-inbox" style={{ 
          fontSize: '48px', 
          color: 'rgba(255, 255, 255, 0.3)', 
          marginBottom: '16px' 
        }}></i>
        <h5 style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>
          לא נבחרו פריטים
        </h5>
        <p style={{ color: 'rgba(255, 255, 255, 0.5)', margin: 0 }}>
          השתמש בחיפוש למעלה כדי להוסיף פריטים לקבלה
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      marginTop: '16px',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '16px 20px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        direction: 'rtl'
      }}>
        <i className="fas fa-list-ul" style={{ 
          marginLeft: '8px', 
          color: '#3b82f6',
          fontSize: '16px'
        }}></i>
        <span style={{ 
          color: 'rgba(255, 255, 255, 0.9)', 
          fontWeight: '600',
          fontSize: '16px'
        }}>
          פריטים נבחרים ({items.length})
        </span>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          direction: 'rtl'
        }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
              <th style={{ 
                width: '8%', 
                textAlign: 'center',
                padding: '12px 8px',
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: '600',
                fontSize: '14px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                #
              </th>
              <th 
                style={{ 
                  width: '42%', 
                  cursor: 'pointer',
                  padding: '12px 16px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontWeight: '600',
                  fontSize: '14px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => handleSort('name')}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  direction: 'rtl'
                }}>
                  <span>פריט</span>
                </div>
              </th>
              <th 
                style={{ 
                  width: '18%', 
                  cursor: 'pointer',
                  textAlign: 'center',
                  padding: '12px 8px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontWeight: '600',
                  fontSize: '14px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => handleSort('idNumber')}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center'
                }}>
                  <span>מספר צ'</span>
                </div>
              </th>
              <th 
                style={{ 
                  width: '22%', 
                  cursor: 'pointer',
                  textAlign: 'center',
                  padding: '12px 8px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontWeight: '600',
                  fontSize: '14px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => handleSort('location')}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center'
                }}>
                  <span>הקצאה</span>
                </div>
              </th>
              <th style={{ 
                width: '10%', 
                textAlign: 'center',
                padding: '12px 8px',
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: '600',
                fontSize: '14px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                פעולות
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((item, index) => (
              <tr 
                key={`${item.id}-${index}`}
                style={{ 
                  transition: 'all 0.2s ease',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <td style={{ 
                  textAlign: 'center', 
                  padding: '12px 8px'
                }}>
                  <span style={{
                    background: 'rgba(59, 130, 246, 0.2)',
                    color: '#3b82f6',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {index + 1}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    direction: 'rtl'
                  }}>
                    <span style={{ 
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: '500'
                    }}>
                      {item.name}
                    </span>
                    {item.requiresReporting && (
                      <span style={{ marginLeft: '8px' }}>
                        <i 
                          className="fas fa-shield-alt" 
                          style={{ 
                            color: '#ef4444',
                            fontSize: '14px'
                          }} 
                          title="פריט צופן"
                        ></i>
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ 
                  textAlign: 'center', 
                  padding: '12px 8px'
                }}>
                  {item.idNumber ? (
                    <span style={{
                      background: 'rgba(34, 197, 94, 0.2)',
                      color: '#22c55e',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {item.idNumber}
                    </span>
                  ) : (
                    <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>ללא</span>
                  )}
                </td>
                <td style={{ 
                  textAlign: 'center', 
                  padding: '12px 8px'
                }}>
                  {item.allocatedLocation?.name ? (
                    <span style={{
                      background: 'rgba(168, 85, 247, 0.2)',
                      color: '#a855f7',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {item.allocatedLocation.name}
                    </span>
                  ) : (
                    <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>ללא הקצאה</span>
                  )}
                </td>
                <td style={{ 
                  textAlign: 'center', 
                  padding: '12px 8px'
                }}>
                  <button 
                    type="button" 
                    onClick={() => onRemove(item.id)}
                    title="הסר פריט"
                    style={{
                      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                      border: 'none',
                      borderRadius: '6px',
                      width: '32px',
                      height: '32px',
                      color: 'white',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div style={{
        padding: '12px 20px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        justifyContent: 'flex-end',
        direction: 'rtl'
      }}>
        <small style={{ 
          color: 'rgba(255, 255, 255, 0.6)',
          display: 'flex',
          alignItems: 'center'
        }}>
          <i className="fas fa-info-circle" style={{ marginLeft: '6px' }}></i>
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

const ReceiptForm: React.FC<ReceiptFormProps> = ({
  onSuccess,
  onCancel,
  originalReceipt = null,
}) => {
  const { users } = useUsers();
  const { userProfile } = useUserProfile();
  const { availableItems: serverAvailableItems, loading: itemsLoading, error: itemsError } = useAvailableItems();
  const { updateReceipt, receipts } = useReceipts();
  const [selectedUserId, setSelectedUserId] = useState<string>(originalReceipt?.signedById || '');
  const [note, setNote] = useState<string>(originalReceipt?.note || '');
  const [hasChanges, setHasChanges] = useState<boolean>(false);

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
      const query = itemSearchQuery.toLowerCase().normalize('NFC');
      filteredItems = unselectedItems.filter(item => 
        (item.itemName?.name?.toLowerCase().normalize('NFC') || '').includes(query) ||
        (item.idNumber?.toLowerCase().normalize('NFC') || '').includes(query) ||
        (item.allocatedLocation?.name?.toLowerCase().normalize('NFC') || '').includes(query)
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

  // Track changes for update mode
  React.useEffect(() => {
    if (!isUpdateMode || !originalReceipt) {
      setHasChanges(false);
      return;
    }

    // Check if any field has changed
    const userChanged = selectedUserId !== originalReceipt.signedById;
    const noteChanged = (note.trim() || null) !== (originalReceipt.note || null);
    
    // Check if items changed
    const originalItems = originalReceipt.receiptItems?.map(item => item.itemId) || [];
    const currentItems = receiptItems.map(item => item.id);
    const itemsChanged = originalItems.length !== currentItems.length || 
      !originalItems.every(itemId => currentItems.includes(itemId)) ||
      !currentItems.every(itemId => originalItems.includes(itemId));

    setHasChanges(userChanged || noteChanged || itemsChanged);
  }, [selectedUserId, note, receiptItems, isUpdateMode, originalReceipt]);

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
        // Only send attributes that have changed
        const updateData: any = {};
        
        // Check if signedById changed
        if (selectedUserId !== originalReceipt.signedById) {
          updateData.signedById = selectedUserId;
        }
        
        // Check if note changed (normalize both values for comparison)
        const currentNote = note.trim() || null;
        const originalNote = originalReceipt.note || null;
        if (currentNote !== originalNote) {
          updateData.note = currentNote;
        }
        
        // Check if items changed
        const originalItems = originalReceipt.receiptItems?.map(item => item.itemId) || [];
        const currentItems = serverItems;
        
        // Compare arrays (order doesn't matter for this comparison)
        const itemsChanged = originalItems.length !== currentItems.length || 
          !originalItems.every(itemId => currentItems.includes(itemId)) ||
          !currentItems.every(itemId => originalItems.includes(itemId));
        
        if (itemsChanged) {
          updateData.items = serverItems;
        }
        
        // Only make the API call if there are changes
        if (Object.keys(updateData).length === 0) {
          setError('לא נעשו שינויים בקבלה');
          return;
        }
        
        // Update existing receipt with only changed fields
        await updateReceipt(originalReceipt.id, updateData);
      } else {
        // Create new receipt
        await receiptService.create({
          createdById: userProfile.id,
          signedById: selectedUserId,
          note: note.trim() || null,
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
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '32px',
      backdropFilter: 'blur(10px)',
      maxWidth: '900px',
      margin: '0 auto',
      direction: 'rtl'
    }}>
      <h3 style={{ 
        marginBottom: '24px', 
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: '24px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <i className="fas fa-file-plus" style={{ color: 'white', fontSize: '18px' }}></i>
        </div>
        {isUpdateMode ? 'עדכון קבלה' : 'יצירת קבלה חדשה'}
      </h3>
      
      {/* Changes indicator for update mode */}
      {isUpdateMode && hasChanges && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.05))',
          borderRadius: '12px',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          padding: '12px 16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <i className="fas fa-edit" style={{ color: '#f59e0b', fontSize: '16px' }}></i>
          <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}>
            יש לך שינויים שלא נשמרו
          </span>
        </div>
      )}
      
      {(error || itemsError) && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05))',
          borderRadius: '12px',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <i className="fas fa-exclamation-triangle" style={{ color: '#ef4444', fontSize: '16px' }}></i>
          <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            {error || itemsError}
          </span>
        </div>
      )}

      {itemsLoading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px', 
          color: 'rgba(255, 255, 255, 0.7)',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          marginBottom: '24px'
        }}>
          <i className="fas fa-spinner fa-spin" style={{ marginLeft: '8px' }}></i>
          טוען פריטים זמינים...
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* User Selection */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '8px'
          }}>
            בחר משתמש <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            required
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
              בחר משתמש...
            </option>
            {users
              .map((user: User) => (
                <option 
                  key={user.id} 
                  value={user.id}
                  style={{
                    background: '#1f2937',
                    color: 'rgba(255, 255, 255, 0.9)'
                  }}
                >
                  {user.name} ({user.personalNumber})
                  {user.id === userProfile?.id && ' - אני'}
                </option>
              ))}
          </select>
          {users.length === 0 && (
            <div style={{
              color: '#ef4444',
              fontSize: '12px',
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <i className="fas fa-exclamation-circle"></i>
              לא נמצאו משתמשים זמינים
            </div>
          )}
          {users.length > 0 && users.length === 1 && users[0].id === userProfile?.id && (
            <div style={{
              color: '#f59e0b',
              fontSize: '12px',
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <i className="fas fa-info-circle"></i>
              ניתן ליצור קבלה רק עבור עצמך כרגע
            </div>
          )}
        </div>

        {/* Note Field */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '8px'
          }}>
            הערה (אופציונלי)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="הכנס הערה או הסבר נוסף עבור הקבלה..."
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
              resize: 'vertical',
              minHeight: '80px',
              fontFamily: 'inherit',
              lineHeight: '1.5'
            }}
            onFocus={(e) => {
              (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(59, 130, 246, 0.5)';
              (e.target as HTMLTextAreaElement).style.background = 'rgba(255, 255, 255, 0.15)';
            }}
            onBlur={(e) => {
              (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(255, 255, 255, 0.2)';
              (e.target as HTMLTextAreaElement).style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '6px'
          }}>
            <small style={{ 
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '12px'
            }}>
              הערה זו תוצג בפרטי הקבלה ובדוחות
            </small>
            <small style={{ 
              color: note.length > 450 ? '#ef4444' : 'rgba(255, 255, 255, 0.6)',
              fontSize: '12px',
              fontWeight: note.length > 450 ? '600' : 'normal'
            }}>
              {note.length}/500 תווים
            </small>
          </div>
        </div>

        {/* Items Selection */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '8px'
          }}>
            הוסף פריטים <span style={{ color: '#ef4444' }}>*</span>
          </label>
          
          {/* Warning about items in other receipts */}
          {!itemsLoading && itemsInOtherReceipts.size > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.05))',
              borderRadius: '12px',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              padding: '16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <i className="fas fa-exclamation-triangle" style={{ color: '#f59e0b', fontSize: '16px' }}></i>
              <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}>
                <strong>שים לב:</strong> חלק מהפריטים אינם זמינים כיוון שהם כבר נמצאים בקבלות אחרות. 
                כל פריט יכול להיות רק בקבלה אחת בכל זמן נתון.
              </div>
            </div>
          )}
          
          {/* Searchable Item Selection */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              border: `1px solid ${selectedItemId ? 'rgba(34, 197, 94, 0.5)' : 'rgba(255, 255, 255, 0.2)'}`,
              padding: '4px',
              transition: 'all 0.2s ease'
            }}>
              <div style={{
                padding: '8px 12px',
                color: selectedItemId ? '#22c55e' : 'rgba(255, 255, 255, 0.5)'
              }}>
                <i className={`fas ${selectedItemId ? 'fa-check' : 'fa-search'}`}></i>
              </div>
              <input
                type="text"
                placeholder="חפש ובחר פריט לפי שם או מספר צ'..."
                value={itemSearchQuery}
                onChange={(e) => setItemSearchQuery(e.target.value)}
                disabled={itemsLoading}
                onFocus={() => {
                  if (selectedItemId) {
                    setSelectedItemId('');
                  }
                }}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '14px',
                  padding: '8px 4px'
                }}
              />
              {(itemSearchQuery || selectedItemId) && (
                <button
                  type="button"
                  onClick={() => {
                    setItemSearchQuery('');
                    setSelectedItemId('');
                  }}
                  title={selectedItemId ? "נקה בחירה" : "נקה חיפוש"}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.7)',
                    cursor: 'pointer',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
            
            {/* Show dropdown results only when there's a search query and no item is selected */}
            {itemSearchQuery && !selectedItemId && (
              <div style={{
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                maxHeight: '300px',
                overflowY: 'auto',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                marginTop: '8px'
              }}>
                {itemsLoading && (
                  <div style={{ 
                    padding: '12px', 
                    color: 'rgba(255, 255, 255, 0.7)',
                    textAlign: 'center'
                  }}>
                    <i className="fas fa-spinner fa-spin" style={{ marginLeft: '8px' }}></i>
                    טוען פריטים...
                  </div>
                )}
                
                {!itemsLoading && filteredAvailableItems.length === 0 && itemSearchQuery && (
                  <div style={{ 
                    padding: '12px', 
                    color: '#ef4444',
                    textAlign: 'center'
                  }}>
                    לא נמצאו פריטים התואמים לחיפוש "{itemSearchQuery}"
                  </div>
                )}
                
                {!itemsLoading && availableItems.length === 0 && !itemSearchQuery && (
                  <div style={{ 
                    padding: '12px', 
                    color: '#ef4444',
                    textAlign: 'center'
                  }}>
                    אין פריטים זמינים
                  </div>
                )}
                
                {!itemsLoading && filteredAvailableItems.length > 0 && (
                  <>
                    <div style={{ 
                      padding: '8px 12px', 
                      background: 'rgba(255, 255, 255, 0.1)', 
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.7)'
                    }}>
                      {itemSearchQuery ? 
                        `נמצאו ${filteredAvailableItems.length} פריטים מתוך ${availableItems.length}` :
                        `${availableItems.length} פריטים זמינים`
                      }
                    </div>
                    {filteredAvailableItems.map(item => {
                      const itemName = item.itemName?.name || 'ללא שם';
                      
                      return (
                        <div
                          key={item.id}
                          style={{
                            padding: '12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            transition: 'all 0.2s ease',
                            color: 'rgba(255, 255, 255, 0.9)'
                          }}
                          onClick={() => {
                            // Immediately add the item to the receipt
                            const quantityToAdd = item.requiresReporting ? 1 : selectedQuantity;
                            addItemDirectly(item, quantityToAdd);
                          }}
                        >
                          <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                            {itemName}
                            {item.requiresReporting && (
                              <span style={{
                                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                color: 'white',
                                fontSize: '10px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                marginRight: '8px',
                                fontWeight: '600'
                              }}>
                                צופן
                              </span>
                            )}
                          </div>
                          {item.idNumber && (
                            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '2px' }}>
                              מספר צ': {item.idNumber}
                            </div>
                          )}
                          {item.allocatedLocation?.name && (
                            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                              הקצאה: {item.allocatedLocation.name}
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
            <div style={{ marginTop: '16px' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(29, 78, 216, 0.05))',
                borderRadius: '12px',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                padding: '16px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <i className="fas fa-info-circle" style={{ color: '#3b82f6', fontSize: '16px' }}></i>
                  <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    פריט נבחר: <strong>{selectedItem.itemName?.name}</strong>
                    {selectedItem.requiresReporting && (
                      <span style={{
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: 'white',
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        marginRight: '8px',
                        fontWeight: '600'
                      }}>
                        צופן
                      </span>
                    )}
                  </span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={addItem}
                disabled={!selectedItem || itemsLoading}
                style={{
                  background: (!selectedItem || itemsLoading) ? 
                    'rgba(255, 255, 255, 0.1)' : 
                    'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: (!selectedItem || itemsLoading) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: (!selectedItem || itemsLoading) ? 
                    'none' : 
                    '0 4px 16px rgba(59, 130, 246, 0.3)'
                }}
              >
                <i className="fas fa-plus" style={{ marginLeft: '8px' }}></i>
                הוסף פריט
              </button>
            </div>
          )}

          {/* Selected items table */}
          <div style={{ marginTop: '24px' }}>
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
          >
            ביטול
          </button>
          <button 
            type="submit" 
            disabled={isLoading || (isUpdateMode && !hasChanges)}
            style={{
              background: (isLoading || (isUpdateMode && !hasChanges)) ? 
                'rgba(255, 255, 255, 0.1)' : 
                'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: (isLoading || (isUpdateMode && !hasChanges)) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: (isLoading || (isUpdateMode && !hasChanges)) ? 'none' : '0 4px 16px rgba(59, 130, 246, 0.3)'
            }}
            title={isUpdateMode && !hasChanges ? 'לא בוצעו שינויים' : undefined}
          >
            {isUpdateMode ? 
              (hasChanges ? 'עדכן קבלה' : 'אין שינויים') : 
              'צור קבלה'
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReceiptForm;
