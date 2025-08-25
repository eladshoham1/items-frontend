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
    <div style={{ marginBottom: '24px' }}>
      <label style={{
        display: 'block',
        fontSize: '14px',
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: '8px'
      }}>
        <i className="fas fa-user" style={{ marginLeft: '8px' }}></i>
        בחר משתמש לקבלת הפריטים:
        <span style={{ color: '#ef4444' }}> *</span>
      </label>
      
      <select
        value={selectedUserId}
        onChange={(e) => onSelectUser(e.target.value)}
        required
        style={{
          width: '100%',
          padding: '12px 16px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: error ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: '14px',
          transition: 'all 0.2s ease',
          outline: 'none',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='rgba(255,255,255,0.5)' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'left 12px center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '16px 16px',
          paddingLeft: '40px',
          cursor: 'pointer'
        }}
        onFocus={(e) => {
          (e.target as HTMLSelectElement).style.borderColor = 'rgba(59, 130, 246, 0.5)';
          (e.target as HTMLSelectElement).style.background = 'rgba(255, 255, 255, 0.15)';
        }}
        onBlur={(e) => {
          (e.target as HTMLSelectElement).style.borderColor = error ? '#ef4444' : 'rgba(255, 255, 255, 0.2)';
          (e.target as HTMLSelectElement).style.background = 'rgba(255, 255, 255, 0.1)';
        }}
      >
        <option value="" style={{
          background: '#1f2937',
          color: 'rgba(255, 255, 255, 0.7)'
        }}>
          בחר משתמש...
        </option>
        {users.map((user: User) => (
          <option 
            key={user.id} 
            value={user.id}
            style={{
              background: '#1f2937',
              color: 'rgba(255, 255, 255, 0.9)'
            }}
          >
            {user.name} - {user.personalNumber}
            {user.location && ` (${user.location})`}
          </option>
        ))}
      </select>
      
      {error && (
        <div style={{
          color: '#ef4444',
          fontSize: '12px',
          marginTop: '4px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <i className="fas fa-exclamation-triangle" style={{ marginLeft: '4px' }}></i>
          {error}
        </div>
      )}
      
      {users.length === 0 && (
        <small style={{ 
          color: 'rgba(255, 255, 255, 0.6)', 
          marginTop: '4px', 
          display: 'block' 
        }}>
          <i className="fas fa-info-circle" style={{ marginLeft: '4px' }}></i>
          אין משתמשים זמינים למסירת פריטים
        </small>
      )}
      
      {users.length > 0 && (
        <small style={{ 
          color: 'rgba(255, 255, 255, 0.6)', 
          marginTop: '4px', 
          display: 'block' 
        }}>
          <i className="fas fa-info-circle me-1"></i>
          זמינים {users.length} משתמשים
        </small>
      )}
    </div>
  );
};

export default UserSelector;
