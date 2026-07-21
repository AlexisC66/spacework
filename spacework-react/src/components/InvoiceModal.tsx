import React from 'react';

interface Props {
  reserva: any;
  onClose: () => void;
  descargarBoletaBase: () => void;
  descargarBoletaExtra: (rs: any, idx: number) => void;
}

const InvoiceModal: React.FC<Props> = ({ reserva, onClose, descargarBoletaBase, descargarBoletaExtra }) => {
  return (
    <div className="modal-overlay d-flex align-items-center justify-content-center" style={{ position: 'fixed', inset: 0, zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white p-4 rounded-4 shadow-lg" style={{ width: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0"><i className="bi bi-receipt me-2"></i>Comprobantes</h5>
          <button className="btn-close" onClick={onClose}></button>
        </div>
        <p className="text-muted small mb-3">Descarga el comprobante principal o los recibos de servicios adicionales.</p>

        <div className="d-flex flex-column gap-2 mb-3">
          <div className="d-flex justify-content-between align-items-center p-3 border rounded-3">
            <div>
              <strong className="d-block small">Comprobante de Alquiler</strong>
              <small className="text-muted">{reserva.espacio?.nombreEspacio}</small>
            </div>
            <button className="btn btn-primary btn-sm px-3" onClick={descargarBoletaBase}>
              <i className="bi bi-download"></i>
            </button>
          </div>

          {reserva.reservaServicios?.map((rs: any, idx: number) => (
            <div key={idx} className="d-flex justify-content-between align-items-center p-3 border rounded-3">
              <div>
                <strong className="d-block small">Servicio Extra</strong>
                <small className="text-muted">{rs.servicioAdicional?.nombre} (x{rs.cantidad})</small>
              </div>
              <button className="btn btn-outline-primary btn-sm px-3" onClick={() => descargarBoletaExtra(rs, idx)}>
                <i className="bi bi-download"></i>
              </button>
            </div>
          ))}
        </div>

        <button className="btn btn-light w-100 py-2 fw-semibold border" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
};

export default InvoiceModal;
