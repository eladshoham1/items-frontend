import React, { useState, useMemo } from 'react';
import { SignaturePad } from './SignaturePad';
import { useUsers, useItems, useReceipts } from '../../hooks';
import { ReceiptItem } from '../../types';

interface ItemCardProps {
  item: ReceiptItem;
  subItemsMap: Record<string, string[]>;
  receiptItems: ReceiptItem[];
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ 
  item, 
  subItemsMap, 
  receiptItems, 
  onQuantityChange, 
  onRemove 
}) => {
  const [subItem, setSubItem] = useState(item.subItem || '');

  const handleSubItemChange = (newSubItem: string) => {
    setSubItem(newSubItem);
    onQuantityChange(item.id, item.quantity);
  };

  return (
    <div className="item-card">
      <div className="input-group">
        <label>שם פריט</label>
        <input value={item.name} disabled />
      </div>
      <div className="input-group">
        <label>מקור</label>
        <input value={item.origin} disabled />
      </div>
      <div className="input-group">
        <label>כמות</label>
        <input 
          type="number" 
          value={item.quantity} 
          onChange={(e) => onQuantityChange(item.id, parseInt(e.target.value) || 0)}
        />
      </div>
      <div className="input-group">
        <label>תת פריט</label>
        <select value={subItem} onChange={(e) => handleSubItemChange(e.target.value)}>
          <option value="">בחר תת פריט</option>
          {(subItemsMap[item.name] || []).map(sub => (
            <option key={sub} value={sub}>
              {sub}
            </option>
          ))}
        </select>
      </div>
      {item.origin === 'כ"ס' && (
        <div className="input-group">
          <label>מספר צ'</label>
          <input value={item.idNumber || ''} disabled />
        </div>
      )}
      <button type="button" className="button danger" onClick={() => onRemove(item.id)}>
        הסר
      </button>
    </div>
  );
};

interface ReceiptFormProps {
  receipt: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const ReceiptForm: React.FC<ReceiptFormProps> = ({ receipt, onSuccess, onCancel }) => {
  const { users } = useUsers();
  const { items: allItems } = useItems();
  const { createReceipt } = useReceipts();
  
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [signature, setSignature] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subItemsMap = useMemo(() => {
    return allItems.reduce((acc: Record<string, string[]>, item) => {
      if (item.subItems && item.subItems.length > 0) {
        acc[item.name] = item.subItems;
      }
      return acc;
    }, {});
  }, [allItems]);

  const addItem = (item: any) => {
    const newReceiptItem: ReceiptItem = {
      id: Date.now().toString(),
      name: item.name,
      origin: item.origin,
      quantity: 1,
      subItem: '',
      idNumber: item.idNumber || ''
    };
    setReceiptItems([...receiptItems, newReceiptItem]);
  };

  const updateItemQuantity = (id: string, quantity: number) => {
    setReceiptItems(items => 
      items.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const removeItem = (id: string) => {
    setReceiptItems(items => items.filter(item => item.id !== id));
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
      setError('יש לחתום');
      return;
    }

    setIsSubmitting(true);

    try {
      const receiptData = {
        userId: selectedUser,
        items: receiptItems,
        signature,
        date: new Date().toISOString()
      };

      const success = await createReceipt(receiptData);
      if (success) {
        onSuccess();
      } else {
        setError('שגיאה ביצירת הקבלה');
      }
    } catch (err) {
      setError('שגיאה ביצירת הקבלה');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="receipt-form" onSubmit={handleSubmit}>
      <h3>יצירת קבלה</h3>
      
      {error && <div className="error-message surface">{error}</div>}
      
      <div className="form-section">
        <h4>בחירת משתמש</h4>
        <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} required>
          <option value="">בחר משתמש</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.name} - {user.rank}
            </option>
          ))}
        </select>
      </div>

      <div className="form-section">
        <h4>בחירת פריטים</h4>
        <select onChange={(e) => {
          const selectedItem = allItems.find(item => item.id === e.target.value);
          if (selectedItem) {
            addItem(selectedItem);
            e.target.value = '';
          }
        }}>
          <option value="">בחר פריט להוספה</option>
          {allItems.map(item => (
            <option key={item.id} value={item.id}>
              {item.name} ({item.origin})
            </option>
          ))}
        </select>

        <div className="items-list">
          {receiptItems.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              subItemsMap={subItemsMap}
              receiptItems={receiptItems}
              onQuantityChange={updateItemQuantity}
              onRemove={removeItem}
            />
          ))}
        </div>
      </div>

      <div className="form-section">
        <h4>חתימה</h4>
        <SignaturePad 
          onSave={setSignature}
        />
      </div>

      <div className="form-buttons button-group">
        <button type="submit" className="button" disabled={isSubmitting}>
          {isSubmitting ? 'יוצר קבלה...' : 'צור קבלה'}
        </button>
        <button type="button" className="button secondary" onClick={onCancel}>
          ביטול
        </button>
      </div>
    </form>
  );
};

export default ReceiptForm;
