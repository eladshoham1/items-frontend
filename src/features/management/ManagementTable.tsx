import React, { useState } from 'react';
import { Modal, ConflictErrorModal, SmartPagination, LoadingSpinner } from '../../shared/components';
import { paginate } from '../../utils';
import { UI_CONFIG } from '../../config/app.config';

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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
        alert(result.error || `שגיאה ביצירת ${title}`);
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
        alert(result.error || `שגיאה בעדכון ${title}`);
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
        setSelectedIds([]);
      } else {
        alert(result.error || `שגיאה במחיקת ${title}`);
      }
    } catch (error) {
      alert(`שגיאה במחיקת ${title}`);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? paginatedItems.map(item => item.id) : []);
  };

  const openEditModal = (item: T) => {
    setEditingItem(item);
    setEditItemName(item.name);
  };

  if (loading) {
    return (
      <div className="management-container">
        <LoadingSpinner message={`טוען ${title}...`} />
      </div>
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
    <div className="management-container">
      {/* Compact Header with Actions */}
      <div className="management-header-compact">
        <div className="management-search-section">
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="text"
              className="management-search-input"
              placeholder={`חיפוש ${title}...`}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{ flex: 1 }}
            />
            {searchTerm && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                title="נקה חיפוש"
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '0 12px',
                  minWidth: 'auto'
                }}
              >
                <i className="fas fa-times" style={{ fontSize: '12px' }}></i>
                <span style={{ fontSize: '12px', fontWeight: '500' }}>נקה</span>
              </button>
            )}
          </div>
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
          
          {selectedIds.length > 0 && (
            <button
              className="btn btn-danger btn-sm"
              onClick={handleDelete}
              disabled={isSubmitting}
              title={`מחק ${selectedIds.length} פריטים נבחרים`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '0 12px'
              }}
            >
              <i className="fas fa-trash" style={{ fontSize: '12px' }}></i>
              <span style={{ fontSize: '12px', fontWeight: '500' }}>מחק ({selectedIds.length})</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner 
          message={`טוען ${title}...`} 
          padding="80px 20px"
          minHeight="400px"
        />
      ) : (
        <>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedIds.length === paginatedItems.length && paginatedItems.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      title="בחר הכל"
                    />
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('name')}
                    title="לחץ למיון לפי שם"
                    data-sorted={sortConfig?.key === 'name' ? 'true' : 'false'}
                  >
                    <div className="d-flex align-items-center">
                      <span>שם</span>
                    </div>
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('createdAt')}
                    title="לחץ למיון לפי תאריך יצירה"
                    data-sorted={sortConfig?.key === 'createdAt' ? 'true' : 'false'}
                  >
                    <div className="d-flex align-items-center">
                      <span>תאריך יצירה</span>
                    </div>
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('updatedAt')}
                    title="לחץ למיון לפי תאריך עדכון"
                    data-sorted={sortConfig?.key === 'updatedAt' ? 'true' : 'false'}
                  >
                    <div className="d-flex align-items-center">
                      <span>תאריך עדכון</span>
                    </div>
                  </th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedIds.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds([...selectedIds, item.id]);
                          } else {
                            setSelectedIds(selectedIds.filter(id => id !== item.id));
                          }
                        }}
                      />
                    </td>
                    <td className="fw-medium">{item.name}</td>
                    <td>{new Date(item.createdAt).toLocaleDateString('he-IL')}</td>
                    <td>{new Date(item.updatedAt).toLocaleDateString('he-IL')}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => openEditModal(item)}
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
    </div>
  );
}
