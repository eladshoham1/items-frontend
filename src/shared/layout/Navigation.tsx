import React, { useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { User } from '../../types';
import './Navigation.css';

interface NavigationProps {
  activeTab: string;
  availableTabs: string[];
  onTabChange: (tab: string) => void;
  user?: FirebaseUser;
  userProfile?: User | null;
  isAdmin?: boolean;
  onLogout?: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ 
  activeTab, 
  availableTabs,
  onTabChange, 
  user, 
  userProfile,
  isAdmin,
  onLogout,
  isMobileOpen = false,
  onMobileClose
}) => {
  // Use mobile state from Layout component if provided, otherwise use local state
  const [localMobileOpen, setLocalMobileOpen] = useState(false);
  const isMobileMenuOpen = isMobileOpen || localMobileOpen;
  
  const handleMobileClose = () => {
    if (onMobileClose) {
      onMobileClose();
    } else {
      setLocalMobileOpen(false);
    }
  };

  const allTabs = [
    { 
      key: 'dashboard', 
      label: 'לוח בקרה', 
      icon: (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
        </svg>
      )
    },
    { 
      key: 'dailyReport', 
      label: 'דו"ח יומי', 
      icon: (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
        </svg>
      )
    },
    { 
      key: 'receipts', 
      label: 'קבלות', 
      icon: (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
        </svg>
      )
    },
    { 
      key: 'users', 
      label: 'משתמשים', 
      icon: (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
        </svg>
      )
    },
    { 
      key: 'items', 
      label: 'ציוד', 
      icon: (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      )
    },
    { 
      key: 'management', 
      label: 'ניהול מערכת', 
      icon: (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
        </svg>
      )
    },
  ];

  // Filter tabs based on available tabs
  const visibleTabs = allTabs.filter(tab => availableTabs.includes(tab.key));

  const handleTabClick = (tab: string) => {
    onTabChange(tab);
    handleMobileClose();
  };

  return (
    <>
      {/* Sidebar Navigation */}
      <nav className={`navigation ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Navigation Menu */}
        <div className="nav-menu">
          <ul className="nav-list">
            {visibleTabs.map((tab) => (
              <li key={tab.key} className="nav-item">
                <button
                  className={`nav-link ${activeTab === tab.key ? 'nav-link-active' : ''}`}
                  onClick={() => handleTabClick(tab.key)}
                  title={tab.label}
                >
                  {tab.icon}
                  <span className="nav-label">{tab.label}</span>
                  {activeTab === tab.key && (
                    <div className="nav-indicator" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="nav-footer">
          <div className="footer-separator"></div>
          <div className="footer-text">
            פותח ע"י סק"ש
          </div>
        </div>

        {/* Mobile overlay - only show if not controlled by Layout */}
        {!onMobileClose && isMobileMenuOpen && (
          <div 
            className="mobile-overlay"
            onClick={handleMobileClose}
          />
        )}
      </nav>
    </>
  );
};

export default Navigation;
