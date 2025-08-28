import React from 'react';

interface SelectionToolbarProps {
  selectedCount: number;
  totalCount: number;
  onDelete?: () => void;
  onClear: () => void;
  onSelectAll?: () => void;
  isVisible: boolean;
  deleteLabel?: string;
  isDeleting?: boolean;
}

export const SelectionToolbar: React.FC<SelectionToolbarProps> = ({
  selectedCount,
  totalCount,
  onDelete,
  onClear,
  onSelectAll,
  isVisible,
  deleteLabel = 'מחק נבחרים',
  isDeleting = false
}) => {
  if (!isVisible || selectedCount === 0) {
    return null;
  }

  const isAllSelected = selectedCount === totalCount;

  return (
    <div className={`selection-toolbar ${!isVisible ? 'hidden' : ''}`}>
      <div className="selection-info">
        <i className="fas fa-check-circle" style={{ color: 'var(--color-primary)' }}></i>
        <span>
          {selectedCount} מתוך {totalCount} נבחרו
        </span>
        {totalCount > 0 && onSelectAll && (
          <button
            className="select-all-link"
            onClick={isAllSelected ? onClear : onSelectAll}
            disabled={isDeleting}
          >
            {isAllSelected ? 'בטל בחירת הכל' : `בחר הכל (${totalCount})`}
          </button>
        )}
      </div>
      
      <div className="selection-actions">
        {onDelete && (
          <button
            className="selection-action-btn danger"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-trash"></i>
            )}
            {deleteLabel} ({selectedCount})
          </button>
        )}
        
        <button
          className="selection-action-btn clear"
          onClick={onClear}
          disabled={isDeleting}
        >
          <i className="fas fa-times"></i>
          בטל בחירה
        </button>
      </div>
    </div>
  );
};
