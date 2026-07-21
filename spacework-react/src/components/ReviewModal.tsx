import React, { useState } from 'react';
import { apiService } from '../services/api';
import { extractApiError } from '../types';

interface ReviewModalProps {
  reservaId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ reservaId, onClose, onSuccess }) => {
  const [calificacion, setCalificacion] = useState(5);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const enviarResena = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError('');
    try {
      await apiService.crearResena({
        reservaId,
        calificacion,
        comentario
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="modal-overlay d-flex align-items-center justify-content-center" style={{ position: 'fixed', inset: 0, zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white p-4 rounded-4 shadow-lg animate__animated animate__fadeIn" style={{ width: '450px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0">
            <i className="bi bi-star text-warning me-2"></i>Calificar Reserva
          </h5>
          <button className="btn-close" onClick={onClose}></button>
        </div>

        {error && <div className="alert alert-danger py-2 small">{error}</div>}

        <form onSubmit={enviarResena}>
          <div className="mb-4">
            <label className="form-label text-muted small d-block">Calificación General</label>
            <div className="d-flex gap-2 justify-content-center py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <i
                  key={star}
                  className={`bi ${star <= calificacion ? 'bi-star-fill text-warning' : 'bi-star text-muted'} fs-2`}
                  style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  onClick={() => setCalificacion(star)}
                />
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label text-muted small">Cuéntanos más (Opcional)</label>
            <textarea
              className="form-control bg-light border-0 text-dark p-3"
              rows={4}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Comparte tu experiencia..."
            />
          </div>

          <div className="d-flex gap-2">
            <button type="button" className="btn btn-outline-secondary w-50 py-2" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary-custom w-50 py-2 fw-semibold" disabled={enviando}>
              {enviando ? 'Enviando...' : 'Enviar Reseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
