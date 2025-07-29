import React, { useState } from 'react';
import { Layout, Navigation } from './shared/layout';
import { Dashboard } from './features/dashboard';
import { DailyReport } from './features/reports';
import { ReceiptsTab } from './features/receipts';
import { UsersTab } from './features/users';
import { ItemsTab } from './features/items';
import { ManagementTab } from './features/management';
import { GoogleAuth } from './features/auth';
import { ManagementProvider } from './contexts';
import { useAuth } from './hooks';
import { User } from 'firebase/auth';
import './shared/styles';

type Tab = 'dashboard' | 'dailyReport' | 'receipts' | 'users' | 'items' | 'management';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [authError, setAuthError] = useState<string | null>(null);
  const { user, isLoading, logout } = useAuth();

  const handleAuthSuccess = (user: User) => {
    console.log('Authentication successful:', user.email, user.displayName);
    setAuthError(null);
  };

  const handleAuthError = (error: string) => {
    setAuthError(error);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem'
      }}>
        טוען...
      </div>
    );
  }

  // Show Google authentication if user is not authenticated
  if (!user) {
    return (
      <>
        <GoogleAuth onAuthSuccess={handleAuthSuccess} onAuthError={handleAuthError} />
        {authError && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#f8d7da',
            color: '#721c24',
            padding: '12px 16px',
            borderRadius: '4px',
            border: '1px solid #f5c6cb',
            zIndex: 1000
          }}>
            {authError}
            <button 
              onClick={() => setAuthError(null)}
              style={{
                marginLeft: '10px',
                background: 'none',
                border: 'none',
                color: '#721c24',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ✕
            </button>
          </div>
        )}
      </>
    );
  }

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
        <Navigation 
          activeTab={activeTab} 
          onTabChange={(tab) => setActiveTab(tab as Tab)}
          user={user}
          onLogout={handleLogout}
        />
        <div className="content-container">
          {renderTabContent()}
        </div>
      </Layout>
    </ManagementProvider>
  );
};

export default App;
