import React, { useState } from 'react';
import { TabNavigation } from '../shared/components';

const TabTest: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tab1');

  const tabs = [
    { id: 'tab1', label: 'Tab 1', icon: 'fas fa-home' },
    { id: 'tab2', label: 'Tab 2', icon: 'fas fa-user', count: 5 },
    { id: 'tab3', label: 'Tab 3', icon: 'fas fa-settings' },
    { id: 'tab4', label: 'Disabled Tab', icon: 'fas fa-ban', disabled: true },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h2>TabNavigation Test</h2>
      
      <h3>Primary Variant</h3>
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="primary"
        size="md"
      />
      
      <h3>Secondary Variant</h3>
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="secondary"
        size="md"
      />
      
      <h3>Minimal Variant</h3>
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="minimal"
        size="sm"
      />
      
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f8f9fa' }}>
        <p>Active Tab: {activeTab}</p>
        <p>Active Tab Label: {tabs.find(t => t.id === activeTab)?.label}</p>
      </div>
    </div>
  );
};

export default TabTest;
