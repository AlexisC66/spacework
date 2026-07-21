import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { apiService } from '../services/api';
import TermsModal from './TermsModal';
import CalendarioDisponibilidad from './CalendarioDisponibilidad';
import ServiceDetailModal from './ServiceDetailModal';
import ReservationPaymentModal from './ReservationPaymentModal';
import type { Espacio, ServicioAdicional, SlotDTO } from '../types';
import { extractApiError } from '../types';

const Reserva: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [espacioId, setEspacioId] = useState<number>(Number(id));
  const [usuarioId, setUsuarioId] = useState<number>(0);
  const [precioHora, setPrecioHora] = useState<number>(5.00);
  const [totalCalculado, setTotalCalculado] = useState<number>(0);
  const [asistentes, setAsistentes] = useState<number>(1);
  const [descuentoMonto, setDescuentoMonto] = useState<number>(0);
  const [subtotalOriginal, setSubtotalOriginal] = useState<number>(0);
  const [espacio, setEspacio] = useState<Espacio | null>(null);

  const [fechaInicio, setFechaInicio] = useState<Date | null>(null);
  const [fechaFin, setFechaFin] = useState<Date | null>(null);
  const [observaciones, setObservaciones] = useState<string>('');
  
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [cargando, setCargando] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [aplicaTarifaMedioDia, setAplicaTarifaMedioDia] = useState(false);

  const [promedioResenas, setPromedioResenas] = useState<number>(0);
  const [totalResenas, setTotalResenas] = useState<number>(0);

  const [serviciosDisponibles, setServiciosDisponibles] = useState<ServicioAdicional[]>([]);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<{ [key: number]: number }>({});
  const [costoServicios, setCostoServicios] = useState<number>(0);
  const [mostrarServicios, setMostrarServicios] = useState(false);
  const [servicioDetalleModal, setServicioDetalleModal] = useState<ServicioAdicional | null>(null);

  const [costoAforoExtra, setCostoAforoExtra] = useState<number>(0);
  const [personasExtra, setPersonasExtra] = useState<number>(0);
  const [diasReserva, setDiasReserva] = useState<number>(1);

  const [conflictos, setConflictos] = useState<SlotDTO[]>([]);
  const [verificandoDisponibilidad, setVerificandoDisponibilidad] = useState(false);

  const hayConflicto = useMemo(() => {
    if (!fechaInicio || !fechaFin || conflictos.length === 0) return false;
    return conflictos.some(s => {
      const sInicio = new Date(s.inicio);
      const sFin = new Date(s.fin);
      return fechaInicio < sFin && fechaFin > sInicio;
    });
  }, [fechaInicio, fechaFin, conflictos]);

  // Modal Terms State
  const [mostrarTermsModal, setMostrarTermsModal] = useState(false);
  const [intencionReserva, setIntencionReserva] = useState<'ahora' | 'luego' | null>(null);
  const [datosFacturacion, setDatosFacturacion] = useState<Record<string, string> | null>(null);

  // flujo Pago State
  const [mostrarModalPago, setMostrarModalPago] = useState(false);

  useEffect(() => {
    const userStr = sessionStorage.getItem('user');
    if (!userStr) {
      navigate('/login');
      return;
    }
    setUsuarioId(JSON.parse(userStr).id);
    
    const espId = Number(id);
    setEspacioId(espId);

    setCargandoDatos(true);
    Promise.all([
      apiService.getEspacios().then(response => {
        const esp = response.data.find((e: Espacio) => e.id === espId);
        if (esp) {
          setEspacio(esp);
          const precioDia = Number(esp.precio) || 0;
          setPrecioHora(precioDia > 0 ? Math.round((precioDia / 8) * 100) / 100 : 0);
        }
      }),
      apiService.getPromedioEspacio(espId).then(res => {
        setPromedioResenas(res.data.promedio || 0);
        setTotalResenas(res.data.total || 0);
      }),
      apiService.getServiciosAdicionales().then(res => {
        setServiciosDisponibles(res.data.filter((s: ServicioAdicional) => s.estado === true));
      })
    ]).catch(err => console.error(err))
      .finally(() => setCargandoDatos(false));
  }, [id, navigate]);

  useEffect(() => {
    if (!espacioId || !fechaInicio || !fechaFin) {
      setConflictos([]);
      return;
    }
    const desde = new Date(fechaInicio);
    desde.setDate(desde.getDate() - 1);
    const hasta = new Date(fechaFin);
    hasta.setDate(hasta.getDate() + 1);

    const desdeStr = desde.toISOString().slice(0, 19);
    const hastaStr = hasta.toISOString().slice(0, 19);

    setVerificandoDisponibilidad(true);
    apiService.getDisponibilidad(espacioId, desdeStr, hastaStr)
      .then(res => {
        setConflictos(res.data.ocupaciones || []);
      })
      .catch(() => setConflictos([]))
      .finally(() => setVerificandoDisponibilidad(false));
  }, [espacioId, fechaInicio, fechaFin]);

  useEffect(() => {
    calcularTotal();
  }, [fechaInicio, fechaFin, espacio, precioHora, serviciosSeleccionados, serviciosDisponibles, asistentes]);

  const validarHoras = (): boolean => {
    if (!fechaInicio || !fechaFin || !espacio) return false;
    const start = fechaInicio;
    const end = fechaFin;
    
    const getMinutes = (timeStr: string) => {
      const parts = timeStr.split(':');
      return Number(parts[0]) * 60 + Number(parts[1]);
    };
    
    const minApertura = getMinutes(espacio.horaApertura || '08:00');
    const minCierre = getMinutes(espacio.horaCierre || '20:00');
    
    const minInicio = start.getHours() * 60 + start.getMinutes();
    const minFin = end.getHours() * 60 + end.getMinutes();
    
    return minInicio >= minApertura && minFin <= minCierre;
  };

  const calcularTotal = () => {
    if (fechaInicio && fechaFin && espacio) {
      const start = fechaInicio;
      const end = fechaFin;
      const diffMs = end.getTime() - start.getTime();

      if (diffMs <= 0 || isNaN(diffMs)) {
        setTotalCalculado(0);
        return;
      }

      let subtotal = 0;
      let aplicoMedioDia = false;
      const tipoId = espacio.tipoEspacio?.id;
      
      const diffDaysExact = diffMs / (1000 * 60 * 60 * 24);
      let diffDays = Math.floor(diffDaysExact);
      const remainder = diffDaysExact - diffDays;
      
      // Si hay un remanente de horas en el último día
      if (remainder > 0) {
          const endHour = end.getHours() + (end.getMinutes() / 60);
          
          // Si sale a las 12:00 o después, se cobra un día extra completo
          if (endHour >= 12) {
              diffDays += 1;
              aplicoMedioDia = true; // Para semántica visual si se requiere
          } else {
              // Si sale antes de las 12:00, le perdonamos ese día extra
              if (diffDays === 0) diffDays = 1;
          }
      }
      
      if (diffDays === 0) diffDays = 1; // Mínimo 1 día
      let diasEfectivos = diffDays;

      if (tipoId === 1) {
        // alquiler por hora (Escritorio Individual)
        let horasACobrar = diffMs / (1000 * 60 * 60);
        
        // Regla Mediodía: Si inicia antes de las 12 y termina a las 12 o después en el mismo día
        const startHour = start.getHours() + (start.getMinutes() / 60);
        const endHour = end.getHours() + (end.getMinutes() / 60);
        const isSameDay = start.getDate() === end.getDate() && start.getMonth() === end.getMonth();
        
        if (isSameDay && startHour < 12 && endHour >= 12) {
            horasACobrar = 8; // Tarifa Día Completo
            aplicoMedioDia = true;
            diasEfectivos = 1; // Aunque sean horas, se asume 1 día completo
        }

        const precioH = precioHora || 0;
        subtotal = precioH > 0 ? horasACobrar * precioH : 0;
      } else {
        // alquiler por día (Sala de Reuniones u Oficina Privada)
        const precioDia = Number(espacio.precio) || 0;
        subtotal = precioDia > 0 ? diasEfectivos * precioDia : 0;
      }
      
      setDiasReserva(diasEfectivos);
      
      const descPorc = Number(espacio?.descuento) || 0;
      const descMonto = subtotal * (descPorc / 100);
      
      let totalSrv = 0;
      Object.keys(serviciosSeleccionados).forEach((srvIdStr) => {
        const srvId = parseInt(srvIdStr);
        const qty = serviciosSeleccionados[srvId] || 0;
        const srv = serviciosDisponibles.find(s => s.id === srvId);
        if (srv && qty > 0) {
          totalSrv += srv.precioBase * qty * diasEfectivos;
        }
      });
      setCostoServicios(totalSrv);

      let pExtra = 0;
      let cAforoExtra = 0;
      if (espacio?.capacidadEquipos && asistentes > espacio?.capacidadEquipos && asistentes <= espacio.capacidad) {
        pExtra = asistentes - espacio?.capacidadEquipos;
        const precioExtra = espacio?.precioPersonaExtra || 0;
        cAforoExtra = pExtra * precioExtra * diasEfectivos;
      }
      setPersonasExtra(pExtra);
      setCostoAforoExtra(cAforoExtra);

      setSubtotalOriginal(Math.round(subtotal * 100) / 100);
      setDescuentoMonto(Math.round(descMonto * 100) / 100);
      setTotalCalculado(Math.round((subtotal - descMonto + totalSrv + cAforoExtra) * 100) / 100);
      setAplicaTarifaMedioDia(aplicoMedioDia);
    } else {
      setSubtotalOriginal(0);
      setDescuentoMonto(0);
      setCostoServicios(0);
      setCostoAforoExtra(0);
      setPersonasExtra(0);
      setDiasReserva(1);
      setTotalCalculado(0);
      setAplicaTarifaMedioDia(false);
    }
  };

  // Lógica IGV Dinámico
  const igvRate = espacio?.ubicacion?.tasaIgv === 0 || espacio?.ubicacion?.exoneradoIgv ? 0 : 0.18;
  const baseImponible = totalCalculado / (1 + igvRate);
  const igvCalculado = totalCalculado - baseImponible;

  const intentarReserva = (intencion: 'ahora' | 'luego', e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    if (totalCalculado <= 0) {
      setErrorMessage('Las fechas seleccionadas no son válidas.');
      return;
    }
    if (hayConflicto) {
      setErrorMessage('El rango seleccionado se superpone con una reserva existente. Elige otras fechas.');
      return;
    }
    if (espacio && asistentes > espacio.capacidad) {
      setErrorMessage(`El número de asistentes no puede superar la capacidad del espacio (${espacio.capacidad} personas).`);
      return;
    }
    if (!validarHoras()) {
      setErrorMessage(`La reserva debe estar dentro del horario de atención: de ${espacio?.horaApertura || '08:00'} a ${espacio?.horaCierre || '20:00'}.`);
      return;
    }
    setIntencionReserva(intencion);
    setMostrarTermsModal(true);
  };

  const handleTermsAccept = (tipoComprobante: string, documento: string, razonSocial: string, direccion: string) => {
    const facturacion = { tipoComprobante, documento, razonSocial, direccion };
    setDatosFacturacion(facturacion);
    setMostrarTermsModal(false);
    
    if (intencionReserva === 'ahora') {
      setMostrarModalPago(true);
    } else if (intencionReserva === 'luego') {
      crearReservaPendiente(facturacion);
    }
  };

  const crearReservaPendiente = async (facturacion: Record<string, string>) => {
    setErrorMessage('');
    setSuccessMessage('');
    setCargando(true);

    const reservaData = {
      usuarioId: usuarioId,
      espacioId: espacioId,
      fechaInicio: fechaInicio ? `${fechaInicio.getFullYear()}-${String(fechaInicio.getMonth() + 1).padStart(2, '0')}-${String(fechaInicio.getDate()).padStart(2, '0')}T${String(fechaInicio.getHours()).padStart(2, '0')}:${String(fechaInicio.getMinutes()).padStart(2, '0')}:00` : undefined,
      fechaFin: fechaFin ? `${fechaFin.getFullYear()}-${String(fechaFin.getMonth() + 1).padStart(2, '0')}-${String(fechaFin.getDate()).padStart(2, '0')}T${String(fechaFin.getHours()).padStart(2, '0')}:${String(fechaFin.getMinutes()).padStart(2, '0')}:00` : undefined,
      montoTotal: totalCalculado,
      descuentoAplicado: descuentoMonto,
      observaciones: observaciones || '',
      asistentes: asistentes,
      serviciosAdicionales: serviciosSeleccionados,
      tipoComprobante: facturacion.tipoComprobante,
      documentoIdentidad: facturacion.documento,
      razonSocial: facturacion.razonSocial,
      direccion: facturacion.direccion
    };

    try {
      await apiService.crearReserva(reservaData);
      setSuccessMessage('¡Reserva creada exitosamente! Podrás pagarla después desde "Mis Reservas". Redireccionando...');
      setTimeout(() => { navigate('/mis-reservas'); }, 2500);
    } catch (err: unknown) {
      setCargando(false);
      setErrorMessage(extractApiError(err));
    }
  };

  const cancelar = () => {
    navigate('/catalogo');
  };

  return (
    <div className="container py-5 animate-fade-in">
      <div className="col-md-8 mx-auto glass-panel p-5">
        <h2 className="text-gradient fw-bold mb-2">Confirmar Tu Reserva</h2>
        {espacio && (
          <div className="mb-4 text-muted small d-flex flex-column gap-1">
            <span>Espacio: <strong>{espacio?.nombreEspacio}</strong> (Capacidad: {espacio.capacidad} personas)</span>
            <span>Horario: <strong>{espacio.horaApertura || '08:00'} - {espacio.horaCierre || '20:00'}</strong></span>
            {totalResenas > 0 && (
              <span className="text-warning d-flex align-items-center gap-1">
                <i className="bi bi-star-fill"></i> {promedioResenas.toFixed(1)} <span className="text-muted ms-1">({totalResenas} reseña{totalResenas !== 1 ? 's' : ''})</span>
              </span>
            )}
          </div>
        )}
        
        {errorMessage && (
          <div className="alert alert-danger bg-danger bg-opacity-25 border-0 text-danger animate-fade-in" role="alert">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="alert alert-success bg-success bg-opacity-25 border-0 text-success animate-fade-in" role="alert">
            {successMessage}
          </div>
        )}

        {cargandoDatos && (
          <div className="animate-fade-in">
            <div className="d-flex gap-3 mb-4">
              <div className="placeholder-glow col-6">
                <span className="placeholder col-12 rounded-3" style={{ height: '48px' }}></span>
              </div>
              <div className="placeholder-glow col-6">
                <span className="placeholder col-12 rounded-3" style={{ height: '48px' }}></span>
              </div>
            </div>
            <div className="placeholder-glow mb-3">
              <span className="placeholder col-4 rounded-3" style={{ height: '16px' }}></span>
            </div>
            <div className="placeholder-glow mb-4">
              <span className="placeholder col-12 rounded-3" style={{ height: '120px' }}></span>
            </div>
            <div className="placeholder-glow mb-4">
              <span className="placeholder col-12 rounded-3" style={{ height: '200px' }}></span>
            </div>
            <div className="d-flex gap-3">
              <div className="placeholder-glow col-4">
                <span className="placeholder col-12 rounded-3" style={{ height: '44px' }}></span>
              </div>
              <div className="placeholder-glow col-4">
                <span className="placeholder col-12 rounded-3" style={{ height: '44px' }}></span>
              </div>
              <div className="placeholder-glow col-4">
                <span className="placeholder col-12 rounded-3" style={{ height: '44px' }}></span>
              </div>
            </div>
          </div>
        )}

        {!cargandoDatos && (<><div className="mb-4 p-3 bg-light rounded-3 border">
          <h6 className="fw-bold text-dark mb-2">
            <i className="bi bi-calendar-check me-2 text-primary"></i>
            Disponibilidad del espacio
          </h6>
          <CalendarioDisponibilidad
            espacioId={espacioId}
            fechaSeleccionada={fechaInicio}
            fechaFin={fechaFin}
            onFechaSeleccionada={(date) => {
              if (!fechaInicio || fechaFin) {
                const d = new Date(date);
                d.setHours(8, 0, 0, 0);
                setFechaInicio(d);
                setFechaFin(null);
              }
            }}
            onRangoSeleccionado={(inicio, fin) => {
              const d1 = new Date(inicio);
              d1.setHours(8, 0, 0, 0);
              const d2 = new Date(fin);
              d2.setHours(18, 0, 0, 0);
              setFechaInicio(d1);
              setFechaFin(d2);
            }}
            modo="reserva"
          />
          {verificandoDisponibilidad && (
            <div className="text-center mt-2">
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Verificando...</span>
              </div>
              <span className="small text-muted ms-2">Verificando disponibilidad...</span>
            </div>
          )}
          {hayConflicto && (
            <div className="alert alert-danger bg-danger bg-opacity-10 border-danger mt-2 mb-0 p-2 small d-flex align-items-center">
              <i className="bi bi-exclamation-triangle-fill me-2 fs-5 text-danger"></i>
              <span>
                <strong>Conflicto detectado:</strong> El rango seleccionado se superpone con una reserva existente.
                Por favor, elige otras fechas u horarios.
              </span>
            </div>
          )}
          {fechaInicio && fechaFin && !hayConflicto && !verificandoDisponibilidad && (
            <div className="alert alert-success bg-success bg-opacity-10 border-success mt-2 mb-0 p-2 small d-flex align-items-center">
              <i className="bi bi-check-circle-fill me-2 fs-5 text-success"></i>
              <span>El espacio está disponible en el rango seleccionado.</span>
            </div>
          )}
        </div>

        <form onSubmit={(e) => intentarReserva('ahora', e)}>
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label text-muted">Fecha y Hora de Inicio</label>
              <DatePicker
                selected={fechaInicio}
                onChange={(date: Date | null) => setFechaInicio(date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={30}
                timeCaption="Hora"
                dateFormat="dd/MM/yyyy HH:mm"
                className="form-control bg-light border-0 text-dark py-2 shadow-sm"
                placeholderText="Seleccione fecha y hora"
                required
                wrapperClassName="w-100"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label text-muted">Fecha y Hora de Fin</label>
              <DatePicker
                selected={fechaFin}
                onChange={(date: Date | null) => setFechaFin(date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={30}
                timeCaption="Hora"
                dateFormat="dd/MM/yyyy HH:mm"
                className="form-control bg-light border-0 text-dark py-2 shadow-sm"
                placeholderText="Seleccione fecha y hora"
                required
                wrapperClassName="w-100"
                minDate={fechaInicio || undefined}
              />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label text-muted">Número de Asistentes</label>
              <input type="number" className="form-control bg-light border-0 text-dark py-2 shadow-sm" value={asistentes} onChange={(e) => setAsistentes(Number(e.target.value))} required min="1" max={espacio?.capacidad || 100} />
              {espacio && asistentes > espacio.capacidad && (
                <span className="small text-danger d-block mt-1">
                  ¡Supera la capacidad máxima de {espacio.capacidad} personas!
                </span>
              )}
              {personasExtra > 0 && (
                <div className="alert alert-warning border-0 p-2 mt-2 mb-0 small d-flex align-items-center">
                  <i className="bi bi-info-circle-fill me-2 fs-5"></i>
                  <span>
                    El aforo base es de <strong>{espacio?.capacidadEquipos} pers</strong>. 
                    Se ha añadido un cargo por <strong>{personasExtra} persona(s) extra</strong>.
                  </span>
                </div>
              )}
            </div>
            <div className="col-md-6">
              <label className="form-label text-muted">Observaciones</label>
              <textarea className="form-control bg-light border-0 text-dark py-2 shadow-sm" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={1} placeholder="Ej. Requerimientos especiales, indicaciones para recepción..."></textarea>
            </div>
          </div>

          {serviciosDisponibles.length > 0 && (
            <div className="mb-4 p-4 border rounded-4 bg-white shadow-sm">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="text-dark fw-bold mb-0">
                  <i className="bi bi-stars text-warning me-2"></i>Servicios Adicionales
                </h5>
                <div className="form-check form-switch">
                  <input 
                    className="form-check-input fs-5" 
                    type="checkbox" 
                    role="switch" 
                    checked={mostrarServicios}
                    onChange={(e) => {
                      setMostrarServicios(e.target.checked);
                      if (!e.target.checked) {
                        setServiciosSeleccionados({});
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              </div>

              {mostrarServicios && (
                <div className="row g-3 mt-2 border-top pt-3 animate-fade-in">
                  {serviciosDisponibles.map(srv => (
                    <div className="col-md-6 mb-2" key={srv.id}>
                      <div className="d-flex align-items-center justify-content-between p-3 border rounded bg-light h-100">
                        <div className="pe-2">
                          <div className="d-flex align-items-center">
                            <h6 className="mb-0 fw-bold">{srv.nombre}</h6>
                            <button 
                              type="button" 
                              className="btn btn-sm btn-link p-0 ms-2 text-primary" 
                              onClick={() => setServicioDetalleModal(srv)} 
                              title="Ver detalles"
                            >
                              <i className="bi bi-info-circle-fill fs-6"></i>
                            </button>
                          </div>
                          <span className="small text-success fw-bold">S/. {srv.precioBase.toFixed(2)} / día</span>
                        </div>
                        <div className="d-flex align-items-center bg-white rounded shadow-sm overflow-hidden border flex-shrink-0">
                        <button 
                          type="button" 
                          className="btn btn-sm btn-light border-0 px-2 text-primary"
                          onClick={() => {
                            const current = serviciosSeleccionados[srv.id] || 0;
                            if (current > 0) {
                              setServiciosSeleccionados({...serviciosSeleccionados, [srv.id]: current - 1});
                            }
                          }}
                        ><i className="bi bi-dash"></i></button>
                        <span className="px-3 fw-bold small">{serviciosSeleccionados[srv.id] || 0}</span>
                        <button 
                          type="button" 
                          className="btn btn-sm btn-light border-0 px-2 text-primary"
                          onClick={() => {
                            const current = serviciosSeleccionados[srv.id] || 0;
                            setServiciosSeleccionados({...serviciosSeleccionados, [srv.id]: current + 1});
                          }}
                        ><i className="bi bi-plus"></i></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          )}

          <div className="card bg-primary bg-opacity-10 border-primary border-opacity-25 p-4 mb-4 shadow-sm rounded-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <h5 className="text-dark fw-bold mb-0">Subtotal Estimado</h5>
                {espacio && espacio.tipoEspacio?.id === 1 && (
                  <span className="small text-muted">Tarifa por hora: S/. {precioHora.toFixed(2)}</span>
                )}
                {espacio && espacio.tipoEspacio?.id !== 1 && (
                  <span className="text-gray-900 font-medium">{espacio?.ubicacion?.ciudad}, {espacio?.ubicacion?.pais}</span>
                )}
              </div>
              <span className="text-dark fw-bold fs-5">S/. {subtotalOriginal.toFixed(2)}</span>
            </div>
            {descuentoMonto > 0 && (
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-success fw-bold">Descuento ({espacio?.descuento}%)</span>
                <span className="text-success fw-bold fs-5">- S/. {descuentoMonto.toFixed(2)}</span>
              </div>
            )}
            
            {costoServicios > 0 && (
              <div className="mb-2">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="text-dark fw-bold">Servicios Adicionales <small className="fw-normal text-muted">(x{diasReserva} {diasReserva === 1 ? 'día' : 'días'})</small></span>
                  <span className="text-dark fw-bold fs-5">+ S/. {costoServicios.toFixed(2)}</span>
                </div>
                <div className="ps-3 border-start border-2 border-primary mt-1 mb-2">
                  {Object.keys(serviciosSeleccionados).map(srvIdStr => {
                    const qty = serviciosSeleccionados[parseInt(srvIdStr)];
                    if (qty > 0) {
                      const srv = serviciosDisponibles.find(s => s.id === parseInt(srvIdStr));
                      if (srv) {
                        return (
                          <div key={srvIdStr} className="d-flex justify-content-between text-muted small">
                            <span>{srv.nombre} (x{qty})</span>
                            <span>S/. {(srv.precioBase * qty * diasReserva).toFixed(2)}</span>
                          </div>
                        );
                      }
                    }
                    return null;
                  })}
                </div>
              </div>
            )}

            {costoAforoExtra > 0 && (
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <span className="text-dark fw-bold d-block">Cargo por Aforo Extra <small className="fw-normal text-muted">(x{diasReserva} {diasReserva === 1 ? 'día' : 'días'})</small></span>
                  <span className="text-muted small">{personasExtra} persona(s) x S/. {(espacio?.precioPersonaExtra || 0).toFixed(2)} c/u / día</span>
                </div>
                <span className="text-dark fw-bold fs-5">+ S/. {costoAforoExtra.toFixed(2)}</span>
              </div>
            )}
            
            {/* Desglose IGV */}
            <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top border-primary border-opacity-25">
              <span className="text-muted small">Valor Base (sin impuestos):</span>
              <span className="text-muted small">S/. {baseImponible.toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small">
                {igvRate > 0 ? `IGV (18%):` : `IGV (0% - Ley de Amazonía):`}
              </span>
              <span className="text-muted small">S/. {igvCalculado.toFixed(2)}</span>
            </div>

            <hr className="border-primary border-opacity-25 my-2" />
            <div className="d-flex justify-content-between align-items-center mt-2 mb-3">
              <h4 className="text-primary fw-bold mb-0">Total a Pagar</h4>
              <span className="text-primary fw-bold fs-3">S/. {totalCalculado.toFixed(2)}</span>
            </div>

            {aplicaTarifaMedioDia && (
              <div className="alert alert-warning border-warning border-opacity-25 d-flex align-items-center p-3 mb-4 rounded-3" style={{ fontSize: '14px' }}>
                <i className="bi bi-info-circle-fill fs-5 me-3 text-warning"></i>
                <div>
                  <strong>Aviso:</strong> Tu reserva cruza el mediodía. Se ha aplicado la tarifa especial de Día Completo.
                </div>
              </div>
            )}
          </div>

          <div className="d-flex gap-3 flex-wrap">
            <button type="button" className="btn btn-outline-secondary flex-grow-1 py-2 fw-semibold" onClick={cancelar}>Cancelar</button>
            <button type="button" className="btn btn-outline-primary flex-grow-1 py-2 fw-semibold" onClick={() => intentarReserva('luego')} disabled={cargando || totalCalculado <= 0 || (espacio ? asistentes > espacio.capacidad : false) || hayConflicto}>
              Reservar y Pagar Después
            </button>
            <button type="submit" className="btn btn-primary-custom flex-grow-1 py-2 fw-semibold" disabled={cargando || totalCalculado <= 0 || (espacio ? asistentes > espacio.capacidad : false) || hayConflicto}>
              Pagar Ahora
            </button>
          </div>
        </form>
      </>)}
      </div>

      <TermsModal 
        show={mostrarTermsModal} 
        onClose={() => setMostrarTermsModal(false)} 
        onAccept={handleTermsAccept} 
      />

      {/* Modal Pago — ReservationPaymentModal */}
      {mostrarModalPago && datosFacturacion && (
        <ReservationPaymentModal
          reservaData={{
            usuarioId,
            espacioId,
            fechaInicio: fechaInicio ? `${fechaInicio.getFullYear()}-${String(fechaInicio.getMonth() + 1).padStart(2, '0')}-${String(fechaInicio.getDate()).padStart(2, '0')}T${String(fechaInicio.getHours()).padStart(2, '0')}:${String(fechaInicio.getMinutes()).padStart(2, '0')}:00` : undefined,
            fechaFin: fechaFin ? `${fechaFin.getFullYear()}-${String(fechaFin.getMonth() + 1).padStart(2, '0')}-${String(fechaFin.getDate()).padStart(2, '0')}T${String(fechaFin.getHours()).padStart(2, '0')}:${String(fechaFin.getMinutes()).padStart(2, '0')}:00` : undefined,
            montoTotal: totalCalculado,
            descuentoAplicado: descuentoMonto,
            observaciones,
            asistentes,
            serviciosAdicionales: serviciosSeleccionados
          }}
          datosFacturacion={datosFacturacion}
          onClose={() => setMostrarModalPago(false)}
        />
      )}

      {/* MODAL DE DETALLES DE SERVICIO */}
      {servicioDetalleModal && (
        <ServiceDetailModal servicio={servicioDetalleModal} onClose={() => setServicioDetalleModal(null)} />
      )}

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.4);
          z-index: 2000;
          backdrop-filter: blur(4px);
        }
        .max-h-90 {
          max-height: 90vh;
        }
        .btn-close-custom {
          position: absolute;
          top: 15px;
          right: 15px;
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 20px;
          cursor: pointer;
          transition: color 0.2s ease;
        }
        .btn-close-custom:hover {
          color: #0f172a;
        }
      `}</style>
    </div>
  );
};

export default Reserva;
