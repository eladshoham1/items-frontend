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
          <h1 className="app-title">אחל"ן</h1>
          <h2 className="app-subtitle">אמצעי חתימות ללא ניירת</h2>
        </div>
      </header>
      <main className="layout-main">
        <div className="main-container">
          {children}
        </div>
      </main>
      <footer className="layout-footer">
        <div className="footer-container">
          <p className="footer-text">פותח ע"י סק"ש</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
