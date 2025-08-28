import React, { useState } from 'react';
import { Modal, ConflictErrorModal, SmartPagination, LoadingSpinner, NotificationModal, SelectionToolbar, SearchInput } from '../../shared/components';
import { paginate } from '../../utils';
import { UI_CONFIG } from '../../config/app.config';
import { NotificationType } from '../../shared/components/NotificationModal';
import { useModernTableSelection } from '../../hooks';

interface BaseEntity {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface ManagementTableProps<T extends BaseEntity> {
  title: string;
  items: T[];
  loading: boolean;
  error: string | null;
  onAdd: (name: string) => Promise<{ success: boolean; error?: string; isConflict?: boolean }>;
  onEdit: (id: string, name: string) => Promise<{ success: boolean; error?: string; isConflict?: boolean }>;
  onDelete: (ids: string[]) => Promise<{ success: boolean; error?: string }>;
  onRefresh: () => void;
}

export function ManagementTable<T extends BaseEntity>({
  title,
  items,
  loading,
  error,
  onAdd,
  onEdit,
  onDelete,
  onRefresh,
}: ManagementTableProps<T>) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [editItemName, setEditItemName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof BaseEntity;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [conflictError, setConflictError] = useState({
    isOpen: false,
    message: '',
    itemName: '',
  });
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    message: string;
    type: NotificationType;
  }>({
    isOpen: false,
    message: '',
    type: 'error',
  });

