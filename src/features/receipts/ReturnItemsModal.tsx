import React, { useState } from 'react';
import { Receipt, BackendReceiptItem } from '../../types';
import { useReceipts } from '../../hooks';
import './ReturnItemsModal.css';

interface ReturnItemsModalProps {
  receipt: Receipt | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface ItemCardProps {
  item: BackendReceiptItem;
  isSelected: boolean;
  onToggle: (itemId: string) => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ 
  item, 
  isSelected,
  onToggle 
}) => {
  return (
    <div className={`return-item-card ${isSelected ? 'selected' : ''}`}>
      <div className="item-checkbox">
        <input
          type="checkbox"
          id={`item-${item.id}`}
          checked={isSelected}
          onChange={() => onToggle(item.id)}
          className="form-check-input"
        />
      </div>
      <div className="item-info">
        <div className="item-name">{item.item?.itemName?.name || 'פריט לא ידוע'}</div>
        <div className="item-details">
          {item.item?.idNumber && (
            <span className="item-badge item-badge-id">
              מספר צ': {item.item.idNumber}
            </span>
          )}
          <span className="item-badge item-badge-origin">
            צופן: לא
          </span>
          {item.item?.note && (
            <span className="item-badge item-badge-note">
              הערה: {item.item.note}
            </span>
          )}
        </div>
      </div>
      <label 
        htmlFor={`item-${item.id}`}
        className="item-toggle-label"
      >
        {isSelected ? (
          <span className="return-status selected">
            <i className="fas fa-check-circle me-1"></i>
            לחזרה
          </span>
        ) : (
          <span className="return-status unselected">
            <i className="fas fa-circle me-1"></i>
            השאר
          </span>
        )}
      </label>
    </div>
  );
};

const ReturnItemsModal: React.FC<ReturnItemsModalProps> = ({ receipt, onSuccess, onCancel }) => {
  const { returnSelectedItems } = useReceipts();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  if (!receipt) return null;

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
    
    // Clear error when user makes changes
    if (error) {
      setError('');
    }
  };

  const selectAll = () => {
    setSelectedItems(new Set(receipt.receiptItems?.map(item => item.id) || []));
    if (error) setError('');
  };

  const clearAll = () => {
    setSelectedItems(new Set());
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedItems.size === 0) {
      setError('יש לבחור לפחות פריט אחד להחזרה');
      return;
    }

    setIsSubmitting(true);

    try {
      const returnData = {
        receiptId: receipt.id,
        receiptItemIds: Array.from(selectedItems)
      };

      const success = await returnSelectedItems(returnData);
      if (success) {
        onSuccess();
      } else {
        setError('שגיאה בהחזרת הפריטים');
      }
    } catch {
      setError('שגיאה בהחזרת הפריטים');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="return-items-container">
      <div className="return-items-content">
        <form onSubmit={handleSubmit} className="return-items-form">
          {error && (
            <div className="alert alert-danger mb-4" role="alert">
              <i className="fas fa-exclamation-circle me-2"></i>
              {error}
            </div>
          )}

          {/* Receipt Info */}
          <div className="receipt-info-section">
            <div className="section-header">
              <h5 className="section-title">
                <i className="fas fa-receipt me-2"></i>
                פרטי קבלה
              </h5>
            </div>
            <div className="receipt-details">
              <div className="detail-item">
                <span className="detail-label">משתמש:</span>
                <span className="detail-value">{receipt.signedBy?.name || 'משתמש לא ידוע'} - {receipt.signedById}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">תאריך:</span>
                <span className="detail-value">
                  {new Date(receipt.createdAt).toLocaleDateString('he-IL', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">סה"כ פריטים:</span>
                <span className="detail-value">{receipt.receiptItems?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* Items Selection */}
          <div className="items-selection-section">
            <div className="section-header">
              <h5 className="section-title">
                <i className="fas fa-boxes me-2"></i>
                בחר פריטים להחזרה ({selectedItems.size} מתוך {receipt.receiptItems?.length || 0})
              </h5>
              <div className="selection-actions">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary btn-sm"
                  onClick={selectAll}
                  disabled={isSubmitting}
                >
                  <i className="fas fa-check-double me-1"></i>
                  בחר הכל
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline-secondary btn-sm"
                  onClick={clearAll}
                  disabled={isSubmitting}
                >
                  <i className="fas fa-times me-1"></i>
                  בטל בחירה
                </button>
              </div>
            </div>
            
            <div className="items-list">
              {receipt.receiptItems?.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  isSelected={selectedItems.has(item.id)}
                  onToggle={toggleItem}
                />
              )) || <div>אין פריטים זמינים</div>}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-outline-secondary btn-lg"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <i className="fas fa-times me-2"></i>
              ביטול
            </button>
            <button 
              type="submit" 
              className="btn btn-danger btn-lg"
              disabled={isSubmitting || selectedItems.size === 0}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  מחזיר פריטים...
                </>
              ) : (
                <>
                  <i className="fas fa-undo me-2"></i>
                  החזר {selectedItems.size} פריטים
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReturnItemsModal;
