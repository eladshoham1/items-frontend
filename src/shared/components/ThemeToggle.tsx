import React from 'react';
import { useTheme } from '../../contexts';
import './ThemeToggle.css';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'default' | 'compact' | 'icon-only';
  size?: 'sm' | 'md' | 'lg';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = '', 
  showLabel = true,
  variant = 'default',
  size = 'md'
}) => {
  const { theme, toggleTheme } = useTheme();

  const getAriaLabel = () => {
    return theme === 'dark' 
      ? 'מעבר למצב לא מבצעי' 
      : 'מעבר למצב מבצעי';
  };

  const getStatusText = () => {
    return theme === 'dark' 
      ? 'מצב מבצעי פעיל' 
      : 'מצב לא מבצעי פעיל';
  };

  const renderIcon = (iconType: 'sun' | 'moon') => {
    if (iconType === 'sun') {
      return (
        <svg className="theme-toggle-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/>
        </svg>
      );
    } else {
      return (
        <svg className="theme-toggle-icon" viewBox="0 0 24 24" fill="currentColor">
          <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd"/>
        </svg>
      );
    }
  };

  if (variant === 'icon-only') {
    return (
      <button
        className={`theme-toggle-icon-button theme-toggle-icon-button--${size} ${className}`}
        onClick={toggleTheme}
        aria-label={getAriaLabel()}
        title={getAriaLabel()}
      >
        {renderIcon(theme === 'dark' ? 'moon' : 'sun')}
      </button>
    );
  }

  return (
    <div className={`theme-toggle-container theme-toggle-container--${variant} theme-toggle-container--${size} ${className}`}>
      {showLabel && (
        <div className="theme-toggle-label-section">
          <span className="theme-toggle-label">ערכת נושא</span>
          <span className="theme-toggle-status">{getStatusText()}</span>
        </div>
      )}
      <div className="theme-toggle-switch-container">
        <button
          className={`theme-toggle-switch theme-toggle-switch--${theme}`}
          onClick={toggleTheme}
          aria-label={getAriaLabel()}
          aria-checked={theme === 'dark'}
          role="switch"
        >
          <span className="theme-toggle-track">
            <span className="theme-toggle-track-icons">
              <span className="theme-toggle-track-icon theme-toggle-track-icon--light">
                {renderIcon('sun')}
              </span>
              <span className="theme-toggle-track-icon theme-toggle-track-icon--dark">
                {renderIcon('moon')}
              </span>
            </span>
            <span className={`theme-toggle-thumb theme-toggle-thumb--${theme}`}>
              {renderIcon(theme === 'dark' ? 'moon' : 'sun')}
            </span>
          </span>
        </button>
      </div>
    </div>
  );
};
