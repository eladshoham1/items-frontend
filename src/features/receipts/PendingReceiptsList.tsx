import React, { useState } from 'react';
import { Receipt } from '../../types';
import { useReceipts } from '../../hooks/useReceipts';
import { SignaturePad } from './SignaturePad';
import { Modal, BulkDeleteErrorModal, SmartPagination } from '../../shared/components';
import CreateReceiptForm from './CreatePendingReceiptForm';
import { paginate } from '../../utils';
import { UI_CONFIG } from '../../config/app.config';
import './ReceiptsTab.css';

interface PendingReceiptsListProps {
  pendingReceipts: Receipt[];
  onRefresh: () => void;
  isAdmin: boolean;
}

const PendingReceiptsList: React.FC<PendingReceiptsListProps> = ({
  pendingReceipts,
  onRefresh,
  isAdmin,
}) => {
  const { signPendingReceipt, deleteReceipt } = useReceipts();
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [signature, setSignature] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Bulk selection state
  const [selectedReceiptIds, setSelectedReceiptIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [bulkDeleteError, setBulkDeleteError] = useState<{
    errors: string[];
    deletedCount: number;
  } | null>(null);

  // Pagination
  const { paginatedItems: paginatedReceipts, totalPages } = paginate(pendingReceipts, currentPage, UI_CONFIG.TABLE_PAGE_SIZE);

  // Bulk selection functions
  const handleSelectAllReceipts = () => {
    if (selectedReceiptIds.length === paginatedReceipts.length) {
      setSelectedReceiptIds([]);
    } else {
      setSelectedReceiptIds(paginatedReceipts.map(receipt => receipt.id));
    }
  };

  const handleToggleReceiptSelection = (receiptId: string) => {
    setSelectedReceiptIds(prev => 
      prev.includes(receiptId) 
        ? prev.filter(id => id !== receiptId)
        : [...prev, receiptId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedReceiptIds.length === 0) return;
    
    const confirmDelete = window.confirm(
      `האם אתה בטוח שברצונך למחוק ${selectedReceiptIds.length} קבלות ממתינות?`
    );
    
    if (!confirmDelete) return;

    const errors: string[] = [];
    let deletedCount = 0;

    for (const receiptId of selectedReceiptIds) {
      try {
        await deleteReceipt(receiptId);
        deletedCount++;
      } catch (err) {
        const receipt = pendingReceipts.find(r => r.id === receiptId);
        const receiptName = receipt ? `קבלה #${receipt.id}` : `קבלה ${receiptId}`;
        errors.push(`${receiptName}: ${err instanceof Error ? err.message : 'שגיאה לא ידועה'}`);
      }
    }

    if (errors.length > 0) {
      setBulkDeleteError({ errors, deletedCount });
    } else {
      alert(`נמחקו בהצלחה ${deletedCount} קבלות`);
    }

    setSelectedReceiptIds([]);
    onRefresh();
  };

  const handleSignClick = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setIsSignModalOpen(true);
    setSignature('');
    setError(null);
  };

  const handleUpdateClick = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setIsUpdateModalOpen(true);
  };

  const handleUpdateSuccess = () => {
    handleCloseModal();
    onRefresh(); // Refresh the pending receipts list
  };

  const handleSignSubmit = async () => {
    if (!selectedReceipt || !signature) {
      setError('נדרשת חתימה');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const success = await signPendingReceipt(selectedReceipt.id, { signature });
      if (success) {
        setIsSignModalOpen(false);
        setSelectedReceipt(null);
        setSignature('');
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to sign pending receipt:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign receipt');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setIsSignModalOpen(false);
    setIsUpdateModalOpen(false);
    setSelectedReceipt(null);
    setSignature('');
    setError(null);
  };

  if (pendingReceipts.length === 0) {
    return (
      <div className="empty-state">
        <i className="fas fa-clock"></i>
        <h4>אין קבלות ממתינות</h4>
        <p>כל הקבלות נחתמו או שאין קבלות ממתינות להצגה</p>
      </div>
    );
  }

  return (
    <>
      <div className="pending-receipts-list" style={{ direction: 'rtl' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h4 style={{ color: '#333' }}>קבלות ממתינות לחתימה</h4>
          {isAdmin && selectedReceiptIds.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className="badge bg-primary">
                {selectedReceiptIds.length} נבחרו
              </span>
              <button 
                className="btn btn-danger btn-sm" 
                onClick={handleBulkDelete}
                disabled={selectedReceiptIds.length === 0}
              >
                <i className="fas fa-trash me-1"></i>
                מחק נבחרים ({selectedReceiptIds.length})
              </button>
            </div>
          )}
        </div>
        
        <div className="table-responsive">
          <table className="receipts-table">
            <thead>
              <tr>
                {isAdmin && (
                  <th style={{ width: '50px' }}>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={selectedReceiptIds.length === paginatedReceipts.length && paginatedReceipts.length > 0}
                      onChange={handleSelectAllReceipts}
                      title="בחר הכל"
                    />
                  </th>
                )}
                <th>מזהה קבלה</th>
                <th>שם המקבל</th>
                <th>כמות פריטים</th>
                <th>תאריך יצירה</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {paginatedReceipts.map((receipt) => (
                <tr key={receipt.id}>
                  {isAdmin && (
                    <td>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedReceiptIds.includes(receipt.id)}
                        onChange={() => handleToggleReceiptSelection(receipt.id)}
                      />
                    </td>
                  )}
                  <td>#{receipt.id}</td>
                  <td>{receipt.signedBy?.name || 'משתמש לא ידוע'}</td>
                  <td>{receipt.receiptItems?.length || 0}</td>
                  <td>{new Date(receipt.createdAt).toLocaleDateString('he-IL')}</td>
                  <td>
                    <div className="action-buttons">
                      {isAdmin && (
                        <button 
                          className="btn btn-primary btn-sm" 
                          onClick={() => handleUpdateClick(receipt)}
                          title="עדכן קבלה"
                        >
                          <i className="fas fa-edit"></i>
                          עדכן
                        </button>
                      )}
                      {!isAdmin && (
                        <button
                          className="btn-sign btn-sm"
                          onClick={() => handleSignClick(receipt)}
                        >
                          <i className="fas fa-signature"></i>
                          חתום וקבל
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <SmartPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Sign Modal */}
      <Modal
        isOpen={isSignModalOpen}
        onClose={handleCloseModal}
        title={`חתימה על קבלה #${selectedReceipt?.id}`}
        size="lg"
      >
        <div className="receipts-modal" style={{ direction: 'rtl', padding: '20px' }}>
          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <h5 style={{ color: '#2980b9', marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>
              <i className="fas fa-receipt me-2"></i>
              פרטי הקבלה לחתימה
            </h5>
            {selectedReceipt && (
              <div className="receipt-summary-card" style={{
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: '#f8f9fa',
                marginBottom: '20px'
              }}>
                {/* Receipt Header Info */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '16px',
                  marginBottom: '20px',
                  padding: '16px',
                  backgroundColor: '#ffffff',
                  borderRadius: '6px',
                  border: '1px solid #e9ecef'
                }}>
                  <div>
                    <strong style={{ color: '#495057' }}>מזהה קבלה:</strong>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2980b9' }}>
                      #{selectedReceipt.id}
                    </div>
                  </div>
                  <div>
                    <strong style={{ color: '#495057' }}>סה"כ פריטים:</strong>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#28a745' }}>
                      {selectedReceipt.receiptItems?.length || 0}
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div>
                  <p style={{ 
                    margin: '0 0 16px 0', 
                    fontWeight: '600', 
                    fontSize: '16px',
                    color: '#495057',
                    borderBottom: '2px solid #dee2e6',
                    paddingBottom: '8px'
                  }}>
                    <i className="fas fa-list me-2"></i>
                    רשימת פריטים לקבלה:
                  </p>
                  <div className="items-grid" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedReceipt.receiptItems && selectedReceipt.receiptItems.length > 0 ? 
                      // Group items by name for better display
                      selectedReceipt.receiptItems
                        .reduce((grouped: { name: string, items: any[], count: number, isNeedReport: boolean }[], receiptItem) => {
                          const itemName = receiptItem.item?.itemName?.name || 'פריט לא ידוע';
                          const isNeedReport = receiptItem.item?.isNeedReport || false;
                          
                          // For cipher items, always create separate entries
                          if (isNeedReport) {
                            grouped.push({
                              name: itemName,
                              items: [receiptItem],
                              count: 1,
                              isNeedReport: true
                            });
                          } else {
                            // For non-cipher items, group by name
                            const existing = grouped.find(g => g.name === itemName && !g.isNeedReport);
                            if (existing) {
                              existing.items.push(receiptItem);
                              existing.count++;
                            } else {
                              grouped.push({
                                name: itemName,
                                items: [receiptItem],
                                count: 1,
                                isNeedReport: false
                              });
                            }
                          }
                          return grouped;
                        }, [])
                        .map((group, index) => (
                          <div 
                            key={`${group.name}-${index}`}
                            className="receipt-item-card"
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '16px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #e9ecef',
                              borderRadius: '6px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ 
                                fontSize: '16px', 
                                fontWeight: 'bold', 
                                color: '#333',
                                marginBottom: '8px'
                              }}>
                                <i className="fas fa-box me-2" style={{ color: '#6c757d' }}></i>
                                {group.name}
                                {group.count > 1 && (
                                  <span 
                                    className="quantity-badge"
                                    style={{
                                      backgroundColor: '#28a745',
                                      color: 'white',
                                      padding: '4px 8px',
                                      borderRadius: '12px',
                                      fontSize: '12px',
                                      fontWeight: 'bold',
                                      marginRight: '8px'
                                    }}
                                  >
                                    כמות: {group.count}
                                  </span>
                                )}
                              </div>
                              
                              {/* Show ID numbers for cipher items or first item */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {group.isNeedReport ? 
                                  // For cipher items, show each ID separately
                                  group.items.map((item, itemIndex) => (
                                    <div key={itemIndex} style={{ fontSize: '14px', color: '#6c757d' }}>
                                      {item.item?.idNumber && (
                                        <span>
                                          <i className="fas fa-hashtag me-1"></i>
                                          מספר צ': {item.item.idNumber}
                                        </span>
                                      )}
                                    </div>
                                  ))
                                  :
                                  // For non-cipher items, show just one example ID if available
                                  group.items[0]?.item?.idNumber && (
                                    <div style={{ fontSize: '14px', color: '#6c757d' }}>
                                      <i className="fas fa-hashtag me-1"></i>
                                      מספר צ': {group.items[0].item.idNumber}
                                      {group.count > 1 && ' (ועוד)'}
                                    </div>
                                  )
                                }
                              </div>
                            </div>
                            
                            <div style={{ textAlign: 'center' }}>
                              <span 
                                className={`cipher-badge ${group.isNeedReport ? 'cipher-yes' : 'cipher-no'}`}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '20px',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  backgroundColor: group.isNeedReport ? '#dc3545' : '#28a745',
                                  color: 'white'
                                }}
                              >
                                צופן: {group.isNeedReport ? 'כן' : 'לא'}
                              </span>
                            </div>
                          </div>
                        ))
                    : (
                      <div 
                        className="no-items-message"
                        style={{
                          textAlign: 'center',
                          padding: '40px 20px',
                          backgroundColor: '#fff3cd',
                          border: '1px solid #ffeaa7',
                          borderRadius: '6px',
                          color: '#856404'
                        }}
                      >
                        <i className="fas fa-exclamation-triangle fa-2x mb-3"></i>
                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                          לא נמצאו פריטים עבור קבלה זו
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              padding: '20px'
            }}>
              <label className="form-label required" style={{ 
                fontSize: '16px', 
                fontWeight: 'bold', 
                color: '#495057',
                marginBottom: '12px',
                display: 'block'
              }}>
                <i className="fas fa-signature me-2" style={{ color: '#2980b9' }}></i>
                חתימה לאישור קבלת הפריטים:
              </label>
              <div style={{
                backgroundColor: '#ffffff',
                border: '2px dashed #dee2e6',
                borderRadius: '6px',
                padding: '16px',
                textAlign: 'center'
              }}>
                <div style={{ marginBottom: '12px', color: '#6c757d', fontSize: '14px' }}>
                  אנא חתמו במסגרת זו לאישור קבלת הפריטים
                </div>
                <SignaturePad onSave={setSignature} />
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#6c757d' }}>
                  <i className="fas fa-info-circle me-1"></i>
                  החתימה מהווה אישור על קבלת הפריטים הרשומים לעיל
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCloseModal}
              disabled={isSubmitting}
            >
              ביטול
            </button>
            <button
              type="button"
              className="btn-sign"
              onClick={handleSignSubmit}
              disabled={isSubmitting || !signature}
            >
              {isSubmitting ? 'חותם...' : 'חתום וקבל'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Update Modal */}
      {isUpdateModalOpen && selectedReceipt && (
        <Modal
          isOpen={isUpdateModalOpen}
          onClose={handleCloseModal}
          title={`עדכון קבלה #${selectedReceipt.id}`}
          size="lg"
        >
          <CreateReceiptForm
            originalReceipt={selectedReceipt}
            onSuccess={handleUpdateSuccess}
            onCancel={handleCloseModal}
          />
        </Modal>
      )}

      {/* Bulk Delete Error Modal */}
      {bulkDeleteError && (
        <BulkDeleteErrorModal
          isOpen={!!bulkDeleteError}
          onClose={() => setBulkDeleteError(null)}
          title="שגיאה במחיקת קבלות"
          message="חלק מהקבלות לא נמחקו בהצלחה"
          errors={bulkDeleteError.errors}
          deletedCount={bulkDeleteError.deletedCount}
          totalCount={selectedReceiptIds.length}
          type="item"
        />
      )}
    </>
  );
};

export default PendingReceiptsList;
