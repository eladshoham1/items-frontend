import React, { useState } from 'react';
import { User } from 'firebase/auth';
import './Navigation.css';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user?: User;
  onLogout?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange, user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const tabs = [
    { key: 'dashboard', label: 'לוח בקרה', icon: '📊' },
    { key: 'dailyReport', label: 'דו"ח יומי', icon: '📋' },
    { key: 'receipts', label: 'קבלות', icon: '📄' },
    { key: 'users', label: 'משתמשים', icon: '👥' },
    { key: 'items', label: 'ציוד', icon: '📦' },
    { key: 'management', label: 'ניהול מערכת', icon: '⚙️' },
  ];

  const handleTabClick = (tab: string) => {
    onTabChange(tab);
    setIsMenuOpen(false);
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <button
          className="mobile-menu-button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className="hamburger">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
        
        <ul className={`nav-menu ${isMenuOpen ? 'nav-menu-open' : ''}`}>
          {tabs.map(({ key, label, icon }) => (
            <li key={key} className="nav-item">
              <button
                className={`nav-link ${activeTab === key ? 'nav-link-active' : ''}`}
                onClick={() => handleTabClick(key)}
              >
                <span className="nav-icon">{icon}</span>
                <span className="nav-label">{label}</span>
              </button>
            </li>
          ))}
          
          {user && (
            <li className="nav-item nav-user-info">
              <div className="user-info">
                <div className="user-profile">
                  {user.photoURL && (
                    <img 
                      src={user.photoURL} 
                      alt="Profile" 
                      className="user-avatar"
                    />
                  )}
                  <div className="user-details">
                    <span className="user-name">{user.displayName || 'User'}</span>
                    <span className="user-email">📧 {user.email}</span>
                  </div>
                </div>
                {onLogout && (
                  <button
                    className="logout-button"
                    onClick={onLogout}
                    title="התנתק"
                  >
                    🚪 התנתק
                  </button>
                )}
              </div>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
