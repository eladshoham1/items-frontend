import React, { useState } from 'react';
import { PendingReceipt, SignPendingReceiptRequest } from '../../types';
import { useReceipts } from '../../hooks/useReceipts';
import { SignaturePad } from './SignaturePad';
import { Modal } from '../../shared/components';

interface PendingReceiptsListProps {
  pendingReceipts: PendingReceipt[];
  onRefresh: () => void;
}

const PendingReceiptsList: React.FC<PendingReceiptsListProps> = ({
  pendingReceipts,
  onRefresh,
}) => {
  const { signPendingReceipt } = useReceipts();
  const [selectedReceipt, setSelectedReceipt] = useState<PendingReceipt | null>(null);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [signature, setSignature] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignClick = (receipt: PendingReceipt) => {
    setSelectedReceipt(receipt);
    setIsSignModalOpen(true);
    setSignature('');
    setError(null);
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
    setSelectedReceipt(null);
    setSignature('');
    setError(null);
  };

  if (pendingReceipts.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted">אין קבלות ממתינות</p>
      </div>
    );
  }

  return (
    <>
      <div className="pending-receipts-list">
        <h4 className="mb-3">קבלות ממתינות לחתימה</h4>
        
        {pendingReceipts.map((receipt) => (
          <div key={receipt.id} className="card mb-3">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div>
                <strong>קבלה ממתינה #{receipt.id}</strong>
                <br />
                <small className="text-muted">
                  נוצר: {new Date(receipt.createdAt).toLocaleDateString('he-IL')}
                </small>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => handleSignClick(receipt)}
              >
                חתום וקבל
              </button>
            </div>
            
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>פרטי משתמש:</strong>
                  <br />
                  שם: {receipt.user.name}
                  <br />
                  מספר אישי: {receipt.user.personalNumber}
                  <br />
                  דרגה: {receipt.user.rank}
                  <br />
                  מיקום: {receipt.user.location?.name || 'לא צוין'}
                </div>
              </div>
              
              <div className="mb-3">
                <strong>פריטים:</strong>
                <ul className="list-unstyled mt-2">
                  {receipt.receiptItems.map((receiptItem) => (
                    <li key={receiptItem.id} className="border-bottom py-2">
                      <div className="d-flex justify-content-between">
                        <div>
                          <strong>{receiptItem.item.itemName.name}</strong>
                          {receiptItem.item.idNumber && (
                            <span className="text-muted"> (מס' {receiptItem.item.idNumber})</span>
                          )}
                        </div>
                      </div>
                      {receiptItem.item.note && (
                        <small className="text-muted">הערה: {receiptItem.item.note}</small>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sign Modal */}
      <Modal
        isOpen={isSignModalOpen}
        onClose={handleCloseModal}
        title={`חתימה על קבלה #${selectedReceipt?.id}`}
        size="lg"
      >
        <div className="sign-pending-receipt-modal">
          {error && (
            <div className="alert alert-danger mb-3">
              {error}
            </div>
          )}

          <div className="mb-4">
            <h5>סיכום הקבלה:</h5>
            {selectedReceipt && (
              <div>
                <p><strong>פריטים לקבלה:</strong></p>
                <ul>
                  {selectedReceipt.receiptItems.map((receiptItem) => (
                    <li key={receiptItem.id}>
                      {receiptItem.item.itemName.name}
                      {receiptItem.item.idNumber && ` (מס' ${receiptItem.item.idNumber})`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="form-label required">חתימה:</label>
            <SignaturePad onSave={setSignature} />
          </div>

          <div className="d-flex justify-content-end gap-2">
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
              className="btn btn-primary"
              onClick={handleSignSubmit}
              disabled={isSubmitting || !signature}
            >
              {isSubmitting ? 'חותם...' : 'חתום וקבל'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default PendingReceiptsList;
