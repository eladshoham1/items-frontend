import React, { useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { User } from '../../types';
import './TopNavigation.css';

interface TopNavigationProps {
  activeTab: string;
  availableTabs: string[];
  onTabChange: (tab: string) => void;
  user?: FirebaseUser;
  userProfile?: User | null;
  isAdmin?: boolean;
  onLogout?: () => void;
}

const TopNavigation: React.FC<TopNavigationProps> = ({ 
  activeTab, 
  availableTabs,
  onTabChange, 
  user, 
  userProfile,
  isAdmin,
  onLogout 
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const allTabs = [
    { key: 'dashboard', label: 'לוח בקרה' },
    { key: 'dailyReport', label: 'דו"ח יומי' },
    { key: 'receipts', label: 'קבלות' },
    { key: 'users', label: 'משתמשים' },
    { key: 'items', label: 'ציוד' },
    { key: 'management', label: 'ניהול מערכת' },
  ];

  // Get current page name
  const currentPage = allTabs.find(tab => tab.key === activeTab)?.label || 'אחל"ן';

  const handleTabClick = (tab: string) => {
    onTabChange(tab);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  return (
    <header className="top-navigation">
      <div className="top-nav-container">
        {/* Left side - User Profile with Settings and Logout */}
        <div className="top-nav-left">
          {user && (
            <div className="user-menu-container">
              <button 
                className="user-profile-button"
                onClick={toggleUserMenu}
                aria-label="פתח תפריט משתמש"
              >
                <div className="user-avatar-container">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt="Profile" 
                      className="user-avatar"
                    />
                  ) : (
                    <div className="user-avatar-placeholder">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="user-info">
                  <div className="user-name">
                    {userProfile?.name || user.displayName || 'משתמש'}
                    {isAdmin && <span className="admin-badge">מנהל</span>}
                  </div>
                  <div className="user-email">{user.email}</div>
                </div>
                <svg className="dropdown-arrow" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 10l5 5 5-5z"/>
                </svg>
              </button>

              {/* User dropdown menu */}
              {isUserMenuOpen && (
                <>
                  <div className="user-menu-dropdown">
                    <div className="user-menu-item" onClick={() => {
                      onTabChange('settings');
                      setIsUserMenuOpen(false);
                    }}>
                      <svg className="menu-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.04.24.24.41.48.41h3.84c.24 0 .43-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.2.07-.47-.12-.61l-2.03-1.58z"/>
                      </svg>
                      <span>הגדרות חשבון</span>
                    </div>
                    
                    {onLogout && (
                      <div className="user-menu-item logout-item" onClick={() => {
                        onLogout();
                        setIsUserMenuOpen(false);
                      }}>
                        <svg className="menu-icon" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
                        </svg>
                        <span>התנתק</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Overlay to close dropdown */}
                  <div 
                    className="user-menu-overlay"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                </>
              )}
            </div>
          )}
        </div>

        {/* Center - Navigation Tabs */}
        <div className="top-nav-center">
          <nav className="nav-tabs">
            {allTabs.filter(tab => availableTabs.includes(tab.key)).map((tab) => (
              <button
                key={tab.key}
                className={`nav-tab ${activeTab === tab.key ? 'nav-tab-active' : ''}`}
                onClick={() => handleTabClick(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right side - Current Page Name */}
        <div className="top-nav-right">
          <h1 className="page-title">{currentPage}</h1>
        </div>
      </div>
    </header>
  );
};

export default TopNavigation;
