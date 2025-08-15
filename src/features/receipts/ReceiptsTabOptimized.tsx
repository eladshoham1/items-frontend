import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Receipt, User } from '../../types';
import { useReceipts } from '../../hooks';
import { paginate } from '../../utils';
import { generateReceiptPDF } from '../../utils/pdfGenerator';
import { UI_CONFIG } from '../../config/app.config';
import { Modal, SmartPagination, TabNavigation } from '../../shared/components';
import CreateReceiptForm from './CreateReceiptForm';
import PendingReceiptsList from './PendingReceiptsList';
import ReceiptDetailsModal from './ReceiptDetailsModal';
import DeleteReceiptModal from './DeleteReceiptModal';
import { ReceiptFormValidation } from './utils/ReceiptFormValidation';
import './ReceiptsTab.css';
import '../../shared/styles/components.css';

interface ReceiptsTabProps {
  userProfile: User;
  isAdmin: boolean;
}

const ReceiptsTab: React.FC<ReceiptsTabProps> = ({ userProfile, isAdmin }) => {
  const { receipts, pendingReceipts, fetchPendingReceipts, fetchMyPendingReceipts, deleteReceipt, fetchReceipts } = useReceipts();
  
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'signed' | 'pending'>('signed');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Modal states
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [detailsReceipt, setDetailsReceipt] = useState<Receipt | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Permission check
  const canCreateReceipts = ReceiptFormValidation.validateUserPermissions(isAdmin, 'create');
  const canUpdateReceipts = ReceiptFormValidation.validateUserPermissions(isAdmin, 'update');
  const canDeleteReceipts = ReceiptFormValidation.validateUserPermissions(isAdmin, 'delete');

  // Helper functions
  const formatDate = (timestamp: string | Date): string => {
    return format(new Date(timestamp), 'dd/MM/yy HH:mm:ss');
  };

  const getUnit = (receipt: Receipt): string => 
    receipt.signedBy?.location?.unit?.name || 
    receipt.createdBy?.location?.unit?.name || 
    '—';

  // Tab configuration
  const receiptTabs = [
    { 
      id: 'signed', 
      label: isAdmin ? 'כל הקבלות החתומות' : 'קבלות המיקום שלי', 
      icon: 'fas fa-receipt' 
    },
    { 
      id: 'pending', 
      label: isAdmin ? 'כל הקבלות הממתינות' : 'קבלות ממתינות במיקום שלי', 
      icon: 'fas fa-clock' 
    },
  ];

  // Filter receipts based on user role and location
  const filteredReceipts = useMemo(() => {
    if (isAdmin) {
      return receipts; // Admins see all receipts
    }
    
    // Non-admin users see receipts related to their location
    return receipts.filter(receipt => {
      const signedByLocation = receipt.signedBy?.location?.name;
      const createdByLocation = receipt.createdBy?.location?.name;
      const userLocation = userProfile.location;
      
      return signedByLocation === userLocation || createdByLocation === userLocation;
    });
  }, [receipts, isAdmin, userProfile.location]);

  const filteredPendingReceipts = useMemo(() => {
    if (isAdmin) {
      return pendingReceipts; // Admins see all pending receipts
    }
    
    // Non-admin users see pending receipts related to their location
    return pendingReceipts.filter(receipt => {
      const signedByLocation = receipt.signedBy?.location?.name;
      const createdByLocation = receipt.createdBy?.location?.name;
      const userLocation = userProfile.location;
      
      return signedByLocation === userLocation || createdByLocation === userLocation;
    });
  }, [pendingReceipts, isAdmin, userProfile.location]);

  // Search and sort functionality
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

  const filteredAndSortedReceipts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    let filtered = filteredReceipts.filter((receipt) => {
      const issuer = receipt.createdBy?.name?.toLowerCase() || '';
      const receiver = receipt.signedBy?.name?.toLowerCase() || '';
      const unit = getUnit(receipt).toLowerCase();
      const count = (receipt.receiptItems?.length || 0).toString();
      const dateStr = formatDate(receipt.updatedAt.toString()).toLowerCase();
      
      return issuer.includes(term) || 
             receiver.includes(term) || 
             unit.includes(term) || 
             count.includes(term) || 
             dateStr.includes(term);
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
            aVal = getUnit(a);
            bVal = getUnit(b);
            break;
          case 'itemCount':
            aVal = a.receiptItems?.length || 0;
            bVal = b.receiptItems?.length || 0;
            break;
          case 'updatedAt':
            aVal = new Date(a.updatedAt).getTime();
            bVal = new Date(b.updatedAt).getTime();
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
  }, [filteredReceipts, searchTerm, sortConfig]);

  const { paginatedItems: paginatedReceipts, totalPages } = paginate(
    filteredAndSortedReceipts, 
    currentPage, 
    UI_CONFIG.TABLE_PAGE_SIZE
  );

  // Event handlers
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as 'signed' | 'pending');
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Load pending receipts when tab changes
  useEffect(() => {
    if (activeTab === 'pending') {
      if (isAdmin) {
        fetchPendingReceipts();
      } else {
        fetchMyPendingReceipts();
      }
    }
  }, [activeTab, isAdmin, fetchPendingReceipts, fetchMyPendingReceipts]);

  // Modal handlers
  const handleCreateClick = () => {
    if (!canCreateReceipts) return;
    setSelectedReceipt(null);
    setIsCreateModalOpen(true);
  };

  const handleUpdateClick = (receipt: Receipt) => {
    if (!canUpdateReceipts) return;
    setSelectedReceipt(receipt);
    setIsUpdateModalOpen(true);
  };

  const handleDeleteClick = (receipt: Receipt) => {
    if (!canDeleteReceipts) return;
    setSelectedReceipt(receipt);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedReceipt) return;

    setIsDeleting(true);
    try {
      const success = await deleteReceipt(selectedReceipt.id);
      if (success) {
        closeAllModals();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const closeAllModals = () => {
    setSelectedReceipt(null);
    setDetailsReceipt(null);
    setIsCreateModalOpen(false);
    setIsUpdateModalOpen(false);
    setIsDeleteModalOpen(false);
  };

  const handleFormSuccess = () => {
    closeAllModals();
    fetchReceipts(); // Refresh data
  };

  const handleDownloadPDF = (receipt: Receipt) => {
    try {
      generateReceiptPDF(receipt);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Could add toast notification here
    }
  };

  const handlePendingReceiptsRefresh = async () => {
    await fetchReceipts();
  };

  // Check if user has location assigned
  if (!userProfile.location) {
    return (
      <div className="surface receipts-tab-container">
        <div style={{ padding: '20px' }}>
          <div className="alert alert-warning">
            <h4>אין לך גישה למערכת</h4>
            <p>המשתמש שלך לא שוייך למיקום. אנא פנה למנהל המערכת כדי לשייך אותך למיקום.</p>
          </div>
        </div>
      </div>
    );
  }

  const renderSignedReceiptsTab = () => (
    <div>
      <div className="header-actions mb-4">
        <h3>{isAdmin ? 'כל הקבלות החתומות' : 'קבלות המיקום שלי'}</h3>
        {canCreateReceipts && (
          <button className="btn btn-primary" onClick={handleCreateClick}>
            <i className="fas fa-plus me-2"></i>
            צור קבלה חדשה
          </button>
        )}
      </div>

      {/* Search bar */}
      <div className="search-bar mb-3" style={{ direction: 'rtl' }}>
        <div className="input-group">
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
              onClick={clearSearch}
              title="נקה חיפוש"
            >
              <i className="fas fa-times" />
            </button>
          )}
        </div>
      </div>

      {paginatedReceipts.length === 0 ? (
        <div className="empty-state text-center py-5">
          <i className="fas fa-receipt fa-3x text-muted mb-3"></i>
          <h4>אין קבלות להצגה</h4>
          <p className="text-muted">
            {isAdmin ? 'לא נמצאו קבלות במערכת' : 'לא נמצאו קבלות עבור המיקום שלך'}
          </p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th 
                    className="sortable-header" 
                    onClick={() => handleSort('createdBy')}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <span>מנפיק</span>
                      {getSortIcon('createdBy')}
                    </div>
                  </th>
                  <th 
                    className="sortable-header" 
                    onClick={() => handleSort('signedBy')}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <span>מקבל</span>
                      {getSortIcon('signedBy')}
                    </div>
                  </th>
                  <th 
                    className="sortable-header" 
                    onClick={() => handleSort('unit')}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <span>יחידה</span>
                      {getSortIcon('unit')}
                    </div>
                  </th>
                  <th 
                    className="sortable-header" 
                    onClick={() => handleSort('itemCount')}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <span>כמות פריטים</span>
                      {getSortIcon('itemCount')}
                    </div>
                  </th>
                  <th 
                    className="sortable-header" 
                    onClick={() => handleSort('updatedAt')}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <span>תאריך חתימה</span>
                      {getSortIcon('updatedAt')}
                    </div>
                  </th>
                  <th style={{ width: '200px' }}>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReceipts.map(receipt => (
                  <tr 
                    key={receipt.id} 
                    onClick={() => setDetailsReceipt(receipt)} 
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{receipt.createdBy?.name || 'משתמש לא ידוע'}</td>
                    <td>{receipt.signedBy?.name || 'משתמש לא ידוע'}</td>
                    <td>{getUnit(receipt)}</td>
                    <td>{receipt.receiptItems?.length || 0}</td>
                    <td>{formatDate(receipt.updatedAt.toString())}</td>
                    <td>
                      <div className="btn-group" onClick={(e) => e.stopPropagation()}>
                        {canUpdateReceipts && (
                          <button 
                            className="btn btn-sm btn-outline-primary" 
                            onClick={() => handleUpdateClick(receipt)}
                            title="עדכן קבלה"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                        )}
                        {canDeleteReceipts && (
                          <button 
                            className="btn btn-sm btn-outline-danger" 
                            onClick={() => handleDeleteClick(receipt)}
                            title="מחק קבלה"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        )}
                        <button 
                          className="btn btn-sm btn-outline-info" 
                          onClick={() => handleDownloadPDF(receipt)}
                          title="הורד PDF"
                        >
                          <i className="fas fa-download"></i>
                        </button>
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
        </>
      )}
    </div>
  );

  const renderPendingReceiptsTab = () => (
    <div style={{ direction: 'rtl' }}>
      <PendingReceiptsList
        pendingReceipts={filteredPendingReceipts}
        onRefresh={handlePendingReceiptsRefresh}
        isAdmin={isAdmin}
        currentUserId={userProfile?.id}
      />
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'signed':
        return renderSignedReceiptsTab();
      case 'pending':
        return renderPendingReceiptsTab();
      default:
        return null;
    }
  };

  return (
    <div className="surface receipts-tab-container">
      <TabNavigation
        tabs={receiptTabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        variant="primary"
        size="md"
      />
      
      <div style={{ padding: '20px' }}>
        {renderTabContent()}
      </div>

      {/* Receipt Details Modal */}
      <ReceiptDetailsModal
        receipt={detailsReceipt}
        isOpen={!!detailsReceipt}
        onClose={() => setDetailsReceipt(null)}
      />

      {/* Create Receipt Modal */}
      {isCreateModalOpen && (
        <Modal isOpen={isCreateModalOpen} onClose={closeAllModals} size="lg">
          <CreateReceiptForm
            onSuccess={handleFormSuccess}
            onCancel={closeAllModals}
            isAdmin={isAdmin}
            currentUser={userProfile}
          />
        </Modal>
      )}

      {/* Update Receipt Modal */}
      {isUpdateModalOpen && selectedReceipt && (
        <Modal isOpen={isUpdateModalOpen} onClose={closeAllModals} size="lg">
          <CreateReceiptForm
            originalReceipt={selectedReceipt}
            onSuccess={handleFormSuccess}
            onCancel={closeAllModals}
            isAdmin={isAdmin}
            currentUser={userProfile}
          />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedReceipt && (
        <DeleteReceiptModal
          isOpen={isDeleteModalOpen}
          onClose={closeAllModals}
          onConfirm={handleConfirmDelete}
          receiptId={selectedReceipt.id}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};

export default ReceiptsTab;
