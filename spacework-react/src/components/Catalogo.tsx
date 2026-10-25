import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { apiService } from '../services/api';
import EspacioDetalleModal from './EspacioDetalleModal';

const Catalogo: React.FC = () => {
  const navigate = useNavigate();


  const [todosLosEspacios, setTodosLosEspacios] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cargando, setCargando] = useState(false);

  // filters
  const [filtroFecha, setFiltroFecha] = useState<Date | null>(new Date());
  const [filtroPrecioMax, setFiltroPrecioMax] = useState(5000);
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState<string>('Lima');
  const [busquedaCiudad, setBusquedaCiudad] = useState('');
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  useEffect(() => {
    setBusquedaCiudad(ciudadSeleccionada);
  }, [ciudadSeleccionada]);

  const [ubicacionesSeleccionadas, setUbicacionesSeleccionadas] = useState<{ [id: number]: boolean }>({});
  const [tiposSeleccionados, setTiposSeleccionados] = useState<{ [id: number]: boolean }>({});

  // catalog data
  const [tipos, setTipos] = useState<any[]>([]);
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);

  const [todasLasReservas, setTodasLasReservas] = useState<any[]>([]);
  const [todasLasResenas, setTodasLasResenas] = useState<any[]>([]);

  // modal detalle
  const [espacioDetalle, setEspacioDetalle] = useState<any>(null);

  // modal mapa
  const [modalMapaOpen, setModalMapaOpen] = useState(false);
  const [sedeSeleccionada, setSedeSeleccionada] = useState<any>(null);

  const cargarEspacios = useCallback(async () => {
    setCargando(true);
    try {
      const response = await apiService.getEspacios();
      setTodosLosEspacios(Array.isArray(response.data) ? response.data : []);
      setCargando(false);
    } catch (err) {
      console.error(err);
      setCargando(false);
    }
  }, []);

  const cargarCatalogos = async () => {
    try {
      const [resTipos, resUbi] = await Promise.all([
        apiService.getTiposEspacio(),
        apiService.getUbicaciones()
      ]);
      setTipos(Array.isArray(resTipos.data) ? resTipos.data : []);
      setUbicaciones(Array.isArray(resUbi.data) ? resUbi.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const cargarReservas = async () => {
    try {
      const res = await apiService.getTodasReservas();
      setTodasLasReservas(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const cargarResenas = async () => {
    try {
      const res = await apiService.getResenasDashboard();
      setTodasLasResenas(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setIsAdmin(['ADMIN', 'ADMINISTRADOR', 'SUPERADMIN'].includes(user?.rol?.nombreRol));
    } else {
      setIsAdmin(false);
    }

    cargarEspacios();
    cargarCatalogos();
    cargarReservas();
    cargarResenas();
  }, [cargarEspacios]);

  const obtenerPrecioMock = (espacio: any): number => {
    if (espacio.tipoEspacio?.id === 1) return 15.00;
    if (espacio.tipoEspacio?.id === 2) return 35.00;
    return 60.00;
  };

  const limpiarFiltros = () => {
    setFiltroFecha(new Date());
    setFiltroPrecioMax(5000);
    setUbicacionesSeleccionadas({});
    setTiposSeleccionados({});
  };

  const ciudadesDisponibles = useMemo(() => {
    const ciudades = new Set(ubicaciones.map(u => u?.ciudad).filter(Boolean));
    if (ciudades.size === 0) return ['Lima'];
    return Array.from(ciudades);
  }, [ubicaciones]);

  const ubicacionesFiltradas = useMemo(() => {
    return ubicaciones.filter(u => u && (!u.ciudad || u.ciudad === ciudadSeleccionada));
  }, [ubicaciones, ciudadSeleccionada]);

  const esEspacioReservado = (espacioId: number): boolean => {
    if (!filtroFecha) return false;
    const fechaFiltroStr = filtroFecha.toISOString().split('T')[0];
    
    return (Array.isArray(todasLasReservas) ? todasLasReservas : []).some(r => {
      if (!r || !r.espacio) return false;
      if (r.espacio.id !== espacioId) return false;
      if (r.estadoReserva?.nombreEstado === 'CANCELADA') return false;
      
      const parseDate = (val: any) => {
        if (!val) return '';
        if (typeof val === 'string') return val.split('T')[0];
        if (Array.isArray(val) && val.length >= 3) {
           return `${val[0]}-${String(val[1]).padStart(2, '0')}-${String(val[2]).padStart(2, '0')}`;
        }
        return String(val);
      };

      const startDay = parseDate(r.fechaInicioReserva);
      const endDay = parseDate(r.fechaFinReserva);
      
      return fechaFiltroStr >= startDay && fechaFiltroStr <= endDay;
    });
  };

  const espacios = useMemo(() => {
    try {
      // aplicar filtros
      return todosLosEspacios.filter(espacio => {
        if (!espacio) return false;
        
        // 0. Filtro Ciudad
        if (espacio.ubicacion?.ciudad && espacio.ubicacion.ciudad !== ciudadSeleccionada) return false;

        // 1. Filtro Ubicacion
        const hasUbicacionFilter = Object.values(ubicacionesSeleccionadas).some(val => val);
        if (hasUbicacionFilter && !ubicacionesSeleccionadas[espacio.ubicacion?.id]) return false;

        // 2. Filtro Tipo
        const hasTipoFilter = Object.values(tiposSeleccionados).some(val => val);
        if (hasTipoFilter && !tiposSeleccionados[espacio.tipoEspacio?.id]) return false;

        // 3. Filtro Precio Máx
        const precio = espacio.precio || obtenerPrecioMock(espacio);
        if (precio > filtroPrecioMax) return false;

        // 4. Filtro Disponibilidad (Solo para usuarios normales)
        if (!isAdmin) {
          if (espacio.estadoEspacio !== 'DISPONIBLE') return false;
          if (esEspacioReservado(espacio.id)) return false;
        }

        return true;
      });
    } catch(e: any) {
      return [{
        id: -1,
        nombreEspacio: "ERROR_EN_FILTRO",
        descripcion: "Error al filtrar espacios. Contacte al administrador.",
        precio: 0,
        descuento: 0,
        estadoEspacio: 'DISPONIBLE',
        codigoEspacio: 'ERR-500',
        capacidad: 0,
        caracteristicas: [],
        ubicacion: { ciudad: ciudadSeleccionada, nombreUbicacion: 'Error' },
        tipoEspacio: { id: 1, nombreTipo: 'Error' }
      }];
    }
  }, [todosLosEspacios, ubicacionesSeleccionadas, tiposSeleccionados, filtroPrecioMax, isAdmin, filtroFecha, todasLasReservas, ciudadSeleccionada]);

  const handleUbicacionChange = (id: number, checked: boolean) => {
    setUbicacionesSeleccionadas(prev => ({ ...prev, [id]: checked }));
  };

  const handleTipoChange = (id: number, checked: boolean) => {
    setTiposSeleccionados(prev => ({ ...prev, [id]: checked }));
  };

  const obtenerImagenEspacio = (espacio: any): string => {
    if (espacio.fotoUrl) return espacio.fotoUrl;
    const tipoId = espacio.tipoEspacio?.id;
    if (tipoId === 1) return 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&q=80&w=400&h=250';
    if (tipoId === 2) return 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=400&h=250';
    return 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=400&h=250';
  };

  const obtenerPromedioEspacio = (espacioNombre: string) => {
    const resenasEspacio = todasLasResenas.filter(r => r && r.espacioNombre === espacioNombre);
    if (resenasEspacio.length === 0) return null;
    const sum = resenasEspacio.reduce((acc, r) => acc + (r.calificacion || 0), 0);
    return (sum / resenasEspacio.length).toFixed(1);
  };

  const obtenerIconoCaracteristica = (nombre: string): string => {
    if (!nombre) return 'bi-bookmark-check';
    const n = nombre.toLowerCase();
    if (n.includes('wi-fi') || n.includes('internet')) return 'bi-wifi';
    if (n.includes('aire') || n.includes('acondicionado') || n.includes('clima')) return 'bi-snow';
    if (n.includes('proyector') || n.includes('pantalla') || n.includes('tv')) return 'bi-pc-display';
    if (n.includes('café') || n.includes('cafe') || n.includes('bebida')) return 'bi-cup-hot';
    if (n.includes('impresora') || n.includes('impresión')) return 'bi-printer';
    if (n.includes('acceso')) return 'bi-door-open';
    return 'bi-bookmark-check';
  };

  const reservar = (espacioId: number) => {
    const userStr = sessionStorage.getItem('user');
    if (!userStr) {
      navigate('/login');
      return;
    }
    const fechaQuery = filtroFecha ? filtroFecha.toISOString().split('T')[0] : '';
    navigate(`/reserva/${espacioId}?fecha=${fechaQuery}`);
  };

  const abrirMapa = (ubicacion: any) => {
    setSedeSeleccionada(ubicacion);
    setModalMapaOpen(true);
  };

  try {
  return (
    <div className="container py-3 animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-dark fw-bold mb-0">Explorar Espacios</h2>
          <p className="text-muted small">{espacios.length} espacios disponibles en {ciudadSeleccionada}</p>
        </div>
        <div>
          {isAdmin && (
            <button className="btn btn-primary-custom rounded-pill px-4 shadow-sm hover-lift d-flex align-items-center gap-2" onClick={() => navigate('/espacios')}>
              <i className="bi bi-gear-fill"></i> Ir al Gestor de Espacios
            </button>
          )}
        </div>
      </div>

      <div className="row g-4">
        {/* Sidebar */}
        <div className="col-lg-3">
          <div className="card glass-panel p-4 sticky-lg-top" style={{ top: '90px', borderRadius: '16px' }}>
            <div className="mb-4">
              <h6 className="text-dark fw-bold mb-3">Ciudad</h6>
              <div className="position-relative">
                <div className="input-group input-group-sm shadow-sm rounded-pill overflow-hidden border">
                  <span className="input-group-text bg-transparent border-0 text-muted">
                    <i className="bi bi-search"></i>
                  </span>
                  <input 
                    type="text" 
                    className="form-control border-0 shadow-none bg-transparent text-dark" 
                    placeholder="Buscar ciudad..."
                    value={busquedaCiudad}
                    onChange={(e) => {
                      setBusquedaCiudad(e.target.value);
                      setMostrarSugerencias(true);
                    }}
                    onFocus={() => setMostrarSugerencias(true)}
                    onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)}
                  />
                </div>
                
                {mostrarSugerencias && (
                  <div className="position-absolute w-100 mt-2 shadow-lg border rounded-3 dropdown-menu show p-0 z-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {ciudadesDisponibles
                      .filter(c => String(c).toLowerCase().includes(busquedaCiudad.toLowerCase()))
                      .map(c => (
                      <div 
                        key={String(c)} 
                        className="dropdown-item p-2 px-3 border-bottom small d-flex align-items-center"
                        onClick={() => {
                          setCiudadSeleccionada(String(c));
                          setBusquedaCiudad(String(c));
                          setMostrarSugerencias(false);
                          setUbicacionesSeleccionadas({});
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <i className="bi bi-geo-alt me-2 text-primary-custom"></i>{String(c)}
                      </div>
                    ))}
                    {ciudadesDisponibles.filter(c => String(c).toLowerCase().includes(busquedaCiudad.toLowerCase())).length === 0 && (
                      <div className="p-3 small text-muted text-center">No se encontraron ciudades</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <hr className="text-muted opacity-25" />

            <div className="mb-4">
              <h6 className="text-dark fw-bold mb-3">Sede / Ubicación</h6>
              <div className="d-flex flex-wrap gap-2">
                {ubicacionesFiltradas.map(u => (
                  <button 
                    key={u.id}
                    className={`btn btn-sm rounded-pill btn-filter ${ubicacionesSeleccionadas[u.id] ? 'active' : ''}`}
                    onClick={() => handleUbicacionChange(u.id, !ubicacionesSeleccionadas[u.id])}
                    style={{ fontSize: '12px', fontWeight: '500' }}
                  >
                    {ubicacionesSeleccionadas[u.id] && <i className="bi bi-check2 me-1"></i>}
                    {u.nombreUbicacion}
                  </button>
                ))}
              </div>
            </div>

            <hr className="text-muted opacity-25" />

            <div className="mb-4">
              <h6 className="text-dark fw-bold mb-3">Fecha de Reserva</h6>
              <DatePicker
                selected={filtroFecha}
                onChange={(date: Date | null) => setFiltroFecha(date)}
                dateFormat="dd/MM/yyyy"
                className="form-control bg-light border-0 text-dark py-2 shadow-sm"
                placeholderText="Seleccione fecha"
                wrapperClassName="w-100"
              />
            </div>

            <hr className="text-muted opacity-25" />

            <div className="mb-4">
              <h6 className="text-dark fw-bold mb-3">Tipo de Espacio</h6>
              <div className="d-flex flex-wrap gap-2">
                {tipos.map(t => (
                  <button 
                    key={t.id}
                    className={`btn btn-sm rounded-pill btn-filter ${tiposSeleccionados[t.id] ? 'active' : ''}`}
                    onClick={() => handleTipoChange(t.id, !tiposSeleccionados[t.id])}
                    style={{ fontSize: '12px', fontWeight: '500' }}
                  >
                    {tiposSeleccionados[t.id] && <i className="bi bi-check2 me-1"></i>}
                    {t.nombreTipo}
                  </button>
                ))}
              </div>
            </div>

            <hr className="text-muted opacity-25" />

            <div className="mb-4">
              <h6 className="text-dark fw-bold mb-3">Rango de Precio</h6>
              <input type="range" className="form-range custom-range" min="0" max="5000" step="50" 
                value={filtroPrecioMax} onChange={(e) => setFiltroPrecioMax(Number(e.target.value))} />
              <div className="d-flex justify-content-between text-muted small mt-1" style={{ fontSize: '11px' }}>
                <span>S/ 0</span>
                <span className="fw-bold text-dark">S/ {filtroPrecioMax}</span>
              </div>
            </div>

            <button 
              className="btn btn-primary w-100 py-2 fw-bold shadow-sm rounded-3 mt-2 animate-fade-in"
              onClick={limpiarFiltros}
              style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', border: 'none' }}
            >
              <i className="bi bi-eraser-fill me-2"></i> Limpiar Filtros
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="col-lg-9">
          <div className="row g-4">
            {cargando ? (
              <div className="col-12 text-center py-5">
                <div className="spinner-border text-primary-custom" role="status"></div>
                <p className="text-muted small mt-2">Buscando espacios disponibles en Lima...</p>
              </div>
            ) : espacios.length === 0 ? (
              <div className="col-12 text-center py-5">
                <i className="bi bi-search text-muted display-4"></i>
                <h4 className="text-dark fw-semibold mt-3">No se encontraron espacios</h4>
                <p className="text-muted small">Intenta ajustar los filtros o el rango de precio.</p>
              </div>
            ) : (
              espacios.map(espacio => (
                <div key={espacio.id} className="col-md-6 col-xl-4">
                  <div className="card glass-card hover-lift h-100 overflow-hidden border-0 shadow-sm d-flex flex-column">
                    <div className="position-relative">
                      <img src={obtenerImagenEspacio(espacio)} className="card-img-top" style={{ height: '190px', objectFit: 'cover' }} alt="Imagen Espacio" />
                      <span className={`position-absolute top-0 end-0 m-3 badge rounded-pill px-3 py-2 text-uppercase ${espacio.estadoEspacio === 'DISPONIBLE' && !esEspacioReservado(espacio.id) ? 'bg-success-custom' : 'bg-muted-custom'}`}>
                        {espacio.estadoEspacio === 'DISPONIBLE' && !esEspacioReservado(espacio.id) ? 'Disponible' : 'Reservado'}
                      </span>
                    </div>

                    <div className="card-body p-4 d-flex flex-column flex-grow-1">
                      <div className="d-flex align-items-center mb-2">
                        <span className="badge bg-primary bg-opacity-10 text-primary align-self-start">{espacio.tipoEspacio?.nombreTipo || 'Espacio'}</span>
                        {espacio.descuento > 0 && (
                          <span className="badge bg-danger ms-2" style={{ fontWeight: 'bold' }}>{espacio.descuento}% OFF</span>
                        )}
                        {obtenerPromedioEspacio(espacio.nombreEspacio) && (
                          <span className="badge bg-warning text-dark ms-auto d-flex align-items-center gap-1">
                            <i className="bi bi-star-fill"></i> {obtenerPromedioEspacio(espacio.nombreEspacio)}
                          </span>
                        )}
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h4 className="card-title text-dark fw-bold mb-0 text-truncate" style={{ maxWidth: '65%', fontSize: '19px' }} title={espacio.nombreEspacio}>
                          {espacio.nombreEspacio}
                        </h4>
                        <div className="text-end" style={{ lineHeight: 1.1 }}>
                          {espacio.tipoEspacio?.id === 1 ? (
                            <>
                              {espacio.descuento > 0 ? (
                                <>
                                  <span className="text-muted text-decoration-line-through small me-2">S/ {espacio.precio || obtenerPrecioMock(espacio)}</span>
                                  <span className="text-primary-custom fw-bold fs-5">S/ {((espacio.precio || obtenerPrecioMock(espacio)) * (1 - espacio.descuento / 100)).toFixed(2)}</span>
                                </>
                              ) : (
                                <span className="text-primary-custom fw-bold fs-5">S/ {espacio.precio || obtenerPrecioMock(espacio)}</span>
                              )}
                              <span className="text-muted small ms-1" style={{ fontSize: '12px' }}>/ hora</span>
                              <i className="bi bi-info-circle ms-1 text-muted" style={{ cursor: 'help', fontSize: '12px' }} title="Política de Mediodía: Las reservas que crucen las 12:00 PM aplicarán tarifa de día completo."></i>
                            </>
                          ) : (
                            <>
                              {espacio.descuento > 0 ? (
                                <>
                                  <span className="text-muted text-decoration-line-through small d-block">S/ {espacio.precio || obtenerPrecioMock(espacio)}</span>
                                  <span className="text-primary-custom fw-bold fs-5">S/ {((espacio.precio || obtenerPrecioMock(espacio)) * (1 - espacio.descuento / 100)).toFixed(2)}</span>
                                </>
                              ) : (
                                <span className="text-primary-custom fw-bold fs-5">S/ {espacio.precio || obtenerPrecioMock(espacio)}</span>
                              )}
                              <span className="text-muted small d-block" style={{ fontSize: '10px' }}>/dia</span>
                            </>
                          )}
                        </div>
                      </div>

                      <p className="text-muted small mb-3">Código: {espacio.codigoEspacio}</p>
                      <p className="card-text text-muted small mb-3 flex-grow-1 line-clamp-3">{espacio.descripcion}</p>
                      
                      <div className="d-flex gap-3 text-muted small mb-3 border-top pt-2">
                        <span><i className="bi bi-people-fill me-1"></i> {espacio.capacidad} Personas</span>
                        {espacio.metrosCuadrados > 0 && (
                          <span><i className="bi bi-aspect-ratio me-1"></i> {espacio.metrosCuadrados} m²</span>
                        )}
                        <span 
                          className="location-link"
                          onClick={() => abrirMapa(espacio.ubicacion)}
                        >
                          <i className="bi bi-geo-alt-fill me-1 text-primary-custom"></i> {espacio.ubicacion?.nombreUbicacion || 'Ubicación'}
                        </span>
                      </div>

                      <div className="d-flex flex-wrap gap-2 mb-4">
                        {Array.isArray(espacio.caracteristicas) && espacio.caracteristicas.map((c: any) => c ? (
                          <span key={c.id || Math.random()} className="badge bg-light text-dark border d-flex align-items-center gap-1 py-1 px-2" style={{ fontSize: '11px', fontWeight: 'normal' }}>
                            <i className={`bi ${obtenerIconoCaracteristica(c.nombreCaracteristica)}`}></i> {c.nombreCaracteristica || ''}
                          </span>
                        ) : null)}
                      </div>

                      <div className="mt-auto d-flex align-items-center justify-content-between pt-3 border-top">
                        <div className="d-flex gap-2 w-100">
                          <button 
                            className="btn btn-outline-secondary py-2 px-3 fw-semibold flex-grow-1 border-2" 
                            onClick={() => setEspacioDetalle(espacio)}
                          >
                            Ver Detalle
                          </button>
                          <button 
                            className="btn btn-primary-custom w-100 py-2 flex-grow-1" 
                            onClick={() => reservar(espacio.id)}
                            disabled={espacio.estadoEspacio !== 'DISPONIBLE' || esEspacioReservado(espacio.id)}
                            style={{ opacity: (espacio.estadoEspacio !== 'DISPONIBLE' || esEspacioReservado(espacio.id)) ? 0.6 : 1 }}
                          >
                            {(espacio.estadoEspacio !== 'DISPONIBLE' || esEspacioReservado(espacio.id)) ? 'Ocupado' : 'Reservar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>



      {espacioDetalle && (
        <EspacioDetalleModal 
          espacio={espacioDetalle}
          resenas={todasLasResenas}
          onClose={() => setEspacioDetalle(null)}
          onReservar={(id) => reservar(id)}
          isAdmin={isAdmin}
          obtenerIconoCaracteristica={obtenerIconoCaracteristica}
        />
      )}

      {/* MODAL DEL MAPA */}
      {modalMapaOpen && sedeSeleccionada && (
        <div className="modal-overlay d-flex justify-content-center align-items-center animate-fade-in" style={{ zIndex: 1050 }}>
          <div className="modal-dialog-centered w-100" style={{ maxWidth: '600px' }}>
            <div className="card border-0 rounded-4 shadow-lg overflow-hidden glass-panel">
              <div className="card-header bg-white border-bottom-0 py-3 px-4 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold d-flex align-items-center">
                  <i className="bi bi-geo-alt-fill text-danger me-2"></i>
                  Ubicación: {sedeSeleccionada.nombreUbicacion}
                </h5>
                <button type="button" className="btn-close" onClick={() => setModalMapaOpen(false)}></button>
              </div>
              <div className="card-body p-0">
                {sedeSeleccionada.urlGoogleMaps && sedeSeleccionada.urlGoogleMaps.includes('<iframe') ? (
                  (() => {
                    const sanitizarIframeUrl = (url: string): string | null => {
                      if (!url) return null;
                      const match = url.match(/src="([^"]+)"/);
                      if (!match) return null;
                      const src = match[1];
                      if (src.startsWith('https://maps.google.com') || src.startsWith('https://www.google.com/maps')) {
                        return src;
                      }
                      return null;
                    };
                    const safeSrc = sanitizarIframeUrl(sedeSeleccionada.urlGoogleMaps);
                    return safeSrc ? (
                      <div className="w-100" style={{ height: '350px' }}>
                        <iframe
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          style={{ border: 0 }}
                          src={safeSrc}
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <p className="text-muted p-3 text-center">Mapa no disponible (URL inválida)</p>
                    );
                  })()
                ) : (
                  <div className="w-100 position-relative" style={{ height: '350px' }}>
                    <iframe 
                      width="100%" 
                      height="100%" 
                      frameBorder="0" 
                      style={{ border: 0 }}
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent((sedeSeleccionada.latitud && sedeSeleccionada.longitud) ? `${sedeSeleccionada.latitud},${sedeSeleccionada.longitud}` : [sedeSeleccionada.direccion, sedeSeleccionada.ciudad, sedeSeleccionada.pais].filter(Boolean).join(', '))}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      allowFullScreen
                    ></iframe>
                    
                    {sedeSeleccionada.urlGoogleMaps && (
                      <div className="position-absolute bottom-0 end-0 m-3">
                        <a href={sedeSeleccionada.urlGoogleMaps} target="_blank" rel="noopener noreferrer" className="btn btn-primary-custom btn-sm rounded-pill shadow">
                          Abrir App <i className="bi bi-box-arrow-up-right ms-1"></i>
                        </a>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="p-4 bg-white border-top">
                  <div className="d-flex align-items-start gap-3">
                    <i className="bi bi-building fs-4 text-muted"></i>
                    <div>
                      <p className="mb-1 fw-bold text-dark">{sedeSeleccionada.direccion || 'Dirección no especificada'}</p>
                      <p className="mb-0 text-muted small">{sedeSeleccionada.ciudad}, {sedeSeleccionada.pais}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .bg-success-custom {
          background-color: rgba(16, 185, 129, 0.9) !important;
          color: white;
          font-weight: 600;
        }
        .bg-muted-custom {
          background-color: rgba(100, 116, 139, 0.9) !important;
          color: white;
          font-weight: 600;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;  
          overflow: hidden;
        }
        .custom-range::-webkit-slider-thumb {
          background: #0ea5e9 !important;
        }
        .custom-range::-moz-range-thumb {
          background: #0ea5e9 !important;
        }
        .location-link {
          cursor: pointer;
          transition: all 0.2s ease;
          border-radius: 4px;
          padding: 2px 6px;
          margin-left: -6px;
        }
        .location-link:hover {
          background-color: rgba(14, 165, 233, 0.1);
          color: #0284c7 !important;
          transform: translateY(-1px);
        }
        .location-link i {
          transition: transform 0.2s ease;
        }
        .location-link:hover i {
          transform: scale(1.2);
        }
      `}</style>
    </div>
  );
  } catch (error: any) {
    return (
      <div className="container py-5 text-center mt-5">
        <h2 className="text-danger">Error Inesperado en Catálogo</h2>
        <p className="lead">Ocurrió un error al cargar la vista:</p>
        <pre className="text-start bg-light p-4 rounded text-danger border mt-4" style={{ whiteSpace: 'pre-wrap' }}>
          Ha ocurrido un error inesperado. Contacte al administrador.
        </pre>
      </div>
    );
  }
};

export default Catalogo;
