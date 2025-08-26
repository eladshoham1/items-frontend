import React from 'react';
import Modal from './Modal';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type: NotificationType;
  confirmText?: string;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type,
  confirmText = 'הבנתי'
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'fas fa-check-circle';
      case 'error':
        return 'fas fa-exclamation-triangle';
      case 'warning':
        return 'fas fa-exclamation-circle';
      case 'info':
        return 'fas fa-info-circle';
      default:
        return 'fas fa-info-circle';
    }
  };

  const getAlertClass = () => {
    switch (type) {
      case 'success':
        return 'alert-success';
      case 'error':
        return 'alert-danger';
      case 'warning':
        return 'alert-warning';
      case 'info':
        return 'alert-info';
      default:
        return 'alert-info';
    }
  };

  const getDefaultTitle = () => {
    switch (type) {
      case 'success':
        return 'הצלחה';
      case 'error':
        return 'שגיאה';
      case 'warning':
        return 'אזהרה';
      case 'info':
        return 'מידע';
      default:
        return 'הודעה';
    }
  };

  const displayTitle = title || getDefaultTitle();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={displayTitle} size="md">
      <div style={{ direction: 'rtl', padding: '20px' }}>
        <div className={`alert ${getAlertClass()}`} style={{ marginBottom: '20px' }}>
          <i className={`${getIcon()} me-2`}></i>
          <div style={{ whiteSpace: 'pre-line' }}>{message}</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
          >
            <i className="fas fa-check me-2"></i>
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default NotificationModal;
