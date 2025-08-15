import React from 'react';
import { User } from '../../../types';
import { UserSelectorProps } from '../types/receipt-form.types';

const UserSelector: React.FC<UserSelectorProps> = ({
  users,
  selectedUserId,
  onSelectUser,
  currentUserId,
  error
}) => {
  return (
    <div className="form-group mb-4">
      <label className="form-label required" htmlFor="user-select">
        <i className="fas fa-user me-2"></i>
        בחר משתמש לקבלת הפריטים:
      </label>
      
      <select
        id="user-select"
        className={`form-control ${error ? 'is-invalid' : ''}`}
        value={selectedUserId}
        onChange={(e) => onSelectUser(e.target.value)}
        required
      >
        <option value="">בחר משתמש...</option>
        {users.map((user: User) => (
          <option key={user.id} value={user.id}>
            {user.name} - {user.personalNumber}
            {user.location && ` (${user.location})`}
          </option>
        ))}
      </select>
      
      {error && (
        <div className="invalid-feedback d-block">
          <i className="fas fa-exclamation-triangle me-1"></i>
          {error}
        </div>
      )}
      
      {users.length === 0 && (
        <small className="text-muted mt-1 d-block">
          <i className="fas fa-info-circle me-1"></i>
          אין משתמשים זמינים למסירת פריטים
        </small>
      )}
      
      {users.length > 0 && (
        <small className="text-muted mt-1 d-block">
          <i className="fas fa-info-circle me-1"></i>
          זמינים {users.length} משתמשים
        </small>
      )}
    </div>
  );
};

export default UserSelector;
