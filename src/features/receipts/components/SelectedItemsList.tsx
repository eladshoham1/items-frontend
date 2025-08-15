import React from 'react';
import { ReceiptFormItem } from '../types/receipt-form.types';

interface SelectedItemsListProps {
  items: ReceiptFormItem[];
  onRemoveItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
}

const SelectedItemsList: React.FC<SelectedItemsListProps> = ({
  items,
  onRemoveItem,
  onUpdateQuantity
}) => {
  // Group non-cipher items by name and location for display
  const groupedItems = items.reduce((grouped: ReceiptFormItem[], item) => {
    if (item.requiresReporting) {
      // Cipher items: show each separately
      grouped.push(item);
    } else {
      // Non-cipher items: group by name and location
      const existingIndex = grouped.findIndex(g =>
        g.name === item.name &&
        g.allocatedLocation?.id === item.allocatedLocation?.id &&
        !g.requiresReporting
      );

      if (existingIndex >= 0) {
        // Update quantity of existing group
        grouped[existingIndex] = {
          ...grouped[existingIndex],
          quantity: grouped[existingIndex].quantity + item.quantity
        };
      } else {
        // Add new group
        grouped.push({ ...item });
      }
    }
    return grouped;
  }, []);

  if (items.length === 0) {
    return (
      <div className="form-group mb-4">
        <label className="form-label">פריטים שנבחרו:</label>
        <div className="alert alert-info">
          <i className="fas fa-info-circle me-2"></i>
          לא נבחרו פריטים עדיין
        </div>
      </div>
    );
  }

  const handleQuantityChange = (item: ReceiptFormItem, delta: number) => {
    if (item.requiresReporting) return; // Cipher items can't change quantity
    
    const newQuantity = Math.max(1, Math.min(item.maxAvailable || 99, item.quantity + delta));
    if (newQuantity === item.quantity) return; // No change
    
    // For non-cipher items, we need to find the representative item ID to update
    // Since we group by name+location, we need to find one item from that group
    const representativeItem = items.find(i => 
      i.name === item.name &&
      i.allocatedLocation?.id === item.allocatedLocation?.id &&
      !i.requiresReporting
    );
    
    if (representativeItem) {
      onUpdateQuantity(representativeItem.id, newQuantity);
    }
  };

  const handleRemoveItem = (item: ReceiptFormItem) => {
    if (item.requiresReporting) {
      // Remove specific cipher item
      onRemoveItem(item.id);
    } else {
      // Remove all items with same name and location
      const itemsToRemove = items.filter(i =>
        i.name === item.name &&
        i.allocatedLocation?.id === item.allocatedLocation?.id &&
        !i.requiresReporting
      );
      itemsToRemove.forEach(i => onRemoveItem(i.id));
    }
  };

  return (
    <div className="form-group mb-4">
      <label className="form-label">
        <i className="fas fa-list me-2"></i>
        פריטים שנבחרו ({items.length}):
      </label>
      
      <div className="selected-items-table-container" style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div className="table-header" style={{
          backgroundColor: '#f8f9fa',
          padding: '12px 16px',
          borderBottom: '1px solid #e9ecef',
          fontWeight: '600',
          color: '#495057'
        }}>
          <div className="row align-items-center">
            <div className="col">
              <i className="fas fa-box me-2 text-primary"></i>
              פריטים בקבלה
            </div>
            <div className="col-auto">
              <span className="badge bg-primary">
                {items.length} פריטים
              </span>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead style={{ backgroundColor: '#f8f9fa' }}>
              <tr>
                <th style={{ width: '40px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>#</th>
                <th style={{ borderBottom: '2px solid #dee2e6' }}>שם הפריט</th>
                <th style={{ width: '120px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>מיקום</th>
                <th style={{ width: '100px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>מספר צ'</th>
                <th style={{ width: '80px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>סוג</th>
                <th style={{ width: '120px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>כמות</th>
                <th style={{ width: '100px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {groupedItems.map((item, index) => (
                <tr 
                  key={item.requiresReporting ? `${item.id}-${index}` : `${item.name}-${item.allocatedLocation?.id || 'no-location'}`}
                  style={{ borderBottom: '1px solid #f1f3f5' }}
                >
                  {/* Row Number */}
                  <td style={{ textAlign: 'center', color: '#6c757d', fontWeight: '500' }}>
                    {index + 1}
                  </td>

                  {/* Item Name */}
                  <td style={{ fontWeight: '600', color: '#333' }}>
                    <div className="d-flex align-items-center">
                      <i className={`fas ${item.requiresReporting ? 'fa-shield-alt text-warning' : 'fa-box text-success'} me-2`}></i>
                      {item.name}
                    </div>
                  </td>

                  {/* Location */}
                  <td style={{ textAlign: 'center' }}>
                    {item.allocatedLocation ? (
                      <span className="badge bg-secondary">
                        {item.allocatedLocation.name}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>

                  {/* ID Number */}
                  <td style={{ 
                    textAlign: 'center', 
                    fontFamily: 'monospace', 
                    fontSize: '14px',
                    color: item.idNumber ? '#495057' : '#6c757d'
                  }}>
                    {item.idNumber || '—'}
                  </td>

                  {/* Type (Cipher/Regular) */}
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge ${item.requiresReporting ? 'bg-warning text-dark' : 'bg-success'}`}>
                      {item.requiresReporting ? 'צופן' : 'רגיל'}
                    </span>
                  </td>

                  {/* Quantity Controls */}
                  <td style={{ textAlign: 'center' }}>
                    {!item.requiresReporting && item.maxAvailable && item.maxAvailable > 1 ? (
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => handleQuantityChange(item, -1)}
                          disabled={item.quantity <= 1}
                          style={{ width: '32px', height: '32px', padding: '0' }}
                          title="הקטן כמות"
                        >
                          <i className="fas fa-minus"></i>
                        </button>
                        
                        <span style={{ 
                          minWidth: '30px', 
                          textAlign: 'center', 
                          fontSize: '16px',
                          fontWeight: '700',
                          color: '#007bff'
                        }}>
                          {item.quantity}
                        </span>
                        
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => handleQuantityChange(item, 1)}
                          disabled={item.quantity >= (item.maxAvailable || 1)}
                          style={{ width: '32px', height: '32px', padding: '0' }}
                          title="הגדל כמות"
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                    ) : (
                      <span style={{ 
                        fontSize: '16px',
                        fontWeight: '700',
                        color: item.requiresReporting ? '#ffc107' : '#28a745'
                      }}>
                        {item.quantity}
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleRemoveItem(item)}
                      title="הסר פריט"
                      style={{ minWidth: '60px' }}
                    >
                      <i className="fas fa-trash me-1"></i>
                      הסר
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        <div className="table-footer" style={{
          backgroundColor: '#f8f9fa',
          padding: '12px 16px',
          borderTop: '1px solid #e9ecef',
          fontSize: '14px'
        }}>
          <div className="row align-items-center">
            <div className="col">
              <span className="text-muted">
                <i className="fas fa-info-circle me-1"></i>
                סה"כ פריטים: <strong>{items.length}</strong>
              </span>
            </div>
            <div className="col-auto">
              {groupedItems.some(i => i.requiresReporting) && (
                <span className="badge bg-warning text-dark">
                  <i className="fas fa-shield-alt me-1"></i>
                  כולל פריטי צופן
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectedItemsList;
