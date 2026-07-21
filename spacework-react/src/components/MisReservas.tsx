import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import ReviewModal from './ReviewModal';
import PaymentModal from './PaymentModal';
import ExtraServiceModal from './ExtraServiceModal';
import ReservationDetailModal from './ReservationDetailModal';
import InvoiceModal from './InvoiceModal';
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
      const reservasArray = Array.isArray(data) ? data : (data?.content || []);
      setReservas([...reservasArray].sort((a: any, b: any) => (b?.id || 0) - (a?.id || 0)));
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

      {mostrarModalPago && reservaSeleccionada && (
        <PaymentModal
          reservaId={reservaSeleccionada.id}
          montoTotal={Number(reservaSeleccionada.montoTotal)}
          onClose={cerrarModalPago}
          onSuccess={() => {
            setSuccessMessage('Pago procesado exitosamente.');
            setTimeout(() => setSuccessMessage(''), 4000);
            cargarReservas();
          }}
        />
      )}

      {mostrarModalResena && reservaParaResena && (
        <ReviewModal
          reservaId={reservaParaResena.id}
          onClose={cerrarModalResena}
          onSuccess={() => {
            setSuccessMessage('Reseña guardada exitosamente.');
            setTimeout(() => setSuccessMessage(''), 4000);
          }}
        />
      )}

      {mostrarModalDetalle && detalleReserva && (
        <ReservationDetailModal reserva={detalleReserva} onClose={cerrarModalDetalle} />
      )}

      {mostrarModalExtra && reservaParaExtra && (
        <ExtraServiceModal
          reserva={reservaParaExtra}
          onClose={cerrarModalExtra}
          onSuccess={() => {
            setSuccessMessage('Servicios adicionales agregados.');
            setTimeout(() => setSuccessMessage(''), 4000);
            cargarReservas();
          }}
        />
      )}

      {mostrarModalFacturas && reservaParaFacturas && (
        <InvoiceModal
          reserva={reservaParaFacturas}
          onClose={cerrarModalFacturas}
          descargarBoletaBase={descargarBoletaBase}
          descargarBoletaExtra={descargarBoletaExtra}
        />
      )}

      {modalMapaOpen && sedeSeleccionada && (
        <div className="modal-overlay d-flex align-items-center justify-content-center" style={{ position: 'fixed', inset: 0, zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-white rounded-4 shadow-lg overflow-hidden" style={{ maxWidth: '600px', width: '90%' }}>
            <div className="p-3 d-flex justify-content-between align-items-center border-bottom">
              <h6 className="fw-bold mb-0"><i className="bi bi-geo-alt text-danger me-2"></i>{sedeSeleccionada.nombreUbicacion}</h6>
              <button className="btn-close" onClick={() => setModalMapaOpen(false)}></button>
            </div>
            <div style={{ height: '350px' }}>
              {sedeSeleccionada.urlGoogleMaps?.includes('<iframe') ? (
                <div dangerouslySetInnerHTML={{ __html: sedeSeleccionada.urlGoogleMaps }} style={{ height: '100%' }} />
              ) : (
                <iframe
                  width="100%" height="100%" frameBorder="0"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(
                    (sedeSeleccionada.latitud && sedeSeleccionada.longitud)
                      ? `${sedeSeleccionada.latitud},${sedeSeleccionada.longitud}`
                      : [sedeSeleccionada.direccion, sedeSeleccionada.ciudad, sedeSeleccionada.pais].filter(Boolean).join(', ')
                  )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  allowFullScreen
                ></iframe>
              )}
            </div>
            <div className="p-3 border-top">
              <p className="mb-0 fw-bold small">{sedeSeleccionada.direccion || 'Dirección no especificada'}</p>
              <small className="text-muted">{sedeSeleccionada.ciudad}, {sedeSeleccionada.pais || 'Perú'}</small>
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
