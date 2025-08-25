import React, { useState } from 'react';
import { TabNavigation } from '../../shared/components';
import { UnitsTab, LocationsTab, ItemNamesTab, AllocationsTab, ManagementSettingsTab, BackupRestoreTab } from './index';
import '../../shared/styles/components.css';

const ManagementTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState('units');

  const subTabs = [
    { 
      id: 'units', 
      label: 'יחידות', 
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
        </svg>
      )
    },
    { 
      id: 'locations', 
      label: 'מיקומים', 
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      )
    },
    { 
      id: 'itemNames', 
      label: 'שמות פריטים', 
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z"/>
        </svg>
      )
    },
    { 
      id: 'allocations', 
      label: 'שבצק', 
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
        </svg>
      )
    },
    { 
      id: 'backup', 
      label: 'גיבוי ושחזור', 
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3L2 12h3v8h14v-8h3L12 3zm2 12h-1v-2h-2v2H9v-2H7v2H6v-6h12v6z"/>
        </svg>
      )
    },
    { 
      id: 'settings', 
      label: 'הגדרות', 
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
        </svg>
      )
    },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveSubTab(tabId);
  };

  const renderActiveTab = () => {
    switch (activeSubTab) {
      case 'units':
        return <UnitsTab />;
      case 'locations':
        return <LocationsTab />;
      case 'itemNames':
        return <ItemNamesTab />;
      case 'allocations':
        return <AllocationsTab />;
      case 'backup':
        return <BackupRestoreTab />;
      case 'settings':
        return <ManagementSettingsTab />;
      default:
        return <UnitsTab />;
    }
  };

  return (
    <div className="page-container">
      {/* Tab Navigation */}
      <TabNavigation
        tabs={subTabs}
        activeTab={activeSubTab}
        onTabChange={handleTabChange}
        variant="primary"
        size="md"
      />
      
      <div className="tab-content">
        {renderActiveTab()}
      </div>
    </div>
  );
};

export default ManagementTab;
