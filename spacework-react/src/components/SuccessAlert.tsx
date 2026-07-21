import React, { useEffect } from 'react';

interface SuccessAlertProps {
  message: string | null;
  onClose?: () => void;
  autoCloseMs?: number;
}

const SuccessAlert: React.FC<SuccessAlertProps> = ({ message, onClose, autoCloseMs = 4000 }) => {
  useEffect(() => {
    if (message && autoCloseMs > 0 && onClose) {
      const timer = setTimeout(onClose, autoCloseMs);
      return () => clearTimeout(timer);
    }
  }, [message, autoCloseMs, onClose]);

  if (!message) return null;

  return (
    <div className="alert alert-success alert-dismissible fade show" role="alert">
      <i className="bi bi-check-circle me-2"></i>
      {message}
      {onClose && (
        <button type="button" className="btn-close" onClick={onClose} aria-label="Cerrar"></button>
      )}
    </div>
  );
};

export default SuccessAlert;
