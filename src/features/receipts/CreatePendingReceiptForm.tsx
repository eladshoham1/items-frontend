import React, { useState, useEffect } from 'react';
import { useUsers } from '../../hooks/useUsers';
import { useReceipts } from '../../hooks/useReceipts';
import { receiptService } from '../../services';
import { User } from '../../types';

interface CreatePendingReceiptFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface AvailableItem {
  id: string;
  idNumber?: string;
  itemName: {
    name: string;
  };
}

const CreatePendingReceiptForm: React.FC<CreatePendingReceiptFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { users } = useUsers();
  const { createPendingReceipt } = useReceipts();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [availableItems, setAvailableItems] = useState<AvailableItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available items on component mount
  useEffect(() => {
    const fetchAvailableItems = async () => {
      try {
        const items = await receiptService.getAvailableItems();
        setAvailableItems(items);
      } catch (err) {
        console.error('Failed to fetch available items:', err);
        setError('Failed to load available items');
      }
    };

    fetchAvailableItems();
  }, []);

  const handleItemToggle = (itemId: string) => {
    setSelectedItemIds(prev => 
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId) {
      setError('Please select a user');
      return;
    }

    if (selectedItemIds.length === 0) {
      setError('Please select at least one item');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await createPendingReceipt({
        userId: selectedUserId,
        itemIds: selectedItemIds,
      });
      onSuccess();
    } catch (err) {
      console.error('Failed to create pending receipt:', err);
      setError(err instanceof Error ? err.message : 'Failed to create pending receipt');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-pending-receipt-form">
      <h3>יצירת קבלה ממתינה</h3>
      
      {error && (
        <div className="alert alert-danger mb-3">
          {error}
        </div>
      )}

      {/* User Selection */}
      <div className="form-group mb-3">
        <label className="form-label required">בחר משתמש:</label>
        <select
          className="form-control"
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          required
        >
          <option value="">בחר משתמש...</option>
          {users.map((user: User) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.personalNumber})
            </option>
          ))}
        </select>
      </div>

      {/* Items Selection */}
      <div className="form-group mb-3">
        <label className="form-label required">בחר פריטים:</label>
        <div className="items-list" style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px' }}>
          {availableItems.length === 0 ? (
            <p>אין פריטים זמינים</p>
          ) : (
            availableItems.map((item) => (
              <div key={item.id} className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`item-${item.id}`}
                  checked={selectedItemIds.includes(item.id)}
                  onChange={() => handleItemToggle(item.id)}
                />
                <label className="form-check-label" htmlFor={`item-${item.id}`}>
                  {item.itemName.name} {item.idNumber && `(${item.idNumber})`}
                </label>
              </div>
            ))
          )}
        </div>
        {selectedItemIds.length > 0 && (
          <small className="text-muted">
            נבחרו {selectedItemIds.length} פריטים
          </small>
        )}
      </div>

      {/* Form Actions */}
      <div className="d-flex justify-content-end gap-2">
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
          disabled={isLoading || !selectedUserId || selectedItemIds.length === 0}
        >
          {isLoading ? 'יוצר...' : 'צור קבלה ממתינה'}
        </button>
      </div>
    </form>
  );
};

export default CreatePendingReceiptForm;
