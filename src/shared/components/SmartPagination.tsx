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
    <div className={`pagination ${className}`}>
      {/* Previous button */}
      <button
        className="btn btn-sm btn-outline"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        title="עמוד קודם"
      >
        →
      </button>

      {/* First page */}
      {showFirstPage && (
        <>
          <button
            className="btn btn-sm btn-outline"
            onClick={() => onPageChange(1)}
          >
            1
          </button>
          {showFirstEllipsis && <span className="pagination-ellipsis">...</span>}
        </>
      )}

      {/* Page numbers */}
      {pageNumbers.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`btn btn-sm ${currentPage === page ? 'btn-primary' : 'btn-outline'}`}
        >
          {page}
        </button>
      ))}

      {/* Last page */}
      {showLastPage && (
        <>
          {showLastEllipsis && <span className="pagination-ellipsis">...</span>}
          <button
            className="btn btn-sm btn-outline"
            onClick={() => onPageChange(totalPages)}
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
      >
        ←
      </button>
    </div>
  );
};

export default SmartPagination;
