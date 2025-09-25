import React, { useEffect, useState } from 'react';

interface PendingReceiptsToastProps {
  count: number;
  onNavigate: () => void;
  onDismiss: () => void;
}

const PendingReceiptsToast: React.FC<PendingReceiptsToastProps> = ({
  count,
  onNavigate,
  onDismiss
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (count > 0) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss();
      }, 5000); // Auto-dismiss after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [count, onDismiss]);

  if (!isVisible || count === 0) {
    return null;
  }

  const message = count === 1 
    ? 'יש לך קבלה חדשה ממתינה לחתימה'
    : `יש לך ${count} קבלות חדשות ממתינות לחתימה`;

  return (
    <div 
      className="pending-receipts-toast"
      style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 1050,
        maxWidth: '300px',
        animation: 'slideInRight 0.3s ease-out',
        direction: 'rtl'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
            📝 קבלות ממתינות
          </div>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>
            {message}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => {
              setIsVisible(false);
              onNavigate();
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            עבור
          </button>
          <button
            onClick={() => {
              setIsVisible(false);
              onDismiss();
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              padding: '2px',
              cursor: 'pointer',
              fontSize: '16px',
              lineHeight: 1
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingReceiptsToast;