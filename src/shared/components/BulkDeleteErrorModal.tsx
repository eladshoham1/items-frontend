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

// Translate common backend error messages to Hebrew
const translateErrorMessage = (msg: string, type: 'user' | 'item') => {
  if (!msg) return '';
  const m = msg.toLowerCase();

  const translations: Array<{ test: (s: string) => boolean; he: string }> = [
    { test: s => s.includes('cannot delete items that have been signed'), he: 'לא ניתן למחוק פריטים שנחתמו עבורם' },
    { test: s => s.includes('cannot delete item that has been signed'), he: 'לא ניתן למחוק פריט שנחתם עבורו' },
    { test: s => s.includes('cannot delete users with active receipts'), he: 'לא ניתן למחוק משתמשים עם קבלות פעילות' },
    { test: s => s.includes('is referenced in receipts') || s.includes('referenced by receipts'), he: 'לא ניתן למחוק: הפריט מקושר לקבלות' },
    { test: s => s.includes('assigned to users') || s.includes('allocated to users'), he: 'לא ניתן למחוק: הפריט מוקצה למשתמשים' },
    { test: s => s.includes('foreign key') || s.includes('dependency'), he: 'לא ניתן למחוק עקב תלות ברשומות אחרות' },
    { test: s => s.includes('cannot delete') && s.includes('signed'), he: 'לא ניתן למחוק פריטים שנחתמו עבורם' },
  ];

  const found = translations.find(t => t.test(m));
  if (found) return found.he;

  // Default: return original message; optionally wrap in Hebrew context
  return msg;
};

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
  const displayMessage = translateErrorMessage(message, type);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="bulk-delete-error-modal bdem" dir="rtl">
        {/* Summary - compact cards */}
        <div className="bdem-summary">
          <div className="bdem-card">
            <div className="bdem-card-label">סה"כ נבחרו</div>
            <div className="bdem-card-number text-primary">{totalCount}</div>
          </div>
          <div className="bdem-card">
            <div className="bdem-card-label">נמחקו בהצלחה</div>
            <div className="bdem-card-number text-success">{deletedCount}</div>
          </div>
          <div className="bdem-card">
            <div className="bdem-card-label">נכשלו</div>
            <div className="bdem-card-number text-danger">{failedCount}</div>
          </div>
        </div>

        {/* Error banner */}
        <div className="bdem-banner bdem-banner-danger">
          <i className="fas fa-times-circle"></i>
          <div>
            <div className="bdem-banner-title">סיבת הכשל</div>
            <div className="bdem-banner-text">{displayMessage}</div>
          </div>
        </div>

        {/* Failed items */}
        {errors.length > 0 && (
          <div className="bdem-section">
            <div className="bdem-section-title">
              <i className="fas fa-list"></i>
              {entityName} שלא ניתן למחוק ({errors.length}):
            </div>
            <div className="bdem-list">
              {errors.map((errorItem, index) => (
                <div key={index} className="bdem-list-item">
                  <i className="fas fa-times-circle text-danger"></i>
                  <span className="bdem-list-text">{errorItem}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="bdem-banner bdem-banner-info" style={{ marginTop: 12 }}>
          <i className="fas fa-lightbulb"></i>
          <div>
            <div className="bdem-banner-title">פתרונות מומלצים</div>
            {type === 'user' ? (
              <ul className="mb-0">
                <li>החזר את כל הפריטים המוקצים למשתמשים אלה</li>
                <li>בטל את הקצאת הפריטים דרך מסך הקבלות</li>
                <li>מחק תחילה את הקבלות הפעילות של המשתמשים</li>
              </ul>
            ) : (
              <ul className="mb-0">
                <li>החזר את הפריטים דרך מסך הקבלות</li>
                <li>בטל את הקצאת הפריטים למשתמשים</li>
                <li>מחק את הקבלות המכילות את הפריטים</li>
              </ul>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="d-flex justify-content-end mt-3">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            <i className="fas fa-check me-2"></i>
            הבנתי
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BulkDeleteErrorModal;
