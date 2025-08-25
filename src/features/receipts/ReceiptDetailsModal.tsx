import React from 'react';
import { format } from 'date-fns';
import { Receipt } from '../../types';
import Modal from '../../shared/components/Modal';

interface ReceiptDetailsModalProps {
  receipt: Receipt | null;
  isOpen: boolean;
  onClose: () => void;
}

const ReceiptDetailsModal: React.FC<ReceiptDetailsModalProps> = ({
  receipt,
  isOpen,
  onClose
}) => {
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
              {receipt.createdBy?.personalNumber && `צ': ${receipt.createdBy.personalNumber}`}
            </small>
          </div>
          
          <div>
            <label style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>מקבל:</label>
            <div style={{ fontWeight: 'bold', color: 'rgba(255, 255, 255, 0.9)' }}>{receipt.signedBy?.name || 'משתמש לא ידוע'}</div>
            <small style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {receipt.signedBy?.personalNumber && `צ': ${receipt.signedBy.personalNumber}`}
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
              {receipt.receiptItems?.length || 0} פריטים
            </span>
          </div>

          <div className="items-table-container" style={{ 
            maxHeight: '400px', 
            overflowY: 'auto' 
          }}>
            {!receipt.receiptItems || receipt.receiptItems.length === 0 ? (
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
                      width: '150px', 
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontWeight: '600',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>מספר צ'</th>
                    <th style={{ 
                      width: '100px', 
                      textAlign: 'center', 
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontWeight: '600',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>צופן</th>
                    <th style={{ 
                      width: '120px', 
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontWeight: '600',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>מיקום</th>
                    <th style={{ 
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontWeight: '600',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>הערות</th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.receiptItems.map((receiptItem, index) => {
                    const item = receiptItem.item;
                    return (
                      <tr key={receiptItem.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <td style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)' }}>
                          {index + 1}
                        </td>
                        <td style={{ fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)' }}>
                          {item?.itemName?.name || 'פריט לא ידוע'}
                        </td>
                        <td style={{ 
                          fontFamily: 'monospace', 
                          fontSize: '14px',
                          color: item?.idNumber ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.5)'
                        }}>
                          {item?.idNumber || '—'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            background: item?.requiresReporting 
                              ? 'linear-gradient(135deg, #ffc107, #ffb300)' 
                              : 'linear-gradient(135deg, #4caf50, #388e3c)',
                            color: item?.requiresReporting ? 'black' : 'white',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {item?.requiresReporting ? 'כן' : 'לא'}
                          </span>
                        </td>
                        <td style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                          {/* Note: allocatedLocation might not be directly available in receiptItem */}
                          <span>—</span>
                        </td>
                        <td style={{ 
                          color: item?.note ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.5)',
                          fontSize: '14px' 
                        }}>
                          {item?.note || '—'}
                        </td>
                      </tr>
                    );
                  })}
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
