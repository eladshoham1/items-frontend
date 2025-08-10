import React, { useState } from 'react';
import { useReceipts } from '../../hooks';
import { Receipt } from '../../types';

interface ReturnFormProps {
  receipt: Receipt;
  onSuccess: () => void;
  onCancel: () => void;
}

const ReturnForm: React.FC<ReturnFormProps> = ({ receipt, onSuccess, onCancel }) => {
  const { returnReceipt } = useReceipts();
  const [itemsId, setItemsId] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleCheckboxChange = (isChecked: boolean, itemId: string) => {
    setItemsId(prev => {
      const newSet = new Set(prev);
      if (isChecked) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });
  };

  const handleSubmitReturn = async () => {
    if (itemsId.size === 0) {
      setError('אנא בחר לפחות פריט אחד להחזרה');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const returnData = {
        receiptId: receipt.id,
        signature: '', // You might want to add signature support here
      };
      
      const success = await returnReceipt(returnData);
      
      if (success) {
        onSuccess();
      } else {
        setError('שגיאה בהחזרת הפריטים');
      }
    } catch (error) {
      setError('שגיאה בהחזרת הפריטים');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="withdraw-form">
      <h2>החזרת ציוד</h2>

      <table className="users-table">
        <thead>
          <tr>
            <th>שם</th>
            <th>צופן</th>
            <th>מספר צ'</th>
            <th>האם להחזיר?</th>
          </tr>
        </thead>
        <tbody>
          {receipt.receiptItems?.map((receiptItem: any) => (
            <tr key={receiptItem.id}>
              <td>{receiptItem.item?.itemName?.name || 'פריט לא ידוע'}</td>
              <td>{receiptItem.item?.isNeedReport ? 'כן' : 'לא'}</td>
              <td>{receiptItem.item?.idNumber || ''}</td>
              <td>
                <input
                  type="checkbox"
                  checked={itemsId.has(receiptItem.item.id)}
                  onChange={(e) => handleCheckboxChange(e.target.checked, receiptItem.item.id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {error && <p className="error-message" style={{color: 'red'}}>{error}</p>}

      <button 
        className="submit-btn" 
        onClick={handleSubmitReturn}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'מחזיר...' : 'החזר'}
      </button>
      <button className="cancel-btn" onClick={onCancel}>ביטול</button>
    </div>
  );
};

export default ReturnForm;
