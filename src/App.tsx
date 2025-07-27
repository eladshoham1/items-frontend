import React, { useState } from 'react';
import { Layout, Navigation } from './shared/layout';
import { Dashboard } from './features/dashboard';
import { DailyReport } from './features/reports';
import { ReceiptsTab } from './features/receipts';
import { UsersTab } from './features/users';
import { ItemsTab } from './features/items';
import './shared/styles';

type Tab = 'dashboard' | 'dailyReport' | 'receipts' | 'users' | 'items';

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
      default:
        return null;
    }
  };

  return (
    <Layout>
      <Navigation activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as Tab)} />
      <div className="content-container">
        {renderTabContent()}
      </div>
    </Layout>
  );
};

export default App;
