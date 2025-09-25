import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { Receipt } from '../../types';
import Modal from '../../shared/components/Modal';

interface ModalReceiptItem {
  name: string;
  idNumber?: string;
  requiresReporting?: boolean;
  note?: string;
  // Add location info if available in the future
}

interface MergedModalReceiptItem {
  name: string;
  idNumber?: string;
  requiresReporting?: boolean;
  note?: string;
  quantity: number;
  originalItems: ModalReceiptItem[];
}

interface ReceiptDetailsModalProps {
  receipt: Receipt | null;
  isOpen: boolean;
  onClose: () => void;
}

// Function to merge items with identical attributes for display
const mergeModalReceiptItems = (items: ModalReceiptItem[]): MergedModalReceiptItem[] => {
  const mergedMap = new Map<string, MergedModalReceiptItem>();

  items.forEach(item => {
    // Create a unique key based on name, idNumber, requiresReporting, and note
    const idNumber = item.idNumber || 'no-id';
    const note = item.note || 'no-note';
    const key = `${item.name}-${idNumber}-${item.requiresReporting}-${note}`;

    if (mergedMap.has(key)) {
      const existingItem = mergedMap.get(key)!;
      existingItem.quantity += 1;
      existingItem.originalItems.push(item);
    } else {
      mergedMap.set(key, {
        name: item.name,
        idNumber: item.idNumber,
        requiresReporting: item.requiresReporting,
        note: item.note,
        quantity: 1,
        originalItems: [item]
      });
    }
  });

  return Array.from(mergedMap.values());
};

