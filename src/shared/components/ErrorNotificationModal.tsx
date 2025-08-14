import React from 'react';
import Modal from './Modal';

interface ErrorNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

const ErrorNotificationModal: React.FC<ErrorNotificationModalProps> = ({
  isOpen,
  onClose,
  title,
  message
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div style={{ direction: 'rtl', padding: '20px' }}>
        <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
          <i className="fas fa-exclamation-triangle me-2"></i>
          <strong>שגיאה:</strong> {message}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
          >
            <i className="fas fa-check me-2"></i>
            הבנתי
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ErrorNotificationModal;
