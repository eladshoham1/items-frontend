import React from 'react';
import './PendingReceiptsBadge.css';

interface PendingReceiptsBadgeProps {
  count: number;
  onClick: () => void;
  className?: string;
  isUrgent?: boolean; // For counts > 5, show as urgent
}

const PendingReceiptsBadge: React.FC<PendingReceiptsBadgeProps> = ({ 
  count, 
  onClick, 
  className = '',
  isUrgent = false
}) => {
  if (count === 0) {
    return null;
  }

  const urgentClass = count > 5 || isUrgent ? 'urgent' : '';
  const title = count === 1 
    ? 'יש לך קבלה אחת ממתינה לחתימה' 
    : `יש לך ${count} קבלות ממתינות לחתימה`;

  return (
    <button 
      className={`pending-receipts-badge ${urgentClass} ${className}`}
      onClick={onClick}
      title={title}
      aria-label={`קבלות ממתינות: ${count}`}
    >
      <div className="badge-icon">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.7L16.2,16.2Z"/>
        </svg>
        {count > 0 && (
          <span className="badge-count" data-count={count > 99 ? '99+' : count}>
            {count > 99 ? '99+' : count}
          </span>
        )}
      </div>
      <span className="badge-text">קבלות ממתינות</span>
    </button>
  );
};

export default PendingReceiptsBadge;