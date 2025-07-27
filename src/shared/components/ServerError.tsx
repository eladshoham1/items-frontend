import React from 'react';

const ServerError: React.FC = () => (
  <div className="card">
    <div className="card-body text-center">
      <div className="alert alert-danger">
        <div style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-md)' }}>⚠️</div>
        <h2 style={{ color: 'var(--color-danger)', marginBottom: 'var(--spacing-sm)' }}>תקלה בשרת</h2>
        <p>לא ניתן לטעון את הנתונים כרגע.<br />אנא נסה שוב מאוחר יותר.</p>
      </div>
    </div>
  </div>
);

export default ServerError;
