import React, { useState, useMemo } from 'react';
import { Receipt, SignPendingReceiptRequest } from '../../types';
import { SignaturePad } from './SignaturePad';
import { Modal, BulkDeleteErrorModal, SmartPagination } from '../../shared/components';
import ReceiptForm from './ReceiptForm';
import ReceiptDetailsModal from './ReceiptDetailsModal';
import { paginate } from '../../utils';
import { UI_CONFIG } from '../../config/app.config';
import './ReceiptsTab.css';

interface PendingReceiptsListProps {
  pendingReceipts: Receipt[];
  onRefresh: () => void;
  isAdmin: boolean;
  currentUserId?: string;
  signPendingReceipt: (receiptId: string, data: SignPendingReceiptRequest) => Promise<any>;
  deleteReceipt: (id: string) => Promise<any>;
}

const PendingReceiptsList: React.FC<PendingReceiptsListProps> = ({
  pendingReceipts,
  onRefresh,
  isAdmin,
  currentUserId,
  signPendingReceipt,
  deleteReceipt,
}) => {
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
    const term = searchTerm.toLowerCase().normalize('NFC');

    let filtered = pendingReceipts.filter((r) => {
      const issuer = (r.createdBy?.name?.toLowerCase() || '').normalize('NFC');
      const receiver = (r.signedBy?.name?.toLowerCase() || '').normalize('NFC');
      const unit = getUnit(r).toLowerCase().normalize('NFC');
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
        {/* Compact Header with Actions */}
        <div className="management-header-compact">
          <div className="management-search-section">
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="text"
                className="management-search-input"
                placeholder="חפש לפי מנפיק, מקבל, יחידה או תאריך..."
                value={searchTerm}
                onChange={handleSearchChange}
                style={{ flex: 1 }}
              />
              {searchTerm && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleSearchChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)}
                  title="נקה חיפוש"
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '0 12px',
                    minWidth: 'auto'
                  }}
                >
                  <i className="fas fa-times" style={{ fontSize: '12px' }}></i>
                  <span style={{ fontSize: '12px', fontWeight: '500' }}>נקה</span>
                </button>
              )}
            </div>
          </div>
          
          <div className="management-actions-compact">
            {isAdmin && selectedReceiptIds.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="badge bg-primary" style={{ fontSize: '12px', padding: '4px 8px' }}>
                  {selectedReceiptIds.length} נבחרו
                </span>
                <button 
                  className="btn btn-danger btn-sm" 
                  onClick={handleBulkDelete}
                  disabled={selectedReceiptIds.length === 0}
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  <i className="fas fa-trash" style={{ marginLeft: '4px' }}></i>
                  מחק נבחרים ({selectedReceiptIds.length})
                </button>
              </div>
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
                      backgroundColor: !isAdmin && !canSign ? 'rgba(255, 255, 255, 0.05)' : 'transparent'
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
                    <td style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{receipt.createdBy?.name || 'משתמש לא ידוע'}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                          {receipt.signedBy?.name || 'משתמש לא ידוע'}
                        </span>
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
                    <td style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{getUnit(receipt)}</td>
                    <td style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{receipt.receiptItems?.length || 0}</td>
                    <td style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{new Date(receipt.createdAt).toLocaleDateString('he-IL')}</td>
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
                          <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>לא זמין לחתימה</span>
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
      <ReceiptDetailsModal
        receipt={detailsReceipt}
        isOpen={!!detailsReceipt}
        onClose={() => setDetailsReceipt(null)}
      />

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
            <h5 style={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>
              <i className="fas fa-receipt" style={{ marginLeft: '8px' }}></i>
              פרטי הקבלה לחתימה
            </h5>
            {selectedReceipt && (
              <div className="receipt-summary-card" style={{
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                marginBottom: '20px'
              }}>
                {/* Receipt Header Info */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '16px',
                  marginBottom: '20px',
                  padding: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div>
                    <strong style={{ color: 'rgba(255, 255, 255, 0.7)' }}>מזהה קבלה:</strong>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#3b82f6' }}>
                      #{selectedReceipt.id}
                    </div>
                  </div>
                  <div>
                    <strong style={{ color: 'rgba(255, 255, 255, 0.7)' }}>סה"כ פריטים:</strong>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#22c55e' }}>
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
                    color: 'rgba(255, 255, 255, 0.8)',
                    borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
                    paddingBottom: '8px'
                  }}>
                    <i className="fas fa-list" style={{ marginLeft: '8px' }}></i>
                    רשימת פריטים לקבלה:
                  </p>
                  <div className="items-grid" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedReceipt.receiptItems && selectedReceipt.receiptItems.length > 0 ? 
                      // Group items by name for better display
                      selectedReceipt.receiptItems
                        .reduce((grouped: { name: string, items: any[], count: number, requiresReporting: boolean }[], receiptItem) => {
                          const itemName = receiptItem.item?.itemName?.name || 'פריט לא ידוע';
                          const requiresReporting = !!receiptItem.item?.requiresReporting;

                          // For cipher items, always create separate entries
                          if (requiresReporting) {
                            grouped.push({
                              name: itemName,
                              items: [receiptItem],
                              count: 1,
                              requiresReporting: true
                            });
                          } else {
                            // For non-cipher items, group by name
                            const existing = grouped.find(g => g.name === itemName && !g.requiresReporting);
                            if (existing) {
                              existing.items.push(receiptItem);
                              existing.count++;
                            } else {
                              grouped.push({
                                name: itemName,
                                items: [receiptItem],
                                count: 1,
                                requiresReporting: false
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
                              background: 'rgba(255, 255, 255, 0.08)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              borderRadius: '12px',
                              backdropFilter: 'blur(10px)'
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ 
                                fontSize: '16px', 
                                fontWeight: 'bold', 
                                color: 'rgba(255, 255, 255, 0.9)',
                                marginBottom: '8px'
                              }}>
                                <i className="fas fa-box me-2" style={{ color: '#64b5f6' }}></i>
                                {group.name}
                                {group.count > 1 && (
                                  <span 
                                    className="quantity-badge"
                                    style={{
                                      background: 'linear-gradient(135deg, #4caf50, #388e3c)',
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
                                {group.requiresReporting ? 
                                  // For cipher items, show each ID separately
                                  group.items.map((item, itemIndex) => (
                                    <div key={itemIndex} style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
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
                                    <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
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
                                className={`cipher-badge ${group.requiresReporting ? 'cipher-yes' : 'cipher-no'}`}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '20px',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  background: group.requiresReporting 
                                    ? 'linear-gradient(135deg, #f44336, #d32f2f)' 
                                    : 'linear-gradient(135deg, #4caf50, #388e3c)',
                                  color: 'white'
                                }}
                              >
                                צופן: {group.requiresReporting ? 'כן' : 'לא'}
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
                          background: 'rgba(245, 158, 11, 0.1)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          borderRadius: '12px',
                          color: 'rgba(255, 255, 255, 0.8)'
                        }}
                      >
                        <i className="fas fa-exclamation-triangle fa-2x mb-3" style={{ color: '#f59e0b' }}></i>
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
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: '20px',
              backdropFilter: 'blur(10px)'
            }}>
              <label className="form-label required" style={{ 
                fontSize: '16px', 
                fontWeight: 'bold', 
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '12px',
                display: 'block'
              }}>
                <i className="fas fa-signature me-2" style={{ color: '#64b5f6' }}></i>
                חתימה לאישור קבלת הפריטים:
              </label>
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '2px dashed rgba(255, 255, 255, 0.3)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center'
              }}>
                <div style={{ marginBottom: '12px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                  אנא חתמו במסגרת זו לאישור קבלת הפריטים
                </div>
                <SignaturePad onSave={setSignature} />
                <div style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
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
          <ReceiptForm
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
