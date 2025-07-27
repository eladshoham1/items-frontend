import React from 'react';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="layout">
      <header className="layout-header">
        <div className="header-container">
          <h1 className="app-title">ניהול ציוד</h1>
        </div>
      </header>
      <main className="layout-main">
        <div className="main-container">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
