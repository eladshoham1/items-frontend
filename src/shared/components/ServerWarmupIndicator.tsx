import React from 'react';

interface ServerWarmupIndicatorProps {
  serverState: 'unknown' | 'awake' | 'sleeping' | 'warming-up';
}

const ServerWarmupIndicator: React.FC<ServerWarmupIndicatorProps> = ({ serverState }) => {
  if (serverState !== 'warming-up') return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: 'rgba(76, 175, 80, 0.9)',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '25px',
        fontSize: '14px',
        fontWeight: '500',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(5px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}
    >
      <div 
        style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: '#fff',
          animation: 'pulse 1.5s ease-in-out infinite'
        }}
      />
      <span>מכין את השרת...</span>
      
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};

export default ServerWarmupIndicator;
