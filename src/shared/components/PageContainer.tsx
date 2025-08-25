import React from 'react';
import './PageContainer.css';

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

const PageContainer: React.FC<PageContainerProps> = ({
  children,
  title,
  subtitle,
  action,
  className = ''
}) => {
  return (
    <div className={`page-container ${className}`}>
      {(title || subtitle || action) && (
        <div className="page-header">
          <div className="page-header-content">
            {(title || subtitle) && (
              <div className="page-header-text">
                {title && (
                  <h1 className="page-title">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                    </svg>
                    {title}
                  </h1>
                )}
                {subtitle && <p className="page-subtitle">{subtitle}</p>}
              </div>
            )}
            {action && (
              <div className="page-header-action">
                {action}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="page-content">
        {children}
      </div>
    </div>
  );
};

export default PageContainer;
