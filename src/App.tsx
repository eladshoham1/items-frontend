import React, { useState, useEffect } from 'react';
import { Layout, Navigation, TopHeader } from './shared/layout';
import { Dashboard } from './features/dashboard';
import { DailyReport } from './features/reports';
import { ReceiptsTab } from './features/receipts';
import { UsersTab } from './features/users';
import { ItemsTab } from './features/items';
import { ManagementTab } from './features/management';
import { SettingsTab } from './features/settings';
import GoogleAuth from './features/auth/GoogleAuth';
import { ManagementProvider } from './contexts';
import { useAuth, useUserProfile } from './hooks';
import { UserProfileSetup } from './components/auth';
import { User } from 'firebase/auth';
import './shared/styles';

type Tab = 'dashboard' | 'dailyReport' | 'receipts' | 'users' | 'items' | 'management' | 'settings';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [authError, setAuthError] = useState<string | null>(null);
  const { user: firebaseUser, isLoading: authLoading, logout } = useAuth();
  const { 
    userProfile, 
    isLoading: profileLoading, 
    needsProfile, 
    error: profileError,
    isAdmin,
    createUserProfile
  } = useUserProfile();

  // Mobile optimization effects
  useEffect(() => {
    // Prevent zoom on input focus for iOS
    const handleInputFocus = (e: FocusEvent) => {
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
          target.style.fontSize = '16px';
        }
      }
    };

    // Add event listeners
    document.addEventListener('focusin', handleInputFocus);

    return () => {
      document.removeEventListener('focusin', handleInputFocus);
    };
  }, []);

  const handleAuthSuccess = (user: User) => {
    setAuthError(null);
  };

  const handleAuthError = (error: string) => {
    setAuthError(error);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      // Swallow logout errors silently
    }
  };

  const handleProfileComplete = async (profileData: Parameters<typeof createUserProfile>[0]) => {
    try {
      await createUserProfile(profileData);
    } catch (error) {
      // Swallow profile creation errors (UI already shows errors)
    }
  };

  // Show loading spinner while checking authentication or profile
  if (authLoading || profileLoading) {
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
  if (!firebaseUser) {
    return (
      <>
              <GoogleAuth 
        onAuthSuccess={handleAuthSuccess}
        onAuthError={handleAuthError}
      />
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

  // Show profile setup if user needs to complete their profile
  if (needsProfile) {
    return (
      <ManagementProvider>
        <UserProfileSetup
          onComplete={handleProfileComplete}
          userEmail={firebaseUser.email || ''}
          userDisplayName={firebaseUser.displayName || undefined}
          userPhoneNumber={firebaseUser.phoneNumber || undefined}
          isLoading={profileLoading}
          error={profileError}
        />
      </ManagementProvider>
    );
  }

  // Show error if profile couldn't be loaded
  if (!userProfile) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        fontSize: '1.2rem'
      }}>
        <div className="alert alert-danger">
          {profileError || 'שגיאה בטעינת פרופיל המשתמש'}
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => window.location.reload()}
        >
          נסה שוב
        </button>
      </div>
    );
  }

  const getAvailableTabs = (): Tab[] => {
    if (isAdmin) {
      return ['dashboard', 'dailyReport', 'receipts', 'users', 'items', 'management'];
    } else {
      return ['dailyReport', 'receipts'];
    }
  };

  const availableTabs = getAvailableTabs();
  
  // Redirect to available tab if current tab is not accessible
  if (!availableTabs.includes(activeTab) && activeTab !== 'settings') {
    setActiveTab(availableTabs[0]);
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return isAdmin ? <Dashboard /> : null;
      case 'dailyReport':
        return <DailyReport userProfile={userProfile} isAdmin={isAdmin} />;
      case 'receipts':
        return <ReceiptsTab userProfile={userProfile} isAdmin={isAdmin} />;
      case 'users':
        return isAdmin ? <UsersTab isAdmin={isAdmin} /> : null;
      case 'items':
        return isAdmin ? <ItemsTab userProfile={userProfile} isAdmin={isAdmin} /> : null;
      case 'management':
        return isAdmin ? <ManagementTab /> : null;
      case 'settings':
        return <SettingsTab userProfile={userProfile} isAdmin={isAdmin} />;
      default:
        return null;
    }
  };

  return (
    <>
      <ManagementProvider>
        <Layout 
          topHeader={
            <TopHeader
              user={firebaseUser}
              userProfile={userProfile}
              isAdmin={isAdmin}
              onLogout={handleLogout}
              onSettingsClick={() => setActiveTab('settings')}
            />
          }
          sidebar={
            <Navigation 
              activeTab={activeTab}
              availableTabs={[...availableTabs, 'settings']}
              onTabChange={(tab: string) => setActiveTab(tab as Tab)}
              user={firebaseUser}
              userProfile={userProfile}
              isAdmin={isAdmin}
              onLogout={handleLogout}
            />
          }
        >
          {renderTabContent()}
        </Layout>
      </ManagementProvider>
    </>
  );
};

export default App;
