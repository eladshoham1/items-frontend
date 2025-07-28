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

  const { paginatedItems, totalPages } = paginate(
    items,
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

  const handleBulkDelete = async () => {
    if (selectedItemIds.length === 0) return;

    const selectedItems = items.filter(item => selectedItemIds.includes(item.id));
    const itemNames = selectedItems.map(item => item.name).join(', ');
    
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
                <th>שם פריט</th>
                <th>מקור</th>
                <th>מספר צ'</th>
                <th>הערה</th>
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
                  <td>{item.name}</td>
                  <td>{item.origin}</td>
                  <td>{item.idNumber || 'לא זמין'}</td>
                  <td>{item.note || 'אין הערה'}</td>
                  <td>{item.isAvailable ? 'זמין' : 'לא זמין'}</td>
                  <td>
                    <div className="btn-group">
                      <button 
                        className="btn btn-sm btn-outline" 
                        onClick={() => handleItemClick(item)}
                      >
                        עדכן
                      </button>
                    </div>
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
