import React, { useState, useEffect } from 'react';

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
  mobileBreakpoint?: number;
  enableCardLayout?: boolean;
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  children,
  className = '',
  mobileBreakpoint = 768,
  enableCardLayout = true
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [useCardLayout, setUseCardLayout] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const mobile = width <= mobileBreakpoint;
      setIsMobile(mobile);
      
      // Auto-enable card layout for very small screens
      if (enableCardLayout && width <= 600) {
        setUseCardLayout(true);
      } else {
        setUseCardLayout(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [mobileBreakpoint, enableCardLayout]);

  // Add data labels to table cells for mobile card layout
  useEffect(() => {
    if (useCardLayout) {
      const table = document.querySelector('.unified-table');
      if (!table) return;

      const headers = Array.from(table.querySelectorAll('th')).map(th => 
        th.textContent?.trim() || ''
      );

      const rows = table.querySelectorAll('tbody tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        cells.forEach((cell, index) => {
          if (headers[index]) {
            cell.setAttribute('data-label', headers[index]);
          }
        });
      });
    }
  }, [useCardLayout, children]);

  const containerClasses = [
    'unified-table-container',
    useCardLayout ? 'mobile-cards' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {isMobile && enableCardLayout && (
        <div style={{
          padding: '12px 16px',
          background: 'var(--color-surface-alt)',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '13px',
          color: 'var(--color-text-secondary)'
        }}>
          <span>📱 תצוגה ניידת</span>
          <button
            onClick={() => setUseCardLayout(!useCardLayout)}
            style={{
              background: 'var(--color-accent)',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {useCardLayout ? '📋 טבלה' : '📱 כרטיסים'}
          </button>
        </div>
      )}
      
      <div style={{ overflowX: useCardLayout ? 'visible' : 'auto' }}>
        {children}
      </div>
    </div>
  );
};

export default ResponsiveTable;