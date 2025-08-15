import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  originalReceipt?: Receipt | null;
  isAdmin: boolean;
  currentUser: User;
}

interface ReceiptFormItem {
  id: string;
  name: string;
  idNumber?: string;
  requiresReporting: boolean;
  quantity: number;
  allocatedLocation?: {
    id: string;
    name: string;
    unit?: { name: string };
  };
}

const CreateReceiptFormFixed: React.FC<CreateReceiptFormProps> = ({
  onSuccess,
  onCancel,
  originalReceipt = null,
  isAdmin,
  currentUser
}) => {
  // State management
  const [selectedUserId, setSelectedUserId] = useState<string>(originalReceipt?.signedById || '');
  const [formItems, setFormItems] = useState<ReceiptFormItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hooks
  const { users, loading: usersLoading } = useUsers();
  const { userProfile } = useUserProfile();
  const { availableItems, loading: itemsLoading, error: itemsError } = useAvailableItems();
  const { updateReceipt, receipts } = useReceipts();

  const isUpdateMode = !!originalReceipt;

  // Permission check
  if (!isAdmin) {
    return (
      <div className="alert alert-danger">
        אין לך הרשאה לבצע פעולה זו
      </div>
    );
  }

  // Get used item IDs from other receipts
  const usedItemIds = useMemo(() => {
    if (!receipts) return new Set<string>();
    
    const used = new Set<string>();
    receipts.forEach(receipt => {
      if (isUpdateMode && originalReceipt && receipt.id === originalReceipt.id) {
        return;
      }
      receipt.receiptItems?.forEach(item => {
        if (item.itemId) used.add(item.itemId);
      });
    });
    return used;
  }, [receipts, isUpdateMode, originalReceipt]);

  // Process available items
  const processedItems = useMemo(() => {
    if (!availableItems) return [];

    return availableItems
      .filter(item => {
        // Include original items in update mode
        if (isUpdateMode && originalReceipt?.receiptItems?.some((ri: any) => ri.itemId === item.id)) {
          return true;
        }
        return !usedItemIds.has(item.id);
      })
      .filter(item => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
          item.itemName?.name?.toLowerCase().includes(search) ||
          item.idNumber?.toLowerCase().includes(search) ||
          item.allocatedLocation?.name?.toLowerCase().includes(search)
        );
      })
      .map(item => {
        // Calculate how many of this item are already selected
        const alreadySelectedCount = formItems.filter(fi => 
          fi.name === item.itemName?.name &&
          fi.allocatedLocation?.id === item.allocatedLocation?.id &&
          !fi.requiresReporting
        ).length;

        // Calculate total available for this name+location
        const totalAvailableForGroup = availableItems.filter(ai =>
          ai.itemName?.name === item.itemName?.name &&
          ai.allocatedLocation?.id === item.allocatedLocation?.id &&
          !ai.requiresReporting &&
          !usedItemIds.has(ai.id)
        ).length;

        const remainingAvailable = Math.max(0, totalAvailableForGroup - alreadySelectedCount);

        return {
          ...item,
          displayName: `${item.itemName?.name || 'פריט לא ידוע'}${item.allocatedLocation?.name ? ` (${item.allocatedLocation.name})` : ''}${item.requiresReporting ? ' - צופן' : ''}`,
          maxQuantity: item.requiresReporting ? 1 : remainingAvailable,
          isAvailable: item.requiresReporting ? !formItems.some(fi => fi.id === item.id) : remainingAvailable > 0
        };
      })
      .filter(item => item.isAvailable)
      .sort((a, b) => {
        // Sort by user location first, then alphabetically
        const selectedUser = users.find(u => u.id === selectedUserId);
        const userLocation = selectedUser?.location;
        
        const aRelevant = a.allocatedLocation?.name === userLocation;
        const bRelevant = b.allocatedLocation?.name === userLocation;
        
        if (aRelevant && !bRelevant) return -1;
        if (!aRelevant && bRelevant) return 1;
        
        return a.displayName.localeCompare(b.displayName, 'he');
      });
  }, [availableItems, usedItemIds, formItems, searchTerm, users, selectedUserId, isUpdateMode, originalReceipt]);

  // Get selected item details
  const selectedItem = processedItems.find(item => item.id === selectedItemId);

  // Initialize form for update mode
  useEffect(() => {
    if (originalReceipt && isUpdateMode) {
      const initialItems: ReceiptFormItem[] = originalReceipt.receiptItems?.map((receiptItem: any) => ({
        id: receiptItem.itemId,
        name: receiptItem.item?.itemName?.name || 'פריט לא ידוע',
        idNumber: receiptItem.item?.idNumber || undefined,
        requiresReporting: receiptItem.item?.requiresReporting || false,
        quantity: 1,
        allocatedLocation: receiptItem.item?.allocatedLocation
      })) || [];

      setFormItems(initialItems);
    }
  }, [originalReceipt, isUpdateMode]);

  // Handle adding items
  const handleAddItem = () => {
    if (!selectedItem) return;

    if (selectedItem.requiresReporting) {
      // Cipher items: add individually
      setFormItems(prev => [...prev, {
        id: selectedItem.id,
        name: selectedItem.itemName?.name || 'פריט לא ידוע',
        idNumber: selectedItem.idNumber || undefined,
        requiresReporting: true,
        quantity: 1,
        allocatedLocation: selectedItem.allocatedLocation
      }]);
    } else {
      // Non-cipher items: add the requested quantity as individual items
      const sameGroupItems = processedItems.filter(pi =>
        pi.itemName?.name === selectedItem.itemName?.name &&
        pi.allocatedLocation?.id === selectedItem.allocatedLocation?.id &&
        !pi.requiresReporting &&
        !formItems.some(fi => fi.id === pi.id)
      );

      const actualQuantity = Math.min(selectedQuantity, sameGroupItems.length);
      const newItems: ReceiptFormItem[] = [];

      for (let i = 0; i < actualQuantity; i++) {
        newItems.push({
          id: sameGroupItems[i].id,
          name: sameGroupItems[i].itemName?.name || 'פריט לא ידוע',
          idNumber: sameGroupItems[i].idNumber || undefined,
          requiresReporting: false,
          quantity: 1,
          allocatedLocation: sameGroupItems[i].allocatedLocation
        });
      }

      setFormItems(prev => [...prev, ...newItems]);
    }

    // Reset selection
    setSelectedItemId('');
    setSelectedQuantity(1);
    setError(null);
  };

  // Handle removing items
  const handleRemoveItem = (itemId: string) => {
    const itemToRemove = formItems.find(item => item.id === itemId);
    if (!itemToRemove) return;

    if (itemToRemove.requiresReporting) {
      // Remove specific cipher item
      setFormItems(prev => prev.filter(item => item.id !== itemId));
    } else {
      // Remove all items with same name+location
      setFormItems(prev => prev.filter(item =>
        !(item.name === itemToRemove.name &&
          item.allocatedLocation?.id === itemToRemove.allocatedLocation?.id &&
          !item.requiresReporting)
      ));
    }
  };

  // Handle quantity change for non-cipher items
  const handleQuantityChange = (itemName: string, locationId: string | undefined, newQuantity: number) => {
    // Remove all items with this name+location
    const filteredItems = formItems.filter(item =>
      !(item.name === itemName &&
        item.allocatedLocation?.id === locationId &&
        !item.requiresReporting)
    );

    // Add back the correct quantity
    if (newQuantity > 0) {
      const availableForGroup = processedItems.filter(pi =>
        pi.itemName?.name === itemName &&
        pi.allocatedLocation?.id === locationId &&
        !pi.requiresReporting
      );

      const newItems: ReceiptFormItem[] = [];
      for (let i = 0; i < Math.min(newQuantity, availableForGroup.length); i++) {
        newItems.push({
          id: availableForGroup[i].id,
          name: itemName,
          idNumber: availableForGroup[i].idNumber || undefined,
          requiresReporting: false,
          quantity: 1,
          allocatedLocation: availableForGroup[i].allocatedLocation
        });
      }

      setFormItems([...filteredItems, ...newItems]);
    } else {
      setFormItems(filteredItems);
    }
  };

  // Group items for display
  const groupedItems = formItems.reduce((grouped: any[], item) => {
    if (item.requiresReporting) {
      grouped.push(item);
    } else {
      const existingIndex = grouped.findIndex(g =>
        g.name === item.name &&
        g.allocatedLocation?.id === item.allocatedLocation?.id &&
        !g.requiresReporting
      );

      if (existingIndex >= 0) {
        grouped[existingIndex] = {
          ...grouped[existingIndex],
          quantity: grouped[existingIndex].quantity + 1
        };
      } else {
        grouped.push({ ...item, quantity: 1 });
      }
    }
    return grouped;
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId) {
      setError('יש לבחור משתמש');
      return;
    }

    if (formItems.length === 0) {
      setError('יש לבחור לפחות פריט אחד');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const itemIds = formItems.map(item => item.id);

      if (isUpdateMode && originalReceipt) {
        await updateReceipt(originalReceipt.id, {
          signedById: selectedUserId,
          items: itemIds
        });
      } else {
        await receiptService.create({
          createdById: currentUser.id,
          signedById: selectedUserId,
          items: itemIds
        });
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : `שגיאה ב${isUpdateMode ? 'עדכון' : 'יצירת'} הקבלה`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (usersLoading || itemsLoading) {
    return (
      <div className="d-flex justify-content-center p-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">טוען...</span>
        </div>
        <span className="ms-2">טוען נתונים...</span>
      </div>
    );
  }

  return (
    <div className="receipt-form-container" style={{ direction: 'rtl', padding: '20px' }}>
      <h3 style={{ marginBottom: '20px', color: '#2980b9' }}>
        {isUpdateMode ? 'עדכון קבלה' : 'יצירת קבלה חדשה'}
      </h3>

      {(error || itemsError) && (
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error || itemsError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* User Selection */}
        <div className="form-group mb-4">
          <label className="form-label required">
            <i className="fas fa-user me-2"></i>
            בחר משתמש לקבלת הפריטים:
          </label>
          <select
            className="form-control"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            required
          >
            <option value="">בחר משתמש...</option>
            {users
              .filter(user => user.id !== currentUser.id)
              .map((user: User) => (
                <option key={user.id} value={user.id}>
                  {user.name} - {user.personalNumber}
                  {user.location && ` (${user.location})`}
                </option>
              ))}
          </select>
        </div>

        {/* Item Selection */}
        <div className="form-group mb-4">
          <label className="form-label required">
            <i className="fas fa-box me-2"></i>
            הוסף פריטים לקבלה:
          </label>

          {/* Search */}
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="חפש פריטים לפי שם, מספר צ' או מיקום..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <select
                className="form-control"
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
              >
                <option value="">בחר פריט...</option>
                {processedItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.displayName}
                    {item.idNumber && ` - צ': ${item.idNumber}`}
                  </option>
                ))}
              </select>
            </div>

            {selectedItem && !selectedItem.requiresReporting && selectedItem.maxQuantity > 1 && (
              <div className="col-md-3">
                <select
                  className="form-control"
                  value={selectedQuantity}
                  onChange={(e) => setSelectedQuantity(parseInt(e.target.value))}
                >
                  {Array.from({ length: selectedItem.maxQuantity }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="col-md-3">
              <button
                type="button"
                className="btn btn-primary w-100"
                onClick={handleAddItem}
                disabled={!selectedItem}
              >
                <i className="fas fa-plus me-2"></i>
                הוסף פריט
              </button>
            </div>
          </div>
        </div>

        {/* Selected Items Table */}
        {formItems.length > 0 && (
          <div className="form-group mb-4">
            <label className="form-label">
              <i className="fas fa-list me-2"></i>
              פריטים שנבחרו ({formItems.length}):
            </label>
            
            <div className="selected-items-table-container">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead style={{ backgroundColor: '#f8f9fa' }}>
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      <th>שם הפריט</th>
                      <th style={{ width: '120px' }}>מיקום</th>
                      <th style={{ width: '100px' }}>מספר צ'</th>
                      <th style={{ width: '80px' }}>סוג</th>
                      <th style={{ width: '120px' }}>כמות</th>
                      <th style={{ width: '100px' }}>פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedItems.map((item, index) => (
                      <tr key={item.requiresReporting ? `${item.id}-${index}` : `${item.name}-${item.allocatedLocation?.id || 'no-location'}`}>
                        <td style={{ textAlign: 'center' }}>{index + 1}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <i className={`fas ${item.requiresReporting ? 'fa-shield-alt text-warning' : 'fa-box text-success'} me-2`}></i>
                            {item.name}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {item.allocatedLocation ? (
                            <span className="badge bg-secondary">{item.allocatedLocation.name}</span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>
                          {item.idNumber || '—'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${item.requiresReporting ? 'bg-warning text-dark' : 'bg-success'}`}>
                            {item.requiresReporting ? 'צופן' : 'רגיל'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {!item.requiresReporting ? (
                            <div className="d-flex align-items-center justify-content-center gap-2">
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => handleQuantityChange(item.name, item.allocatedLocation?.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                style={{ width: '32px', height: '32px' }}
                              >
                                <i className="fas fa-minus"></i>
                              </button>
                              <span className="fw-bold">{item.quantity}</span>
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => handleQuantityChange(item.name, item.allocatedLocation?.id, item.quantity + 1)}
                                style={{ width: '32px', height: '32px' }}
                              >
                                <i className="fas fa-plus"></i>
                              </button>
                            </div>
                          ) : (
                            <span className="fw-bold">1</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="form-actions" style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '12px',
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid #e9ecef'
        }}>
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            ביטול
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin me-2"></i>
                {isUpdateMode ? 'מעדכן...' : 'יוצר...'}
              </>
            ) : (
              isUpdateMode ? 'עדכן קבלה' : 'צור קבלה'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateReceiptFormFixed;
