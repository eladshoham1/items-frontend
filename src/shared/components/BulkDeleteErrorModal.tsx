import React from 'react';
import Modal from './Modal';
import './BulkDeleteErrorModal.css';

interface BulkDeleteErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  deletedCount: number;
  totalCount: number;
  errors: string[];
  type: 'user' | 'item';
}

const BulkDeleteErrorModal: React.FC<BulkDeleteErrorModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  deletedCount,
  totalCount,
  errors,
  type
}) => {
  const entityName = type === 'user' ? 'משתמשים' : 'פריטים';
  const failedCount = totalCount - deletedCount;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
    >
      <div className="bulk-delete-error-modal">
        {/* Summary */}
        <div className="alert alert-warning mb-4">
          <div className="d-flex align-items-center mb-3">
            <i className="fas fa-exclamation-triangle me-2 text-warning"></i>
            <strong>סיכום מחיקה</strong>
          </div>
          <div className="container-fluid">
            <div className="row g-3 text-center justify-content-center">
              <div className="col-12 col-sm-4">
                <div className="stat-box bg-white p-3 rounded border shadow-sm">
                  <div className="stat-number text-primary h3 mb-1 fw-bold">{totalCount}</div>
                  <div className="stat-label small text-muted fw-medium">סה"כ נבחרו</div>
                </div>
              </div>
              <div className="col-12 col-sm-4">
                <div className="stat-box bg-white p-3 rounded border shadow-sm">
                  <div className="stat-number text-success h3 mb-1 fw-bold">{deletedCount}</div>
                  <div className="stat-label small text-muted fw-medium">נמחקו בהצלחה</div>
                </div>
              </div>
              <div className="col-12 col-sm-4">
                <div className="stat-box bg-white p-3 rounded border shadow-sm">
                  <div className="stat-number text-danger h3 mb-1 fw-bold">{failedCount}</div>
                  <div className="stat-label small text-muted fw-medium">נכשלו</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="alert alert-danger mb-4">
          <div className="d-flex align-items-center mb-2">
            <i className="fas fa-times-circle me-2 text-danger"></i>
            <strong>סיבת הכשל</strong>
          </div>
          <p className="mb-0">{message}</p>
        </div>

        {/* Failed Items List */}
        {errors.length > 0 && (
          <div className="failed-items-section">
            <h6 className="mb-3">
              <i className="fas fa-list me-2"></i>
              {entityName} שלא ניתן למחוק ({errors.length}):
            </h6>
            <div className="failed-items-list bg-light p-3 rounded" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {errors.map((errorItem, index) => (
                <div key={index} className="failed-item mb-2">
                  <div className="d-flex align-items-center">
                    <i className="fas fa-times-circle text-danger me-2"></i>
                    <span className="fw-medium">{errorItem}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resolution Tips */}
        <div className="resolution-section mt-4">
          <h6 className="mb-3">
            <i className="fas fa-lightbulb me-2"></i>
            פתרונות מומלצים:
          </h6>
          <div className="alert alert-info">
            {type === 'user' ? (
              <ul className="mb-0 ps-3">
                <li>החזר את כל הפריטים המוקצים למשתמשים אלה</li>
                <li>בטל את הקצאת הפריטים דרך מסך הקבלות</li>
                <li>מחק תחילה את הקבלות הפעילות של המשתמשים</li>
              </ul>
            ) : (
              <ul className="mb-0 ps-3">
                <li>החזר את הפריטים דרך מסך הקבלות</li>
                <li>בטל את הקצאת הפריטים למשתמשים</li>
                <li>מחק את הקבלות המכילות את הפריטים</li>
              </ul>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-flex justify-content-end mt-4">
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
          >
            <i className="fas fa-check me-2"></i>
            הבנתי
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BulkDeleteErrorModal;
