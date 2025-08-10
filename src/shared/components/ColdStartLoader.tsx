import React, { useState, useEffect } from 'react';

interface ColdStartLoaderProps {
  isVisible: boolean;
  serverState?: 'unknown' | 'awake' | 'sleeping' | 'warming-up';
  message?: string;
}

const ColdStartLoader: React.FC<ColdStartLoaderProps> = ({ 
  isVisible, 
  serverState = 'unknown',
  message 
}) => {
  const [dots, setDots] = useState('');

  // Determine message based on server state
  const getStateMessage = () => {
    if (message) return message;
    
    switch (serverState) {
      case 'warming-up':
        return 'מעיר את השרת...';
      case 'sleeping':
        return 'השרת מתעורר...';
      case 'unknown':
      default:
        return 'השרת מתעורר...';
    }
  };

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(2px)'
      }}
    >
      <div 
        style={{
          background: serverState === 'warming-up' 
            ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '40px 50px',
          borderRadius: '20px',
          textAlign: 'center',
          color: 'white',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          border: '2px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          minWidth: '350px'
        }}
      >
        {/* Animated server icon */}
        <div 
          style={{ 
            fontSize: '60px', 
            marginBottom: '20px',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}
        >
          🖥️
        </div>
        
        <h3 style={{ 
          margin: '0 0 15px 0', 
          fontSize: '24px',
          fontWeight: '700'
        }}>
          {getStateMessage()}{dots}
        </h3>
        
        <p style={{ 
          margin: '0 0 25px 0', 
          fontSize: '16px',
          opacity: 0.9,
          lineHeight: '1.5'
        }}>
          {serverState === 'warming-up' 
            ? 'מכין את השרת עבורך...'
            : 'השרת במצב שינה ומתעורר כעת'
          }<br />
          זה יקח כמה שניות...
        </p>
        
        {/* Progress bar */}
        <div 
          style={{
            width: '100%',
            height: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '3px',
            overflow: 'hidden',
            marginBottom: '20px'
          }}
        >
          <div 
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
              borderRadius: '3px',
              animation: 'loading 2s ease-in-out infinite'
            }}
          />
        </div>
        
        <div style={{ 
          fontSize: '14px',
          opacity: 0.8,
          fontWeight: '500'
        }}>
          💡 הערה: הבקשה הבאה תהיה מהירה יותר
        </div>
      </div>
      
      <style>
        {`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
          }
          
          @keyframes loading {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(0%); }
            100% { transform: translateX(100%); }
          }
        `}
      </style>
    </div>
  );
};

export default ColdStartLoader;
