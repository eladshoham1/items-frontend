import React, { useState } from 'react';
import { ServerError } from '../../shared/components';
import Modal from '../../shared/components/Modal';
import UserForm from './UserForm';
import { useUsers } from '../../hooks';
import { User } from '../../types';
import { paginate } from '../../utils';
import { UI_CONFIG } from '../../config/app.config';

const UsersTab: React.FC = () => {
  const { users, loading, error, deleteUser, refetch } = useUsers();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { paginatedItems: paginatedUsers, totalPages } = paginate(
    users,
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
          <button className="btn btn-primary" onClick={handleAddClick}>
            הוסף משתמש חדש
          </button>
        </div>
      </div>

      <div className="card-body">
        <div className="table-responsive">
          <table className="table">
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
                    <div className="btn-group">
                      <button 
                        className="btn btn-sm btn-outline" 
                        onClick={() => handleSelectUser(user)}
                      >
                        עדכן
                      </button>
                      <button 
                        className="btn btn-sm btn-danger" 
                        onClick={() => handleDelete(user.id)}
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
        title={selectedUser ? 'עדכן משתמש' : 'הוסף משתמש חדש'}
        size="md"
      >
        <UserForm
          user={selectedUser}
          onSuccess={handleSuccess}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
};

export default UsersTab;
