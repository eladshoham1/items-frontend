import React, { useState } from 'react';
import { ServerError } from '../../shared/components';
import Modal from '../../shared/components/Modal';
import ReceiptForm from './ReceiptForm';
import { useReceipts } from '../../hooks';
import { Receipt } from '../../types';
import { paginate, generateReceiptPDF } from '../../utils';
import { UI_CONFIG } from '../../config/app.config';

const ReceiptsTab: React.FC = () => {
  const { receipts, loading, error, fetchReceipts, deleteReceipt } = useReceipts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedReceipts = () => {
    if (!receipts || !Array.isArray(receipts) || !sortConfig) {
      return receipts;
    }

    return [...receipts].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'date':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'name':
          aValue = a.user.name;
          bValue = b.user.name;
          break;
        case 'phone':
          aValue = a.user.phoneNumber;
          bValue = b.user.phoneNumber;
          break;
        case 'items':
          aValue = a.receiptItems?.length || 0;
          bValue = b.receiptItems?.length || 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue, 'he') 
          : bValue.localeCompare(aValue, 'he');
      }

      if (sortConfig.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <i className="fas fa-sort ms-1" style={{ opacity: 0.5 }}></i>;
    }
    return sortConfig.direction === 'asc' 
      ? <i className="fas fa-sort-up ms-1"></i>
      : <i className="fas fa-sort-down ms-1"></i>;
  };

  const { paginatedItems: paginatedReceipts, totalPages } = paginate(
    getSortedReceipts(),
    currentPage,
    UI_CONFIG.TABLE_PAGE_SIZE
  );

  const handleReceiptClick = async (receipt: Receipt) => {
    setGeneratingPdfId(receipt.id);
    try {
      await generateReceiptPDF(receipt);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('שגיאה ביצירת PDF. אנא נסה שוב.');
    } finally {
      setGeneratingPdfId(null);
    }
  };

  const handleAddClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleReturnItems = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setIsEditModalOpen(true);
  };

  const handleCloseReturnModal = () => {
    setIsEditModalOpen(false);
    setSelectedReceipt(null);
  };

  const handleReturnSuccess = async () => {
    handleCloseReturnModal();
    await fetchReceipts(); // Refresh the receipts list
  };

  const handleSuccess = async () => {
    handleCloseModal();
    await fetchReceipts(); // Refresh the receipts list
  };

  const handleDeleteClick = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setDeleteConfirmText('');
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedReceipt(null);
    setDeleteConfirmText('');
    setIsDeleting(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedReceipt || deleteConfirmText !== 'מחק') {
      return;
    }

    setIsDeleting(true);
    try {
      const success = await deleteReceipt(selectedReceipt.id);
      if (success) {
        handleCloseDeleteModal();
        // No need to refresh - the hook already removes the item from state
      } else {
        alert('שגיאה במחיקת הקבלה');
      }
    } catch (error) {
      console.error('Error deleting receipt:', error);
      alert('שגיאה במחיקת הקבלה');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="mb-0">קבלות</h2>
            <button className="btn btn-primary" onClick={handleAddClick}>
              צור קבלה חדשה
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="alert alert-info">
            <div className="spinner"></div>
            <span>טוען נתונים...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <ServerError />;
  }

  return (
    <div className="card">
      <div className="card-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="mb-0">קבלות</h2>
          <button className="btn btn-primary" onClick={handleAddClick}>
            צור קבלה חדשה
          </button>
        </div>
      </div>

      <div className="card-body">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th 
                  className="sortable-header" 
                  onClick={() => handleSort('date')}
                  title="לחץ למיון לפי תאריך"
                  data-sorted={sortConfig?.key === 'date' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <span>תאריך מלא</span>
                    <div className="sort-indicator">
                      {getSortIcon('date')}
                    </div>
                  </div>
                </th>
                <th 
                  className="sortable-header" 
                  onClick={() => handleSort('name')}
                  title="לחץ למיון לפי שם המקבל"
                  data-sorted={sortConfig?.key === 'name' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <span>שם המקבל</span>
                    <div className="sort-indicator">
                      {getSortIcon('name')}
                    </div>
                  </div>
                </th>
                <th 
                  className="sortable-header" 
                  onClick={() => handleSort('phone')}
                  title="לחץ למיון לפי טלפון"
                  data-sorted={sortConfig?.key === 'phone' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <span>טלפון</span>
                    <div className="sort-indicator">
                      {getSortIcon('phone')}
                    </div>
                  </div>
                </th>
                <th 
                  className="sortable-header" 
                  onClick={() => handleSort('items')}
                  title="לחץ למיון לפי פריטים"
                  data-sorted={sortConfig?.key === 'items' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <span>פריטים</span>
                    <div className="sort-indicator">
                      {getSortIcon('items')}
                    </div>
                  </div>
                </th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {paginatedReceipts.map((receipt: Receipt) => (
                <tr key={receipt.id}>
                  <td>{new Date(receipt.createdAt).toLocaleDateString('he-IL', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</td>
                  <td>{receipt.user.name}</td>
                  <td>{receipt.user.phoneNumber}</td>
                  <td>{receipt.receiptItems?.length || 0} פריטים</td>
                  <td>
                    <div className="d-flex justify-content-start">
                      <button 
                        className="btn btn-sm btn-outline-primary" 
                        onClick={() => handleReceiptClick(receipt)}
                        disabled={generatingPdfId === receipt.id}
                        title="הורד קבלה כ-PDF"
                        style={{ minWidth: '100px', marginLeft: '5px', marginRight: '5px' }}
                      >
                        {generatingPdfId === receipt.id ? (
                          <>
                            <div className="spinner-border spinner-border-sm me-1" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            יוצר PDF...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-download me-1"></i>
                            הורד PDF
                          </>
                        )}
                      </button>
                      
                      <button 
                        className="btn btn-sm btn-outline-secondary" 
                        onClick={() => handleReturnItems(receipt)}
                        title="ערוך קבלה"
                        style={{ minWidth: '100px', marginLeft: '5px', marginRight: '5px' }}
                      >
                        <i className="fas fa-edit me-1"></i>
                        ערוך קבלה
                      </button>

                      <button 
                        className="btn btn-sm btn-danger" 
                        onClick={() => handleDeleteClick(receipt)}
                        title="מחק קבלה"
                        style={{ minWidth: '80px', marginLeft: '5px', marginRight: '5px' }}
                      >
                        <i className="fas fa-trash me-1"></i>
                        מחק
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`btn btn-sm ${currentPage === page ? 'btn-primary' : 'btn-outline'}`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="צור קבלה חדשה"
        size="lg"
      >
        <ReceiptForm
          onSuccess={handleSuccess}
          onCancel={handleCloseModal}
        />
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseReturnModal}
        title="ערוך קבלה"
        size="lg"
      >
        <ReceiptForm
          receipt={selectedReceipt}
          onSuccess={handleReturnSuccess}
          onCancel={handleCloseReturnModal}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        title="מחק קבלה"
        size="md"
      >
        <div className="p-4">
          {selectedReceipt && (
            <>
              <div className="alert alert-danger" role="alert">
                <i className="fas fa-exclamation-triangle me-2"></i>
                <strong>אזהרה!</strong> פעולה זו תמחק את הקבלה לצמיתות ולא ניתן יהיה לשחזר אותה.
              </div>
              
              <div className="mb-3">
                <h6>פרטי הקבלה למחיקה:</h6>
                <ul className="list-unstyled">
                  <li><strong>תאריך:</strong> {new Date(selectedReceipt.createdAt).toLocaleDateString('he-IL', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</li>
                  <li><strong>שם המקבל:</strong> {selectedReceipt.user.name}</li>
                  <li><strong>פריטים:</strong> {selectedReceipt.receiptItems?.length || 0} פריטים</li>
                </ul>
              </div>

              <div className="mb-4">
                <label className="form-label">
                  <strong>כדי לאשר את המחיקה, הקלד "מחק" בתיבת הטקסט:</strong>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="הקלד 'מחק' כדי לאשר"
                  style={{ direction: 'rtl' }}
                />
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseDeleteModal}
                  disabled={isDeleting}
                >
                  <i className="fas fa-times me-1"></i>
                  ביטול
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleConfirmDelete}
                  disabled={deleteConfirmText !== 'מחק' || isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <div className="spinner-border spinner-border-sm me-1" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      מוחק...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-trash me-1"></i>
                      מחק קבלה
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ReceiptsTab;
