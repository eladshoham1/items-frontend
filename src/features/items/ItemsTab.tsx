import React, { useState } from 'react';
import { ServerError, ConflictErrorModal, BulkDeleteErrorModal, SmartPagination, LoadingSpinner, NotificationModal, SearchInput } from '../../shared/components';
import { SelectionToolbar } from '../../shared/components';
import { useModernTableSelection } from '../../hooks';
import Modal from '../../shared/components/Modal';
import ItemForm from './ItemForm';
import { useItems } from '../../hooks';
import { Item, User } from '../../types';
import { paginate, getConflictResolutionMessage } from '../../utils';
import { UI_CONFIG } from '../../config/app.config';
import type { NotificationType } from '../../shared/components/NotificationModal';

interface ItemsTabProps {
  userProfile: User;
  isAdmin: boolean;
}

const ItemsTab: React.FC<ItemsTabProps> = ({ userProfile, isAdmin }) => {
  const { items, loading, error, refetch, deleteManyItems } = useItems();
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
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

  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: NotificationType;
    message: string;
    title?: string;
  }>({
    isOpen: false,
    type: 'info',
    message: ''
  });

  const showNotification = (type: NotificationType, message: string, title?: string) => {
    setNotification({
      isOpen: true,
      type,
      message,
      title
    });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Helper function to get receipt location
  const getReceiptLocation = (item: Item) => {
    return item.receiptInfo?.signedBy?.location?.name || '—';
  };

  // Filter and sort items based on search term and sort config
  const filteredAndSortedItems = (() => {
    let filtered = items.filter(item => {
      const statusText = !item.isOperational ? 'תקול' : (item.isAvailable ?? false) ? 'זמין' : 'לא זמין';
      const locationText = item.allocatedLocation?.name || 'לא מוקצה';
      const receiptLocationText = getReceiptLocation(item);
      
      return (item.itemName?.name && item.itemName.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.idNumber && item.idNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.note && item.note.toLowerCase().includes(searchTerm.toLowerCase())) ||
        statusText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        locationText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receiptLocationText.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case 'name':
            aValue = a.itemName?.name || '';
            bValue = b.itemName?.name || '';
            break;
          case 'idNumber':
            aValue = a.idNumber || '';
            bValue = b.idNumber || '';
            break;
          case 'allocatedLocation':
            aValue = a.allocatedLocation?.name || '';
            bValue = b.allocatedLocation?.name || '';
            break;
          case 'receiptLocation':
            aValue = getReceiptLocation(a) || '';
            bValue = getReceiptLocation(b) || '';
            break;
          case 'status':
            // Status priority: תקול (0) < לא זמין (1) < זמין (2)
            aValue = !a.isOperational ? 0 : (a.isAvailable ?? false) ? 2 : 1;
            bValue = !b.isOperational ? 0 : (b.isAvailable ?? false) ? 2 : 1;
            break;
          case 'note':
            aValue = a.note || '';
            bValue = b.note || '';
            break;
          case 'isOperational':
            aValue = a.isOperational;
            bValue = b.isOperational;
            break;
          case 'isAvailable':
            aValue = a.isAvailable ?? false;
            bValue = b.isAvailable ?? false;
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

  // Modern selection hook - use all filtered items for selection, not just paginated
  const {
    selectedIds,
    isSelected,
    toggleSelection,
    clearSelection,
    selectAll,
    selectedCount
  } = useModernTableSelection({
    items: filteredAndSortedItems,
    multiSelect: true
  });

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

  // Reset page when search term changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
    clearSelection();
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const selectedItems = items.filter(item => selectedIds.includes(item.id));
    const itemNames = selectedItems.map(item => item.itemName?.name || 'אין שם').join(', ');
    
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את הפריטים הבאים?\n\n${itemNames}\n\n(${selectedIds.length} פריטים)`)) return;

    const result = await deleteManyItems(selectedIds);
    if (result.success) {
      clearSelection();
    } else if (result.isConflict && result.bulkError) {
      // Show bulk delete error modal
      setBulkDeleteError({
        isOpen: true,
        message: result.bulkError.message,
        deletedCount: result.bulkError.deletedCount,
        totalCount: selectedIds.length,
        errors: result.bulkError.errors,
      });
      clearSelection();
    } else if (result.isConflict) {
      // Show regular conflict error modal
      setConflictError({
        isOpen: true,
        message: result.error || 'שגיאת התנגשות במחיקת פריטים',
        itemName: `${selectedIds.length} פריטים`,
      });
    } else {
      showNotification('error', `שגיאה במחיקת הפריטים: ${result.error || 'שגיאה לא ידועה'}`);
    }
  };

  // Check if user has a location assigned
  if (!userProfile.location) {
    return (
      <div className="card">
        <div className="card-header">
          <h2 className="mb-0">ציוד</h2>
        </div>
        <div className="card-body">
          <div className="alert alert-warning">
            <h4>אין לך גישה למערכת</h4>
            <p>המשתמש שלך לא שוייך למיקום. אנא פנה למנהל המערכת כדי לשייך אותך למיקום.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <LoadingSpinner message="טוען פריטי ציוד..." />
    );
  }

  if (error) {
    return <ServerError />;
  }

  return (
    <>
      {/* Compact Header with Actions */}
      <div className="management-header-compact">
        <div className="management-search-section">
          <SearchInput
            value={searchTerm}
            onChange={(value) => handleSearchChange({ target: { value } } as React.ChangeEvent<HTMLInputElement>)}
            placeholder="חפש פריטים לפי שם, מספר צ', הקצאה, מיקום או הערה..."
            resultsCount={filteredAndSortedItems.length}
            resultsLabel="פריטים"
          />
        </div>
        
        <div className="management-actions-compact">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button className="btn btn-primary btn-sm" onClick={handleAddClick}>
              <i className="fas fa-plus" style={{ marginLeft: '6px' }}></i>
              הוסף פריט חדש
            </button>
          </div>
        </div>
      </div>

      {/* Modern Selection Toolbar */}
      <SelectionToolbar
        selectedCount={selectedCount}
        totalCount={filteredAndSortedItems.length}
        onDelete={handleBulkDelete}
        onClear={clearSelection}
        onSelectAll={selectAll}
        isDeleting={false}
        isVisible={selectedCount > 0}
      />

        <div className="unified-table-container">
          <table className="unified-table">
            <thead>
              <tr>
                <th 
                  className="unified-table-header unified-table-header-regular"
                  onClick={() => handleSort('name')}
                  title="לחץ למיון לפי שם פריט"
                  data-sorted={sortConfig?.key === 'name' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center">
                    <span>שם פריט</span>
                  </div>
                </th>
                <th 
                  className="unified-table-header unified-table-header-regular"
                  onClick={() => handleSort('idNumber')}
                  title="לחץ למיון לפי מספר צ'"
                  data-sorted={sortConfig?.key === 'idNumber' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center">
                    <span>מספר צ'</span>
                  </div>
                </th>
                <th 
                  className="unified-table-header unified-table-header-regular"
                  onClick={() => handleSort('allocatedLocation')}
                  title="לחץ למיון לפי הקצאה"
                  data-sorted={sortConfig?.key === 'allocatedLocation' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center">
                    <span>הקצאה</span>
                  </div>
                </th>
                <th 
                  className="unified-table-header unified-table-header-regular"
                  onClick={() => handleSort('receiptLocation')}
                  title="לחץ למיון לפי מיקום"
                  data-sorted={sortConfig?.key === 'receiptLocation' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center">
                    <span>מיקום</span>
                  </div>
                </th>
                <th 
                  className="unified-table-header unified-table-header-regular"
                  onClick={() => handleSort('status')}
                  title="לחץ למיון לפי סטטוס"
                  data-sorted={sortConfig?.key === 'status' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center">
                    <span>סטטוס</span>
                  </div>
                </th>
                <th 
                  className="unified-table-header unified-table-header-regular"
                  onClick={() => handleSort('note')}
                  title="לחץ למיון לפי הערה"
                  data-sorted={sortConfig?.key === 'note' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center">
                    <span>הערה</span>
                  </div>
                </th>
                <th className="unified-table-header unified-table-header-regular">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item: Item, index: number) => (
                <tr 
                  key={item.id} 
                  className={`unified-table-row modern-table-row ${isSelected(item.id) ? 'selected' : ''}`}
                  onClick={(e) => toggleSelection(item.id, e)}
                  title="לחץ לבחירה"
                >
                  <td className="unified-table-cell">{item.itemName?.name || 'אין תערכה'}</td>
                  <td className="unified-table-cell">{item.idNumber || 'לא זמין'}</td>
                  <td className="unified-table-cell">{item.allocatedLocation?.name || 'לא מוקצה'}</td>
                  <td className="unified-table-cell">{getReceiptLocation(item)}</td>
                  <td className="unified-table-cell">
                    <span 
                      className={`unified-badge ${
                        !item.isOperational 
                          ? 'unified-badge-warning' 
                          : (item.isAvailable ?? false) 
                            ? 'unified-badge-success' 
                            : 'unified-badge-danger'
                      }`}
                    >
                      {!item.isOperational 
                        ? 'תקול' 
                        : (item.isAvailable ?? false) 
                          ? 'זמין' 
                          : 'לא זמין'
                      }
                    </span>
                  </td>
                  <td className="unified-table-cell">{item.note || 'אין הערה'}</td>
                  <td className="unified-table-cell">
                    <button 
                      className="unified-action-btn unified-action-btn-primary" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemClick(item);
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

        {totalPages > 1 && (
          <SmartPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedItem ? 'עדכן פריט' : 'הוסף פריט חדש'}
        size="md"
      >
        <ItemForm
          key={selectedItem?.id || 'new'}
          item={selectedItem}
          isAdmin={isAdmin}
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

      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        type={notification.type}
        message={notification.message}
        title={notification.title}
      />
    </>
  );
};

export default ItemsTab;
