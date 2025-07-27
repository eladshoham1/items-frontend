import React, { useState } from 'react';
import './Navigation.css';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const tabs = [
    { key: 'dashboard', label: 'לוח בקרה', icon: '📊' },
    { key: 'dailyReport', label: 'דו"ח יומי', icon: '📋' },
    { key: 'receipts', label: 'קבלות', icon: '📄' },
    { key: 'users', label: 'משתמשים', icon: '👥' },
    { key: 'items', label: 'ציוד', icon: '📦' },
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
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
