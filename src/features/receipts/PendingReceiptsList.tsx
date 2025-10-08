import React, { useState, useMemo } from 'react';
import { Receipt, SignPendingReceiptRequest } from '../../types';
import { SignaturePad } from './SignaturePad';
import { Modal, SmartPagination, NotificationModal, SearchInput } from '../../shared/components';
import ReceiptForm from './ReceiptForm';
import ReceiptDetailsModal from './ReceiptDetailsModal';
import DeleteReceiptModal from './DeleteReceiptModal';
import { paginate, formatDateTimeHebrew, getReceiptUnit, getReceiptLocation, receiptItemsMatchSearch, compareReceiptValues } from '../../utils';
import { UI_CONFIG } from '../../config/app.config';
import type { NotificationType } from '../../shared/components/NotificationModal';
import { usePendingReceiptsContext } from '../../contexts';
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
  // Get context for immediate count updates
  const { decrementPendingCount, refreshPendingCount } = usePendingReceiptsContext();
  
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [signature, setSignature] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // New: search and sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  // New: details modal state
  const [detailsReceipt, setDetailsReceipt] = useState<Receipt | null>(null);

  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: NotificationType;
    message: string;
    title?: string;
  }>({
    isOpen: false,
    type: 'info',
    message: ''
  });

  const showNotification = (type: NotificationType, message: string, title?: string) => {
    setNotification({
      isOpen: true,
      type,
      message,
      title
    });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  };



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

  // New: search + sort + paginate
  const filteredAndSorted = useMemo(() => {
    const term = searchTerm.toLowerCase().normalize('NFC');

    let filtered = pendingReceipts.filter((r) => {
      const issuer = (r.createdBy?.name?.toLowerCase() || '').normalize('NFC');
      const receiver = (r.signedBy?.name?.toLowerCase() || '').normalize('NFC');
      const unit = getReceiptUnit(r).toLowerCase().normalize('NFC');
      const location = getReceiptLocation(r).toLowerCase().normalize('NFC');
      const count = (r.receiptItems?.length || 0).toString();
      const date = formatDateTimeHebrew(r.createdAt);
      const note = (r.note?.toLowerCase() || '').normalize('NFC');

      // Check if any items match the search term
      const itemsMatch = receiptItemsMatchSearch(r, term);

      return (
        issuer.includes(term) ||
        receiver.includes(term) ||
        unit.includes(term) ||
        location.includes(term) ||
        count.includes(term) ||
        date.includes(term) ||
        note.includes(term) ||
        itemsMatch
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
            aVal = getReceiptUnit(a) || '';
            bVal = getReceiptUnit(b) || '';
            break;
          case 'location':
            aVal = getReceiptLocation(a) || '';
            bVal = getReceiptLocation(b) || '';
            break;
          case 'itemCount':
            aVal = a.receiptItems?.length || 0;
            bVal = b.receiptItems?.length || 0;
            break;
          case 'createdAt':
            aVal = new Date(a.createdAt).getTime();
            bVal = new Date(b.createdAt).getTime();
            break;
          case 'note':
            aVal = a.note || '';
            bVal = b.note || '';
            break;
          default:
            return 0;
        }

        return compareReceiptValues(aVal, bVal, direction);
      });
    }

    return filtered;
  }, [pendingReceipts, searchTerm, sortConfig]);

  // Apply pagination after filtering & sorting
  const { paginatedItems: paginatedReceipts, totalPages } = paginate(filteredAndSorted, currentPage, UI_CONFIG.TABLE_PAGE_SIZE);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleDeleteClick = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedReceipt) return;

    setIsDeleting(true);
    try {
      const success = await deleteReceipt(selectedReceipt.id);
      if (success) {
        // Immediately update the header count for responsive UI with specific receipt ID
        decrementPendingCount(selectedReceipt.id);
        
        handleCloseModal();
        onRefresh();
        showNotification('success', 'הקבלה נמחקה בהצלחה');
        
        // Also refresh the global count to ensure accuracy
        await refreshPendingCount();
      }
    } catch (error) {
      showNotification('error', 'שגיאה במחיקת הקבלה');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSignClick = (receipt: Receipt) => {
    // Security check - only allow if user is the designated receiver
    if (!canUserSignReceipt(receipt)) {
      showNotification('error', 'אין לך הרשאה לחתום על קבלה זו. הקבלה מיועדת למשתמש אחר.');
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
        // Immediately update the header count for responsive UI with specific receipt ID
        decrementPendingCount(selectedReceipt.id);
        
        setIsSignModalOpen(false);
        setSelectedReceipt(null);
        setSignature('');
        onRefresh();
        
        // Also refresh the global count to ensure accuracy
        await refreshPendingCount();
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
    setIsDeleteModalOpen(false);
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
            <SearchInput
              value={searchTerm}
              onChange={(value) => handleSearchChange({ target: { value } } as React.ChangeEvent<HTMLInputElement>)}
              placeholder="חפש לפי מנפיק, מקבל, יחידה, מיקום, הערה, פריטים או תאריך..."
              resultsCount={filteredAndSorted.length}
              resultsLabel="קבלות"
            />
          </div>
        </div>
        
        <div className="unified-table-container">
          <table className="unified-table">
            <thead>
              <tr>
                <th className="unified-table-header unified-table-header-regular sortable" onClick={() => handleSort('createdBy')} data-sorted={sortConfig?.key === 'createdBy'}>
                  <div className="d-flex align-items-center">
                    <span>מנפיק</span>
                  </div>
                </th>
                <th className="unified-table-header unified-table-header-regular sortable" onClick={() => handleSort('signedBy')} data-sorted={sortConfig?.key === 'signedBy'}>
                  <div className="d-flex align-items-center">
                    <span>מקבל</span>
                  </div>
                </th>
                <th className="unified-table-header unified-table-header-regular sortable" onClick={() => handleSort('unit')} data-sorted={sortConfig?.key === 'unit'}>
                  <div className="d-flex align-items-center">
                    <span>יחידה</span>
                  </div>
                </th>
                <th className="unified-table-header unified-table-header-regular sortable" onClick={() => handleSort('location')} data-sorted={sortConfig?.key === 'location'}>
                  <div className="d-flex align-items-center">
                    <span>מיקום</span>
                  </div>
                </th>
                <th className="unified-table-header unified-table-header-regular sortable" onClick={() => handleSort('itemCount')} data-sorted={sortConfig?.key === 'itemCount'}>
                  <div className="d-flex align-items-center">
                    <span>כמות פריטים</span>
                  </div>
                </th>
                <th className="unified-table-header unified-table-header-regular sortable" onClick={() => handleSort('createdAt')} data-sorted={sortConfig?.key === 'createdAt'}>
                  <div className="d-flex align-items-center">
                    <span>תאריך יצירה</span>
                  </div>
                </th>
                <th className="unified-table-header unified-table-header-regular sortable" onClick={() => handleSort('note')} data-sorted={sortConfig?.key === 'note'}>
                  <div className="d-flex align-items-center">
                    <span>הערה</span>
                  </div>
                </th>
                <th className="unified-table-header unified-table-header-regular" style={{ width: '200px' }}>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {paginatedReceipts.map((receipt, index) => {
                const canSign = canUserSignReceipt(receipt);
                return (
                  <tr 
                    key={receipt.id} 
                    className="unified-table-row"
                    onClick={() => setDetailsReceipt(receipt)} 
                    style={{ 
                      cursor: 'pointer',
                      opacity: !isAdmin && !canSign ? 0.6 : 1
                    }}
                    title="לחץ לפרטים"
                  >
                    <td className="unified-table-cell">{receipt.createdBy?.name || 'משתמש לא ידוע'}</td>
                    <td className="unified-table-cell">
                      <div className="d-flex align-items-center">
                        <span>
                          {receipt.signedBy?.name || 'משתמש לא ידוע'}
                        </span>
                      </div>
                    </td>
                    <td className="unified-table-cell">{getReceiptUnit(receipt)}</td>
                    <td className="unified-table-cell">{getReceiptLocation(receipt)}</td>
                    <td className="unified-table-cell">{receipt.receiptItems?.length || 0}</td>
                    <td className="unified-table-cell">
                      {formatDateTimeHebrew(receipt.createdAt)}
                    </td>
                    <td className="unified-table-cell">
                      {receipt.note ? (
                        <span title={receipt.note} style={{ 
                          maxWidth: '150px', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap',
                          display: 'inline-block'
                        }}>
                          {receipt.note}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                      )}
                    </td>
                    <td className="unified-table-cell" style={{ textAlign: 'center' }}>
                      <div className="action-buttons" onClick={(e) => e.stopPropagation()} style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        gap: '8px' 
                      }}>
                        {isAdmin && (
                          <>
                            <button 
                              className="btn btn-primary btn-sm me-2 unified-action-btn" 
                              onClick={() => handleUpdateClick(receipt)}
                              title="עדכן קבלה"
                            >
                              <i className="fas fa-edit"></i>
                              עדכן
                            </button>
                            <button 
                              className="btn btn-danger btn-sm unified-action-btn" 
                              onClick={() => handleDeleteClick(receipt)}
                              title="מחק קבלה"
                            >
                              <i className="fas fa-trash"></i>
                              מחק
                            </button>
                          </>
                        )}
                        {canSign && (
                          <button
                            className="btn-sign btn-sm unified-action-btn"
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

          <div style={{ marginBottom: '32px' }}>
            <h5 style={{ 
              color: '#ffffff', 
              marginBottom: '20px', 
              fontSize: '20px', 
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}>
              <i className="fas fa-receipt" style={{ color: '#64b5f6', fontSize: '22px' }}></i>
              פרטי הקבלה לחתימה
            </h5>
            {selectedReceipt && (
              <div className="receipt-summary-card" style={{
                border: '2px solid rgba(100, 181, 246, 0.3)',
                borderRadius: '16px',
                padding: '24px',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                marginBottom: '24px',
                backdropFilter: 'blur(15px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
              }}>
                {/* Receipt Header Info */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                  gap: '20px',
                  marginBottom: '24px'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', marginBottom: '4px' }}>
                      <i className="fas fa-hashtag" style={{ marginLeft: '6px' }}></i>
                      מזהה קבלה
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#64b5f6' }}>
                      #{selectedReceipt.id}
                    </div>
                  </div>
                  
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', marginBottom: '4px' }}>
                      <i className="fas fa-boxes" style={{ marginLeft: '6px' }}></i>
                      סה"כ פריטים
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4ade80' }}>
                      {selectedReceipt.receiptItems?.length || 0}
                    </div>
                  </div>

                  <div style={{
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0.05) 100%)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(168, 85, 247, 0.2)',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', marginBottom: '4px' }}>
                      <i className="fas fa-user" style={{ marginLeft: '6px' }}></i>
                      מנפיק
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#a855f7' }}>
                      {selectedReceipt.createdBy?.name || 'משתמש לא ידוע'}
                    </div>
                  </div>

                  <div style={{
                    background: 'linear-gradient(135deg, rgba(245, 101, 101, 0.15) 0%, rgba(245, 101, 101, 0.05) 100%)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(245, 101, 101, 0.2)',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', marginBottom: '4px' }}>
                      <i className="fas fa-user-check" style={{ marginLeft: '6px' }}></i>
                      מקבל
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f56565' }}>
                      {selectedReceipt.signedBy?.name || 'משתמש לא ידוע'}
                    </div>
                  </div>

                  <div style={{
                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(251, 191, 36, 0.05) 100%)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(251, 191, 36, 0.2)',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', marginBottom: '4px' }}>
                      <i className="fas fa-building" style={{ marginLeft: '6px' }}></i>
                      יחידה
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fbbf24' }}>
                      {getReceiptUnit(selectedReceipt)}
                    </div>
                  </div>

                  <div style={{
                    background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(14, 165, 233, 0.05) 100%)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(14, 165, 233, 0.2)',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', marginBottom: '4px' }}>
                      <i className="fas fa-map-marker-alt" style={{ marginLeft: '6px' }}></i>
                      מיקום
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0ea5e9' }}>
                      {getReceiptLocation(selectedReceipt)}
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div>
                  <div style={{ 
                    margin: '0 0 20px 0', 
                    fontWeight: '700', 
                    fontSize: '18px',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    background: 'linear-gradient(135deg, rgba(100, 181, 246, 0.2) 0%, rgba(100, 181, 246, 0.1) 100%)',
                    borderRadius: '12px',
                    border: '1px solid rgba(100, 181, 246, 0.3)',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                  }}>
                    <i className="fas fa-list-ul" style={{ color: '#64b5f6', fontSize: '20px' }}></i>
                    רשימת פריטים לקבלה
                  </div>
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

          <div style={{ marginBottom: '32px' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
              border: '2px solid rgba(100, 181, 246, 0.3)',
              borderRadius: '16px',
              padding: '24px',
              backdropFilter: 'blur(15px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
            }}>
              <label className="form-label required" style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                color: '#64b5f6',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="fas fa-signature" style={{ color: '#64b5f6', fontSize: '20px' }}></i>
                חתימה לאישור קבלת הפריטים
              </label>
              
              <div style={{
                background: 'linear-gradient(135deg, rgba(100, 181, 246, 0.1) 0%, rgba(100, 181, 246, 0.05) 100%)',
                border: '2px dashed rgba(100, 181, 246, 0.4)',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                minHeight: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <div style={{ 
                  marginBottom: '16px', 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  fontSize: '16px',
                  fontWeight: '500'
                }}>
                  <i className="fas fa-pen-fancy me-2" style={{ color: '#64b5f6' }}></i>
                  אנא חתמו במסגרת זו לאישור קבלת הפריטים
                </div>
                
                <div style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '12px',
                  padding: '8px',
                  margin: '0 auto',
                  maxWidth: '100%',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(0, 0, 0, 0.1)'
                }}>
                  <SignaturePad onSave={setSignature} />
                </div>
                
                <div style={{ 
                  marginTop: '16px', 
                  fontSize: '13px', 
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontStyle: 'italic'
                }}>
                  <i className="fas fa-info-circle me-1" style={{ color: '#64b5f6' }}></i>
                  החתימה מהווה אישור חוקי על קבלת הפריטים הרשומים לעיל
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

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedReceipt && (
        <DeleteReceiptModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseModal}
          onConfirm={handleConfirmDelete}
          receiptId={selectedReceipt.id}
          isLoading={isDeleting}
        />
      )}

      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        type={notification.type}
        message={notification.message}
        title={notification.title}
      />
    </>
  );
};

export default PendingReceiptsList;
