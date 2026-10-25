import React, { useState } from 'react';

interface EspacioDetalleModalProps {
  espacio: any;
  resenas: any[];
  onClose: () => void;
  onReservar: (espacioId: number) => void;
  isAdmin: boolean;
  obtenerIconoCaracteristica: (nombre: string) => string;
}

const EspacioDetalleModal: React.FC<EspacioDetalleModalProps> = ({ 
  espacio, 
  resenas, 
  onClose, 
  onReservar,
  isAdmin,
  obtenerIconoCaracteristica 
}) => {
  const [fotoActivaIndex, setFotoActivaIndex] = useState(0);

  const fotos = espacio.fotos && espacio.fotos.length > 0 
    ? espacio.fotos 
    : [{ urlFoto: espacio.fotoUrl || 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=800&h=500' }];

  const resenasEspacio = resenas.filter(r => r.espacioNombre === espacio.nombreEspacio);
  const ultimasResenas = resenasEspacio.slice(0, 3);
  const promedio = resenasEspacio.length > 0 
    ? (resenasEspacio.reduce((acc, r) => acc + r.calificacion, 0) / resenasEspacio.length).toFixed(1)
    : null;

  return (
    <div className="modal-overlay d-flex justify-content-center align-items-center animate-fade-in" style={{ zIndex: 1050 }}>
      <div className="glass-panel w-100 max-h-90 overflow-hidden d-flex flex-column position-relative" style={{ maxWidth: '900px', borderRadius: '20px' }}>
        <button 
          className="btn-close-custom position-absolute top-0 end-0 m-4 z-3 bg-white rounded-circle shadow-sm d-flex justify-content-center align-items-center" 
          onClick={onClose}
          style={{ width: '36px', height: '36px', border: 'none' }}
        >
          <i className="bi bi-x-lg text-dark"></i>
        </button>

        <div className="row g-0 flex-grow-1 overflow-auto">
          {/* Columna Izquierda: Carrusel de Fotos */}
          <div className="col-md-6 bg-dark position-relative">
            <img 
              src={fotos[fotoActivaIndex].urlFoto} 
              alt="Espacio" 
              className="w-100 h-100 object-fit-cover animate-fade-in"
              style={{ minHeight: '400px' }}
            />
            
            {/* Controles del Carrusel */}
            {fotos.length > 1 && (
              <>
                <button 
                  className="position-absolute top-50 start-0 translate-middle-y btn btn-light rounded-circle ms-3 opacity-75"
                  onClick={() => setFotoActivaIndex(prev => prev === 0 ? fotos.length - 1 : prev - 1)}
                  style={{ width: '40px', height: '40px' }}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
                <button 
                  className="position-absolute top-50 end-0 translate-middle-y btn btn-light rounded-circle me-3 opacity-75"
                  onClick={() => setFotoActivaIndex(prev => prev === fotos.length - 1 ? 0 : prev + 1)}
                  style={{ width: '40px', height: '40px' }}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
                <div className="position-absolute bottom-0 start-50 translate-middle-x mb-3 d-flex gap-2">
                  {fotos.map((_: any, idx: number) => (
                    <div 
                      key={idx} 
                      className={`rounded-circle bg-white ${idx === fotoActivaIndex ? 'opacity-100' : 'opacity-50'}`}
                      style={{ width: '10px', height: '10px', transition: 'all 0.3s', cursor: 'pointer' }}
                      onClick={() => setFotoActivaIndex(idx)}
                    ></div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Columna Derecha: Información */}
          <div className="col-md-6 p-4 p-md-5 d-flex flex-column bg-white">
            <div className="mb-2 d-flex justify-content-between align-items-start">
              <span className="badge bg-primary bg-opacity-10 text-primary">{espacio.tipoEspacio?.nombreTipo}</span>
              {promedio && (
                <span className="badge bg-warning text-dark d-flex align-items-center gap-1 fs-6">
                  <i className="bi bi-star-fill"></i> {promedio}
                </span>
              )}
            </div>
            
            <h2 className="fw-bold text-dark mb-1">{espacio.nombreEspacio}</h2>
            <p className="text-muted small mb-4">
              <i className="bi bi-geo-alt-fill text-danger me-1"></i> {espacio.ubicacion?.nombreUbicacion}
            </p>

            <div className="d-flex gap-4 mb-4 pb-4 border-bottom">
              <div>
                <span className="d-block text-muted small">Capacidad</span>
                <div className="d-flex flex-column">
                  <strong className="text-dark"><i className="bi bi-people-fill me-1"></i> {espacio.capacidad} máx.</strong>
                  {espacio.capacidadEquipos && espacio.capacidadEquipos < espacio.capacidad && (
                    <span className="text-muted small mt-1">
                      <i className="bi bi-person-check-fill me-1 text-warning"></i> 
                      Equipado para {espacio.capacidadEquipos} pers.
                    </span>
                  )}
                  {espacio.precioPersonaExtra > 0 && (
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                      (Extra: S/. {espacio.precioPersonaExtra} c/u)
                    </span>
                  )}
                </div>
              </div>
              <div>
                <span className="d-block text-muted small">Horario</span>
                <strong className="text-dark"><i className="bi bi-clock-fill me-1"></i> {espacio.horaApertura?.slice(0,5) || '08:00'} - {espacio.horaCierre?.slice(0,5) || '20:00'}</strong>
              </div>
            </div>

            <h6 className="fw-bold text-dark mb-2">Acerca de este espacio</h6>
            <p className="text-muted small mb-4" style={{ lineHeight: '1.6' }}>
              {espacio.descripcion}
            </p>

            <h6 className="fw-bold text-dark mb-3">Características incluidas</h6>
            <div className="d-flex flex-wrap gap-2 mb-4 pb-4 border-bottom">
              {espacio.caracteristicas?.map((c: any) => (
                <span key={c.id} className="badge bg-light text-dark border d-flex align-items-center gap-1 py-2 px-3" style={{ fontWeight: 'normal' }}>
                  <i className={`bi ${obtenerIconoCaracteristica(c.nombreCaracteristica)} fs-6 text-primary`}></i> {c.nombreCaracteristica}
                </span>
              ))}
            </div>

            {ultimasResenas.length > 0 && (
              <div className="mb-4">
                <h6 className="fw-bold text-dark mb-3">Últimas Reseñas</h6>
                <div className="d-flex flex-column gap-3">
                  {ultimasResenas.map(r => (
                    <div key={r.id} className="bg-light p-3 rounded-3">
                      <div className="d-flex justify-content-between mb-1">
                        <strong className="small text-dark">{r.clienteNombre}</strong>
                        <span className="text-warning small"><i className="bi bi-star-fill"></i> {r.calificacion}.0</span>
                      </div>
                      <p className="small text-muted mb-0 fst-italic">"{r.comentario}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-auto pt-4 d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted text-decoration-line-through small d-block">
                  {espacio.descuento > 0 ? `S/ ${espacio.precio || 0}` : ''}
                </span>
                <span className="text-primary fw-bold fs-3">
                  S/ {espacio.descuento > 0 ? ((espacio.precio || 0) * (1 - espacio.descuento / 100)).toFixed(2) : (espacio.precio || 0)}
                </span>
                <span className="text-muted small"> /dia</span>
              </div>
              {!isAdmin && (
                <button 
                  className="btn btn-primary-custom px-4 py-2 fw-semibold shadow-sm"
                  onClick={() => onReservar(espacio.id)}
                >
                  Reservar Ahora
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EspacioDetalleModal;
