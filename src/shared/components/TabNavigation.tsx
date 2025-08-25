import React from 'react';
import './TabNavigation.css';

export interface TabItem {
  id: string;
  label: string;
  icon?: string;
  count?: number;
  disabled?: boolean;
}

interface TabNavigationProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'primary' | 'secondary' | 'minimal' | 'compact';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  tabs,
  activeTab,
  onTabChange,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = ''
}) => {
  return (
    <div className={`tab-navigation-container ${className}`}>
      <nav 
        className={`tab-navigation tab-navigation--${variant} tab-navigation--${size} ${fullWidth ? 'tab-navigation--full-width' : ''}`}
        role="tablist"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-navigation__item ${activeTab === tab.id ? 'tab-navigation__item--active' : ''} ${tab.disabled ? 'tab-navigation__item--disabled' : ''}`}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            disabled={tab.disabled}
            title={tab.disabled ? 'לא זמין' : `עבור ל${tab.label}`}
          >
            <div className="tab-navigation__content">
              {tab.icon && (
                <i className={`${tab.icon} tab-navigation__icon`} aria-hidden="true"></i>
              )}
              <span className="tab-navigation__label">{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className="tab-navigation__count">{tab.count}</span>
              )}
            </div>
            {activeTab === tab.id && (
              <div className="tab-navigation__indicator" aria-hidden="true"></div>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default TabNavigation;
