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
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <div>
            <label className="text-muted small">מנפיק:</label>
            <div className="fw-bold">{receipt.createdBy?.name || 'משתמש לא ידוע'}</div>
            <small className="text-muted">
              {receipt.createdBy?.personalNumber && `צ': ${receipt.createdBy.personalNumber}`}
            </small>
          </div>
          
          <div>
            <label className="text-muted small">מקבל:</label>
            <div className="fw-bold">{receipt.signedBy?.name || 'משתמש לא ידוע'}</div>
            <small className="text-muted">
              {receipt.signedBy?.personalNumber && `צ': ${receipt.signedBy.personalNumber}`}
            </small>
          </div>
          
          <div>
            <label className="text-muted small">יחידה:</label>
            <div className="fw-bold">{getUnit(receipt)}</div>
          </div>
          
          <div>
            <label className="text-muted small">תאריך יצירה:</label>
            <div className="fw-bold">{formatDate(receipt.createdAt)}</div>
          </div>
          
          <div>
            <label className="text-muted small">תאריך עדכון:</label>
            <div className="fw-bold">{formatDate(receipt.updatedAt)}</div>
          </div>
          
          <div>
            <label className="text-muted small">סטטוס:</label>
            <div>
              <span className={`badge ${receipt.isSigned ? 'bg-success' : 'bg-warning'}`}>
                {receipt.isSigned ? 'חתום' : 'ממתין לחתימה'}
              </span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="receipt-items" style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <div className="items-header" style={{
            padding: '12px 16px',
            borderBottom: '1px solid #e9ecef',
            backgroundColor: '#f8f9fa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h6 className="mb-0 fw-bold">
              <i className="fas fa-list me-2"></i>
              פריטים בקבלה
            </h6>
            <span className="badge bg-primary">
              {receipt.receiptItems?.length || 0} פריטים
            </span>
          </div>

          <div className="items-table-container" style={{ 
            maxHeight: '400px', 
            overflowY: 'auto' 
          }}>
            {!receipt.receiptItems || receipt.receiptItems.length === 0 ? (
              <div className="text-center p-4 text-muted">
                <i className="fas fa-inbox fa-2x mb-2"></i>
                <div>לא נמצאו פריטים בקבלה זו</div>
              </div>
            ) : (
              <table className="table table-striped mb-0">
                <thead style={{ backgroundColor: '#f8f9fa', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ width: '50px', textAlign: 'center' }}>#</th>
                    <th>שם הפריט</th>
                    <th style={{ width: '150px' }}>מספר צ'</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>צופן</th>
                    <th style={{ width: '120px' }}>מיקום</th>
                    <th>הערות</th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.receiptItems.map((receiptItem, index) => {
                    const item = receiptItem.item;
                    return (
                      <tr key={receiptItem.id}>
                        <td style={{ textAlign: 'center', color: '#6c757d' }}>
                          {index + 1}
                        </td>
                        <td style={{ fontWeight: '600' }}>
                          {item?.itemName?.name || 'פריט לא ידוע'}
                        </td>
                        <td style={{ 
                          fontFamily: 'monospace', 
                          fontSize: '14px',
                          color: item?.idNumber ? '#495057' : '#6c757d'
                        }}>
                          {item?.idNumber || '—'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${
                            item?.requiresReporting ? 'bg-warning text-dark' : 'bg-success'
                          }`}>
                            {item?.requiresReporting ? 'כן' : 'לא'}
                          </span>
                        </td>
                        <td style={{ fontSize: '14px' }}>
                          {/* Note: allocatedLocation might not be directly available in receiptItem */}
                          <span className="text-muted">—</span>
                        </td>
                        <td style={{ 
                          color: item?.note ? '#495057' : '#6c757d',
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
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <h6 className="mb-3">
              <i className="fas fa-signature me-2"></i>
              חתימה דיגיטלית:
            </h6>
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
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
          borderTop: '1px solid #e9ecef'
        }}>
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={onClose}
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
