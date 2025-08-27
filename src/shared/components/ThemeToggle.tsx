import React from 'react';
import { useTheme } from '../../contexts';
import './ThemeToggle.css';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = '', 
  showLabel = true 
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`notification-toggle-field ${className}`}>
      <span className="notification-toggle-label">
        {theme === 'dark' ? 'מצב כהה' : 'מצב בהיר'}
      </span>
      <label className="notification-toggle-wrapper">
        <input
          type="checkbox"
          checked={theme === 'dark'}
          onChange={toggleTheme}
          className="notification-toggle-input"
          aria-label={theme === 'dark' ? 'עבור למצב בהיר' : 'עבור למצב כהה'}
        />
        <span className="notification-toggle-slider">
          <span className="theme-icon">
            {theme === 'dark' ? '🌙' : '☀️'}
          </span>
        </span>
      </label>
    </div>
  );
};
