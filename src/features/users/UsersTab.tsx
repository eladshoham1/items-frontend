import React, { useState } from 'react';
import { ServerError, ConflictErrorModal, BulkDeleteErrorModal } from '../../shared/components';
import Modal from '../../shared/components/Modal';
import UserForm from './UserForm';
import { useUsers } from '../../hooks';
import { User } from '../../types';
import { paginate, getConflictResolutionMessage } from '../../utils';
import { UI_CONFIG } from '../../config/app.config';

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

  // Filter and sort users based on search term and sort config
  const filteredAndSortedUsers = (() => {
    let filtered = users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.personalNumber.toString().includes(searchTerm) ||
      user.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.rank.toLowerCase().includes(searchTerm.toLowerCase())
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
      alert(`שגיאה במחיקת המשתמשים: ${result.error || 'שגיאה לא ידועה'}`);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h2 className="mb-0">משתמשים</h2>
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
          <h2 className="mb-0">משתמשים</h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {selectedUserIds.length > 0 && (
              <>
                <span className="badge bg-primary">
                  {selectedUserIds.length} נבחרו
                </span>
                <button 
                  className="btn btn-danger btn-sm" 
                  onClick={handleBulkDelete}
                  disabled={selectedUserIds.length === 0}
                >
                  <i className="fas fa-trash me-1"></i>
                  מחק נבחרים ({selectedUserIds.length})
                </button>
              </>
            )}
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
                placeholder="חפש משתמשים לפי שם, מספר אישי, טלפון, דרגה, מיקום או מסגרת..."
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
                נמצאו {filteredAndSortedUsers.length} משתמשים מתוך {users.length}
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
                    checked={selectedUserIds.length === paginatedUsers.length && paginatedUsers.length > 0}
                    onChange={handleSelectAllUsers}
                    title="בחר הכל"
                  />
                </th>
                <th 
                  className="sortable-header" 
                  onClick={() => handleSort('name')}
                  title="לחץ למיון לפי שם"
                  data-sorted={sortConfig?.key === 'name' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <span>שם</span>
                    <div className="sort-indicator">
                      {getSortIcon('name')}
                    </div>
                  </div>
                </th>
                <th 
                  className="sortable-header" 
                  onClick={() => handleSort('personalNumber')}
                  title="לחץ למיון לפי מספר אישי"
                  data-sorted={sortConfig?.key === 'personalNumber' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <span>מספר אישי</span>
                    <div className="sort-indicator">
                      {getSortIcon('personalNumber')}
                    </div>
                  </div>
                </th>
                <th 
                  className="sortable-header" 
                  onClick={() => handleSort('phoneNumber')}
                  title="לחץ למיון לפי טלפון"
                  data-sorted={sortConfig?.key === 'phoneNumber' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <span>טלפון</span>
                    <div className="sort-indicator">
                      {getSortIcon('phoneNumber')}
                    </div>
                  </div>
                </th>
                <th 
                  className="sortable-header" 
                  onClick={() => handleSort('rank')}
                  title="לחץ למיון לפי דרגה"
                  data-sorted={sortConfig?.key === 'rank' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <span>דרגה</span>
                    <div className="sort-indicator">
                      {getSortIcon('rank')}
                    </div>
                  </div>
                </th>
                <th 
                  className="sortable-header" 
                  onClick={() => handleSort('unit')}
                  title="לחץ למיון לפי מסגרת"
                  data-sorted={sortConfig?.key === 'unit' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <span>מסגרת</span>
                    <div className="sort-indicator">
                      {getSortIcon('unit')}
                    </div>
                  </div>
                </th>
                <th 
                  className="sortable-header" 
                  onClick={() => handleSort('location')}
                  title="לחץ למיון לפי מיקום"
                  data-sorted={sortConfig?.key === 'location' ? 'true' : 'false'}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <span>מיקום</span>
                    <div className="sort-indicator">
                      {getSortIcon('location')}
                    </div>
                  </div>
                </th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user: User) => (
                <tr key={user.id}>
                  <td>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={selectedUserIds.includes(user.id)}
                      onChange={() => handleToggleUserSelection(user.id)}
                    />
                  </td>
                  <td>{user.name}</td>
                  <td>{user.personalNumber}</td>
                  <td>{user.phoneNumber}</td>
                  <td>{user.rank}</td>
                  <td>{user.unit}</td>
                  <td>{user.location}</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-outline" 
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
    </div>
  );
};

export default UsersTab;
