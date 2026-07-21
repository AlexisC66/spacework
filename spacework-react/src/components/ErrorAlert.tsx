import React, { useEffect } from 'react';

interface ErrorAlertProps {
  message: string | null;
  onClose?: () => void;
  autoCloseMs?: number;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onClose, autoCloseMs = 5000 }) => {
  useEffect(() => {
    if (message && autoCloseMs > 0 && onClose) {
      const timer = setTimeout(onClose, autoCloseMs);
      return () => clearTimeout(timer);
    }
  }, [message, autoCloseMs, onClose]);

  if (!message) return null;

  return (
    <div className="alert alert-danger alert-dismissible fade show" role="alert">
      <i className="bi bi-exclamation-triangle me-2"></i>
      {message}
      {onClose && (
        <button type="button" className="btn-close" onClick={onClose} aria-label="Cerrar"></button>
      )}
    </div>
  );
};

export default ErrorAlert;
