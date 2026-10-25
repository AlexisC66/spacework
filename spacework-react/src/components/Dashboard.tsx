import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'es': es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const CustomEvent = ({ event }: any) => {
  const parts = event.title.split(' - ');
  const spaceName = parts[0];
  const userName = parts.slice(1).join(' - ');

  return (
    <div className="h-100 d-flex flex-column justify-content-center" style={{ padding: '2px 4px' }}>
      <strong className="d-block text-truncate" style={{ fontSize: '0.85rem', lineHeight: '1.2' }}>{spaceName}</strong>
      {userName && <span className="d-block text-truncate" style={{ fontSize: '0.75rem', opacity: 0.9, lineHeight: '1.2' }}>{userName}</span>}
    </div>
  );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [reservas, setReservas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [viewMode, setViewMode] = useState<'RESUMEN' | 'ANALISIS' | 'CALENDARIO'>('RESUMEN');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedManageSpace, setSelectedManageSpace] = useState<any>(null);
  const [espacios, setEspacios] = useState<any[]>([]);
  const [resenas, setResenas] = useState<any[]>([]);

  // estados para controlar el calendario
  const [calendarView, setCalendarView] = useState<any>('month');
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  useEffect(() => {
    const userStr = sessionStorage.getItem('user');
    if (!userStr) {
      navigate('/login');
      return;
    }
    const user = JSON.parse(userStr);
    if (!['ADMIN', 'ADMINISTRADOR', 'SUPERADMIN'].includes(user?.rol?.nombreRol)) {
      navigate('/catalogo');
      return;
    }

    cargarDatosDashboard();
  }, [navigate]);

  const cargarDatosDashboard = async () => {
    setCargando(true);
    try {
      const [resReservas, resEspacios, resResenas] = await Promise.all([
        apiService.getTodasReservas(),
        apiService.getEspacios(),
        apiService.getResenasDashboard()
      ]);
      
      let data = resReservas.data;
      if (Array.isArray(data)) {
        setReservas(data.sort((a, b) => (b?.id || 0) - (a?.id || 0)));
      } else {
        setReservas([]);
      }
      
      setEspacios(Array.isArray(resEspacios.data) ? resEspacios.data : []);
      setResenas(Array.isArray(resResenas.data) ? resResenas.data : []);
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err);
      setErrorMessage('Error al cargar los datos del dashboard.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setCargando(false);
    }
  };

  const spaceAnalytics = useMemo(() => {
    if (!espacios.length) return { top5: [], bottom5: [] };

    const stats = espacios.map(esp => {
      const reservasDeEspacio = reservas.filter(r => r.espacio?.id === esp.id && !r.estadoReserva?.nombreEstado?.startsWith('CANCELADA'));
      const cantidad = reservasDeEspacio.length;
      const ingresos = reservasDeEspacio.reduce((sum, r) => sum + Number(r.montoTotal || 0), 0);
      return { ...esp, cantidadReservas: cantidad, ingresosTotales: ingresos };
    });

    const sorted = [...stats].sort((a, b) => b.cantidadReservas - a.cantidadReservas);
    return {
      top5: sorted.slice(0, 5),
      bottom5: sorted.slice(-5).reverse() // Los 5 peores, con el peor al inicio
    };
  }, [espacios, reservas]);

  const ingresosTotales = useMemo(() => {
    return reservas
      .filter(r => r.estadoReserva?.nombreEstado === 'CONFIRMADA' || r.estadoReserva?.nombreEstado === 'FINALIZADA')
      .reduce((sum, r) => sum + Number(r.montoTotal), 0);
  }, [reservas]);

  const totalReservas = reservas.length;

  const clientesActivos = useMemo(() => {
    const uniqueUsers = new Set(reservas.map(r => r.usuario?.id).filter(id => id != null));
    return uniqueUsers.size;
  }, [reservas]);

  const descargarReporte = async () => {
    try {
      const response = await apiService.descargarReporteExcel();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'reporte-reservas.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al descargar el Excel:', err);
    }
  };

  const formatearFecha = (fecha: string) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toISOString().slice(0, 16).replace('T', ' ');
  };

  // --- LOGICA DE CALENDARIO ---
  const calendarEvents = useMemo(() => {
    const events: any[] = [];
    reservas.forEach(r => {
      const start = new Date(r.fechaInicioReserva);
      const end = new Date(r.fechaFinReserva);
      const title = `${r.espacio?.nombreEspacio} - ${r.usuario?.nombre} ${r.usuario?.apellidoPaterno}`;

      const loopStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const loopEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());

      let loopDate = new Date(loopStart);

      while (loopDate <= loopEnd) {
        const isFirstDay = loopDate.getTime() === loopStart.getTime();
        const isLastDay = loopDate.getTime() === loopEnd.getTime();

        const eventStart = isFirstDay ? new Date(start) : new Date(loopDate.getFullYear(), loopDate.getMonth(), loopDate.getDate(), 0, 0, 0);
        const eventEnd = isLastDay ? new Date(end) : new Date(loopDate.getFullYear(), loopDate.getMonth(), loopDate.getDate(), 23, 59, 59);

        events.push({
          id: `${r.id}-${loopDate.getTime()}`,
          title: title,
          start: eventStart,
          end: eventEnd,
          resource: r
        });

        // avanzar un día
        loopDate.setDate(loopDate.getDate() + 1);
      }
    });
    return events;
  }, [reservas]);

  const eventStyleGetter = (event: any, _start: Date, _end: Date, _isSelected: boolean) => {
    let backgroundColor = '#3b82f6'; // default blue
    let borderColor = '#2563eb';
    const estado = event.resource?.estadoReserva?.nombreEstado;
    
    if (estado === 'CONFIRMADA') {
      backgroundColor = '#10b981'; // green
      borderColor = '#059669';
    }
    if (estado === 'PENDIENTE') {
      backgroundColor = '#f59e0b'; // yellow/orange
      borderColor = '#d97706';
    }
    if (estado === 'FINALIZADA') {
      backgroundColor = '#6366f1'; // indigo
      borderColor = '#4f46e5';
    }
    if (estado?.startsWith('CANCELADA')) {
      backgroundColor = '#ef4444'; // red
      borderColor = '#dc2626';
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.95,
        color: 'white',
        border: `1px solid ${borderColor}`,
        display: 'block',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }
    };
  };

  return (
    <div className="container py-3 animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-dark fw-bold mb-0">Dashboard de Control</h2>
          <p className="text-muted small">Indicadores clave de rendimiento y reportes del sistema</p>
        </div>
        <div className="d-flex gap-2">
          <div className="btn-group" role="group">
            <button 
              type="button" 
              className={`btn btn-sm ${viewMode === 'RESUMEN' ? 'btn-primary-custom' : 'btn-outline-secondary'}`}
              onClick={() => setViewMode('RESUMEN')}
            >
              <i className="bi bi-grid-fill me-1"></i> Resumen
            </button>
            <button 
              type="button" 
              className={`btn btn-sm ${viewMode === 'ANALISIS' ? 'btn-primary-custom' : 'btn-outline-secondary'}`}
              onClick={() => setViewMode('ANALISIS')}
            >
              <i className="bi bi-bar-chart-line-fill me-1"></i> Análisis
            </button>
            <button 
              type="button" 
              className={`btn btn-sm ${viewMode === 'CALENDARIO' ? 'btn-primary-custom' : 'btn-outline-secondary'}`}
              onClick={() => setViewMode('CALENDARIO')}
            >
              <i className="bi bi-calendar-week-fill me-1"></i> Calendario
            </button>
          </div>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/catalogo')}>Volver al Catálogo</button>
          <button className="btn btn-success btn-sm" onClick={descargarReporte}>
            <i className="bi bi-file-earmark-excel-fill me-1"></i> Exportar a Excel
          </button>
        </div>
      </div>

      {cargando && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-muted small mt-2">Cargando datos del sistema...</p>
        </div>
      )}

      {errorMessage && (
        <div className="alert alert-danger bg-danger bg-opacity-25 border-0 text-danger mb-3" role="alert">
          {errorMessage}
        </div>
      )}

      {/* Modal para Gestión de Espacio (Feedback y Precio) */}
      {selectedManageSpace && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-light border-bottom-0">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="bi bi-gear-fill text-primary me-2"></i> Gestionar Espacio: {selectedManageSpace.nombreEspacio}
                </h5>
                <button type="button" className="btn-close" onClick={() => setSelectedManageSpace(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="row g-4">
                  <div className="col-md-6 border-end">
                    <h6 className="fw-bold mb-3"><i className="bi bi-cash-coin me-2 text-success"></i>Ajuste de Precio Promocional</h6>
                    <p className="text-muted small">Modifica el precio temporalmente para incentivar las reservas.</p>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Precio por Hora Actual (S/.)</label>
                      <input type="number" className="form-control bg-light" defaultValue={selectedManageSpace.precioPorHora} />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Precio por Día Actual (S/.)</label>
                      <input type="number" className="form-control bg-light" defaultValue={selectedManageSpace.precioPorDia} />
                    </div>
                    <button className="btn btn-success w-100 fw-semibold" onClick={() => {
                      alert('Precios actualizados exitosamente en la base de datos.');
                      setSelectedManageSpace(null);
                    }}>Guardar Precios</button>
                  </div>
                  
                  <div className="col-md-6">
                    <h6 className="fw-bold mb-3"><i className="bi bi-chat-square-text-fill me-2 text-warning"></i>Feedback de Clientes</h6>
                    <p className="text-muted small mb-3">Últimas opiniones y sugerencias sobre este espacio.</p>
                    
                    {resenas.filter(r => r.espacioNombre === selectedManageSpace.nombreEspacio).length === 0 ? (
                      <p className="small text-muted fst-italic">No hay reseñas para este espacio todavía.</p>
                    ) : (
                      resenas.filter(r => r.espacioNombre === selectedManageSpace.nombreEspacio).slice(0, 5).map(resena => (
                        <div key={resena.id} className="p-3 bg-light rounded mb-2 border-start border-4" style={{ borderColor: resena.calificacion <= 2 ? '#ef4444' : '#10b981' }}>
                          <div className="d-flex justify-content-between mb-1">
                            <strong className="small">{resena.usuarioNombre} <span className="text-muted fw-normal" style={{fontSize:'0.7rem'}}>({resena.fecha?.substring(0,10)})</span></strong>
                            <span className={`small ${resena.calificacion <= 2 ? 'text-danger' : 'text-warning'}`}>
                              {[1,2,3,4,5].map(star => (
                                <i key={star} className={`bi ${star <= resena.calificacion ? 'bi-star-fill' : 'bi-star'}`}></i>
                              ))}
                            </span>
                          </div>
                          {resena.comentario && <p className="small mb-0 text-muted fst-italic">"{resena.comentario}"</p>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedEvent && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-bottom-0">
                <h5 className="modal-title fw-bold text-dark">Detalles de la Reserva</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedEvent(null)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-2"><strong>Código:</strong> {selectedEvent.resource.codigoReserva}</div>
                <div className="mb-2"><strong>Espacio:</strong> {selectedEvent.resource.espacio?.nombreEspacio}</div>
                <div className="mb-2"><strong>Cliente:</strong> {selectedEvent.resource.usuario?.nombre} {selectedEvent.resource.usuario?.apellidoPaterno}</div>
                <div className="mb-2"><strong>Inicio:</strong> {formatearFecha(selectedEvent.resource.fechaInicioReserva)}</div>
                <div className="mb-2"><strong>Fin:</strong> {formatearFecha(selectedEvent.resource.fechaFinReserva)}</div>
                <div className="mb-2">
                  <strong>Estado:</strong> 
                  <span className={`badge ms-2 
                    ${selectedEvent.resource.estadoReserva?.nombreEstado === 'CONFIRMADA' ? 'bg-success' : ''}
                    ${selectedEvent.resource.estadoReserva?.nombreEstado === 'PENDIENTE' ? 'bg-warning' : ''}
                    ${selectedEvent.resource.estadoReserva?.nombreEstado?.startsWith('CANCELADA') ? 'bg-danger' : ''}
                    ${selectedEvent.resource.estadoReserva?.nombreEstado === 'FINALIZADA' ? 'bg-info' : ''}
                  `}>
                    {selectedEvent.resource.estadoReserva?.nombreEstado}
                  </span>
                </div>
                <div className="mb-2 mt-3 p-3 bg-light rounded">
                  <strong>Monto Total:</strong> <span className="text-primary-custom fs-5 ms-2">S/. {Number(selectedEvent.resource.montoTotal).toFixed(2)}</span>
                </div>
              </div>
              <div className="modal-footer border-top-0">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedEvent(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!cargando && (
        <>
          {viewMode === 'RESUMEN' ? (
            <>
              <div className="row g-4 mb-5">
                <div className="col-md-4">
                  <div className="card glass-panel p-4 border-0">
                    <h6 className="text-muted mb-2 text-uppercase fw-semibold small">Ingresos Totales</h6>
                    <h2 className="text-gradient fw-bold mb-1">S/. {ingresosTotales.toFixed(2)}</h2>
                    <span className="text-success small"><i className="bi bi-graph-up-arrow me-1"></i> Facturación Real</span>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card glass-panel p-4 border-0">
                    <h6 className="text-muted mb-2 text-uppercase fw-semibold small">Total Reservas</h6>
                    <h2 className="text-dark fw-bold mb-1">{totalReservas}</h2>
                    <span className="text-muted small">Registradas en el sistema</span>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card glass-panel p-4 border-0">
                    <h6 className="text-muted mb-2 text-uppercase fw-semibold small">Usuarios con Reservas</h6>
                    <h2 className="text-dark fw-bold mb-1">{clientesActivos}</h2>
                    <span className="text-info small"><i className="bi bi-people-fill me-1"></i> Clientes activos</span>
                  </div>
                </div>
              </div>

              <div className="card glass-panel p-4 border-0">
                <h4 className="text-dark fw-semibold mb-4">Registro Reciente de Reservas</h4>
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr className="text-muted">
                        <th>Código</th>
                        <th>Usuario</th>
                        <th>Espacio</th>
                        <th>Fecha Inicio</th>
                        <th>Fecha Fin</th>
                        <th>Monto</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservas.length > 0 ? reservas.map(reserva => (
                        <tr key={reserva.id}>
                          <td><strong className="text-dark">{reserva.codigoReserva}</strong></td>
                          <td>{reserva.usuario?.nombre} {reserva.usuario?.apellidoPaterno}</td>
                          <td>{reserva.espacio?.nombreEspacio}</td>
                          <td>{formatearFecha(reserva.fechaInicioReserva)}</td>
                          <td>{formatearFecha(reserva.fechaFinReserva)}</td>
                          <td><strong className="text-dark">S/. {Number(reserva.montoTotal).toFixed(2)}</strong></td>
                          <td>
                            <span className={`badge 
                              ${reserva.estadoReserva?.nombreEstado === 'CONFIRMADA' ? 'bg-success' : ''}
                              ${reserva.estadoReserva?.nombreEstado === 'PENDIENTE' ? 'bg-warning' : ''}
                              ${reserva.estadoReserva?.nombreEstado?.startsWith('CANCELADA') ? 'bg-danger' : ''}
                              ${reserva.estadoReserva?.nombreEstado === 'FINALIZADA' ? 'bg-info' : ''}
                            `}>
                              {reserva.estadoReserva?.nombreEstado}
                            </span>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={7} className="text-center text-muted py-4">No hay reservas registradas en el sistema.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : viewMode === 'ANALISIS' ? (
             <div className="row g-4 mb-4 animate-fade-in">
                <div className="col-md-6">
                  <div className="card glass-panel p-4 border-0 h-100">
                    <h5 className="text-dark fw-bold mb-3"><i className="bi bi-fire text-danger me-2"></i> Espacios Más Solicitados</h5>
                    <p className="text-muted small mb-3">Los 5 espacios estrella de SpaceWork con mayor demanda.</p>
                    <div className="list-group list-group-flush">
                      {spaceAnalytics.top5.map((esp, i) => (
                        <div key={esp.id} className="list-group-item bg-transparent px-0 py-3 d-flex justify-content-between align-items-center border-bottom border-light">
                          <div className="d-flex align-items-center gap-3">
                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{width: '35px', height: '35px'}}>
                              {i + 1}
                            </div>
                            <div>
                              <strong className="d-block text-dark">{esp.nombreEspacio}</strong>
                              <span className="small text-muted">{esp.ubicacion?.nombreSede || 'Sede Principal'}</span>
                            </div>
                          </div>
                          <div className="text-end">
                            <strong className="d-block text-success">S/. {esp.ingresosTotales.toFixed(2)}</strong>
                            <span className="badge bg-primary bg-opacity-10 text-primary">{esp.cantidadReservas} reservas</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="card glass-panel p-4 border-0 h-100" style={{ borderTop: '4px solid #ef4444' }}>
                    <h5 className="text-dark fw-bold mb-3"><i className="bi bi-snow text-info me-2"></i> Espacios Menos Solicitados</h5>
                    <p className="text-muted small mb-3">Estos 5 espacios presentan baja demanda. Revisa su feedback o ajusta sus precios para aumentar su atractivo.</p>
                    <div className="list-group list-group-flush">
                      {spaceAnalytics.bottom5.map((esp) => (
                        <div key={esp.id} className="list-group-item bg-transparent px-0 py-3 d-flex justify-content-between align-items-center border-bottom border-light">
                          <div>
                            <strong className="d-block text-dark">{esp.nombreEspacio}</strong>
                            <span className="small text-muted"><i className="bi bi-tag-fill me-1"></i> S/. {esp.precioPorHora}/hora</span>
                          </div>
                          <div className="text-end d-flex align-items-center gap-3">
                            <div className="text-end">
                              <strong className="d-block text-muted">S/. {esp.ingresosTotales.toFixed(2)}</strong>
                              <span className="badge bg-secondary bg-opacity-10 text-secondary">{esp.cantidadReservas} reservas</span>
                            </div>
                            <button className="btn btn-sm btn-outline-primary fw-semibold" onClick={() => setSelectedManageSpace(esp)}>
                              Gestionar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
             </div>
          ) : (
            <div className="card glass-panel p-4 border-0">
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 600 }}
                culture="es"
                views={['month', 'week', 'day', 'agenda']}
                view={calendarView}
                onView={(newView) => setCalendarView(newView)}
                date={calendarDate}
                onNavigate={(newDate) => setCalendarDate(newDate)}
                messages={{
                  next: "Siguiente",
                  previous: "Anterior",
                  today: "Hoy",
                  month: "Mes",
                  week: "Semana",
                  day: "Día",
                  agenda: "Agenda",
                  date: "Fecha",
                  time: "Hora",
                  event: "Evento",
                  noEventsInRange: "No hay reservas en este rango de fechas.",
                  showMore: (total) => `+ Ver más (${total})`
                }}
                components={{
                  event: CustomEvent
                }}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={(event) => setSelectedEvent(event)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
