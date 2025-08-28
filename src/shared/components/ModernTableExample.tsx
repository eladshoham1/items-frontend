import React from 'react';
import { useModernTableSelection } from '../../hooks';
import { SelectionToolbar } from '../components';

interface TableItem {
  id: string;
  name: string;
  // other properties...
}

interface ModernTableExampleProps {
  items: TableItem[];
  onDelete: (ids: string[]) => Promise<void>;
}

export const ModernTableExample: React.FC<ModernTableExampleProps> = ({
  items,
  onDelete
}) => {
  // Use the modern selection hook
  const {
    selectedIds,
    toggleSelection,
    clearSelection,
    hasSelection,
    selectedCount
  } = useModernTableSelection({
    items,
    onSelectionChange: (ids: string[]) => {
      console.log('Selection changed:', ids);
    }
  });

  const handleDelete = async () => {
    await onDelete(selectedIds);
    clearSelection();
  };

  return (
    <div>
      {/* Modern Selection Toolbar */}
      <SelectionToolbar
        selectedCount={selectedCount}
        totalCount={items.length}
        onDelete={hasSelection ? handleDelete : undefined}
        onClear={clearSelection}
        isVisible={hasSelection}
        deleteLabel="מחק פריטים"
        isDeleting={false}
      />

      {/* Modern Table */}
      <div className="unified-table-container">
        <table className="unified-table">
          <thead>
            <tr>
              <th className="unified-table-header unified-table-header-regular">שם</th>
              <th className="unified-table-header unified-table-header-regular">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr 
                key={item.id} 
                className={`unified-table-row selectable ${selectedIds.includes(item.id) ? 'selected' : ''}`}
                onClick={(e) => {
                  // Don't trigger selection when clicking on action buttons
                  if ((e.target as HTMLElement).closest('.unified-action-btn')) {
                    return;
                  }
                  toggleSelection(item.id, e, index);
                }}
                title="לחץ לבחירה • Ctrl+לחץ לבחירה מרובה • Shift+לחץ לטווח"
              >
                <td className="unified-table-cell">{item.name}</td>
                <td className="unified-table-cell">
                  <button
                    className="unified-action-btn unified-action-btn-primary"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent row selection
                      // Handle edit action
                    }}
                  >
                    עדכן
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
