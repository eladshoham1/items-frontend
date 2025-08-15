import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useUsers } from '../../hooks/useUsers';
import { useAvailableItems } from '../../hooks/useAvailableItems';
import { useReceipts } from '../../hooks/useReceipts';
import { receiptService } from '../../services';
import { 
  ReceiptFormData, 
  ReceiptFormErrors, 
  AvailableItemOption, 
  ReceiptFormItem,
  ReceiptFormProps 
} from './types/receipt-form.types';
import { ReceiptFormValidation } from './utils/ReceiptFormValidation';
import UserSelector from './components/UserSelector';
import ItemSelector from './components/ItemSelector';
import SelectedItemsList from './components/SelectedItemsList';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import './ReceiptsTab.css';

const CreateReceiptForm: React.FC<ReceiptFormProps> = ({
  onSuccess,
  onCancel,
  originalReceipt = null,
  isAdmin,
  currentUser
}) => {
  // State management
  const [formData, setFormData] = useState<ReceiptFormData>({
    selectedUserId: originalReceipt?.signedById || '',
    items: []
  });
  const [errors, setErrors] = useState<ReceiptFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hooks
  const { users, loading: usersLoading } = useUsers();
  const { availableItems, loading: itemsLoading, error: itemsError } = useAvailableItems();
  const { updateReceipt, receipts } = useReceipts();

  const isUpdateMode = !!originalReceipt;

  // Permission check
  useEffect(() => {
    if (!ReceiptFormValidation.validateUserPermissions(isAdmin, isUpdateMode ? 'update' : 'create')) {
      setErrors({ general: 'אין לך הרשאה לבצע פעולה זו' });
    }
  }, [isAdmin, isUpdateMode]);

  // Initialize form data for update mode
  useEffect(() => {
    if (originalReceipt && isUpdateMode) {
      const initialItems: ReceiptFormItem[] = originalReceipt.receiptItems?.map((receiptItem: any) => ({
        id: receiptItem.itemId,
        name: receiptItem.item?.itemName?.name || 'פריט לא ידוע',
        idNumber: receiptItem.item?.idNumber || undefined,
        requiresReporting: receiptItem.item?.requiresReporting || false,
        quantity: 1, // Each receipt item is individual
        allocatedLocation: receiptItem.item?.allocatedLocation
      })) || [];

      setFormData(prev => ({
        ...prev,
        items: initialItems
      }));
    }
  }, [originalReceipt, isUpdateMode]);

  // Get items already used in other receipts (excluding current one)
  const usedItemIds = useMemo(() => {
    if (!receipts) return new Set<string>();
    
    const used = new Set<string>();
    receipts.forEach(receipt => {
      // Skip current receipt in update mode
      if (isUpdateMode && originalReceipt && receipt.id === originalReceipt.id) {
        return;
      }
      
      receipt.receiptItems?.forEach(item => {
        if (item.itemId) used.add(item.itemId);
      });
    });
    
    return used;
  }, [receipts, isUpdateMode, originalReceipt]);

  // Process available items for dropdown
  const processedAvailableItems = useMemo((): AvailableItemOption[] => {
    if (!availableItems) return [];

    return availableItems
      .filter(item => {
        // Include items from original receipt in update mode
        if (isUpdateMode && originalReceipt?.receiptItems?.some((ri: any) => ri.itemId === item.id)) {
          return true;
        }
        // Exclude items used in other receipts
        return !usedItemIds.has(item.id);
      })
      .map(item => {
        const itemName = item.itemName?.name || 'פריט לא ידוע';
        const locationText = item.allocatedLocation?.name ? ` (${item.allocatedLocation.name})` : '';
        const cipherText = item.requiresReporting ? ' - צופן' : '';
        const displayName = `${itemName}${locationText}${cipherText}`;
        
        // Calculate max quantity based on current form selections
        let maxQuantity = 1;
        if (!item.requiresReporting) {
          // For non-cipher items, count available items with same name and location
          const sameItems = availableItems.filter(ai => 
            ai.itemName?.name === item.itemName?.name &&
            ai.allocatedLocation?.id === item.allocatedLocation?.id &&
            !ai.requiresReporting &&
            !usedItemIds.has(ai.id)
          );
          
          // Subtract already selected quantities for this name+location combination
          const currentlySelected = formData.items
            .filter(fi => 
              fi.name === item.itemName?.name &&
              fi.allocatedLocation?.id === item.allocatedLocation?.id &&
              !fi.requiresReporting
            ).length; // Count individual items, not quantities
            
          maxQuantity = Math.max(0, sameItems.length - currentlySelected);
        } else {
          // For cipher items, check if already selected
          const isAlreadySelected = formData.items.some(fi => fi.id === item.id);
          maxQuantity = isAlreadySelected ? 0 : 1;
        }

        return {
          ...item,
          displayName,
          isAvailable: item.isOperational !== false && !usedItemIds.has(item.id) && maxQuantity > 0,
          maxQuantity
        };
      })
      .filter(item => item.isAvailable)
      .sort((a, b) => {
        // Sort by relevance to selected user's location
        const selectedUser = users.find(u => u.id === formData.selectedUserId);
        const userLocation = selectedUser?.location;
        
        const aRelevant = a.allocatedLocation?.name === userLocation;
        const bRelevant = b.allocatedLocation?.name === userLocation;
        
        if (aRelevant && !bRelevant) return -1;
        if (!aRelevant && bRelevant) return 1;
        
        // Then by cipher status (non-cipher first)
        if (!a.requiresReporting && b.requiresReporting) return -1;
        if (a.requiresReporting && !b.requiresReporting) return 1;
        
        // Finally alphabetically
        return a.displayName.localeCompare(b.displayName, 'he');
      });
  }, [availableItems, usedItemIds, isUpdateMode, originalReceipt, users, formData.selectedUserId, formData.items]);

  // Get users excluding current admin
  const selectableUsers = useMemo(() => 
    users.filter(user => user.id !== currentUser.id),
    [users, currentUser.id]
  );

  // Handle user selection
  const handleUserSelect = useCallback((userId: string) => {
    setFormData(prev => ({ ...prev, selectedUserId: userId }));
    setErrors(prev => ({ ...prev, selectedUserId: undefined }));
  }, []);

  // Handle adding items - completely rewrite this logic
  const handleAddItem = useCallback((item: AvailableItemOption, quantity: number) => {
    const validationError = ReceiptFormValidation.validateItemAvailability(
      item, 
      quantity, 
      formData.items.map(i => i.id)
    );
    
    if (validationError) {
      setErrors(prev => ({ ...prev, items: validationError }));
      return;
    }

    if (item.requiresReporting) {
      const newItem: ReceiptFormItem = {
        id: item.id,
        name: item.itemName?.name || 'פריט לא ידוע',
        idNumber: item.idNumber || undefined,
        requiresReporting: true,
        quantity: 1,
        allocatedLocation: item.allocatedLocation,
        maxAvailable: 1
      };
      
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }));
    } else {
      // For non-cipher items, add individual items up to the requested quantity
      const sameNameLocationItems = processedAvailableItems.filter(ai =>
        ai.itemName?.name === item.itemName?.name &&
        ai.allocatedLocation?.id === item.allocatedLocation?.id &&
        !ai.requiresReporting &&
        !formData.items.some(fi => fi.id === ai.id) // Not already selected
      );
      
      const actualQuantity = Math.min(quantity, sameNameLocationItems.length);
      const newItems: ReceiptFormItem[] = [];
      
      for (let i = 0; i < actualQuantity; i++) {
        const availableItem = sameNameLocationItems[i];
        newItems.push({
          id: availableItem.id,
          name: availableItem.itemName?.name || 'פריט לא ידוע',
          idNumber: availableItem.idNumber || undefined,
          requiresReporting: false,
          quantity: 1, // Each item is individual
          allocatedLocation: availableItem.allocatedLocation,
          maxAvailable: sameNameLocationItems.length
        });
      }
      
      if (newItems.length > 0) {
        setFormData(prev => ({
          ...prev,
          items: [...prev.items, ...newItems]
        }));
      } else {
        setErrors(prev => ({ ...prev, items: 'לא נמצאו פריטים זמינים להוספה' }));
        return;
      }
    }

    setErrors(prev => ({ ...prev, items: undefined }));
  }, [formData.items, processedAvailableItems]);

  // Handle removing items - fix the logic
  const handleRemoveItem = useCallback((itemId: string) => {
    const itemToRemove = formData.items.find(item => item.id === itemId);
    if (!itemToRemove) return;
    
    if (itemToRemove.requiresReporting) {
      // For cipher items, remove the specific item
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== itemId)
      }));
    } else {
      // For non-cipher items, remove all items with the same name+location
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter(item => 
          !(item.name === itemToRemove.name &&
            item.allocatedLocation?.id === itemToRemove.allocatedLocation?.id &&
            !item.requiresReporting)
        )
      }));
    }
  }, [formData.items]);

  // Handle quantity update - completely rewrite this logic
  const handleUpdateQuantity = useCallback((itemId: string, newQuantity: number) => {
    const targetItem = formData.items.find(item => item.id === itemId);
    if (!targetItem || targetItem.requiresReporting) return;
    
    // For non-cipher items, we need to adjust the quantity properly
    // This means we might need to add or remove items from the same name+location group
    
    setFormData(prev => {
      const sameGroupItems = prev.items.filter(item => 
        item.name === targetItem.name &&
        item.allocatedLocation?.id === targetItem.allocatedLocation?.id &&
        !item.requiresReporting
      );
      
      // Calculate current total quantity for this group
      const currentGroupQuantity = sameGroupItems.reduce((sum, item) => sum + item.quantity, 0);
      const quantityDifference = newQuantity - currentGroupQuantity;
      
      if (quantityDifference === 0) {
        return prev; // No change needed
      }
      
      // Remove all items from this group first
      const itemsWithoutGroup = prev.items.filter(item => 
        !(item.name === targetItem.name &&
          item.allocatedLocation?.id === targetItem.allocatedLocation?.id &&
          !item.requiresReporting)
      );
      
      // Add back the correct quantity
      if (newQuantity > 0) {
        // Find available items for this name+location combination
        const availableForGroup = processedAvailableItems.filter(ai =>
          ai.itemName?.name === targetItem.name &&
          ai.allocatedLocation?.id === targetItem.allocatedLocation?.id &&
          !ai.requiresReporting
        );
        
        // Add items up to the new quantity
        const newGroupItems: ReceiptFormItem[] = [];
        for (let i = 0; i < Math.min(newQuantity, availableForGroup.length); i++) {
          newGroupItems.push({
            id: availableForGroup[i].id,
            name: targetItem.name,
            idNumber: availableForGroup[i].idNumber || undefined,
            requiresReporting: false,
            quantity: 1, // Each item is individual
            allocatedLocation: targetItem.allocatedLocation,
            maxAvailable: availableForGroup.length
          });
        }
        
        return {
          ...prev,
          items: [...itemsWithoutGroup, ...newGroupItems]
        };
      } else {
        // Remove all items from this group
        return {
          ...prev,
          items: itemsWithoutGroup
        };
      }
    });
    
    setErrors(prev => ({ ...prev, items: undefined }));
  }, [formData.items, processedAvailableItems]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = ReceiptFormValidation.validateReceiptForm(
      formData, 
      selectableUsers, 
      currentUser.id
    );

    if (ReceiptFormValidation.hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Convert form items to item IDs for backend
      const itemIds: string[] = [];
      
      formData.items.forEach(formItem => {
        if (formItem.requiresReporting) {
          // Cipher items: add each item individually
          itemIds.push(formItem.id);
        } else {
          // Non-cipher items: find available items and add by quantity
          const sameItems = processedAvailableItems.filter(ai =>
            ai.itemName?.name === formItem.name &&
            ai.allocatedLocation?.id === formItem.allocatedLocation?.id &&
            !ai.requiresReporting
          );

          for (let i = 0; i < formItem.quantity && i < sameItems.length; i++) {
            itemIds.push(sameItems[i].id);
          }
        }
      });

      if (isUpdateMode && originalReceipt) {
        await updateReceipt(originalReceipt.id, {
          signedById: formData.selectedUserId,
          items: itemIds
        });
      } else {
        await receiptService.create({
          createdById: currentUser.id,
          signedById: formData.selectedUserId,
          items: itemIds
        });
      }

      onSuccess();
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 
          `שגיאה ב${isUpdateMode ? 'עדכון' : 'יצירת'} הקבלה`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (usersLoading || itemsLoading) {
    return <LoadingSpinner message="טוען נתונים..." />;
  }

  return (
    <div className="receipt-form-container" style={{ direction: 'rtl', padding: '20px' }}>
      <div className="receipt-form-header">
        <h3 style={{ marginBottom: '20px', color: '#2980b9' }}>
          {isUpdateMode ? 'עדכון קבלה' : 'יצירת קבלה חדשה'}
        </h3>
        
        {errors.general && (
          <div className="alert alert-danger">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {errors.general}
          </div>
        )}
        
        {itemsError && (
          <div className="alert alert-warning">
            <i className="fas fa-exclamation-triangle me-2"></i>
            שגיאה בטעינת הפריטים: {itemsError}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="receipt-form">
        <UserSelector
          users={selectableUsers}
          selectedUserId={formData.selectedUserId}
          onSelectUser={handleUserSelect}
          currentUserId={currentUser.id}
          error={errors.selectedUserId}
        />

        <ItemSelector
          availableItems={processedAvailableItems}
          selectedItems={formData.items}
          onAddItem={handleAddItem}
          onRemoveItem={handleRemoveItem}
          onUpdateQuantity={handleUpdateQuantity}
          error={errors.items}
        />

        <SelectedItemsList
          items={formData.items}
          onRemoveItem={handleRemoveItem}
          onUpdateQuantity={handleUpdateQuantity}
        />

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
            disabled={isSubmitting || ReceiptFormValidation.hasErrors(errors)}
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

export default CreateReceiptForm;
