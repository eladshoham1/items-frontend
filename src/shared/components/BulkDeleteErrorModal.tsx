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
  type: 'user' | 'item' | 'unit' | 'location' | 'itemName';
}

// Translate common backend error messages to Hebrew
const translateErrorMessage = (msg: string, type: 'user' | 'item' | 'unit' | 'location' | 'itemName') => {
  if (!msg) return '';
  const m = msg.toLowerCase();

  const translations: Array<{ test: (s: string) => boolean; he: string }> = [
    { test: s => s.includes('cannot delete items that have been signed'), he: 'לא ניתן למחוק פריטים שנחתמו עבורם' },
    { test: s => s.includes('cannot delete item that has been signed'), he: 'לא ניתן למחוק פריט שנחתם עבורו' },
    { test: s => s.includes('cannot delete users with active receipts'), he: 'לא ניתן למחוק משתמשים עם קבלות פעילות' },
    { test: s => s.includes('is referenced in receipts') || s.includes('referenced by receipts'), he: 'לא ניתן למחוק: הפריט מקושר לקבלות' },
    { test: s => s.includes('assigned to users') || s.includes('allocated to users'), he: 'לא ניתן למחוק: הפריט מוקצה למשתמשים' },
    // Locations: FK from users to locations
    { test: s => s.includes('users_locationid_fkey') || (s.includes('location') && s.includes('users') && s.includes('foreign key')), he: 'לא ניתן למחוק מיקום המשויך למשתמשים. יש להסיר את שיוך המשתמשים לפני המחיקה.' },
    { test: s => s.includes('foreign key') || s.includes('dependency'), he: 'לא ניתן למחוק עקב תלות ברשומות אחרות' },
    // Management: units with locations having users
    { test: s => s.includes('cannot delete unit') && s.includes('locations') && s.includes('assigned users'), he: 'לא ניתן למחוק יחידה שיש לה מיקומים עם משתמשים משויכים. יש להסיר/להעביר את המשתמשים תחילה.' },
  ];

  const found = translations.find(t => t.test(m));
  if (found) return found.he;

  // Default: return original message
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
  const entityName = (
    type === 'user' ? 'משתמשים' :
    type === 'item' ? 'פריטים' :
    type === 'unit' ? 'יחידות' :
    type === 'location' ? 'מיקומים' :
    'שמות פריטים'
  );
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
            ) : type === 'unit' ? (
              <ul className="mb-0">
                <li>אתר מיקומים ביחידה שבהם משויכים משתמשים</li>
                <li>העבר את המשתמשים ליחידה אחרת או הסר את שיוכם</li>
                <li>לאחר שאין שיוכים, נסה למחוק שוב את היחידה</li>
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
