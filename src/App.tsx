import React, { useState } from 'react';
import { Layout, Navigation } from './shared/layout';
import { Dashboard } from './features/dashboard';
import { DailyReport } from './features/reports';
import { ReceiptsTab } from './features/receipts';
import { UsersTab } from './features/users';
import { ItemsTab } from './features/items';
import { ManagementTab } from './features/management';
import { ManagementProvider } from './contexts';
import './shared/styles';

type Tab = 'dashboard' | 'dailyReport' | 'receipts' | 'users' | 'items' | 'management';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'dailyReport':
        return <DailyReport />;
      case 'receipts':
        return <ReceiptsTab />;
      case 'users':
        return <UsersTab />;
      case 'items':
        return <ItemsTab />;
      case 'management':
        return <ManagementTab />;
      default:
        return null;
    }
  };

  return (
    <ManagementProvider>
      <Layout>
        <Navigation activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as Tab)} />
        <div className="content-container">
          {renderTabContent()}
        </div>
      </Layout>
    </ManagementProvider>
  );
};

export default App;
