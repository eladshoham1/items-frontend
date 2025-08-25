import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  minHeight?: string;
  padding?: string;
  containerStyle?: React.CSSProperties;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'טוען...', 
  size = 'md',
  minHeight = '300px',
  padding = '60px 20px',
  containerStyle = {}
}) => {
  const spinnerSizes = {
    sm: { width: '24px', height: '24px', border: '2px' },
    md: { width: '40px', height: '40px', border: '3px' },
    lg: { width: '56px', height: '56px', border: '4px' }
  };

  const spinner = spinnerSizes[size];

  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: padding,
      minHeight: minHeight,
      ...containerStyle
    }}>
      <div style={{
        width: spinner.width,
        height: spinner.height,
        border: `${spinner.border} solid rgba(255, 255, 255, 0.1)`,
        borderTop: `${spinner.border} solid #3b82f6`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '16px'
      }}></div>
      <p style={{
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '14px',
        fontWeight: '500',
        margin: '0'
      }}>
        {message}
      </p>
    </div>
  );
};

export default LoadingSpinner;
