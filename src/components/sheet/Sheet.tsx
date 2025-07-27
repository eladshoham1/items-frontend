import React from 'react';
import './Sheet.css';

interface SheetProps {
  children: React.ReactNode;
  onClose?: () => void;
}

const Sheet: React.FC<SheetProps> = ({ children, onClose }) => {
  return (
    <div className="sheet-overlay">
      <div className="sheet-content">
        {onClose && (
          <button className="sheet-close-btn" onClick={onClose} aria-label="סגור">
            &times;
          </button>
        )}
        {children}
      </div>
    </div>
  );
};

export default Sheet;
