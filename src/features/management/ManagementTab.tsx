import React, { useState } from 'react';
import { UnitsTab } from './UnitsTab';
import { LocationsTab } from './LocationsTab';
import { RanksTab } from './RanksTab';
import { OriginsTab } from './OriginsTab';
import { ItemNamesTab } from './ItemNamesTab';

const ManagementTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState('units');

  const subTabs = [
    { key: 'units', label: 'יחידות', icon: '🏢' },
    { key: 'locations', label: 'מיקומים', icon: '📍' },
    { key: 'ranks', label: 'דרגות', icon: '⭐' },
    { key: 'origins', label: 'מקורות', icon: '📌' },
    { key: 'itemNames', label: 'שמות פריטים', icon: '📝' },
  ];

  const renderActiveTab = () => {
    switch (activeSubTab) {
      case 'units':
        return <UnitsTab />;
      case 'locations':
        return <LocationsTab />;
      case 'ranks':
        return <RanksTab />;
      case 'origins':
        return <OriginsTab />;
      case 'itemNames':
        return <ItemNamesTab />;
      default:
        return <UnitsTab />;
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="mb-0">ניהול מערכת</h2>
        <p className="text-muted mb-3">
          ניהול נתוני בסיס: יחידות, מיקומים, דרגות, מקורות ושמות פריטים
        </p>
        
        {/* Sub-navigation */}
        <div className="btn-group" role="group">
          {subTabs.map(({ key, label, icon }) => (
            <button
              key={key}
              type="button"
              className={`btn ${activeSubTab === key ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setActiveSubTab(key)}
            >
              <span className="me-2">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="card-body">
        {renderActiveTab()}
      </div>
    </div>
  );
};

export default ManagementTab;
