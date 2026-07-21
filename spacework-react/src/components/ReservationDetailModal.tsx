import React from 'react';

interface Props {
  reserva: any;
  onClose: () => void;
}

const obtenerImagenEspacio = (espacio: any): string => {
  if (espacio?.fotoUrl) return espacio.fotoUrl;
  if (espacio?.fotos?.length > 0) return espacio.fotos[0].urlFoto;
  return 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=150&h=100';
};

const formatearFechaHora = (fecha: string): string => {
  return new Date(fecha).toLocaleString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const ReservationDetailModal: React.FC<Props> = ({ reserva, onClose }) => {
  return (
    <div className="modal-overlay d-flex align-items-center justify-content-center" style={{ position: 'fixed', inset: 0, zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white p-4 rounded-4 shadow-lg" style={{ width: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0"><i className="bi bi-info-circle text-primary me-2"></i>Detalles</h5>
          <button className="btn-close" onClick={onClose}></button>
        </div>

        <div className="text-center mb-3">
          <p className="text-muted small mb-0">Código: <strong>{reserva.codigoReserva || reserva.id}</strong></p>
        </div>

        <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-3 mb-3">
          <img src={obtenerImagenEspacio(reserva.espacio)} alt="" style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />
          <div>
            <h6 className="fw-bold mb-0">{reserva.espacio?.nombreEspacio}</h6>
            <small className="text-muted"><i className="bi bi-geo-alt me-1"></i>{reserva.espacio?.ubicacion?.nombreUbicacion}</small>
          </div>
        </div>

        <div className="row g-2 mb-3">
          <div className="col-6">
            <small className="text-muted d-block">Check-in</small>
            <strong className="small">{formatearFechaHora(reserva.fechaInicioReserva)}</strong>
          </div>
          <div className="col-6">
            <small className="text-muted d-block">Check-out</small>
            <strong className="small">{formatearFechaHora(reserva.fechaFinReserva)}</strong>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center py-2 border-top">
          <span className="text-muted small">Estado:</span>
          <span className={`badge rounded-pill px-3 py-1 fw-medium ${
            reserva.estadoReserva?.nombreEstado === 'CONFIRMADA' ? 'bg-success bg-opacity-10 text-success' :
            reserva.estadoReserva?.nombreEstado === 'PENDIENTE' ? 'bg-warning bg-opacity-10 text-warning' :
            reserva.estadoReserva?.nombreEstado?.startsWith('CANCELADA') ? 'bg-danger bg-opacity-10 text-danger' :
            'bg-info bg-opacity-10 text-info'
          }`}>{reserva.estadoReserva?.nombreEstado}</span>
        </div>
        <div className="d-flex justify-content-between align-items-center py-2">
          <span className="text-muted small">Total:</span>
          <strong>S/. {Number(reserva.montoTotal).toFixed(2)}</strong>
        </div>

        {reserva.reservaServicios?.length > 0 && (
          <div className="border-top pt-2 mt-1">
            <small className="text-muted fw-semibold">Servicios adicionales:</small>
            {reserva.reservaServicios.map((rs: any, i: number) => (
              <div key={i} className="d-flex justify-content-between small py-1">
                <span>{rs.servicioAdicional?.nombre} x{rs.cantidad}</span>
                <span>S/. {Number(rs.subtotal).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        <button className="btn btn-primary w-100 mt-3 py-2 fw-semibold rounded-pill" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
};

export default ReservationDetailModal;
