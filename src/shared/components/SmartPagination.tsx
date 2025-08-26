import React, { useState, useEffect } from 'react';
import { generatePageNumbers } from '../../utils';

interface SmartPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const SmartPagination: React.FC<SmartPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = ''
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const handlePageChange = (page: number) => {
    onPageChange(page);
    // Scroll to top of the page content when changing pages
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  if (totalPages <= 1) return null;

  const pageNumbers = generatePageNumbers(currentPage, totalPages);
  const showFirstPage = pageNumbers[0] > 1;
  const showLastPage = pageNumbers[pageNumbers.length - 1] < totalPages;
  const showFirstEllipsis = pageNumbers[0] > 2;
  const showLastEllipsis = pageNumbers[pageNumbers.length - 1] < totalPages - 1;

  // Add custom CSS to override existing pagination styles
  const customStyles = `
    .smart-pagination-custom button {
      width: ${isMobile ? '28px' : '36px'} !important;
      height: ${isMobile ? '28px' : '36px'} !important;
      min-width: ${isMobile ? '28px' : '36px'} !important;
      max-width: ${isMobile ? '28px' : '36px'} !important;
      min-height: ${isMobile ? '28px' : '36px'} !important;
      max-height: ${isMobile ? '28px' : '36px'} !important;
      font-size: ${isMobile ? '11px' : '14px'} !important;
      border-radius: ${isMobile ? '5px' : '8px'} !important;
      padding: 0 !important;
      box-sizing: border-box !important;
      flex-shrink: 0 !important;
      flex-grow: 0 !important;
    }
  `;

  return (
    <>
      <style>{customStyles}</style>
    <div 
      className={`smart-pagination smart-pagination-custom ${className}`} 
      role="navigation" 
      aria-label="דפדוף בין עמודים"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '20px 16px'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '2px' : '6px',
        justifyContent: 'center',
        direction: 'rtl' // RTL for Hebrew layout
      }}>
        {/* Previous button (right arrow in RTL) */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title="עמוד קודם"
          aria-label="עמוד קודם"
          style={{
            width: isMobile ? '28px' : '36px',
            height: isMobile ? '28px' : '36px',
            minWidth: isMobile ? '28px' : '36px',
            maxWidth: isMobile ? '28px' : '36px',
            minHeight: isMobile ? '28px' : '36px',
            maxHeight: isMobile ? '28px' : '36px',
            borderRadius: isMobile ? '5px' : '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: currentPage === 1 
              ? 'rgba(255, 255, 255, 0.05)' 
              : 'rgba(255, 255, 255, 0.08)',
            color: currentPage === 1 
              ? 'rgba(255, 255, 255, 0.3)' 
              : 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            fontSize: isMobile ? '11px' : '16px',
            fontWeight: '600',
            outline: 'none',
            padding: '0',
            boxSizing: 'border-box',
            flexShrink: 0,
            flexGrow: 0
          }}
          onMouseEnter={(e) => {
            if (currentPage !== 1) {
              (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.12)';
              (e.target as HTMLButtonElement).style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== 1) {
              (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.08)';
              (e.target as HTMLButtonElement).style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }
          }}
        >
          ‹
        </button>

        {/* First page */}
        {showFirstPage && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              title="עמוד ראשון"
              aria-label="עמוד ראשון"
              style={{
                width: isMobile ? '28px' : '36px',
                height: isMobile ? '28px' : '36px',
                minWidth: isMobile ? '28px' : '36px',
                maxWidth: isMobile ? '28px' : '36px',
                minHeight: isMobile ? '28px' : '36px',
                maxHeight: isMobile ? '28px' : '36px',
                borderRadius: isMobile ? '5px' : '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'rgba(255, 255, 255, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: isMobile ? '11px' : '14px',
                fontWeight: '500',
                outline: 'none',
                padding: '0',
                boxSizing: 'border-box',
                flexShrink: 0,
                flexGrow: 0
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.12)';
                (e.target as HTMLButtonElement).style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.08)';
                (e.target as HTMLButtonElement).style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              1
            </button>
            {showFirstEllipsis && (
              <span style={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '14px',
                padding: '0 4px',
                userSelect: 'none'
              }}>
                ⋯
              </span>
            )}
          </>
        )}

        {/* Page numbers */}
        {pageNumbers.map(page => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            title={`עמוד ${page}`}
            aria-label={`עמוד ${page}${currentPage === page ? ' - עמוד נוכחי' : ''}`}
            aria-current={currentPage === page ? 'page' : undefined}
            style={{
              width: isMobile ? '28px' : '36px',
              height: isMobile ? '28px' : '36px',
              minWidth: isMobile ? '28px' : '36px',
              maxWidth: isMobile ? '28px' : '36px',
              minHeight: isMobile ? '28px' : '36px',
              maxHeight: isMobile ? '28px' : '36px',
              borderRadius: isMobile ? '5px' : '8px',
              border: currentPage === page 
                ? '1px solid rgba(59, 130, 246, 0.4)' 
                : '1px solid rgba(255, 255, 255, 0.1)',
              background: currentPage === page 
                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(29, 78, 216, 0.9))' 
                : 'rgba(255, 255, 255, 0.08)',
              color: currentPage === page 
                ? 'white' 
                : 'rgba(255, 255, 255, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: isMobile ? '11px' : '14px',
              fontWeight: currentPage === page ? '600' : '500',
              outline: 'none',
              padding: '0',
              boxSizing: 'border-box',
              flexShrink: 0,
              flexGrow: 0,
              boxShadow: currentPage === page 
                ? (isMobile ? '0 1px 3px rgba(59, 130, 246, 0.3)' : '0 4px 12px rgba(59, 130, 246, 0.3)')
                : 'none'
            }}
            onMouseEnter={(e) => {
              if (currentPage !== page) {
                (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.12)';
                (e.target as HTMLButtonElement).style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (currentPage !== page) {
                (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.08)';
                (e.target as HTMLButtonElement).style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }
            }}
          >
            {page}
          </button>
        ))}

        {/* Last page */}
        {showLastPage && (
          <>
            {showLastEllipsis && (
              <span style={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '14px',
                padding: '0 4px',
                userSelect: 'none'
              }}>
                ⋯
              </span>
            )}
            <button
              onClick={() => handlePageChange(totalPages)}
              title={`עמוד אחרון (${totalPages})`}
              aria-label={`עמוד אחרון (${totalPages})`}
              style={{
                width: isMobile ? '28px' : '36px',
                height: isMobile ? '28px' : '36px',
                minWidth: isMobile ? '28px' : '36px',
                maxWidth: isMobile ? '28px' : '36px',
                minHeight: isMobile ? '28px' : '36px',
                maxHeight: isMobile ? '28px' : '36px',
                borderRadius: isMobile ? '5px' : '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'rgba(255, 255, 255, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: isMobile ? '11px' : '14px',
                fontWeight: '500',
                outline: 'none',
                padding: '0',
                boxSizing: 'border-box',
                flexShrink: 0,
                flexGrow: 0
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.12)';
                (e.target as HTMLButtonElement).style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.08)';
                (e.target as HTMLButtonElement).style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              {totalPages}
            </button>
          </>
        )}

        {/* Next button (left arrow in RTL) */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          title="עמוד הבא"
          aria-label="עמוד הבא"
          style={{
            width: isMobile ? '28px' : '36px',
            height: isMobile ? '28px' : '36px',
            minWidth: isMobile ? '28px' : '36px',
            maxWidth: isMobile ? '28px' : '36px',
            minHeight: isMobile ? '28px' : '36px',
            maxHeight: isMobile ? '28px' : '36px',
            borderRadius: isMobile ? '5px' : '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: currentPage === totalPages 
              ? 'rgba(255, 255, 255, 0.05)' 
              : 'rgba(255, 255, 255, 0.08)',
            color: currentPage === totalPages 
              ? 'rgba(255, 255, 255, 0.3)' 
              : 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            fontSize: isMobile ? '11px' : '16px',
            fontWeight: '600',
            outline: 'none',
            padding: '0',
            boxSizing: 'border-box',
            flexShrink: 0,
            flexGrow: 0
          }}
          onMouseEnter={(e) => {
            if (currentPage !== totalPages) {
              (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.12)';
              (e.target as HTMLButtonElement).style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== totalPages) {
              (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.08)';
              (e.target as HTMLButtonElement).style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }
          }}
        >
          ›
        </button>
      </div>

      {/* Page info for both mobile and desktop - shown below pagination */}
      <div style={{
        textAlign: 'center',
        fontSize: isMobile ? '11px' : '13px',
        color: 'rgba(255, 255, 255, 0.6)',
        fontWeight: '500'
      }}>
        עמוד {currentPage} מתוך {totalPages}
      </div>
    </div>
    </>
  );
};

export default SmartPagination;
