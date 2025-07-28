import React, { useState } from 'react';
import { ServerError } from '../../shared/components';
import Modal from '../../shared/components/Modal';
import ReceiptForm from './ReceiptForm';
import ReturnItemsModal from './ReturnItemsModal';
import { useReceipts } from '../../hooks';
import { Receipt } from '../../types';
import { paginate, generateReceiptPDF } from '../../utils';
import { UI_CONFIG } from '../../config/app.config';

const ReceiptsTab: React.FC = () => {
  const { receipts, loading, error, fetchReceipts } = useReceipts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);

  const { paginatedItems: paginatedReceipts, totalPages } = paginate(
    receipts,
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
    setIsReturnModalOpen(true);
  };

  const handleCloseReturnModal = () => {
    setIsReturnModalOpen(false);
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
                <th>תאריך מלא</th>
                <th>שם המקבל</th>
                <th>טלפון</th>
                <th>פריטים</th>
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
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-sm btn-outline-primary" 
                        onClick={() => handleReceiptClick(receipt)}
                        disabled={generatingPdfId === receipt.id}
                        title="הורד קבלה כ-PDF"
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
                        className="btn btn-sm btn-outline-danger" 
                        onClick={() => handleReturnItems(receipt)}
                        title="החזר פריטים"
                      >
                        <i className="fas fa-undo me-1"></i>
                        החזר פריטים
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
        isOpen={isReturnModalOpen}
        onClose={handleCloseReturnModal}
        title="החזר פריטים מקבלה"
        size="lg"
      >
        <ReturnItemsModal
          receipt={selectedReceipt}
          onSuccess={handleReturnSuccess}
          onCancel={handleCloseReturnModal}
        />
      </Modal>
    </div>
  );
};

export default ReceiptsTab;
