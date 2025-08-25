import React from 'react';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  topHeader?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children, sidebar, topHeader }) => {
  return (
    <div className="layout">
      {/* Top Header */}
      {topHeader && (
        <header className="layout-top-header">
          {topHeader}
        </header>
      )}
      
      {/* Sidebar */}
      {sidebar && (
        <aside className="layout-sidebar">
          {sidebar}
        </aside>
      )}
      
      {/* Main Content Area */}
      <div className="layout-main">
        {/* Content */}
        <main className="layout-content">
          <div className="content-container">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
