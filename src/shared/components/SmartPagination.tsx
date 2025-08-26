import React from 'react';
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
  if (totalPages <= 1) return null;

  const pageNumbers = generatePageNumbers(currentPage, totalPages);
  const showFirstPage = pageNumbers[0] > 1;
  const showLastPage = pageNumbers[pageNumbers.length - 1] < totalPages;
  const showFirstEllipsis = pageNumbers[0] > 2;
  const showLastEllipsis = pageNumbers[pageNumbers.length - 1] < totalPages - 1;

  return (
    <div className={`pagination ${className}`} role="navigation" aria-label="דפדוף בין עמודים">
      {/* Page info for mobile */}
      <div className="pagination-info">
        עמוד {currentPage} מתוך {totalPages}
      </div>

      {/* Previous button */}
      <button
        className="btn btn-sm btn-outline"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        title="עמוד קודם"
        aria-label="עמוד קודם"
      >
        <span className="nav-arrow">‹</span>
      </button>

      {/* First page */}
      {showFirstPage && (
        <>
          <button
            className="btn btn-sm btn-outline"
            onClick={() => onPageChange(1)}
            title="עמוד ראשון"
            aria-label="עמוד ראשון"
          >
            1
          </button>
          {showFirstEllipsis && <span className="pagination-ellipsis">⋯</span>}
        </>
      )}

      {/* Page numbers */}
      {pageNumbers.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`btn btn-sm ${currentPage === page ? 'btn-primary' : 'btn-outline'}`}
          title={`עמוד ${page}`}
          aria-label={`עמוד ${page}${currentPage === page ? ' - עמוד נוכחי' : ''}`}
          aria-current={currentPage === page ? 'page' : undefined}
        >
          {page}
        </button>
      ))}

      {/* Last page */}
      {showLastPage && (
        <>
          {showLastEllipsis && <span className="pagination-ellipsis">⋯</span>}
          <button
            className="btn btn-sm btn-outline"
            onClick={() => onPageChange(totalPages)}
            title={`עמוד אחרון (${totalPages})`}
            aria-label={`עמוד אחרון (${totalPages})`}
          >
            {totalPages}
          </button>
        </>
      )}

      {/* Next button */}
      <button
        className="btn btn-sm btn-outline"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        title="עמוד הבא"
        aria-label="עמוד הבא"
      >
        <span className="nav-arrow">›</span>
      </button>
    </div>
  );
};

export default SmartPagination;
