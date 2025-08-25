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
    <div className="form-group mb-4" style={{ direction: 'rtl', textAlign: 'right' }}>
      <label className="form-label" style={{ 
        textAlign: 'right',
        direction: 'rtl',
        color: 'rgba(255, 255, 255, 0.9)',
        display: 'block',
        width: '100%'
      }}>
        <i className="fas fa-list me-2"></i>
        פריטים שנבחרו ({items.length}):
      </label>
      
      <div className="selected-items-table-container" style={{
        background: 'rgba(255, 255, 255, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '12px',
        overflow: 'hidden',
        backdropFilter: 'blur(10px)'
      }}>
        <div className="table-header" style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          fontWeight: '600',
          color: 'rgba(255, 255, 255, 0.9)',
          direction: 'rtl',
          textAlign: 'right'
        }}>
          <div className="row align-items-center" style={{ direction: 'rtl' }}>
            <div className="col" style={{ textAlign: 'right' }}>
              <i className="fas fa-box me-2" style={{ color: '#64b5f6' }}></i>
              פריטים בקבלה
            </div>
            <div className="col-auto">
              <span style={{
                background: 'linear-gradient(135deg, #64b5f6, #42a5f5)',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {items.length} פריטים
              </span>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table style={{ 
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: 'transparent'
          }}>
            <thead style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
              <tr>
                <th style={{ 
                  width: '40px', 
                  textAlign: 'center', 
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontWeight: '600',
                  padding: '12px 8px'
                }}>#</th>
                <th style={{ 
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontWeight: '600',
                  textAlign: 'right',
                  padding: '12px 8px'
                }}>שם הפריט</th>
                <th style={{ 
                  width: '120px', 
                  textAlign: 'center', 
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontWeight: '600',
                  padding: '12px 8px'
                }}>מיקום</th>
                <th style={{ 
                  width: '100px', 
                  textAlign: 'center', 
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontWeight: '600',
                  padding: '12px 8px'
                }}>מספר צ'</th>
                <th style={{ 
                  width: '80px', 
                  textAlign: 'center', 
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontWeight: '600',
                  padding: '12px 8px'
                }}>סוג</th>
                <th style={{ 
                  width: '120px', 
                  textAlign: 'center', 
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontWeight: '600',
                  padding: '12px 8px'
                }}>כמות</th>
                <th style={{ 
                  width: '100px', 
                  textAlign: 'center', 
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontWeight: '600',
                  padding: '12px 8px'
                }}>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {groupedItems.map((item, index) => (
                <tr 
                  key={item.requiresReporting ? `${item.id}-${index}` : `${item.name}-${item.allocatedLocation?.id || 'no-location'}`}
                  style={{ 
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  {/* Row Number */}
                  <td style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '500', padding: '12px 8px' }}>
                    {index + 1}
                  </td>

                  {/* Item Name */}
                  <td style={{ fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)', textAlign: 'right', padding: '12px 8px' }}>
                    <div className="d-flex align-items-center" style={{ justifyContent: 'flex-end' }}>
                      <span>{item.name}</span>
                      <i className={`fas ${item.requiresReporting ? 'fa-shield-alt' : 'fa-box'} ms-2`} 
                         style={{ color: item.requiresReporting ? '#ffc107' : '#4caf50' }}></i>
                    </div>
                  </td>

                  {/* Location */}
                  <td style={{ textAlign: 'center', padding: '12px 8px' }}>
                    {item.allocatedLocation ? (
                      <span style={{
                        background: 'rgba(255, 255, 255, 0.15)',
                        color: 'rgba(255, 255, 255, 0.9)',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {item.allocatedLocation.name}
                      </span>
                    ) : (
                      <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>—</span>
                    )}
                  </td>

                  {/* ID Number */}
                  <td style={{ 
                    textAlign: 'center', 
                    fontFamily: 'monospace', 
                    fontSize: '14px',
                    color: item.idNumber ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.5)',
                    padding: '12px 8px'
                  }}>
                    {item.idNumber || '—'}
                  </td>

                  {/* Type (Cipher/Regular) */}
                  <td style={{ textAlign: 'center', padding: '12px 8px' }}>
                    <span style={{
                      background: item.requiresReporting 
                        ? 'linear-gradient(135deg, #ffc107, #ffb300)' 
                        : 'linear-gradient(135deg, #4caf50, #388e3c)',
                      color: item.requiresReporting ? '#000' : '#fff',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {item.requiresReporting ? 'צופן' : 'רגיל'}
                    </span>
                  </td>

                  {/* Quantity Controls */}
                  <td style={{ textAlign: 'center', padding: '12px 8px' }}>
                    {!item.requiresReporting && item.maxAvailable && item.maxAvailable > 1 ? (
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => handleQuantityChange(item, -1)}
                          disabled={item.quantity <= 1}
                          style={{ 
                            width: '32px', 
                            height: '32px', 
                            padding: '0',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: 'rgba(255, 255, 255, 0.8)',
                            borderRadius: '6px',
                            transition: 'all 0.2s ease'
                          }}
                          title="הקטן כמות"
                          onMouseEnter={(e) => {
                            if (!e.currentTarget.disabled) {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                              e.currentTarget.style.color = 'rgba(255, 255, 255, 1)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                          }}
                        >
                          <i className="fas fa-minus"></i>
                        </button>
                        
                        <span style={{ 
                          minWidth: '30px', 
                          textAlign: 'center', 
                          fontSize: '16px',
                          fontWeight: '700',
                          color: '#64b5f6'
                        }}>
                          {item.quantity}
                        </span>
                        
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => handleQuantityChange(item, 1)}
                          disabled={item.quantity >= (item.maxAvailable || 1)}
                          style={{ 
                            width: '32px', 
                            height: '32px', 
                            padding: '0',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: 'rgba(255, 255, 255, 0.8)',
                            borderRadius: '6px',
                            transition: 'all 0.2s ease'
                          }}
                          title="הגדל כמות"
                          onMouseEnter={(e) => {
                            if (!e.currentTarget.disabled) {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                              e.currentTarget.style.color = 'rgba(255, 255, 255, 1)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                          }}
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                    ) : (
                      <span style={{ 
                        fontSize: '16px',
                        fontWeight: '700',
                        color: item.requiresReporting ? '#ffc107' : '#4caf50'
                      }}>
                        {item.quantity}
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: 'center', padding: '12px 8px' }}>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => handleRemoveItem(item)}
                      title="הסר פריט"
                      style={{ 
                        minWidth: '60px',
                        background: 'rgba(244, 67, 54, 0.1)',
                        border: '1px solid rgba(244, 67, 54, 0.3)',
                        color: '#f44336',
                        borderRadius: '6px',
                        transition: 'all 0.2s ease',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(244, 67, 54, 0.2)';
                        e.currentTarget.style.borderColor = 'rgba(244, 67, 54, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(244, 67, 54, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(244, 67, 54, 0.3)';
                      }}
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
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '12px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: '14px',
          direction: 'rtl',
          textAlign: 'right'
        }}>
          <div className="row align-items-center">
            <div className="col">
              <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                <i className="fas fa-info-circle me-1"></i>
                סה"כ פריטים: <strong style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{items.length}</strong>
              </span>
            </div>
            <div className="col-auto">
              {groupedItems.some(i => i.requiresReporting) && (
                <span style={{
                  background: 'linear-gradient(135deg, #ffc107, #ffb300)',
                  color: '#000',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
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
