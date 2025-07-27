import React, { useState } from 'react';
import { ServerError } from '../../shared/components';
import Modal from '../../shared/components/Modal';
import ItemForm from './ItemForm';
import { useItems } from '../../hooks';
import { Item } from '../../types';
import { paginate } from '../../utils';
import { UI_CONFIG } from '../../config/app.config';

const ItemsTab: React.FC = () => {
  const { items, loading, error, refetch, deleteItem } = useItems();
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

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

  const handleDeleteItem = async (itemId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את הפריט?')) {
      const success = await deleteItem(itemId);
      if (success) {
        // Item deleted successfully, list will be refreshed automatically
      } else {
        alert('שגיאה במחיקת הפריט');
      }
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
          <button className="btn btn-primary" onClick={handleAddClick}>
            הוסף פריט חדש
          </button>
        </div>
      </div>

      <div className="card-body">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
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
                  <td>{item.name}</td>
                  <td>{item.origin}</td>
                  <td>{item.idNumber || 'לא זמין'}</td>
                  <td>{item.note || 'אין הערה'}</td>
                  <td>זמין</td>
                  <td>
                    <div className="btn-group">
                      <button 
                        className="btn btn-sm btn-outline" 
                        onClick={() => handleItemClick(item)}
                      >
                        עדכן
                      </button>
                      <button 
                        className="btn btn-sm btn-danger" 
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        מחק
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
    </div>
  );
};

export default ItemsTab;
