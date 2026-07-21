import React from 'react';

interface ServiceDetail {
  id: number;
  nombre: string;
  descripcion: string;
  precioBase: number;
  imagenUrl?: string;
  caracteristicasDetalle?: string;
  advertenciasDevolucion?: string;
}

interface Props {
  servicio: ServiceDetail;
  onClose: () => void;
}

const ServiceDetailModal: React.FC<Props> = ({ servicio, onClose }) => {
  const resolveImageUrl = (url: string): string => {
    const driveMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return driveMatch ? `https://lh3.googleusercontent.com/d/${driveMatch[1]}` : url;
  };

  return (
    <div className="modal-overlay d-flex align-items-center justify-content-center" style={{ position: 'fixed', inset: 0, zIndex: 1100, backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-4 shadow-lg overflow-hidden" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', position: 'relative' }}>
        <button
          className="btn-close position-absolute bg-white shadow-sm rounded-circle p-2"
          style={{ top: '10px', right: '10px', zIndex: 10, width: '36px', height: '36px' }}
          onClick={onClose}
        />

        {servicio.imagenUrl ? (
          <div style={{ height: '200px', backgroundColor: '#f8f9fa', backgroundImage: `url(${resolveImageUrl(servicio.imagenUrl)})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        ) : (
          <div className="d-flex align-items-center justify-content-center bg-light" style={{ height: '120px' }}>
            <i className="bi bi-box-seam text-secondary" style={{ fontSize: '3rem', opacity: 0.5 }}></i>
          </div>
        )}

        <div className="p-4">
          <span className="badge bg-primary bg-opacity-10 text-primary mb-2 px-3 py-2 rounded-pill">
            S/. {servicio.precioBase.toFixed(2)} c/u
          </span>
          <h4 className="fw-bold text-dark mb-2">{servicio.nombre}</h4>
          <p className="text-muted small mb-4">{servicio.descripcion}</p>

          {servicio.caracteristicasDetalle && (
            <div className="mb-4">
              <h6 className="fw-bold text-dark"><i className="bi bi-list-check text-success me-2"></i>Características</h6>
              <div className="bg-light p-3 rounded-3 small text-muted" style={{ whiteSpace: 'pre-line' }}>
                {servicio.caracteristicasDetalle}
              </div>
            </div>
          )}

          {servicio.advertenciasDevolucion && (
            <div className="mb-2">
              <h6 className="fw-bold text-danger"><i className="bi bi-exclamation-triangle-fill me-2"></i>Advertencias</h6>
              <div className="bg-danger bg-opacity-10 text-danger p-3 rounded-3 small border border-danger border-opacity-25" style={{ whiteSpace: 'pre-line' }}>
                {servicio.advertenciasDevolucion}
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-top bg-light d-flex justify-content-end" style={{ borderRadius: '0 0 1rem 1rem' }}>
          <button className="btn btn-primary px-4 rounded-pill" onClick={onClose}>Entendido</button>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailModal;
