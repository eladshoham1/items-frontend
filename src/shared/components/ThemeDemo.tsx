import React from 'react';
import { useTheme } from '../../contexts';
import './ThemeDemo.css';

export const ThemeDemo: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className="theme-demo">
      <h3>Theme System Demo</h3>
      <p>Current theme: <strong>{theme === 'dark' ? 'מצב כהה' : 'מצב בהיר'}</strong></p>
      
      <div className="theme-demo-colors">
        <div className="color-box bg-primary">Primary</div>
        <div className="color-box bg-surface">Surface</div>
        <div className="color-box bg-sidebar">Sidebar</div>
        <div className="color-box bg-success">Success</div>
        <div className="color-box bg-warning">Warning</div>
        <div className="color-box bg-danger">Danger</div>
      </div>
      
      <div className="theme-demo-text">
        <p className="text-primary">Primary text</p>
        <p className="text-secondary">Secondary text</p>
        <p className="text-muted">Muted text</p>
      </div>
    </div>
  );
};
