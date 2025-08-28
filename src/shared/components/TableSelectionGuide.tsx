import React, { useState, useEffect } from 'react';

interface TableSelectionGuideProps {
  onDismiss?: () => void;
  showOnFirstVisit?: boolean;
}

export const TableSelectionGuide: React.FC<TableSelectionGuideProps> = ({ 
  onDismiss, 
  showOnFirstVisit = true 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    const hasSeenGuide = localStorage.getItem('table-selection-guide-seen');
    
    if (showOnFirstVisit && !hasSeenGuide) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', checkMobile);
      };
    }
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [showOnFirstVisit]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('table-selection-guide-seen', 'true');
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <div className="table-selection-guide">
      <div className="guide-content">
        <div className="guide-header">
          <i className="fas fa-touch" style={{ color: '#3b82f6' }}></i>
          <h4>בחירה בטבלה</h4>
          <button onClick={handleDismiss} className="guide-close">
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="guide-message">
          {isMobile ? (
            <p>גע על שורה כדי לבחור אותה. השתמש בכפתור "בחר הכל" למטה לבחירה של כל הפריטים.</p>
          ) : (
            <p>לחץ על שורה לבחירה. השתמש ב-Ctrl+לחיצה לבחירה מרובה.</p>
          )}
        </div>
      </div>
    </div>
  );
};
