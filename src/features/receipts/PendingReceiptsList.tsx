import React, { useState, useMemo } from 'react';
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
  currentUserId?: string; // Add current user ID prop
}

const PendingReceiptsList: React.FC<PendingReceiptsListProps> = ({
  pendingReceipts,
  onRefresh,
  isAdmin,
  currentUserId,
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

  // New: search and sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  // New: details modal state
  const [detailsReceipt, setDetailsReceipt] = useState<Receipt | null>(null);

  // Helper: safely get unit (prefer receiver unit, fallback to issuer)
  const getUnit = (r: Receipt) => r.signedBy?.location?.unit?.name || r.createdBy?.location?.unit?.name || '—';

  // Helper: check if current user can sign this receipt
  const canUserSignReceipt = (receipt: Receipt) => {
    if (!currentUserId) return false; // No user ID provided
    return receipt.signedById === currentUserId; // Only if user is the designated receiver (applies to both admin and non-admin)
  };

  // Search and sort logic
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <i className="fas fa-sort ms-1" style={{ opacity: 0.5 }} />;
    }
    return sortConfig.direction === 'asc' ? (
      <i className="fas fa-sort-up ms-1" />
    ) : (
      <i className="fas fa-sort-down ms-1" />
    );
  };

  // New: search + sort + paginate
  const filteredAndSorted = useMemo(() => {
    const term = searchTerm.toLowerCase();

    let filtered = pendingReceipts.filter((r) => {
      const issuer = r.createdBy?.name?.toLowerCase() || '';
      const receiver = r.signedBy?.name?.toLowerCase() || '';
      const unit = getUnit(r).toLowerCase();
      const count = (r.receiptItems?.length || 0).toString();
      const date = new Date(r.createdAt).toLocaleDateString('he-IL');
      return (
        issuer.includes(term) ||
        receiver.includes(term) ||
        unit.includes(term) ||
        count.includes(term) ||
        date.includes(term)
      );
    });

    if (sortConfig) {
      const { key, direction } = sortConfig;
      filtered = [...filtered].sort((a, b) => {
        let aVal: any, bVal: any;
        switch (key) {
          case 'createdBy':
            aVal = a.createdBy?.name || '';
            bVal = b.createdBy?.name || '';
            break;
          case 'signedBy':
            aVal = a.signedBy?.name || '';
            bVal = b.signedBy?.name || '';
            break;
          case 'unit':
            aVal = getUnit(a) || '';
            bVal = getUnit(b) || '';
            break;
          case 'itemCount':
            aVal = a.receiptItems?.length || 0;
            bVal = b.receiptItems?.length || 0;
            break;
          case 'createdAt':
            aVal = new Date(a.createdAt).getTime();
            bVal = new Date(b.createdAt).getTime();
            break;
          default:
            return 0;
        }

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          const cmp = aVal.localeCompare(bVal, 'he');
          return direction === 'asc' ? cmp : -cmp;
        }
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [pendingReceipts, searchTerm, sortConfig]);

  // Apply pagination after filtering & sorting
  const { paginatedItems: paginatedReceipts, totalPages } = paginate(filteredAndSorted, currentPage, UI_CONFIG.TABLE_PAGE_SIZE);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
    setSelectedReceiptIds([]);
  };

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
    // Security check - only allow if user is the designated receiver
    if (!canUserSignReceipt(receipt)) {
      alert('אין לך הרשאה לחתום על קבלה זו. הקבלה מיועדת למשתמש אחר.');
      return;
    }
    
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
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

        {/* Full-width search bar */}
        <div className="search-bar" style={{ direction: 'rtl', margin: '12px 0 16px 0' }}>
          <div className="input-group" style={{ width: '100%' }}>
            <span className="input-group-text">
              <i className="fas fa-search" />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="חפש לפי מנפיק, מקבל, יחידה או תאריך..."
              value={searchTerm}
              onChange={handleSearchChange}
              style={{ direction: 'rtl' }}
            />
            {searchTerm && (
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => handleSearchChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)}
                title="נקה חיפוש"
              >
                <i className="fas fa-times" />
              </button>
            )}
          </div>
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
                      onClick={(e) => e.stopPropagation()}
                    />
                  </th>
                )}
                <th className="sortable-header" onClick={() => handleSort('createdBy')} data-sorted={sortConfig?.key === 'createdBy'}>
                  <div className="d-flex align-items-center justify-content-between">
                    <span>מנפיק</span>
                    <div className="sort-indicator">{getSortIcon('createdBy')}</div>
                  </div>
                </th>
                <th className="sortable-header" onClick={() => handleSort('signedBy')} data-sorted={sortConfig?.key === 'signedBy'}>
                  <div className="d-flex align-items-center justify-content-between">
                    <span>מקבל</span>
                    <div className="sort-indicator">{getSortIcon('signedBy')}</div>
                  </div>
                </th>
                <th className="sortable-header" onClick={() => handleSort('unit')} data-sorted={sortConfig?.key === 'unit'}>
                  <div className="d-flex align-items-center justify-content-between">
                    <span>יחידה</span>
                    <div className="sort-indicator">{getSortIcon('unit')}</div>
                  </div>
                </th>
                <th className="sortable-header" onClick={() => handleSort('itemCount')} data-sorted={sortConfig?.key === 'itemCount'}>
                  <div className="d-flex align-items-center justify-content-between">
                    <span>כמות פריטים</span>
                    <div className="sort-indicator">{getSortIcon('itemCount')}</div>
                  </div>
                </th>
                <th className="sortable-header" onClick={() => handleSort('createdAt')} data-sorted={sortConfig?.key === 'createdAt'}>
                  <div className="d-flex align-items-center justify-content-between">
                    <span>תאריך יצירה</span>
                    <div className="sort-indicator">{getSortIcon('createdAt')}</div>
                  </div>
                </th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {paginatedReceipts.map((receipt) => {
                const canSign = canUserSignReceipt(receipt);
                return (
                  <tr 
                    key={receipt.id} 
                    onClick={() => setDetailsReceipt(receipt)} 
                    style={{ 
                      cursor: 'pointer',
                      opacity: !isAdmin && !canSign ? 0.6 : 1,
                      backgroundColor: !isAdmin && !canSign ? '#f8f9fa' : 'transparent'
                    }}
                  >
                    {isAdmin && (
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selectedReceiptIds.includes(receipt.id)}
                          onChange={() => handleToggleReceiptSelection(receipt.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                    )}
                    <td>{receipt.createdBy?.name || 'משתמש לא ידוע'}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        {receipt.signedBy?.name || 'משתמש לא ידוע'}
                        {!isAdmin && !canSign && (
                          <span 
                            className="badge bg-warning ms-2" 
                            style={{ fontSize: '10px' }}
                            title="קבלה זו מיועדת למשתמש אחר"
                          >
                            לא זמין
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{getUnit(receipt)}</td>
                    <td>{receipt.receiptItems?.length || 0}</td>
                    <td>{new Date(receipt.createdAt).toLocaleDateString('he-IL')}</td>
                    <td>
                      <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
                        {isAdmin && (
                          <button 
                            className="btn btn-primary btn-sm me-2" 
                            onClick={() => handleUpdateClick(receipt)}
                            title="עדכן קבלה"
                          >
                            <i className="fas fa-edit"></i>
                            עדכן
                          </button>
                        )}
                        {canSign && (
                          <button
                            className="btn-sign btn-sm"
                            onClick={() => handleSignClick(receipt)}
                            title="חתום וקבל"
                          >
                            <i className="fas fa-signature"></i>
                            חתום וקבל
                          </button>
                        )}
                        {!canSign && !isAdmin && (
                          <span className="text-muted small">לא זמין לחתימה</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <SmartPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        )}
      </div>

      {/* Details Modal */}
      {detailsReceipt && (
        <Modal
          isOpen={!!detailsReceipt}
          onClose={() => setDetailsReceipt(null)}
          title={`פרטי קבלה #${detailsReceipt.id}`}
          size="lg"
        >
          <div style={{ direction: 'rtl', padding: '16px' }}>
            {/* Summary */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
                marginBottom: '16px',
                background: '#ffffff',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                padding: '12px',
              }}
            >
              <div>
                <div style={{ color: '#6c757d', fontSize: 12 }}>מנפיק</div>
                <div style={{ fontWeight: 700 }}>{detailsReceipt.createdBy?.name || '—'}</div>
              </div>
              <div>
                <div style={{ color: '#6c757d', fontSize: 12 }}>מקבל</div>
                <div style={{ fontWeight: 700 }}>{detailsReceipt.signedBy?.name || '—'}</div>
              </div>
              <div>
                <div style={{ color: '#6c757d', fontSize: 12 }}>יחידה</div>
                <div style={{ fontWeight: 700 }}>{(detailsReceipt.signedBy?.location?.unit?.name || detailsReceipt.createdBy?.location?.unit?.name) ?? '—'}</div>
              </div>
              <div>
                <div style={{ color: '#6c757d', fontSize: 12 }}>תאריך יצירה</div>
                <div style={{ fontWeight: 700 }}>{new Date(detailsReceipt.createdAt).toLocaleString('he-IL')}</div>
              </div>
            </div>

            {/* Items Table */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '10px 12px',
                  borderBottom: '1px solid #e9ecef',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ fontWeight: 700 }}>פריטים</div>
                <span
                  style={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    padding: '2px 10px',
                    borderRadius: '12px',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {detailsReceipt.receiptItems?.length || 0}
                </span>
              </div>

              <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: 12, color: '#6c757d', borderBottom: '1px solid #e9ecef', width: 60 }}>#</th>
                      <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: 12, color: '#6c757d', borderBottom: '1px solid #e9ecef' }}>פריט</th>
                      <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: 12, color: '#6c757d', borderBottom: '1px solid #e9ecef', width: 180 }}>מספר צ'</th>
                      <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: 12, color: '#6c757d', borderBottom: '1px solid #e9ecef', width: 120 }}>צופן</th>
                      <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: 12, color: '#6c757d', borderBottom: '1px solid #e9ecef' }}>הערה</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detailsReceipt.receiptItems || []).map((ri, idx) => {
                      const itemName = ri.item?.itemName?.name || '—';
                      const idNumber = ri.item?.idNumber || '';
                      const isNeedReport = !!ri.item?.idNumber; // Changed to check idNumber
                      const note = ri.item?.note || '';
                      return (
                        <tr key={ri.id} style={{ borderBottom: '1px solid #f1f3f5' }}>
                          <td style={{ padding: '10px 12px', color: '#6c757d' }}>{idx + 1}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: '#333' }}>{itemName}</td>
                          <td style={{ padding: '10px 12px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', direction: 'ltr', textAlign: 'right' }}>{idNumber || '—'}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span
                              style={{
                                backgroundColor: isNeedReport ? '#dc3545' : '#28a745',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            >
                              {isNeedReport ? 'כן' : 'לא'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', color: '#495057' }}>{note || '—'}</td>
                        </tr>
                      );
                    })}

                    {(!detailsReceipt.receiptItems || detailsReceipt.receiptItems.length === 0) && (
                      <tr>
                        <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#6c757d' }}>
                          לא נמצאו פריטים עבור קבלה זו
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}

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
                          const isNeedReport = !!receiptItem.item?.idNumber; // Changed to check idNumber
                          
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
