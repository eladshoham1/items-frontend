import React, { useState } from 'react';
import { TabNavigation } from '../../shared/components';
import { UnitsTab, LocationsTab, ItemNamesTab, ManagementSettingsTab, BackupRestoreTab } from './index';

const ManagementTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState('units');

  const subTabs = [
    { id: 'units', label: 'יחידות', icon: 'fas fa-building' },
    { id: 'locations', label: 'מיקומים', icon: 'fas fa-map-marker-alt' },
    { id: 'itemNames', label: 'שמות פריטים', icon: 'fas fa-tags' },
    { id: 'backup', label: 'גיבוי ושחזור', icon: 'fas fa-database' },
    { id: 'settings', label: 'הגדרות', icon: 'fas fa-cog' },
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
      case 'backup':
        return <BackupRestoreTab />;
      case 'settings':
        return <ManagementSettingsTab />;
      default:
        return <UnitsTab />;
    }
  };

  return (
    <div>
      {/* Tab Navigation */}
      <TabNavigation
        tabs={subTabs}
        activeTab={activeSubTab}
        onTabChange={handleTabChange}
        variant="primary"
        size="md"
      />
      
      <div className="card">
        <div className="card-header">
          <h2 className="mb-0">ניהול מערכת</h2>
          <p className="text-muted mb-0">
            ניהול נתוני בסיס: יחידות, מיקומים ושמות פריטים
          </p>
        </div>
        
        <div className="card-body">
          {renderActiveTab()}
        </div>
      </div>
    </div>
  );
};

export default ManagementTab;
