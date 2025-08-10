import React from 'react';
import './ConflictErrorModal.css';

interface ConflictErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  resolutionMessage: string;
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
  return found ? found.he : msg;
};

const ConflictErrorModal: React.FC<ConflictErrorModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  resolutionMessage,
  type
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    return type === 'user' ? 'fas fa-user-times' : 'fas fa-box-open';
  };

  const getColor = () => {
    return type === 'user' ? '#dc3545' : '#fd7e14';
  };

  const displayMessage = translateErrorMessage(message, type);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content conflict-modal" onClick={e => e.stopPropagation()} dir="rtl">
        <div className="modal-header conflict-header" style={{ backgroundColor: getColor() }}>
          <h4 className="modal-title">
            <i className={`${getIcon()} me-2`}></i>
            {title}
          </h4>
          <button 
            className="btn-close btn-close-white" 
            onClick={onClose}
            aria-label="סגור"
          ></button>
        </div>
        
        <div className="modal-body">
          <div className="conflict-explanation">
            <div className="alert alert-warning d-flex align-items-start">
              <i className="fas fa-exclamation-triangle me-3 mt-1" style={{ color: '#856404' }}></i>
              <div>
                <strong>בעיה:</strong>
                <p className="mb-0 mt-2" style={{ whiteSpace: 'pre-line', fontWeight: 500 }}>{displayMessage}</p>
              </div>
            </div>
          </div>
          
          <div className="resolution-guide">
            <div className="alert alert-info d-flex align-items-start">
              <i className="fas fa-lightbulb me-3 mt-1" style={{ color: '#0c5460' }}></i>
              <div>
                <strong>פתרונות אפשריים:</strong>
                <div className="mt-2" style={{ whiteSpace: 'pre-line' }}>
                  {resolutionMessage}
                </div>
              </div>
            </div>
          </div>
          
          <div className="additional-help">
            <div className="card bg-light">
              <div className="card-body">
                <h6 className="card-title">
                  <i className="fas fa-info-circle me-2"></i>
                  מידע נוסף
                </h6>
                <p className="card-text small">
                  {type === 'user' 
                    ? 'מחיקת משתמש אפשרית רק כאשר אין לו פריטים מוקצים. ניתן לעקוב אחר הפריטים המוקצים דרך מסך הדוחות.'
                    : 'מחיקת פריט אפשרית רק כאשר הוא לא מוקצה למשתמש כלשהו. ניתן לבדוק את סטטוס הפריט דרך מסך הפריטים.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            className="btn btn-primary"
            onClick={onClose}
          >
            <i className="fas fa-check me-2"></i>
            הבנתי
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConflictErrorModal;
