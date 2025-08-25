import React, { useState, useEffect } from 'react';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  topHeader?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children, sidebar, topHeader }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileMenuOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="layout">
      {/* Top Header */}
      {topHeader && (
        <header className="layout-top-header">
          {isMobile && (
            <button 
              className="mobile-menu-toggle"
              onClick={toggleMobileMenu}
              aria-label="פתח תפריט ניווט"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
              </svg>
            </button>
          )}
          {topHeader}
        </header>
      )}
      
      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={closeMobileMenu}
        />
      )}
      
      {/* Sidebar */}
      {sidebar && (
        <aside className={`layout-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
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
