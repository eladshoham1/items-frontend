import React, { useEffect, useRef, useCallback } from 'react';
import './Modal.css';

interface ModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ 
  children, 
  isOpen, 
  onClose, 
  title,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = ''
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const handleOverlayClick = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  }, [onClose, closeOnOverlayClick]);

  const handleContentClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
  }, []);

  const handleCloseClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Focus the modal
      modalRef.current?.focus();
      
      // Simple mobile-friendly scroll prevention
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        // On mobile, just prevent overflow - don't fix position
        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'none';
      } else {
        // On desktop, use the more aggressive prevention
        const scrollY = window.scrollY;
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        document.body.setAttribute('data-scroll-y', scrollY.toString());
      }
    } else {
      // ENHANCED CLEANUP - Always restore all styles regardless of device
      const scrollY = document.body.getAttribute('data-scroll-y');
      
      // Force reset all possible scroll-blocking styles
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.touchAction = '';
      document.body.style.pointerEvents = '';
      document.body.style.userSelect = '';
      document.body.removeAttribute('data-scroll-y');
      
      // Force enable scrolling on mobile
      if (window.innerWidth <= 768) {
        document.body.style.overflowY = 'auto';
        document.body.style.touchAction = 'auto';
        document.documentElement.style.overflowY = 'auto';
        document.documentElement.style.touchAction = 'auto';
        
        // Remove any style attributes that might be blocking scrolling
        setTimeout(() => {
          document.body.removeAttribute('style');
        }, 100);
      }
      
      // Restore scroll position only on desktop
      if (scrollY && window.innerWidth > 768) {
        window.scrollTo(0, parseInt(scrollY));
      }
      
      // Restore focus to the previously focused element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }

    return () => {
      // Cleanup function - always restore normal state and ensure mobile accessibility
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.touchAction = '';
      document.body.removeAttribute('data-scroll-y');
      
      // Ensure body is fully interactive on mobile
      document.body.style.pointerEvents = '';
      document.body.style.userSelect = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  // Use medium size on mobile instead of full to avoid sizing issues
  const isMobile = window.innerWidth <= 768;
  const effectiveSize = isMobile ? 'md' : size;

  return (
    <div 
      className="modal-overlay" 
      onClick={handleOverlayClick}
      onTouchStart={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      style={{
        // Force inline styles for debugging on mobile
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        zIndex: 1003,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px'
      }}
    >
      <div 
        ref={modalRef}
        className={`modal-content modal-content--${effectiveSize} ${className}`}
        onClick={handleContentClick}
        onTouchStart={handleContentClick}
        tabIndex={-1}
        style={{
          // Force inline styles for debugging on mobile
          background: '#2a2a2a',
          border: '2px solid #007bff',
          borderRadius: '8px',
          maxWidth: 'calc(100vw - 20px)',
          maxHeight: '85vh',
          width: '100%',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
        }}
      >
        {(title || showCloseButton) && (
          <div className="modal-header">
            {title && <h3 id="modal-title" className="modal-title">{title}</h3>}
            {showCloseButton && (
              <button 
                className="modal-close-button" 
                onClick={handleCloseClick}
                onTouchStart={handleCloseClick}
                aria-label="סגור חלון"
                type="button"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            )}
          </div>
        )}
        
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