const ReceiptDetailsModal: React.FC<ReceiptDetailsModalProps> = ({
  receipt,
  isOpen,
  onClose
}) => {
  // Convert receipt items to modal format and merge identical ones
  const modalItems: ModalReceiptItem[] = useMemo(() => {
    if (!receipt?.receiptItems) return [];
    
    return receipt.receiptItems.map(receiptItem => ({
      name: receiptItem.item?.itemName?.name || 'פריט לא ידוע',
      idNumber: receiptItem.item?.idNumber || undefined,
      requiresReporting: receiptItem.item?.requiresReporting || false,
      note: receiptItem.item?.note || undefined
    }));
  }, [receipt?.receiptItems]);

  const mergedItems = useMemo(() => mergeModalReceiptItems(modalItems), [modalItems]);

  if (!receipt) return null;

  const formatDate = (date: Date | string) => {
    return format(new Date(date), 'dd/MM/yyyy HH:mm:ss');
  };

  const getUnit = (receipt: Receipt) => 
    receipt.signedBy?.location?.unit?.name || 
    receipt.createdBy?.location?.unit?.name || 
    '—';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`פרטי קבלה #${receipt.id}`}
      size="lg"
    >
      <div style={{ direction: 'rtl', padding: '16px' }}>
        {/* Receipt Summary */}
        <div className="receipt-summary" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
          padding: '16px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)'
        }}>
          <div>
            <label style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>מנפיק:</label>
            <div style={{ fontWeight: 'bold', color: 'rgba(255, 255, 255, 0.9)' }}>{receipt.createdBy?.name || 'משתמש לא ידוע'}</div>
            <small style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {receipt.createdBy?.personalNumber && `מספר אישי: ${receipt.createdBy.personalNumber}`}
            </small>
          </div>
          
          <div>
            <label style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>מקבל:</label>
            <div style={{ fontWeight: 'bold', color: 'rgba(255, 255, 255, 0.9)' }}>{receipt.signedBy?.name || 'משתמש לא ידוע'}</div>
            <small style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {receipt.signedBy?.personalNumber && `מספר אישי: ${receipt.signedBy.personalNumber}`}
            </small>
          </div>
          
          <div>
            <label style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>יחידה:</label>
            <div style={{ fontWeight: 'bold', color: 'rgba(255, 255, 255, 0.9)' }}>{getUnit(receipt)}</div>
          </div>
          
          <div>
            <label style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>תאריך יצירה:</label>
            <div style={{ fontWeight: 'bold', color: 'rgba(255, 255, 255, 0.9)' }}>{formatDate(receipt.createdAt)}</div>
          </div>
          
          <div>
            <label style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>תאריך עדכון:</label>
            <div style={{ fontWeight: 'bold', color: 'rgba(255, 255, 255, 0.9)' }}>{formatDate(receipt.updatedAt)}</div>
          </div>
          
          <div>
            <label style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>סטטוס:</label>
            <div>
              <span style={{
                background: receipt.isSigned 
                  ? 'linear-gradient(135deg, #4caf50, #388e3c)' 
                  : 'linear-gradient(135deg, #ffc107, #ffb300)',
                color: receipt.isSigned ? 'white' : 'black',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {receipt.isSigned ? 'חתום' : 'ממתין לחתימה'}
              </span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="receipt-items" style={{
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '12px',
          overflow: 'hidden',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="items-header" style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h6 style={{ margin: 0, fontWeight: 'bold', color: 'rgba(255, 255, 255, 0.9)' }}>
              <i className="fas fa-list me-2" style={{ color: '#64b5f6' }}></i>
              פריטים בקבלה
            </h6>
            <span style={{
              background: 'linear-gradient(135deg, #64b5f6, #42a5f5)',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {mergedItems.length} סוגים, {modalItems.length} פריטים
            </span>
          </div>

          <div className="items-table-container" style={{ 
            maxHeight: '400px', 
            overflowY: 'auto' 
          }}>
            {modalItems.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '32px 16px', 
                color: 'rgba(255, 255, 255, 0.6)' 
              }}>
                <i className="fas fa-inbox fa-2x mb-2" style={{ color: 'rgba(255, 255, 255, 0.4)' }}></i>
                <div>לא נמצאו פריטים בקבלה זו</div>
              </div>
            ) : (
              <table className="table mb-0" style={{ backgroundColor: 'transparent' }}>
                <thead style={{ background: 'rgba(255, 255, 255, 0.05)', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ 
                      width: '50px', 
                      textAlign: 'center', 
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontWeight: '600',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>#</th>
                    <th style={{ 
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontWeight: '600',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>שם הפריט</th>
                    <th style={{ 
                      width: '130px', 
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontWeight: '600',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>מספר צ'</th>
                    <th style={{ 
                      width: '80px', 
                      textAlign: 'center', 
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontWeight: '600',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>צופן</th>
                    <th style={{ 
                      width: '80px', 
                      textAlign: 'center', 
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontWeight: '600',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>כמות</th>
                    <th style={{ 
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontWeight: '600',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>הערות</th>
                  </tr>
                </thead>
                <tbody>
                  {mergedItems.map((mergedItem, index) => (
                    <tr key={`${mergedItem.name}-${mergedItem.idNumber || 'no-id'}-${index}`} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <td style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)' }}>
                        {index + 1}
                      </td>
                      <td style={{ fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {mergedItem.name}
                          {mergedItem.requiresReporting && (
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
                        fontFamily: 'monospace', 
                        fontSize: '14px',
                        color: mergedItem.idNumber ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.5)'
                      }}>
                        {mergedItem.idNumber ? (
                          <span style={{
                            background: 'rgba(34, 197, 94, 0.2)',
                            color: '#22c55e',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {mergedItem.idNumber}
                          </span>
                        ) : (
                          <span>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          background: mergedItem.requiresReporting 
                            ? 'linear-gradient(135deg, #ffc107, #ffb300)' 
                            : 'linear-gradient(135deg, #4caf50, #388e3c)',
                          color: mergedItem.requiresReporting ? 'black' : 'white',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {mergedItem.requiresReporting ? 'כן' : 'לא'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          background: 'rgba(59, 130, 246, 0.2)',
                          color: '#3b82f6',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}>
                          {mergedItem.quantity}
                        </span>
                      </td>
                      <td style={{ 
                        color: mergedItem.note ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.5)',
                        fontSize: '14px' 
                      }}>
                        {mergedItem.note || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Signature Section */}
        {receipt.isSigned && receipt.signature && (
          <div className="receipt-signature mt-4" style={{
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)'
          }}>
            <h6 style={{ marginBottom: '12px', color: 'rgba(255, 255, 255, 0.9)' }}>
              <i className="fas fa-signature me-2" style={{ color: '#64b5f6' }}></i>
              חתימה דיגיטלית:
            </h6>
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '12px',
              maxHeight: '150px',
              overflow: 'hidden'
            }}>
              <img 
                src={receipt.signature} 
                alt="חתימה דיגיטלית"
                style={{
                  maxWidth: '100%',
                  maxHeight: '120px',
                  objectFit: 'contain'
                }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="modal-actions mt-4" style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'rgba(255, 255, 255, 0.9)'
            }}
          >
            <i className="fas fa-times me-2"></i>
            סגור
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ReceiptDetailsModal;
