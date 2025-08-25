import React, { useState } from 'react';
import { TabNavigation } from '../../shared/components';
import { UnitsTab, LocationsTab, ItemNamesTab, AllocationsTab, ManagementSettingsTab, BackupRestoreTab } from './index';

const ManagementTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState('units');

  const subTabs = [
    { id: 'units', label: 'יחידות', icon: 'fas fa-building' },
    { id: 'locations', label: 'מיקומים', icon: 'fas fa-map-marker-alt' },
    { id: 'itemNames', label: 'שמות פריטים', icon: 'fas fa-tags' },
    { id: 'allocations', label: 'שבצק', icon: 'fas fa-clipboard-list' },
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
    <>
      {/* Tab Navigation */}
      <TabNavigation
        tabs={subTabs}
        activeTab={activeSubTab}
        onTabChange={handleTabChange}
        variant="primary"
        size="md"
      />
      
      <div style={{ padding: '20px 0' }}>
        {renderActiveTab()}
      </div>
    </>
  );
};

export default ManagementTab;
