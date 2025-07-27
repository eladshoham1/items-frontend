
import React, { useState } from 'react';
import ServerError from '../ServerError';
import Sheet from '../sheet/Sheet';
import ItemForm from './ItemForm';
import { useItems } from '../../hooks';
import { Item } from '../../types';
import { paginate } from '../../utils';
import { UI_CONFIG } from '../../config/app.config';
import '../../style/theme.css';

const ItemsTab: React.FC = () => {
  const { items, loading, error, markItemReceived, markItemReturned } = useItems();
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
    setSelectedItem(null);
    setIsModalOpen(false);
  };

  const handleReceive = async (itemId: string) => {
    const success = await markItemReceived(itemId);
    if (!success) {
      alert('שגיאה בקבלת הפריט');
    }
  };

  const handleReturn = async (itemId: string) => {
    const success = await markItemReturned(itemId);
    if (!success) {
      alert('שגיאה בהחזרת הפריט');
    }
  };

  if (loading) {
    return (
      <div className="surface items-tab-container">
        <h2>ציוד</h2>
        <p className="loading-message">טוען נתונים...</p>
      </div>
    );
  }

  if (error) {
    return <ServerError />;
  }

  return (
    <div className="surface items-tab-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>ציוד</h2>
        <button className="button secondary" onClick={handleAddClick}>
          הוסף ציוד חדש
        </button>
      </div>

      <table className="users-table">
        <thead>
          <tr>
            <th>מקור</th>
            <th>שם</th>
            <th>מספר זיהוי</th>
            <th>הערות</th>
            <th>פעולות</th>
          </tr>
        </thead>
        <tbody>
          {paginatedItems.map(item => (
            <tr key={item.id}>
              <td>{item.origin}</td>
              <td>{item.name}</td>
              <td>{item.idNumber || 'אין'}</td>
              <td>{item.note || 'אין'}</td>
              <td>
                <button className="button" onClick={() => handleItemClick(item)}>ערוך</button>
                <button className="button" onClick={() => handleReceive(item.id)}>קבל</button>
                <button className="button danger" onClick={() => handleReturn(item.id)}>החזר</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button 
            key={page} 
            onClick={() => setCurrentPage(page)} 
            className={`pagination-btn${currentPage === page ? ' active' : ''}`}
          >
            {page}
          </button>
        ))}
      </div>

      {isModalOpen && (
        <Sheet onClose={handleCloseModal}>
          <ItemForm 
            item={selectedItem}
            onSuccess={handleCloseModal}
            onCancel={handleCloseModal}
          />
        </Sheet>
      )}
    </div>
  );
};

export default ItemsTab;
