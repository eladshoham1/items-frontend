import React, { useEffect, useCallback } from 'react';
import './Modal.css';

interface ModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ 
  children, 
  isOpen, 
  onClose, 
  title,
  size = 'md'
}) => {
  const handleOverlayClick = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const handleContentClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
  }, []);

  const handleCloseClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      // Prevent background scrolling on mobile
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={handleOverlayClick}
      onTouchStart={handleOverlayClick}
    >
      <div 
        className={`modal-content modal-${size}`}
        onClick={handleContentClick}
        onTouchStart={handleContentClick}
      >
        <div className="modal-header">
          {title && <h3 className="modal-title">{title}</h3>}
          <button 
            className="modal-close-btn" 
            onClick={handleCloseClick}
            onTouchStart={handleCloseClick}
            aria-label="סגור"
            type="button"
          >
            &times;
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
