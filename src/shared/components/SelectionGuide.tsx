import React, { useState, useEffect } from 'react';

interface SelectionGuideProps {
  show: boolean;
  message?: string;
}

export const SelectionGuide: React.FC<SelectionGuideProps> = ({ 
  show, 
  message = 'לחץ על שורה לבחירה • Ctrl+לחץ לבחירה מרובה • Shift+לחץ לטווח' 
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  return (
    <div className={`selection-guide ${visible ? 'show' : ''}`}>
      {message}
    </div>
  );
};
