import React, { useState } from 'react';
import Modal from '../../shared/components/Modal';

interface DeleteReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  receiptId: string;
  isLoading?: boolean;
}

const DeleteReceiptModal: React.FC<DeleteReceiptModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  receiptId,
  isLoading = false
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (confirmationText.trim() !== 'מחק') {
      setError('יש להקליד "מחק" בדיוק כדי לאשר המחיקה');
      return;
    }

    setError(null);
    onConfirm();
  };

  const handleClose = () => {
    setConfirmationText('');
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="מחיקת קבלה" size="md">
      <div style={{ direction: 'rtl', padding: '20px' }}>
        <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
          <i className="fas fa-exclamation-triangle me-2"></i>
          <strong>אזהרה:</strong> פעולה זו תמחק את הקבלה לצמיתות ולא ניתן יהיה לשחזר אותה.
        </div>

        <div style={{ marginBottom: '20px' }}>
          <p><strong>מזהה קבלה:</strong> {receiptId}</p>
          <p>האם את/ה בטוח/ה שברצונך למחוק קבלה זו?</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label required">
              אנא הקלד/י <strong>"מחק"</strong> כדי לאשר המחיקה:
            </label>
            <input
              type="text"
              className={`form-control ${error ? 'is-invalid' : ''}`}
              value={confirmationText}
              onChange={(e) => {
                setConfirmationText(e.target.value);
                if (error) setError(null);
              }}
              placeholder="הקלד מחק"
              required
              disabled={isLoading}
              autoFocus
            />
            {error && (
              <div className="invalid-feedback" style={{ display: 'block' }}>
                {error}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={isLoading}
            >
              ביטול
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              disabled={isLoading || confirmationText.trim() !== 'מחק'}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin me-2"></i>
                  מוחק...
                </>
              ) : (
                <>
                  <i className="fas fa-trash me-2"></i>
                  מחק קבלה
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default DeleteReceiptModal;
