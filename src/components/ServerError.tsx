import React from 'react';

const ServerError: React.FC = () => (
  <div className="surface error-message" style={{ textAlign: 'center', padding: '32px 0' }}>
    <h2 style={{ color: '#d32f2f', marginBottom: '12px' }}>תקלה בשרת</h2>
    <p>לא ניתן לטעון את הנתונים כרגע.<br />אנא נסה שוב מאוחר יותר.</p>
    <span style={{ fontSize: '2.5rem', color: '#d32f2f' }}>⚠️</span>
  </div>
);

export default ServerError;
