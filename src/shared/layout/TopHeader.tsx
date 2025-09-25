import React, { useState, useEffect, useRef } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { User } from '../../types';
import { usePendingReceiptsCount } from '../../hooks';
import { PendingReceiptsBadge, ErrorBoundary } from '../components';
import './TopHeader.css';

interface TopHeaderProps {
  user?: FirebaseUser;
  userProfile?: User | null;
  isAdmin?: boolean;
  onLogout?: () => void;
  onSettingsClick?: () => void;
  onPendingReceiptsClick?: () => void;
}

const TopHeader: React.FC<TopHeaderProps> = ({ 
  user, 
  userProfile,
  isAdmin,
  onLogout,
  onSettingsClick,
  onPendingReceiptsClick
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Get pending receipts count
  const { userSpecificCount: pendingCount } = usePendingReceiptsCount(userProfile, isAdmin);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  if (!user) {
    return null;
  }

  return (
    <header className="top-header">
      <div className="top-header-container">
        {/* Left side - Logo/Title */}
        <div className="header-left">
          <div className="header-logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div className="logo-text">
              <h1 className="logo-title">אחל"ן</h1>
            </div>
          </div>
        </div>

        {/* Right side - User Profile */}
        <div className="header-right">
          {/* Pending Receipts Badge */}
          {onPendingReceiptsClick && (
            <ErrorBoundary fallback={<div></div>}>
              <PendingReceiptsBadge 
                count={pendingCount} 
                onClick={onPendingReceiptsClick}
              />
            </ErrorBoundary>
          )}
          
          <div className="user-menu-container" ref={menuRef}>
            <button 
              className="user-profile-button"
              onClick={toggleUserMenu}
              aria-label="פתח תפריט משתמש"
            >
              <div className="user-avatar-container">
                {user.photoURL && !imageError ? (
                  <img 
                    src={user.photoURL} 
                    alt="Profile" 
                    className="user-avatar"
                    onError={handleImageError}
                    onLoad={handleImageLoad}
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
                <div className="user-email">{userProfile?.location || user.email}</div>
              </div>
              <svg className="dropdown-arrow" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 10l5 5 5-5z"/>
              </svg>
            </button>

            {/* User dropdown menu */}
            {isUserMenuOpen && (
              <div className="user-menu-dropdown" onClick={(e) => e.stopPropagation()}>
                {onSettingsClick && (
                  <div className="user-menu-item" onClick={() => {
                    onSettingsClick();
                    setIsUserMenuOpen(false);
                  }}>
                    <svg className="menu-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l1.86-1.41c.18-.14.23-.41.12-.61l-1.74-3.18c-.12-.23-.37-.3-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.5c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l1.86 1.41c-.04.34-.07.67-.07 1s.03.65.07.97l-1.86 1.41c-.19.15-.24.42-.12.61l1.74 3.18c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.5c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.74-3.18c.12-.2.07-.47-.12-.61L19.43 13z"/>
                    </svg>
                    <span>הגדרות חשבון</span>
                  </div>
                )}
                
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
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
