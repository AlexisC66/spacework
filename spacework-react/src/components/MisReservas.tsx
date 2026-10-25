import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MisReservas: React.FC = () => {
  const navigate = useNavigate();

  const [usuarioId, setUsuarioId] = useState<number>(0);
  const [reservas, setReservas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  console.log('MisReservas render:', { reservas, usuarioId });

  // payment modal state
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [reservaSeleccionada, setReservaSeleccionada] = useState<any>(null);
  const [metodoPago, setMetodoPago] = useState('card');
  const [pagoForm, setPagoForm] = useState({
    nombreTarjeta: '',
    nroTarjeta: '',
    exp: '',
    cvv: '',
    referencia: ''
  });

  // review modal state
  const [mostrarModalResena, setMostrarModalResena] = useState(false);
  const [reservaParaResena, setReservaParaResena] = useState<any>(null);
  const [resenaForm, setResenaForm] = useState({
    calificacion: 5,
    comentario: ''
  });

  // detail modal state
  const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);
  const [detalleReserva, setDetalleReserva] = useState<any>(null);

  // map modal state
  const [modalMapaOpen, setModalMapaOpen] = useState(false);
  const [sedeSeleccionada, setSedeSeleccionada] = useState<any>(null);

  // extra service modal state
  const [mostrarModalExtra, setMostrarModalExtra] = useState(false);
  const [reservaParaExtra, setReservaParaExtra] = useState<any>(null);
  const [serviciosAdicionales, setServiciosAdicionales] = useState<any[]>([]);
  const [cantidadesExtras, setCantidadesExtras] = useState<{[key: number]: number}>({});
  const [fechaGlobal, setFechaGlobal] = useState<string>('');
  const [tipoDuracionExtra, setTipoDuracionExtra] = useState<'dia' | 'reserva'>('dia');
  const [extraForm, setExtraForm] = useState({
    servicioId: '',
    cantidad: 1,
    fechaUso: '',
    // para el pago si está confirmada
    nombreTarjeta: '',
    nroTarjeta: '',
    exp: '',
    cvv: ''
  });

  // Modal para Facturas
  const [mostrarModalFacturas, setMostrarModalFacturas] = useState(false);
  const [reservaParaFacturas, setReservaParaFacturas] = useState<any>(null);
  const [reservaACancelar, setReservaACancelar] = useState<number | null>(null);

  const abrirMapa = (ubicacion: any) => {
    if (!ubicacion) return;
    setSedeSeleccionada(ubicacion);
    setModalMapaOpen(true);
  };

  useEffect(() => {
    const userStr = sessionStorage.getItem('user');
    if (!userStr) {
      navigate('/login');
      return;
    }
    const user = JSON.parse(userStr);
    const uId = user.id || user.usuarioId || user.UsuarioID;
    setUsuarioId(uId);
  }, [navigate]);

  useEffect(() => {
    if (usuarioId) {
      cargarReservas();
    }
  }, [usuarioId]);

  const cargarReservas = async () => {
    setCargando(true);
    try {
      const response = await apiService.getReservasPorUsuario(usuarioId);
      const data = response.data;
      if (Array.isArray(data)) {
        setReservas([...data].sort((a, b) => (b?.id || 0) - (a?.id || 0)));
      } else {
        setReservas([]);
      }
    } catch (err) {
      console.error('Error al cargar reservas:', err);
      setErrorMessage('Error al cargar las reservas. Intente nuevamente.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setCargando(false);
    }
  };

  const gastoPorTipo = useMemo(() => {
    const tiposMap = new Map<string, number>();
    let totalConf = 0;
    
    reservas.forEach(r => {
      const estado = r.estadoReserva?.nombreEstado?.toUpperCase();
      if (estado === 'CONFIRMADA' || estado === 'FINALIZADA') {
        const tipo = r.espacio?.tipoEspacio?.nombreTipo || 'Otros';
        const monto = Number(r.montoTotal || 0);
        tiposMap.set(tipo, (tiposMap.get(tipo) || 0) + monto);
        totalConf += monto;
      }
    });

    const lista: { nombre: string, monto: number, porcentaje: number }[] = [];
    tiposMap.forEach((monto, nombre) => {
      lista.push({
        nombre,
        monto,
        porcentaje: totalConf > 0 ? Math.round((monto / totalConf) * 100) : 0
      });
    });
    
    return lista.sort((a, b) => b.monto - a.monto);
  }, [reservas]);

  const obtenerImagenEspacio = (espacio: any): string => {
    if (espacio?.fotoUrl) return espacio.fotoUrl;
    const tipoId = espacio?.tipoEspacio?.id;
    if (tipoId === 1) {
      return 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&q=80&w=150&h=100';
    } else if (tipoId === 2) {
      return 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=150&h=100';
    } else {
      return 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=150&h=100';
    }
  };

  const verDetalle = (reserva: any) => {
    setDetalleReserva(reserva);
    setMostrarModalDetalle(true);
  };

  const cerrarModalDetalle = () => {
    setMostrarModalDetalle(false);
    setTimeout(() => setDetalleReserva(null), 300);
  };

  const abrirModalFacturas = (r: any) => {
    setReservaParaFacturas(r);
    setMostrarModalFacturas(true);
  };

  const cerrarModalFacturas = () => {
    setMostrarModalFacturas(false);
    setTimeout(() => setReservaParaFacturas(null), 300);
  };

  const iniciarCancelacion = (id: number) => {
    setReservaACancelar(id);
  };

  const confirmarCancelacion = async () => {
    if (!reservaACancelar) return;
    try {
      await apiService.cancelarReserva(reservaACancelar);
      setSuccessMessage('Reserva cancelada exitosamente.');
      cargarReservas();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (error: any) {
      console.error('Error al cancelar la reserva:', error);
      setErrorMessage(error.response?.data?.error || 'No se pudo cancelar la reserva.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setReservaACancelar(null);
    }
  };

  const cerrarModalCancelacion = () => {
    setReservaACancelar(null);
  };

  const generarPDF = (titulo: string, items: any[], total: number, fileName: string) => {
    const doc = new jsPDF();
    const userStr = sessionStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : {};
    const nombreCliente = `${user.nombre || ''} ${user.apellidoPaterno || ''}`.trim();
    const r = reservaParaFacturas;

    doc.setFontSize(22);
    doc.setTextColor(14, 165, 233);
    doc.text("SpaceWork", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Coworking & Espacios Flexibles", 14, 28);
    doc.text("RUC: 20123456789", 14, 34);
    
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text(titulo, 140, 22);
    doc.setFontSize(12);
    doc.text(`Reserva Nro: ${r.codigoReserva || r.id}`, 140, 28);
    doc.text(`Fecha Emisión: ${new Date().toLocaleDateString()}`, 140, 34);

    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(14, 45, 196, 45);

    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`Cliente: ${nombreCliente || 'Cliente Web'}`, 14, 55);
    doc.text(`Estado de Reserva: ${r.estadoReserva?.nombreEstado || 'CONFIRMADA'}`, 14, 62);
    doc.text(`Ubicación: ${r.espacio?.ubicacion?.nombreUbicacion || ''}`, 14, 69);

    autoTable(doc, {
      startY: 85,
      head: [['Descripción del Servicio', 'Cantidad', 'Importe']],
      body: items,
      theme: 'grid',
      headStyles: { fillColor: [14, 165, 233] }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 120;
    
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(`TOTAL: S/. ${Number(total).toFixed(2)}`, 140, finalY + 15);

    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Gracias por elegir SpaceWork.", 105, 280, { align: 'center' });

    doc.save(fileName);
  };

  const descargarBoletaBase = () => {
    if (!reservaParaFacturas) return;
    const r = reservaParaFacturas;
    // Restamos los extras al monto total para obtener el pago base
    const totalExtras = r.reservaServicios ? r.reservaServicios.reduce((acc: number, rs: any) => acc + rs.subtotal, 0) : 0;
    const baseTotal = r.montoTotal - totalExtras;

    generarPDF(
      "BOLETA DE PAGO", 
      [[`Alquiler de espacio: ${r.espacio?.nombreEspacio}`, '1', `S/. ${baseTotal.toFixed(2)}`]], 
      baseTotal, 
      `Boleta_${r.codigoReserva || r.id}_Base.pdf`
    );
  };

  const descargarBoletaExtra = (rs: any, idx: number) => {
    if (!reservaParaFacturas) return;
    const r = reservaParaFacturas;
    generarPDF(
      "BOLETA DE PAGO", 
      [[`Servicio Extra: ${rs.servicioAdicional?.nombre}`, rs.cantidad.toString(), `S/. ${Number(rs.subtotal).toFixed(2)}`]], 
      rs.subtotal, 
      `Boleta_${r.codigoReserva || r.id}_Extra_${idx+1}.pdf`
    );
  };

  const abrirModalPago = (reserva: any) => {
    setReservaSeleccionada(reserva);
    setMostrarModalPago(true);
    setMetodoPago('card');
    setPagoForm({
      nombreTarjeta: '',
      nroTarjeta: '',
      exp: '',
      cvv: '',
      referencia: ''
    });
  };

  const cerrarModalPago = () => {
    setMostrarModalPago(false);
    setReservaSeleccionada(null);
  };

  const formatCardNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, '');
    let formatted = input.match(/.{1,4}/g)?.join(' ') || input;
    setPagoForm(prev => ({ ...prev, nroTarjeta: formatted }));
  };

  const formatExpiry = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, '');
    if (input.length > 2) {
      input = input.substring(0, 2) + '/' + input.substring(2, 4);
    }
    setPagoForm(prev => ({ ...prev, exp: input }));
  };

  const formatExtraCardNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, '');
    let formatted = input.match(/.{1,4}/g)?.join(' ') || input;
    setExtraForm(prev => ({ ...prev, nroTarjeta: formatted }));
  };

  const formatExtraExpiry = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, '');
    if (input.length > 2) {
      input = input.substring(0, 2) + '/' + input.substring(2, 4);
    }
    setExtraForm(prev => ({ ...prev, exp: input }));
  };

  const isValidLuhn = (num: string) => {
    const cleanNum = num.replace(/\D/g, '');
    if (!cleanNum) return false;
    let sum = 0;
    let isEven = false;
    for (let i = cleanNum.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNum.charAt(i), 10);
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      sum += digit;
      isEven = !isEven;
    }
    return sum % 10 === 0;
  };

  const procesarPago = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (metodoPago === 'card' && !isValidLuhn(pagoForm.nroTarjeta)) {
      setErrorMessage('El número de tarjeta es inválido.');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }

    const formaPagoId = metodoPago === 'card' ? 1 : 3;

    const referencia = metodoPago === 'card'
      ? 'CARD-' + pagoForm.nroTarjeta.slice(-4) + '-' + Math.floor(Math.random()*10000)
      : pagoForm.referencia;

    const datosTarjeta = metodoPago === 'card'
      ? `${pagoForm.nombreTarjeta}|${pagoForm.nroTarjeta}|${pagoForm.exp}`
      : null;

    const pagoData = {
      reservaId: reservaSeleccionada.id,
      formaPagoId: formaPagoId,
      montoPago: reservaSeleccionada.montoTotal,
      referenciaTransaccion: referencia,
      datosTarjeta: datosTarjeta
    };

    try {
      await apiService.procesarPago(pagoData);
      setSuccessMessage('El pago se procesó con éxito. Reserva confirmada.');
      cerrarModalPago();
      cargarReservas();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Error al procesar el pago. Inténtelo de nuevo.');
      cerrarModalPago();
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  const abrirModalResena = async (reserva: any) => {
    try {
      const res = await apiService.chequearResenaReserva(reserva.id);
      if (res.data.hasResena) {
        setErrorMessage('Ya dejaste una reseña para esta reserva. ¡Gracias!');
        setTimeout(() => setErrorMessage(''), 4000);
      } else {
        setReservaParaResena(reserva);
        setResenaForm({ calificacion: 5, comentario: '' });
        setMostrarModalResena(true);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Error al verificar la reseña.');
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  const cerrarModalResena = () => {
    setMostrarModalResena(false);
    setReservaParaResena(null);
  };

  const enviarResena = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      await apiService.crearResena({
        reservaId: reservaParaResena.id,
        calificacion: resenaForm.calificacion,
        comentario: resenaForm.comentario
      });
      setSuccessMessage('¡Gracias por tu reseña!');
      cerrarModalResena();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Error al enviar la reseña.');
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  const abrirModalExtra = async (reserva: any) => {
    try {
      const res = await apiService.getServiciosAdicionales();
      const activos = res.data.filter((s: any) => s.estado);
      setServiciosAdicionales(activos);
      setReservaParaExtra(reserva);
      setCantidadesExtras({});
    setFechaGlobal('');
      
      const fInicioDate = new Date(reserva.fechaInicioReserva);
      const hoy = new Date();
      // Tomamos el maximo entre la fecha de inicio y hoy para no permitir fechas pasadas
      const fInicioStr = (fInicioDate > hoy ? fInicioDate : hoy).toISOString().split('T')[0];

      setExtraForm({ 
        servicioId: activos[0]?.id?.toString() || '', 
        cantidad: 1, 
        fechaUso: fInicioStr,
        nombreTarjeta: '',
        nroTarjeta: '',
        exp: '',
        cvv: ''
      });
      setMostrarModalExtra(true);
    } catch (e) {
      setErrorMessage("Error al cargar servicios");
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  const cerrarModalExtra = () => {
    setMostrarModalExtra(false);
    setReservaParaExtra(null);
    setCantidadesExtras({});
    setFechaGlobal('');
  };

  
    const handleIncrement = (id: number) => {
    setCantidadesExtras(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const handleDecrement = (id: number) => {
    setCantidadesExtras(prev => {
      const actual = prev[id] || 0;
      if (actual <= 0) return prev;
      return { ...prev, [id]: actual - 1 };
    });
  };

    const getFechasParaExtras = () => {
    if (!reservaParaExtra) return [];
    if (tipoDuracionExtra === 'dia') {
      return [fechaGlobal];
    } else {
      const start = new Date(Math.max(new Date(reservaParaExtra.fechaInicioReserva).getTime(), new Date().getTime()));
      start.setHours(0,0,0,0);
      const end = new Date(reservaParaExtra.fechaFinReserva);
      end.setHours(0,0,0,0);
      const fechas = [];
      let current = new Date(start);
      while (current <= end) {
        fechas.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
      return fechas.length > 0 ? fechas : [fechaGlobal];
    }
  };

  const calcularTotalExtras = () => {
    const dias = getFechasParaExtras().length;
    return serviciosAdicionales.reduce((acc, srv) => {
      const q = cantidadesExtras[srv.id] || 0;
      return acc + (q * srv.precioBase * dias);
    }, 0);
  };

  const procesarAgregarExtra = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    const items = Object.entries(cantidadesExtras).filter(([_, q]) => q > 0);
    if (items.length === 0) {
       setErrorMessage('Debes seleccionar al menos un servicio.');
       setTimeout(() => setErrorMessage(''), 3000);
       return;
    }

    const fechas = getFechasParaExtras();
    const payload: any[] = [];
    
    items.forEach(([id, q]) => {
      fechas.forEach(fecha => {
        payload.push({
          servicioId: parseInt(id),
          cantidad: q,
          fechaUso: fecha
        });
      });
    });

    const isConfirmada = reservaParaExtra.estadoReserva?.nombreEstado === 'CONFIRMADA';
    
    try {
      // 1. Agregar los servicios a la reserva
      await apiService.agregarServicioExtraReserva(reservaParaExtra.id, payload);

      // 2. Si está confirmada, procesamos el pago por el total extra
      if (isConfirmada) {
         if (!isValidLuhn(extraForm.nroTarjeta)) {
           setErrorMessage('El número de tarjeta es inválido.');
           setTimeout(() => setErrorMessage(''), 4000);
           return;
         }
         const granTotal = calcularTotalExtras();
         const ref = 'CARD-' + extraForm.nroTarjeta.slice(-4) + '-' + Math.floor(Math.random()*10000);
         const datosTarjeta = `${extraForm.nombreTarjeta}|${extraForm.nroTarjeta}|${extraForm.exp}`;
         
         const pagoData = {
           reservaId: reservaParaExtra.id,
           formaPagoId: 1, // Tarjeta por defecto
           montoPago: granTotal,
           referenciaTransaccion: ref,
           datosTarjeta: datosTarjeta
         };
         
         await apiService.procesarPago(pagoData);
      }

      setSuccessMessage('Servicios adicionales agregados exitosamente.');
      cerrarModalExtra();
      cargarReservas();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Error al agregar el servicio.');
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  const formatearFechaHora = (fecha: string) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  return (
    <div className="container py-4 animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-dark fw-bold mb-0">Mis Reservas</h2>
          <p className="text-muted small">Visualiza y gestiona tus reservas de espacios en tiempo real</p>
        </div>
        <button className="btn btn-primary-custom btn-sm" onClick={() => navigate('/catalogo')}>
          <i className="bi bi-plus-lg me-1"></i> Nueva Reserva
        </button>
      </div>

      {successMessage && (
        <div className="alert alert-success bg-success bg-opacity-25 border-0 text-success mb-3" role="alert">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="alert alert-danger bg-danger bg-opacity-25 border-0 text-danger mb-3" role="alert">
          {errorMessage}
        </div>
      )}

      <div className="row g-4">
        
        <div className="col-lg-8">
          
          {cargando && (
            <div className="text-center py-5 glass-panel border-0">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="text-muted small mt-2">Cargando tus reservas...</p>
            </div>
          )}

          {!cargando && reservas.length === 0 && (
            <div className="text-center py-5 glass-panel border-0">
              <i className="bi bi-calendar-x text-muted display-4"></i>
              <h4 className="text-dark fw-semibold mt-3">No tienes reservas registradas</h4>
              <p className="text-muted small">Explora nuestros espacios disponibles y realiza tu primera reserva hoy mismo.</p>
              <button className="btn btn-primary-custom btn-sm mt-2" onClick={() => navigate('/catalogo')}>Ver Espacios</button>
            </div>
          )}

          {!cargando && reservas.length > 0 && (
            <div className="d-flex flex-column gap-3">
              {reservas.map(r => (
                <div key={r.id} className="card reserva-card glass-panel border-0 shadow-sm overflow-hidden" style={{ transition: 'transform 0.25s ease, box-shadow 0.25s ease', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '12px' }}>
                  <div className="row g-0">
                    <div className="col-md-4 position-relative">
                      <img src={obtenerImagenEspacio(r.espacio)} className="reserva-img w-100 h-100" style={{ objectFit: 'cover', minHeight: '150px', transition: 'transform 0.5s ease' }} alt="Espacio" />
                      <span className={`badge position-absolute top-2 
                        ${r.estadoReserva?.nombreEstado === 'CONFIRMADA' ? 'bg-success' : ''}
                        ${r.estadoReserva?.nombreEstado === 'PENDIENTE' ? 'bg-warning' : ''}
                        ${r.estadoReserva?.nombreEstado?.startsWith('CANCELADA') ? 'bg-danger' : ''}
                        ${r.estadoReserva?.nombreEstado === 'FINALIZADA' ? 'bg-info' : ''}
                      `} style={{ left: '10px', top: '10px', padding: '6px 12px', fontSize: '11px' }}>
                        {r.estadoReserva?.nombreEstado === 'CONFIRMADA' ? 'CONFIRMADA' : r.estadoReserva?.nombreEstado}
                      </span>
                    </div>
                    
                    <div className="col-md-8 p-4 d-flex flex-column justify-content-between">
                      <div>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h5 className="fw-bold text-dark mb-0">{r.espacio?.nombreEspacio}</h5>
                            <span className="badge bg-light text-muted border mt-1" style={{ fontSize: '11px' }}>
                              {r.espacio?.tipoEspacio?.nombreTipo}
                            </span>
                          </div>
                          <div className="text-end">
                            <span className="text-muted small d-block">Código</span>
                            <strong className="text-primary small">{r.codigoReserva}</strong>
                          </div>
                        </div>

                        <div 
                          className="text-muted small mb-3 d-inline-block" 
                          style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                          onClick={() => abrirMapa(r.espacio?.ubicacion)}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#0ea5e9'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#6c757d'}
                        >
                          <i className="bi bi-geo-alt-fill me-1 text-primary-custom"></i>
                          <span className="text-decoration-underline fw-medium">{r.espacio?.ubicacion?.nombreUbicacion}</span>
                        </div>
                        
                        <div className="row bg-light rounded p-2 mb-3 g-2">
                          <div className="col-6">
                            <span className="text-muted d-block" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Desde</span>
                            <strong className="text-dark small"><i className="bi bi-calendar3 me-1"></i>{formatearFechaHora(r.fechaInicioReserva)}</strong>
                          </div>
                          <div className="col-6">
                            <span className="text-muted d-block" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Hasta</span>
                            <strong className="text-dark small"><i className="bi bi-calendar3 me-1"></i>{formatearFechaHora(r.fechaFinReserva)}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="d-flex flex-column flex-xl-row justify-content-between align-items-xl-center gap-3 pt-3 border-top">
                        <div className="flex-shrink-0">
                          <span className="text-muted small d-block">Monto Total</span>
                          <strong className="fs-4 text-dark text-nowrap">S/. {Number(r.montoTotal).toFixed(2)}</strong>
                        </div>
                        <div className="d-flex flex-wrap gap-2 justify-content-xl-end">
                          {r.estadoReserva?.nombreEstado === 'PENDIENTE' && (
                            <button className="btn btn-sm py-2 px-3 d-flex align-items-center gap-1" style={{ backgroundColor: '#10b981', color: 'white', fontWeight: 600, border: 'none', borderRadius: '6px' }} onClick={() => abrirModalPago(r)}>
                              <i className="bi bi-credit-card-2-front-fill"></i> Pagar
                            </button>
                          )}
                          {['CONFIRMADA', 'FINALIZADA'].includes(r.estadoReserva?.nombreEstado?.toUpperCase() || '') && (
                            <>
                              <button className="btn btn-outline-warning btn-sm py-2 px-3 d-flex align-items-center gap-1" onClick={() => abrirModalResena(r)}>
                                <i className="bi bi-star-fill"></i> Reseña
                              </button>
                              <button className="btn btn-outline-primary btn-sm py-2 px-3 d-flex align-items-center gap-1" onClick={() => abrirModalFacturas(r)}>
                                <i className="bi bi-file-earmark-pdf-fill"></i> Comprobantes
                              </button>
                            </>
                          )}
                          {['PENDIENTE', 'CONFIRMADA'].includes(r.estadoReserva?.nombreEstado?.toUpperCase() || '') && new Date(r.fechaFinReserva) > new Date() && (
                            <button className="btn btn-outline-success btn-sm py-2 px-3 d-flex align-items-center gap-1" onClick={() => abrirModalExtra(r)}>
                              <i className="bi bi-plus-circle-fill"></i> Extra
                            </button>
                          )}
                          <button className="btn btn-outline-secondary btn-sm py-2 px-3" onClick={() => verDetalle(r)}>
                            Detalle
                          </button>
                          {['PENDIENTE', 'CONFIRMADA'].includes(r.estadoReserva?.nombreEstado?.toUpperCase() || '') && new Date(r.fechaInicioReserva) > new Date() && (
                            <button className="btn btn-outline-danger btn-sm py-2 px-3 d-flex align-items-center gap-1" onClick={() => iniciarCancelacion(r.id)}>
                              <i className="bi bi-x-circle"></i> Cancelar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
        </div>

        <div className="col-lg-4">
          <div className="card glass-panel border-0 shadow-sm p-4" style={{ position: 'sticky', top: '24px', borderRadius: '12px' }}>
            <h4 className="fw-bold text-dark mb-4">Resumen de Gastos</h4>
            
            <div className="p-3 bg-success bg-opacity-10 rounded-3 border-start border-4 border-success mb-3">
              <span className="text-success small fw-semibold d-block">Total Confirmado (Pagado)</span>
              <strong className="fs-3 text-success d-block">S/. {(reservas.filter(r => ['CONFIRMADA', 'FINALIZADA'].includes(r.estadoReserva?.nombreEstado?.toUpperCase() || '')).reduce((sum, r) => sum + Number(r.montoTotal || 0), 0)).toFixed(2)}</strong>
              <span className="text-muted" style={{ fontSize: '11px' }}>{reservas.filter(r => ['CONFIRMADA', 'FINALIZADA'].includes(r.estadoReserva?.nombreEstado?.toUpperCase() || '')).length} reservas pagadas</span>
            </div>

            <div className="p-3 bg-warning bg-opacity-10 rounded-3 border-start border-4 border-warning mb-3">
              <span className="text-warning small fw-semibold d-block">Pendiente de Pago</span>
              <strong className="fs-3 text-warning d-block">S/. {(reservas.filter(r => r.estadoReserva?.nombreEstado?.toUpperCase() === 'PENDIENTE').reduce((sum, r) => sum + Number(r.montoTotal || 0), 0)).toFixed(2)}</strong>
              <span className="text-muted" style={{ fontSize: '11px' }}>{reservas.filter(r => r.estadoReserva?.nombreEstado?.toUpperCase() === 'PENDIENTE').length} reservas pendientes</span>
            </div>

            <div className="border-top my-4"></div>

            <h5 className="fw-bold text-dark mb-3">Consumo por Categoría</h5>
            
            {gastoPorTipo.length === 0 && (
              <div className="text-center py-3">
                <p className="text-muted small mb-0">No hay gastos confirmados para clasificar.</p>
              </div>
            )}
            
            {gastoPorTipo.map((cat, idx) => (
              <div key={idx} className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="text-dark small fw-semibold">{cat.nombre}</span>
                  <span className="text-dark small font-monospace">S/. {cat.monto.toFixed(2)}</span>
                </div>
                <div className="progress" style={{ height: '6px' }}>
                  <div className="progress-bar" style={{ width: `${cat.porcentaje}%`, background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)' }} role="progressbar" aria-valuenow={cat.porcentaje} aria-valuemin={0} aria-valuemax={100}></div>
                </div>
                <span className="text-muted d-block mt-1" style={{ fontSize: '11px' }}>{cat.porcentaje}% del gasto total</span>
              </div>
            ))}

            <div className="border-top my-4"></div>

            <div className="row text-center g-2">
              <div className="col-6">
                <div className="p-2 border rounded bg-light">
                  <span className="text-muted d-block" style={{ fontSize: '11px' }}>Total Reservas</span>
                  <strong className="fs-5 text-dark">{reservas.length}</strong>
                </div>
              </div>
              <div className="col-6">
                <div className="p-2 border rounded bg-light">
                  <span className="text-muted d-block" style={{ fontSize: '11px' }}>Completadas</span>
                  <strong className="fs-5 text-dark">{reservas.filter(r => ['CONFIRMADA', 'FINALIZADA'].includes(r.estadoReserva?.nombreEstado?.toUpperCase() || '')).length}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {mostrarModalPago && (
        <div className="d-flex justify-content-center align-items-center animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 2000, backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel p-5 col-md-8 col-lg-5 overflow-auto border-0 position-relative" style={{ maxHeight: '90vh' }}>
            <button className="btn-close-custom" onClick={cerrarModalPago} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#64748b', fontSize: '20px', cursor: 'pointer' }}><i className="bi bi-x-lg"></i></button>
            
            <h3 className="text-gradient fw-bold mb-3">Realizar Pago</h3>
            <p className="text-muted small mb-4">Completa el pago para confirmar tu reserva del espacio: <strong>{reservaSeleccionada?.espacio?.nombreEspacio}</strong></p>
            
            <div className="alert alert-dark bg-dark bg-opacity-75 border-secondary border-opacity-25 text-white mb-4 d-flex justify-content-between align-items-center">
              <div>
                <span className="small text-muted d-block">Monto a pagar</span>
                <strong className="fs-4 text-gradient">S/. {Number(reservaSeleccionada?.montoTotal).toFixed(2)}</strong>
              </div>
              <div className="text-end small text-muted">
                <span>Código: {reservaSeleccionada?.codigoReserva}</span>
              </div>
            </div>

            <form onSubmit={procesarPago}>
              <div className="mb-4">
                <label className="form-label text-muted small">Método de Pago</label>
                <div className="d-flex gap-3">
                  <div className="flex-grow-1">
                    <input type="radio" className="btn-check" name="metodoPago" id="card" value="card" checked={metodoPago === 'card'} onChange={() => setMetodoPago('card')} />
                    <label className="btn btn-outline-primary w-100 py-3 d-flex flex-column align-items-center gap-1" htmlFor="card">
                      <i className="bi bi-credit-card fs-4"></i>
                      <span className="small fw-semibold">Tarjeta Crédito/Débito</span>
                    </label>
                  </div>
                  <div className="flex-grow-1">
                    <input type="radio" className="btn-check" name="metodoPago" id="transfer" value="transfer" checked={metodoPago === 'transfer'} onChange={() => setMetodoPago('transfer')} />
                    <label className="btn btn-outline-primary w-100 py-3 d-flex flex-column align-items-center gap-1" htmlFor="transfer">
                      <i className="bi bi-bank fs-4"></i>
                      <span className="small fw-semibold">Transferencia</span>
                    </label>
                  </div>
                </div>
              </div>

              {metodoPago === 'card' && (
                <div className="animate-fade-in">
                  <div className="mb-3">
                    <label className="form-label text-muted small">Nombre del Tarjetahabiente</label>
                    <input type="text" className="form-control bg-light border-0 text-dark py-2" value={pagoForm.nombreTarjeta} onChange={(e) => setPagoForm({...pagoForm, nombreTarjeta: e.target.value})} required placeholder="Ej. Juan Pérez" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted small">Número de Tarjeta</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-0 text-muted"><i className="bi bi-credit-card-fill"></i></span>
                      <input type="text" className="form-control bg-light border-0 text-dark py-2" value={pagoForm.nroTarjeta} onChange={formatCardNumber} required placeholder="4000 1234 5678 9010" maxLength={19} />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-6 mb-4">
                      <label className="form-label text-muted small">Vencimiento</label>
                      <input type="text" className="form-control bg-light border-0 text-dark py-2" value={pagoForm.exp} onChange={formatExpiry} required placeholder="MM/AA" maxLength={5} />
                    </div>
                    <div className="col-6 mb-4">
                      <label className="form-label text-muted small">CVV</label>
                      <input type="password" className="form-control bg-light border-0 text-dark py-2" value={pagoForm.cvv} onChange={(e) => setPagoForm({...pagoForm, cvv: e.target.value})} required placeholder="•••" maxLength={4} />
                    </div>
                  </div>
                </div>
              )}

              {metodoPago === 'transfer' && (
                <div className="animate-fade-in mb-4">
                  <div className="p-3 bg-light rounded-3 mb-3 border">
                    <span className="small text-muted d-block">Cuenta de Ahorros BCP (Soles)</span>
                    <strong className="text-dark">193-98765432-0-12</strong>
                    <span className="small text-muted d-block mt-2">CCI (Transferencia interbancaria)</span>
                    <strong className="text-dark">002-19309876543201214</strong>
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted small">Número de Operación / Referencia</label>
                    <input type="text" className="form-control bg-light border-0 text-dark py-2" value={pagoForm.referencia} onChange={(e) => setPagoForm({...pagoForm, referencia: e.target.value})} required placeholder="Ej. N° Operación de 6 u 8 dígitos" />
                  </div>
                </div>
              )}

              <div className="d-flex gap-3 mt-4">
                <button type="button" className="btn btn-outline-secondary w-50" onClick={cerrarModalPago}>Cancelar</button>
                <button type="submit" className="btn btn-primary-custom w-50 py-2 fw-semibold">Procesar Pago</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalResena && (
        <div className="d-flex justify-content-center align-items-center animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 2000, backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel p-5 col-md-8 col-lg-5 overflow-auto border-0 position-relative" style={{ maxHeight: '90vh' }}>
            <button className="btn-close-custom" onClick={cerrarModalResena} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#64748b', fontSize: '20px', cursor: 'pointer' }}><i className="bi bi-x-lg"></i></button>
            
            <h3 className="text-gradient fw-bold mb-3">Deja tu Reseña</h3>
            <p className="text-muted small mb-4">¿Cómo fue tu experiencia en <strong>{reservaParaResena?.espacio?.nombreEspacio}</strong>?</p>
            
            <form onSubmit={enviarResena}>
              <div className="mb-4 text-center">
                <label className="form-label text-muted small d-block">Calificación General</label>
                <div className="d-flex justify-content-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <i 
                      key={star} 
                      className={`bi ${star <= resenaForm.calificacion ? 'bi-star-fill text-warning' : 'bi-star text-muted'} fs-2`}
                      style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      onClick={() => setResenaForm({ ...resenaForm, calificacion: star })}
                    ></i>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label text-muted small">Cuéntanos más (Opcional)</label>
                <textarea 
                  className="form-control bg-light border-0 text-dark p-3" 
                  rows={4} 
                  placeholder="¿Qué te gustó más del espacio? ¿Algo podría mejorar?"
                  value={resenaForm.comentario} 
                  onChange={(e) => setResenaForm({ ...resenaForm, comentario: e.target.value })}
                ></textarea>
              </div>

              <div className="d-flex gap-3 mt-4">
                <button type="button" className="btn btn-outline-secondary w-50" onClick={cerrarModalResena}>Cancelar</button>
                <button type="submit" className="btn btn-primary-custom w-50 py-2 fw-semibold">Enviar Reseña</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalDetalle && detalleReserva && (
        <div className="d-flex justify-content-center align-items-center animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 2000, backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel p-4 col-11 col-md-8 col-lg-4 overflow-auto border-0 position-relative shadow-lg" style={{ maxHeight: '90vh', borderRadius: '16px' }}>
            <button className="btn-close-custom" onClick={cerrarModalDetalle} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#64748b', fontSize: '20px', cursor: 'pointer' }}><i className="bi bi-x-lg"></i></button>
            
            <div className="text-center mb-4 mt-2">
              <div className="d-inline-flex justify-content-center align-items-center rounded-circle mb-3 shadow-sm" style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%)' }}>
                <i className="bi bi-info-circle fs-3 text-primary-custom"></i>
              </div>
              <h4 className="fw-bold text-dark mb-1">Detalles de Reserva</h4>
              <p className="text-muted small mb-0">Código: <span className="text-primary-custom fw-semibold">{detalleReserva.codigoReserva || detalleReserva.id}</span></p>
            </div>
            
            <div className="p-3 bg-light rounded-4 mb-4 border">
              <div className="d-flex align-items-center mb-3 pb-3 border-bottom">
                <div className="flex-shrink-0">
                  <img src={obtenerImagenEspacio(detalleReserva.espacio)} alt="Espacio" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }} />
                </div>
                <div className="ms-3 flex-grow-1">
                  <h6 className="fw-bold text-dark mb-1">{detalleReserva.espacio?.nombreEspacio}</h6>
                  <p className="text-muted small mb-0"><i className="bi bi-geo-alt-fill me-1 text-primary-custom"></i>{detalleReserva.espacio?.ubicacion?.nombreUbicacion}</p>
                </div>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-6">
                  <span className="text-muted d-block mb-1" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Check-in</span>
                  <div className="d-flex align-items-center">
                    <i className="bi bi-calendar-check text-success me-2"></i>
                    <strong className="text-dark small" style={{ fontSize: '13px' }}>{formatearFechaHora(detalleReserva.fechaInicioReserva)}</strong>
                  </div>
                </div>
                <div className="col-6">
                  <span className="text-muted d-block mb-1" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Check-out</span>
                  <div className="d-flex align-items-center">
                    <i className="bi bi-calendar-x text-danger me-2"></i>
                    <strong className="text-dark small" style={{ fontSize: '13px' }}>{formatearFechaHora(detalleReserva.fechaFinReserva)}</strong>
                  </div>
                </div>
              </div>
              
              <div className="border-top pt-3 mt-2">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted small">Estado:</span>
                  <span className={`badge rounded-pill px-3 py-1 fw-medium
                        ${detalleReserva.estadoReserva?.nombreEstado === 'CONFIRMADA' ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-25' : ''}
                        ${detalleReserva.estadoReserva?.nombreEstado === 'PENDIENTE' ? 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25' : ''}
                        ${detalleReserva.estadoReserva?.nombreEstado?.startsWith('CANCELADA') ? 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25' : ''}
                        ${detalleReserva.estadoReserva?.nombreEstado === 'FINALIZADA' ? 'bg-info bg-opacity-10 text-info border border-info border-opacity-25' : ''}
                  `}>
                    {detalleReserva.estadoReserva?.nombreEstado}
                  </span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted small">Total a pagar:</span>
                  <strong className="fs-5 text-dark fw-bold">S/. {Number(detalleReserva.montoTotal).toFixed(2)}</strong>
                </div>
              </div>

              {detalleReserva.reservaServicios && detalleReserva.reservaServicios.length > 0 && (
                <div className="border-top pt-3 mt-3">
                  <h6 className="fw-bold text-dark mb-2"><i className="bi bi-box-seam me-2 text-primary"></i>Servicios Adicionales</h6>
                  <ul className="list-group list-group-flush border rounded overflow-hidden shadow-sm">
                    {detalleReserva.reservaServicios.map((rs: any, idx: number) => (
                      <li key={idx} className="list-group-item d-flex justify-content-between align-items-center bg-white p-3">
                        <div>
                          <span className="fw-semibold text-dark d-block mb-1">{rs.servicioAdicional?.nombre} (x{rs.cantidad})</span>
                          {rs.fechaUso && (
                            <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill fw-medium px-2 py-1">
                              <i className="bi bi-calendar-event me-1"></i>
                              {new Date(rs.fechaUso + 'T00:00:00').toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <span className="text-dark fw-bold font-monospace">S/. {Number(rs.subtotal).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {detalleReserva.observaciones && (
              <div className="mb-4">
                <h6 className="fw-semibold text-dark small mb-2"><i className="bi bi-card-text me-2 text-muted"></i>Observaciones:</h6>
                <div className="p-3 bg-white rounded-3 border shadow-sm small text-muted fst-italic">
                  "{detalleReserva.observaciones}"
                </div>
              </div>
            )}
            
              <div className="text-center mt-2">
              <button className="btn btn-primary-custom w-100 py-2 fw-semibold rounded-pill shadow-sm" onClick={cerrarModalDetalle}>Cerrar Detalles</button>
            </div>
          </div>
        </div>
      )}

      {mostrarModalExtra && reservaParaExtra && (
        <div className="d-flex justify-content-center align-items-center animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.5)', zIndex: 2000, backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel p-4 col-11 col-md-8 col-lg-5 overflow-auto border-0 position-relative shadow-lg" style={{ maxHeight: '90vh', borderRadius: '16px' }}>
            <button className="btn-close-custom" onClick={cerrarModalExtra} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#64748b', fontSize: '20px', cursor: 'pointer' }}><i className="bi bi-x-lg"></i></button>
            
            <h3 className="text-gradient fw-bold mb-3">Añadir Servicio Extra</h3>
            <p className="text-muted small mb-4">Añade equipos adicionales para un día específico de tu reserva en <strong>{reservaParaExtra.espacio?.nombreEspacio}</strong>.</p>
            
            <form onSubmit={procesarAgregarExtra}>
              <div className="mb-4">
                <label className="form-label text-muted small fw-semibold mb-2">Duración del Servicio Extra</label>
                <div className="d-flex gap-3 mb-3">
                  <div className="form-check">
                    <input className="form-check-input" type="radio" name="duracionExtra" id="duracionDia" checked={tipoDuracionExtra === 'dia'} onChange={() => setTipoDuracionExtra('dia')} />
                    <label className="form-check-label small" htmlFor="duracionDia">
                      Solo un día específico
                    </label>
                  </div>
                  <div className="form-check">
                    <input className="form-check-input" type="radio" name="duracionExtra" id="duracionReserva" checked={tipoDuracionExtra === 'reserva'} onChange={() => setTipoDuracionExtra('reserva')} />
                    <label className="form-check-label small" htmlFor="duracionReserva">
                      Toda la reserva restante
                    </label>
                  </div>
                </div>

                {tipoDuracionExtra === 'dia' ? (
                  <div className="animate-fade-in">
                    <label className="form-label text-muted small fw-semibold">Seleccionar Fecha</label>
                    <input 
                      type="date" 
                      className="form-control border py-2" 
                      value={fechaGlobal} 
                      onChange={(e) => setFechaGlobal(e.target.value)}
                      min={new Date(Math.max(new Date(reservaParaExtra.fechaInicioReserva).getTime(), new Date().getTime())).toISOString().split('T')[0]}
                      max={reservaParaExtra.fechaFinReserva?.split('T')[0]}
                      required 
                    />
                    <div className="form-text" style={{fontSize: '10px'}}>Debe estar dentro de los días de tu reserva.</div>
                  </div>
                ) : (
                  <div className="p-3 bg-light border rounded small text-muted animate-fade-in">
                    <i className="bi bi-info-circle me-2"></i>
                    Se añadirán los servicios seleccionados para todos los días restantes de la reserva (<strong>{getFechasParaExtras().length} días</strong> en total). El costo se multiplicará por esta cantidad de días.
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="form-label text-muted small fw-semibold mb-3">Servicios Disponibles</label>
                <div className="d-flex flex-column gap-2">
                  {serviciosAdicionales.map(srv => {
                    const q = cantidadesExtras[srv.id] || 0;
                    return (
                      <div key={srv.id} className={`d-flex justify-content-between align-items-center p-3 border rounded-3 transition-all ${q > 0 ? 'border-primary bg-primary bg-opacity-10' : 'bg-white'}`}>
                        <div>
                          <div className="fw-semibold text-dark">{srv.nombre}</div>
                          <div className="text-muted small">S/. {srv.precioBase.toFixed(2)} / día</div>
                        </div>
                        <div className="d-flex align-items-center gap-3">
                          <button type="button" className="btn btn-sm btn-outline-secondary rounded-circle" style={{width: '32px', height: '32px'}} onClick={() => handleDecrement(srv.id)}>
                            <i className="bi bi-dash"></i>
                          </button>
                          <span className="fw-bold" style={{minWidth: '20px', textAlign: 'center'}}>{q}</span>
                          <button type="button" className="btn btn-sm btn-outline-primary rounded-circle" style={{width: '32px', height: '32px'}} onClick={() => handleIncrement(srv.id)}>
                            <i className="bi bi-plus"></i>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-primary bg-opacity-10 rounded-3 mb-4 border border-primary border-opacity-25 d-flex justify-content-between align-items-center">
                <span className="text-primary fw-semibold small">Gran Total Extras:</span>
                <strong className="text-primary fs-5">S/. {calcularTotalExtras().toFixed(2)}</strong>
              </div>

              {reservaParaExtra.estadoReserva?.nombreEstado === 'CONFIRMADA' && (
                <div className="border-top pt-4 mb-2 animate-fade-in">
                  <h6 className="fw-bold text-dark mb-3"><i className="bi bi-credit-card-2-front-fill me-2 text-primary"></i>Datos de Pago</h6>
                  <p className="small text-muted mb-3">Tu reserva ya está pagada. Para añadir este servicio, por favor ingresa los datos de tu tarjeta para cobrar el subtotal.</p>
                  
                  <div className="mb-3">
                    <input type="text" className="form-control bg-light border-0 py-2 text-dark" placeholder="Nombre en la Tarjeta" value={extraForm.nombreTarjeta} onChange={(e) => setExtraForm({...extraForm, nombreTarjeta: e.target.value})} required />
                  </div>
                  <div className="mb-3">
                    <input type="text" className="form-control bg-light border-0 py-2 text-dark" placeholder="Número de Tarjeta (16 dígitos)" maxLength={19} value={extraForm.nroTarjeta} onChange={formatExtraCardNumber} required />
                  </div>
                  <div className="row g-2 mb-2">
                    <div className="col-6">
                      <input type="text" className="form-control bg-light border-0 py-2 text-dark" placeholder="MM/AA" maxLength={5} value={extraForm.exp} onChange={formatExtraExpiry} required />
                    </div>
                    <div className="col-6">
                      <input type="password" className="form-control bg-light border-0 py-2 text-dark" placeholder="CVV" maxLength={4} value={extraForm.cvv} onChange={(e) => setExtraForm({...extraForm, cvv: e.target.value})} required />
                    </div>
                  </div>
                </div>
              )}

              <div className="d-flex gap-3 mt-4">
                <button type="button" className="btn btn-outline-secondary w-50 py-2 fw-semibold" onClick={cerrarModalExtra}>Cancelar</button>
                <button type="submit" className="btn btn-primary-custom w-50 py-2 fw-semibold">
                  {reservaParaExtra.estadoReserva?.nombreEstado === 'CONFIRMADA' ? 'Pagar y Añadir Todos' : 'Añadir Todos'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalFacturas && reservaParaFacturas && (
        <div className="d-flex justify-content-center align-items-center animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.5)', zIndex: 2000, backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel p-4 col-11 col-md-6 col-lg-4 overflow-auto border-0 position-relative shadow-lg" style={{ maxHeight: '90vh', borderRadius: '16px' }}>
            <button className="btn-close-custom" onClick={cerrarModalFacturas} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#64748b', fontSize: '20px', cursor: 'pointer' }}><i className="bi bi-x-lg"></i></button>
            
            <h4 className="text-gradient fw-bold mb-3"><i className="bi bi-receipt me-2"></i>Tus Comprobantes</h4>
            <p className="text-muted small mb-4">Descarga el comprobante principal de tu alquiler o los recibos de los servicios adicionales solicitados.</p>
            
            <div className="d-flex flex-column gap-3 mb-4">
              {/* Factura Base */}
              <div className="d-flex justify-content-between align-items-center p-3 border rounded bg-white shadow-sm hover-shadow transition">
                <div>
                  <strong className="d-block text-dark mb-1">Comprobante de Alquiler</strong>
                  <span className="text-muted small">Alquiler de {reservaParaFacturas.espacio?.nombreEspacio}</span>
                </div>
                <button className="btn btn-primary-custom btn-sm px-3" onClick={descargarBoletaBase}>
                  <i className="bi bi-download"></i>
                </button>
              </div>

              {/* Facturas de Extras */}
              {reservaParaFacturas.reservaServicios && reservaParaFacturas.reservaServicios.map((rs: any, idx: number) => (
                <div key={idx} className="d-flex justify-content-between align-items-center p-3 border rounded bg-white shadow-sm hover-shadow transition">
                  <div>
                    <strong className="d-block text-dark mb-1">Comprobante de Servicio Extra</strong>
                    <span className="text-muted small">{rs.servicioAdicional?.nombre} (x{rs.cantidad})</span>
                  </div>
                  <button className="btn btn-outline-primary btn-sm px-3" onClick={() => descargarBoletaExtra(rs, idx)}>
                    <i className="bi bi-download"></i>
                  </button>
                </div>
              ))}
            </div>

            <div className="text-center mt-2">
              <button className="btn btn-light w-100 py-2 fw-semibold border" onClick={cerrarModalFacturas}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {modalMapaOpen && sedeSeleccionada && (
        <div className="d-flex justify-content-center align-items-center animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 2000, backdropFilter: 'blur(4px)' }}>
          <div className="w-100" style={{ maxWidth: '600px' }}>
            <div className="card border-0 rounded-4 shadow-lg overflow-hidden glass-panel m-3">
              <div className="card-header bg-white border-bottom-0 py-3 px-4 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold d-flex align-items-center">
                  <i className="bi bi-geo-alt-fill text-danger me-2"></i>
                  Ubicación: {sedeSeleccionada.nombreUbicacion}
                </h5>
                <button type="button" className="btn-close" onClick={() => setModalMapaOpen(false)}></button>
              </div>
              <div className="card-body p-0">
                {sedeSeleccionada.urlGoogleMaps && sedeSeleccionada.urlGoogleMaps.includes('<iframe') ? (
                  <div 
                    className="w-100" 
                    style={{ height: '350px' }}
                    dangerouslySetInnerHTML={{ __html: sedeSeleccionada.urlGoogleMaps }}
                  />
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
                      <div className="position-absolute top-0 start-0 m-3">
                        <a href={sedeSeleccionada.urlGoogleMaps} target="_blank" rel="noopener noreferrer" className="btn btn-light btn-sm shadow text-primary fw-semibold d-flex align-items-center gap-1">
                          Abrir en Maps <i className="bi bi-box-arrow-up-right"></i>
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
                      <p className="mb-0 text-muted small">{sedeSeleccionada.ciudad}, {sedeSeleccionada.pais || 'Peru'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    
      {reservaACancelar && (
        <div className="d-flex justify-content-center align-items-center animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', zIndex: 9999, backdropFilter: 'blur(5px)' }}>
          <div className="bg-white p-4 rounded-4 shadow-lg text-center" style={{ maxWidth: '400px', width: '90%', position: 'relative' }}>
            <div className="mb-3">
              <div className="d-inline-flex justify-content-center align-items-center bg-danger bg-opacity-10 rounded-circle mb-3" style={{ width: '64px', height: '64px' }}>
                <i className="bi bi-exclamation-triangle text-danger fs-1"></i>
              </div>
              <h4 className="fw-bold text-dark mb-2">¿Cancelar Reserva?</h4>
              <p className="text-muted small mb-0">Esta acción cambiará el estado de la reserva a "CANCELADA" y no se podrá deshacer.</p>
            </div>
            <div className="d-flex gap-3 mt-4">
              <button className="btn btn-light w-50 fw-semibold text-muted border" onClick={cerrarModalCancelacion}>Volver</button>
              <button className="btn btn-danger w-50 fw-semibold shadow-sm" onClick={confirmarCancelacion}>Sí, Cancelar</button>
            </div>
          </div>
        </div>
      )}
</div>
  );
};

export default MisReservas;
