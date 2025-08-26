import React, { useState } from 'react';
import { ServerError, ConflictErrorModal, BulkDeleteErrorModal, SmartPagination, LoadingSpinner, NotificationModal } from '../../shared/components';
import Modal from '../../shared/components/Modal';
import UserForm from './UserForm';
import { useUsers } from '../../hooks';
import { User } from '../../types';
import { paginate, getConflictResolutionMessage } from '../../utils';
import { UI_CONFIG } from '../../config/app.config';
import type { NotificationType } from '../../shared/components/NotificationModal';

interface UsersTabProps {
  isAdmin?: boolean;
}

const UsersTab: React.FC<UsersTabProps> = ({ isAdmin = false }) => {
  const { users, loading, error, deleteManyUsers, refetch } = useUsers();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [conflictError, setConflictError] = useState<{
    isOpen: boolean;
    message: string;
    userName: string;
  }>({
    isOpen: false,
    message: '',
    userName: '',
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

  // Filter and sort users based on search term and sort config
  const filteredAndSortedUsers = (() => {
    const normalizedSearchTerm = searchTerm.toLowerCase().normalize('NFC');
    let filtered = users.filter(user => 
      user.name.toLowerCase().normalize('NFC').includes(normalizedSearchTerm) ||
      user.personalNumber.toString().includes(searchTerm) ||
      user.phoneNumber.toLowerCase().normalize('NFC').includes(normalizedSearchTerm) ||
      user.location.toLowerCase().normalize('NFC').includes(normalizedSearchTerm) ||
      user.unit.toLowerCase().normalize('NFC').includes(normalizedSearchTerm) ||
      user.rank.toLowerCase().normalize('NFC').includes(normalizedSearchTerm) ||
      (user.isAdmin && 'מנהל'.normalize('NFC').includes(normalizedSearchTerm)) ||
      (!user.isAdmin && 'משתמש'.normalize('NFC').includes(normalizedSearchTerm))
    );

    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case 'name':
            aValue = a.name;
            bValue = b.name;
            break;
          case 'personalNumber':
            aValue = a.personalNumber;
            bValue = b.personalNumber;
            break;
          case 'phoneNumber':
            aValue = a.phoneNumber;
            bValue = b.phoneNumber;
            break;
          case 'location':
            aValue = a.location;
            bValue = b.location;
            break;
          case 'unit':
            aValue = a.unit;
            bValue = b.unit;
            break;
          case 'rank':
            aValue = a.rank;
            bValue = b.rank;
            break;
          case 'isAdmin':
            aValue = a.isAdmin ? 1 : 0; // Admin users first when ascending
            bValue = b.isAdmin ? 1 : 0;
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

  const { paginatedItems: paginatedUsers, totalPages } = paginate(
    filteredAndSortedUsers,
    currentPage,
    UI_CONFIG.TABLE_PAGE_SIZE
  );

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleSuccess = async () => {
    handleCloseModal();
    await refetch(); // Explicitly refresh the users list
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleSelectAllUsers = () => {
    if (selectedUserIds.length === paginatedUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(paginatedUsers.map(user => user.id));
    }
  };

  const handleToggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Reset page when search term changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
    setSelectedUserIds([]);
  };

  const handleBulkDelete = async () => {
    if (selectedUserIds.length === 0) return;

    const selectedUsers = users.filter(user => selectedUserIds.includes(user.id));
    const userNames = selectedUsers.map(user => user.name).join(', ');
    
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את המשתמשים הבאים?\n\n${userNames}\n\n(${selectedUserIds.length} משתמשים)`)) return;

    const result = await deleteManyUsers(selectedUserIds);
    if (result.success) {
      setSelectedUserIds([]);
    } else if (result.isConflict && result.bulkError) {
      // Show bulk delete error modal
      setBulkDeleteError({
        isOpen: true,
        message: result.bulkError.message,
        deletedCount: result.bulkError.deletedCount,
        totalCount: selectedUserIds.length,
        errors: result.bulkError.errors,
      });
      setSelectedUserIds([]);
    } else if (result.isConflict) {
      // Show regular conflict error modal
      setConflictError({
        isOpen: true,
        message: result.error || 'שגיאת התנגשות במחיקת משתמשים',
        userName: `${selectedUserIds.length} משתמשים`,
      });
    } else {
      showNotification('error', `שגיאה במחיקת המשתמשים: ${result.error || 'שגיאה לא ידועה'}`);
    }
  };

  if (loading) {
    return (
      <div className="management-container">
        <LoadingSpinner message="טוען משתמשים..." />
      </div>
    );
  }

  if (error) {
    return <ServerError />;
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
              placeholder="חפש משתמשים לפי שם, מספר אישי, טלפון, דרגה, מיקום, מסגרת או סוג משתמש..."
              value={searchTerm}
              onChange={handleSearchChange}
              style={{ flex: 1 }}
            />
            {searchTerm && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => handleSearchChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)}
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
          {searchTerm && (
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '4px' }}>
              נמצאו {filteredAndSortedUsers.length} משתמשים מתוך {users.length}
            </div>
          )}
        </div>
        
        <div className="management-actions-compact">
          {selectedUserIds.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className="badge bg-primary" style={{ fontSize: '12px', padding: '4px 8px' }}>
                {selectedUserIds.length} נבחרו
              </span>
              <button 
                className="btn btn-danger btn-sm" 
                onClick={handleBulkDelete}
                disabled={selectedUserIds.length === 0}
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                <i className="fas fa-trash" style={{ marginLeft: '4px' }}></i>
                מחק נבחרים ({selectedUserIds.length})
              </button>
            </div>
          )}
        </div>
      </div>

        <div className="unified-table-container">
          <table className="unified-table">
            <thead>
              <tr>
                <th className="unified-table-header unified-table-header-sticky" style={{ width: '50px' }}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={selectedUserIds.length === paginatedUsers.length && paginatedUsers.length > 0}
                    onChange={handleSelectAllUsers}
                    title="בחר הכל"
                  />
                </th>
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
                  onClick={() => handleSort('personalNumber')}
                  title="לחץ למיון לפי מספר אישי"
                  data-sorted={sortConfig?.key === 'personalNumber' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center">
                    <span>מספר אישי</span>
                  </div>
                </th>
                <th 
                  className="unified-table-header unified-table-header-regular" 
                  onClick={() => handleSort('phoneNumber')}
                  title="לחץ למיון לפי טלפון"
                  data-sorted={sortConfig?.key === 'phoneNumber' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center">
                    <span>טלפון</span>
                  </div>
                </th>
                <th 
                  className="unified-table-header unified-table-header-regular" 
                  onClick={() => handleSort('rank')}
                  title="לחץ למיון לפי דרגה"
                  data-sorted={sortConfig?.key === 'rank' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center">
                    <span>דרגה</span>
                  </div>
                </th>
                <th 
                  className="unified-table-header unified-table-header-regular" 
                  onClick={() => handleSort('unit')}
                  title="לחץ למיון לפי מסגרת"
                  data-sorted={sortConfig?.key === 'unit' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center">
                    <span>מסגרת</span>
                  </div>
                </th>
                <th 
                  className="unified-table-header unified-table-header-regular" 
                  onClick={() => handleSort('location')}
                  title="לחץ למיון לפי מיקום"
                  data-sorted={sortConfig?.key === 'location' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center">
                    <span>מיקום</span>
                  </div>
                </th>
                <th 
                  className="unified-table-header unified-table-header-regular" 
                  onClick={() => handleSort('isAdmin')}
                  title="לחץ למיון לפי סוג משתמש"
                  data-sorted={sortConfig?.key === 'isAdmin' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center">
                    <span>סוג משתמש</span>
                  </div>
                </th>
                <th className="unified-table-header unified-table-header-regular">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user: User, index: number) => (
                <tr key={user.id} className="unified-table-row">
                  <td className={`unified-table-cell-sticky ${index % 2 === 0 ? 'even' : 'odd'}`}>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={selectedUserIds.includes(user.id)}
                      onChange={() => handleToggleUserSelection(user.id)}
                    />
                  </td>
                  <td className="unified-table-cell">{user.name}</td>
                  <td className="unified-table-cell">{user.personalNumber}</td>
                  <td className="unified-table-cell">{user.phoneNumber}</td>
                  <td className="unified-table-cell">{user.rank}</td>
                  <td className="unified-table-cell">{user.unit}</td>
                  <td className="unified-table-cell">{user.location}</td>
                  <td className="unified-table-cell">
                    <span className={`unified-badge ${user.isAdmin ? 'unified-badge-success' : 'unified-badge-secondary'}`}>
                      {user.isAdmin ? 'מנהל' : 'משתמש'}
                    </span>
                  </td>
                  <td className="unified-table-cell">
                    <button 
                      className="unified-action-btn unified-action-btn-primary" 
                      onClick={() => handleSelectUser(user)}
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
        title={selectedUser ? 'עדכן משתמש' : 'הוסף משתמש חדש'}
        size="md"
      >
        <UserForm
          user={selectedUser}
          isAdmin={isAdmin}
          onSuccess={handleSuccess}
          onCancel={handleCloseModal}
        />
      </Modal>

      <ConflictErrorModal
        isOpen={conflictError.isOpen}
        onClose={() => setConflictError({ isOpen: false, message: '', userName: '' })}
        title={`לא ניתן למחוק את המשתמש "${conflictError.userName}"`}
        message={conflictError.message}
        resolutionMessage={getConflictResolutionMessage('user')}
        type="user"
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
        title="תוצאות מחיקה מרובה - משתמשים"
        message={bulkDeleteError.message}
        deletedCount={bulkDeleteError.deletedCount}
        totalCount={bulkDeleteError.totalCount}
        errors={bulkDeleteError.errors}
        type="user"
      />

      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        type={notification.type}
        message={notification.message}
        title={notification.title}
      />
    </div>
  );
};

export default UsersTab;