  // Filter and sort items
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().normalize('NFC').includes(searchTerm.toLowerCase().normalize('NFC'))
  );

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (!sortConfig) return 0;

    const { key, direction } = sortConfig;
    let aValue: any = a[key];
    let bValue: any = b[key];

    // Handle date sorting
    if (key === 'createdAt' || key === 'updatedAt') {
      const aTime = new Date(aValue as string).getTime();
      const bTime = new Date(bValue as string).getTime();
      
      if (direction === 'asc') {
        return aTime < bTime ? -1 : aTime > bTime ? 1 : 0;
      } else {
        return aTime > bTime ? -1 : aTime < bTime ? 1 : 0;
      }
    }

    // Handle string sorting
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return direction === 'asc' 
        ? aValue.localeCompare(bValue, 'he') 
        : bValue.localeCompare(aValue, 'he');
    }

    // Handle number sorting
    if (direction === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const { paginatedItems, totalPages } = paginate(
    sortedItems,
    currentPage,
    UI_CONFIG.TABLE_PAGE_SIZE
  );

  // Modern table selection
  const {
    selectedIds,
    toggleSelection,
    clearSelection,
    selectAll,
    hasSelection
  } = useModernTableSelection({
    items: sortedItems,
    onSelectionChange: (ids) => {
      // Optional: Handle selection changes
    }
  });

  const handleSort = (key: keyof BaseEntity) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handleAdd = async () => {
    if (!newItemName.trim()) return;
    
    setIsSubmitting(true);
    try {
      const result = await onAdd(newItemName.trim());
      if (result.success) {
        setNewItemName('');
        setIsAddModalOpen(false);
      } else if (result.isConflict) {
        setConflictError({
          isOpen: true,
          message: result.error || `${title} עם שם זה כבר קיים במערכת`,
          itemName: newItemName.trim(),
        });
      } else {
        setNotification({
          isOpen: true,
          message: result.error || `שגיאה ביצירת ${title}`,
          type: 'error',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editingItem || !editItemName.trim()) return;
    
    setIsSubmitting(true);
    try {
      const result = await onEdit(editingItem.id, editItemName.trim());
      if (result.success) {
        setEditingItem(null);
        setEditItemName('');
      } else if (result.isConflict) {
        setConflictError({
          isOpen: true,
          message: result.error || `${title} עם שם זה כבר קיים במערכת`,
          itemName: editItemName.trim(),
        });
      } else {
        setNotification({
          isOpen: true,
          message: result.error || `שגיאה בעדכון ${title}`,
          type: 'error',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;
    
    const confirmed = window.confirm(
      `האם אתה בטוח שברצונך למחוק ${selectedIds.length} ${title}?`
    );
    
    if (!confirmed) return;
    
    try {
      const result = await onDelete(selectedIds);
      if (result.success) {
        clearSelection();
      } else {
        setNotification({
          isOpen: true,
          message: result.error || `שגיאה במחיקת ${title}`,
          type: 'error',
        });
      }
    } catch (error) {
      setNotification({
        isOpen: true,
        message: `שגיאה במחיקת ${title}`,
        type: 'error',
      });
    }
  };

  const openEditModal = (item: T) => {
    setEditingItem(item);
    setEditItemName(item.name);
  };

  if (loading) {
    return (
      <LoadingSpinner message={`טוען ${title}...`} />
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <strong>שגיאה:</strong> {error}
        <button className="btn btn-sm btn-outline-danger ms-2" onClick={onRefresh}>
          נסה שוב
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Compact Header with Actions */}
      <div className="management-header-compact">
        <div className="management-search-section">
          <SearchInput
            value={searchTerm}
            onChange={(value) => {
              setSearchTerm(value);
              setCurrentPage(1);
            }}
            placeholder={`חיפוש ${title}...`}
            resultsCount={filteredItems.length}
            resultsLabel={title}
          />
        </div>
        
        <div className="management-actions-compact">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setIsAddModalOpen(true)}
            disabled={loading}
            title={`הוסף ${title} חדש`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '0 16px'
            }}
          >
            <i className="fas fa-plus" style={{ fontSize: '13px' }}></i>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>הוסף חדש</span>
          </button>
        </div>
      </div>

      {/* Modern Selection Toolbar */}
      <SelectionToolbar
        selectedCount={selectedIds.length}
        totalCount={paginatedItems.length}
        onDelete={selectedIds.length > 0 ? handleDelete : undefined}
        onClear={clearSelection}
        onSelectAll={selectAll}
        isVisible={hasSelection}
        deleteLabel={`מחק ${title}`}
        isDeleting={isSubmitting}
      />

      {loading ? (
        <LoadingSpinner 
          message={`טוען ${title}...`} 
          padding="80px 20px"
          minHeight="400px"
        />
      ) : (
        <>
          <div className="unified-table-container">
            <table className="unified-table">
              <thead>
                <tr>
                  <th 
                    className="unified-table-header unified-table-header-regular"
                    onClick={() => handleSort('name')}
                    title="לחץ למיון לפי שם"
                    data-sorted={sortConfig?.key === 'name' ? 'true' : 'false'}
                  >
                    <div className="d-flex align-items-center">
                      <span>שם</span>
                    </div>
                  </th>
                  <th 
                    className="unified-table-header unified-table-header-regular"
                    onClick={() => handleSort('createdAt')}
                    title="לחץ למיון לפי תאריך יצירה"
                    data-sorted={sortConfig?.key === 'createdAt' ? 'true' : 'false'}
                  >
                    <div className="d-flex align-items-center">
                      <span>תאריך יצירה</span>
                    </div>
                  </th>
                  <th 
                    className="unified-table-header unified-table-header-regular"
                    onClick={() => handleSort('updatedAt')}
                    title="לחץ למיון לפי תאריך עדכון"
                    data-sorted={sortConfig?.key === 'updatedAt' ? 'true' : 'false'}
                  >
                    <div className="d-flex align-items-center">
                      <span>תאריך עדכון</span>
                    </div>
                  </th>
                  <th className="unified-table-header unified-table-header-regular">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item, index) => (
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
                    title="לחץ לבחירה • Ctrl+לחץ לבחירה מרובה"
                  >
                    <td className="unified-table-cell">{item.name}</td>
                    <td className="unified-table-cell">{new Date(item.createdAt).toLocaleDateString('he-IL')}</td>
                    <td className="unified-table-cell">{new Date(item.updatedAt).toLocaleDateString('he-IL')}</td>
                    <td className="unified-table-cell">
                      <button
                        className="unified-action-btn unified-action-btn-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(item);
                        }}
                        title="עריכה"
                      >
                        עדכן
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination-container">
              <SmartPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setNewItemName('');
        }}
        title={`הוסף ${title}`}
        size="md"
      >
        <div className="p-4">
          <div className="form-group">
            <label className="form-label">שם {title}</label>
            <input
              type="text"
              className="form-control"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder={`הכנס שם ${title}`}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAdd();
                }
              }}
            />
          </div>
          
          <div className="d-flex justify-content-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                setNewItemName('');
              }}
            >
              ביטול
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAdd}
              disabled={!newItemName.trim() || isSubmitting}
            >
              {isSubmitting ? 'שומר...' : 'הוסף'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => {
          setEditingItem(null);
          setEditItemName('');
        }}
        title={`ערוך ${title}`}
        size="md"
      >
        <div className="p-4">
          <div className="form-group">
            <label className="form-label">שם {title}</label>
            <input
              type="text"
              className="form-control"
              value={editItemName}
              onChange={(e) => setEditItemName(e.target.value)}
              placeholder={`הכנס שם ${title}`}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleEdit();
                }
              }}
            />
          </div>
          
          <div className="d-flex justify-content-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setEditingItem(null);
                setEditItemName('');
              }}
            >
              ביטול
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleEdit}
              disabled={!editItemName.trim() || isSubmitting}
            >
              {isSubmitting ? 'שומר...' : 'עדכן'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Conflict Error Modal */}
      <ConflictErrorModal
        isOpen={conflictError.isOpen}
        onClose={() => setConflictError({ isOpen: false, message: '', itemName: '' })}
        title={`לא ניתן לשמור את ${title} "${conflictError.itemName}"`}
        message={conflictError.message}
        resolutionMessage={`בחר שם אחר עבור ${title} או ערוך את הקיים.`}
        type="item"
      />

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ isOpen: false, message: '', type: 'error' })}
        message={notification.message}
        type={notification.type}
      />
    </>
  );
}
