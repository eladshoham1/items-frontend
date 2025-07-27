import React, { useState } from 'react';
import ServerError from '../ServerError';
import Sheet from '../sheet/Sheet';
import UserForm from './UserForm';
import { useUsers } from '../../hooks';
import { User } from '../../types';
import { paginate } from '../../utils';
import { UI_CONFIG } from '../../config/app.config';

const UsersTab: React.FC = () => {
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleSuccess = async () => {
    handleCloseModal();
    await refetch(); // Explicitly refresh the users list
  };
  const { users, loading, error, deleteUser, refetch } = useUsers();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { paginatedItems: paginatedUsers, totalPages } = paginate(
    users,
    currentPage,
    UI_CONFIG.TABLE_PAGE_SIZE
  );

  const handleAddClick = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את המשתמש?')) return;

    const success = await deleteUser(userId);
    if (!success) {
      alert('שגיאה במחיקת המשתמש');
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="surface users-tab-container">
        <h2>משתמשים</h2>
        <p className="loading-message">טוען נתונים...</p>
      </div>
    );
  }

  if (error) {
    return <ServerError />;
  }

  return (
    <div className="surface users-tab-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>משתמשים</h2>
        <button className="button secondary" onClick={handleAddClick} style={{ marginBottom: '10px' }}>
          הוסף משתמש חדש
        </button>
      </div>

      <table className="users-table">
        <thead>
          <tr>
            <th>שם</th>
            <th>מספר אישי</th>
            <th>טלפון</th>
            <th>דרגה</th>
            <th>מיקום</th>
            <th>פעולות</th>
          </tr>
        </thead>
        <tbody>
          {paginatedUsers.map((user: User) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.personalNumber}</td>
              <td>{user.phoneNumber}</td>
              <td>{user.rank}</td>
              <td>{user.location}</td>
              <td>
                <button className="button" onClick={() => handleSelectUser(user)}>עדכן</button>
                <button className="button danger" onClick={() => handleDelete(user.id)}>
                  🗑️ מחק
                </button>
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
          <UserForm
            user={selectedUser}
            onSuccess={handleSuccess}
            onCancel={handleCloseModal}
          />
        </Sheet>
      )}
    </div>
  );
};

export default UsersTab;
