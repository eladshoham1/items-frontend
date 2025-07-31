import React, { useState } from 'react';
import { ServerError, ConflictErrorModal, BulkDeleteErrorModal } from '../../shared/components';
import Modal from '../../shared/components/Modal';
import ItemForm from './ItemForm';
import { useItems } from '../../hooks';
import { Item } from '../../types';
import { paginate, getConflictResolutionMessage } from '../../utils';
import { UI_CONFIG } from '../../config/app.config';

const ItemsTab: React.FC = () => {
  const { items, loading, error, refetch, deleteManyItems } = useItems();
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [conflictError, setConflictError] = useState<{
    isOpen: boolean;
    message: string;
    itemName: string;
  }>({
    isOpen: false,
    message: '',
    itemName: '',
  });

  const [bulkDeleteError, setBulkDeleteError] = useState<{
    isOpen: boolean;
    message: string;
    deletedCount: number;
    totalCount: number;
    errors: string[];
  }>({
    isOpen: false,
    message: '',
    deletedCount: 0,
    totalCount: 0,
    errors: [],
  });

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <i className="fas fa-sort ms-1" style={{ opacity: 0.5 }}></i>;
    }
    return sortConfig.direction === 'asc' 
      ? <i className="fas fa-sort-up ms-1"></i>
      : <i className="fas fa-sort-down ms-1"></i>;
  };

  // Filter and sort items based on search term and sort config
  const filteredAndSortedItems = (() => {
    let filtered = items.filter(item => 
      (item.itemName?.name && item.itemName.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.idNumber && item.idNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.note && item.note.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case 'name':
            aValue = a.itemName?.name || '';
            bValue = b.itemName?.name || '';
            break;
          case 'isNeedReport':
            aValue = a.isNeedReport;
            bValue = b.isNeedReport;
            break;
          case 'idNumber':
            aValue = a.idNumber || '';
            bValue = b.idNumber || '';
            break;
          case 'note':
            aValue = a.note || '';
            bValue = b.note || '';
            break;
          default:
            return 0;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue, 'he') 
            : bValue.localeCompare(aValue, 'he');
        }

        if (sortConfig.direction === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    }

    return filtered;
  })();

  const { paginatedItems, totalPages } = paginate(
    filteredAndSortedItems,
    currentPage,
    UI_CONFIG.TABLE_PAGE_SIZE
  );

  const handleAddClick = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
    refetch(); // Refresh the items list after modal closes
  };

  const handleSelectAllItems = () => {
    if (selectedItemIds.length === paginatedItems.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(paginatedItems.map(item => item.id));
    }
  };

  const handleToggleItemSelection = (itemId: string) => {
    setSelectedItemIds(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Reset page when search term changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
    setSelectedItemIds([]);
  };

  const handleBulkDelete = async () => {
    if (selectedItemIds.length === 0) return;

    const selectedItems = items.filter(item => selectedItemIds.includes(item.id));
    const itemNames = selectedItems.map(item => item.itemName?.name || 'אין שם').join(', ');
    
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את הפריטים הבאים?\n\n${itemNames}\n\n(${selectedItemIds.length} פריטים)`)) return;

    const result = await deleteManyItems(selectedItemIds);
    if (result.success) {
      setSelectedItemIds([]);
    } else if (result.isConflict && result.bulkError) {
      // Show bulk delete error modal
      setBulkDeleteError({
        isOpen: true,
        message: result.bulkError.message,
        deletedCount: result.bulkError.deletedCount,
        totalCount: selectedItemIds.length,
        errors: result.bulkError.errors,
      });
      setSelectedItemIds([]);
    } else if (result.isConflict) {
      // Show regular conflict error modal
      setConflictError({
        isOpen: true,
        message: result.error || 'שגיאת התנגשות במחיקת פריטים',
        itemName: `${selectedItemIds.length} פריטים`,
      });
    } else {
      alert(`שגיאה במחיקת הפריטים: ${result.error || 'שגיאה לא ידועה'}`);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h2 className="mb-0">ציוד</h2>
        </div>
        <div className="card-body">
          <div className="alert alert-info">
            <div className="spinner"></div>
            <span>טוען נתונים...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <ServerError />;
  }

  return (
    <div className="card">
      <div className="card-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="mb-0">ציוד</h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {selectedItemIds.length > 0 && (
              <>
                <span className="badge bg-primary">
                  {selectedItemIds.length} נבחרו
                </span>
                <button 
                  className="btn btn-danger btn-sm" 
                  onClick={handleBulkDelete}
                  disabled={selectedItemIds.length === 0}
                >
                  <i className="fas fa-trash me-1"></i>
                  מחק נבחרים ({selectedItemIds.length})
                </button>
              </>
            )}
            <button className="btn btn-primary" onClick={handleAddClick}>
              הוסף פריט חדש
            </button>
          </div>
        </div>
      </div>

      <div className="card-body">
        {/* Search Input */}
        <div className="row mb-3">
          <div className="col-md-6">
            <div className="input-group">
              <span className="input-group-text">
                <i className="fas fa-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="חפש פריטים לפי שם, מספר צ' או הערה..."
                value={searchTerm}
                onChange={handleSearchChange}
                style={{ direction: 'rtl' }}
              />
              {searchTerm && (
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => handleSearchChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)}
                  title="נקה חיפוש"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
            {searchTerm && (
              <small className="text-muted mt-1 d-block">
                נמצאו {filteredAndSortedItems.length} פריטים מתוך {items.length}
              </small>
            )}
          </div>
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={selectedItemIds.length === paginatedItems.length && paginatedItems.length > 0}
                    onChange={handleSelectAllItems}
                    title="בחר הכל"
                  />
                </th>
                <th 
                  className="sortable-header"
                  onClick={() => handleSort('name')}
                  title="לחץ למיון לפי שם פריט"
                  data-sorted={sortConfig?.key === 'name' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <span>שם פריט</span>
                    <div className="sort-indicator">
                      {getSortIcon('name')}
                    </div>
                  </div>
                </th>
                <th 
                  className="sortable-header"
                  onClick={() => handleSort('isNeedReport')}
                  title="לחץ למיון לפי צופן"
                  data-sorted={sortConfig?.key === 'isNeedReport' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <span>צופן</span>
                    <div className="sort-indicator">
                      {getSortIcon('isNeedReport')}
                    </div>
                  </div>
                </th>
                <th 
                  className="sortable-header"
                  onClick={() => handleSort('idNumber')}
                  title="לחץ למיון לפי מספר צ'"
                  data-sorted={sortConfig?.key === 'idNumber' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <span>מספר צ'</span>
                    <div className="sort-indicator">
                      {getSortIcon('idNumber')}
                    </div>
                  </div>
                </th>
                <th 
                  className="sortable-header"
                  onClick={() => handleSort('note')}
                  title="לחץ למיון לפי הערה"
                  data-sorted={sortConfig?.key === 'note' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <span>הערה</span>
                    <div className="sort-indicator">
                      {getSortIcon('note')}
                    </div>
                  </div>
                </th>
                <th>סטטוס</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item: Item) => (
                <tr key={item.id}>
                  <td>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={selectedItemIds.includes(item.id)}
                      onChange={() => handleToggleItemSelection(item.id)}
                    />
                  </td>
                  <td>{item.itemName?.name || 'אין תערכה'}</td>
                  <td>{item.isNeedReport ? 'כן' : 'לא'}</td>
                  <td>{item.idNumber || 'לא זמין'}</td>
                  <td>{item.note || 'אין הערה'}</td>
                  <td>{item.isAvailable ? 'זמין' : 'לא זמין'}</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-outline" 
                      onClick={() => handleItemClick(item)}
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
          <div className="pagination">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`btn btn-sm ${currentPage === page ? 'btn-primary' : 'btn-outline'}`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedItem ? 'עדכן פריט' : 'הוסף פריט חדש'}
        size="md"
      >
        <ItemForm
          key={selectedItem?.id || 'new'}
          item={selectedItem}
          onSuccess={handleCloseModal}
          onCancel={handleCloseModal}
        />
      </Modal>

      <ConflictErrorModal
        isOpen={conflictError.isOpen}
        onClose={() => setConflictError({ isOpen: false, message: '', itemName: '' })}
        title={`לא ניתן למחוק את הפריט "${conflictError.itemName}"`}
        message={conflictError.message}
        resolutionMessage={getConflictResolutionMessage('item')}
        type="item"
      />

      <BulkDeleteErrorModal
        isOpen={bulkDeleteError.isOpen}
        onClose={() => setBulkDeleteError({ 
          isOpen: false, 
          message: '', 
          deletedCount: 0, 
          totalCount: 0, 
          errors: [] 
        })}
        title="תוצאות מחיקה מרובה - פריטים"
        message={bulkDeleteError.message}
        deletedCount={bulkDeleteError.deletedCount}
        totalCount={bulkDeleteError.totalCount}
        errors={bulkDeleteError.errors}
        type="item"
      />
    </div>
  );
};

export default ItemsTab;
