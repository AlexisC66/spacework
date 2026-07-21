import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { extractApiError } from '../types';

interface ExtraServiceModalProps {
  reserva: any;
  onClose: () => void;
  onSuccess: () => void;
}

const isValidLuhn = (num: string): boolean => {
  const digits = num.replace(/\D/g, '');
  if (!digits || digits.length < 13) return false;
  let sum = 0, alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits.charAt(i), 10);
    if (alternate) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
};

const ExtraServiceModal: React.FC<ExtraServiceModalProps> = ({ reserva, onClose, onSuccess }) => {
  const [servicios, setServicios] = useState<any[]>([]);
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [tipoDuracion, setTipoDuracion] = useState<'dia' | 'reserva'>('dia');
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Datos de tarjeta (solo si la reserva ya está confirmada)
  const [nombreTarjeta, setNombreTarjeta] = useState('');
  const [nroTarjeta, setNroTarjeta] = useState('');
  const [exp, setExp] = useState('');
  const [cvv, setCvv] = useState('');

  useEffect(() => {
    apiService.getServiciosAdicionales().then(res => {
      const activos = Array.isArray(res.data) ? res.data.filter((s: any) => s.estado) : (res.data?.content || []);
      setServicios(activos);
    }).catch(() => setError('Error al cargar servicios.'));
  }, []);

  const handleIncrement = (id: number) => setCantidades(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const handleDecrement = (id: number) => setCantidades(prev => {
    const next = { ...prev };
    if (next[id] > 1) next[id]--;
    else delete next[id];
    return next;
  });

  const getFechas = (): string[] => {
    if (tipoDuracion === 'dia') return fechaSeleccionada ? [fechaSeleccionada] : [];
    const fechas: string[] = [];
    const start = new Date(Math.max(new Date(reserva.fechaInicioReserva).getTime(), new Date().getTime()));
    const end = new Date(reserva.fechaFinReserva);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      fechas.push(d.toISOString().split('T')[0]);
    }
    return fechas;
  };

  const calcularTotal = (): number => {
    const dias = getFechas().length;
    return servicios.reduce((acc, srv) => {
      const q = cantidades[srv.id] || 0;
      return acc + (srv.precioBase * q * (tipoDuracion === 'dia' ? 1 : dias));
    }, 0);
  };

  const formatCardNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '').slice(0, 16);
    setNroTarjeta(input.match(/.{1,4}/g)?.join(' ') || input);
  };

  const formatExpiry = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (input.length >= 2) input = input.slice(0, 2) + '/' + input.slice(2);
    setExp(input);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const items = Object.entries(cantidades).filter(([_, q]) => q > 0);
    if (items.length === 0) { setError('Selecciona al menos un servicio.'); return; }

    setEnviando(true);
    try {
      const fechas = getFechas();
      const payload = items.flatMap(([idStr, q]) =>
        fechas.map(f => ({ servicioId: Number(idStr), cantidad: q, fechaUso: f }))
      );

      await apiService.agregarServicioExtraReserva(reserva.id, payload);

      const isConfirmada = reserva.estadoReserva?.nombreEstado === 'CONFIRMADA';
      if (isConfirmada) {
        if (!isValidLuhn(nroTarjeta)) { setError('Número de tarjeta inválido.'); setEnviando(false); return; }
        const ref = 'CARD-' + nroTarjeta.slice(-4) + '-' + Math.floor(Math.random() * 10000);
        await apiService.procesarPago({
          reservaId: reserva.id,
          formaPagoId: 1,
          montoPago: calcularTotal(),
          referenciaTransaccion: ref
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setEnviando(false);
    }
  };

  const isConfirmada = reserva.estadoReserva?.nombreEstado === 'CONFIRMADA';
  const minDate = new Date(Math.max(new Date(reserva.fechaInicioReserva).getTime(), new Date().getTime())).toISOString().split('T')[0];
  const maxDate = reserva.fechaFinReserva?.split('T')[0];

  return (
    <div className="modal-overlay d-flex align-items-center justify-content-center" style={{ position: 'fixed', inset: 0, zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white p-4 rounded-4 shadow-lg" style={{ width: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0"><i className="bi bi-box-seam text-primary me-2"></i>Servicios Extra</h5>
          <button className="btn-close" onClick={onClose}></button>
        </div>
        <p className="text-muted small mb-3">Para: <strong>{reserva.espacio?.nombreEspacio}</strong></p>

        {error && <div className="alert alert-danger py-2 small">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label text-muted small fw-semibold">Duración</label>
            <div className="d-flex gap-3 mb-2">
              <div className="form-check">
                <input className="form-check-input" type="radio" id="durDia" checked={tipoDuracion === 'dia'} onChange={() => setTipoDuracion('dia')} />
                <label className="form-check-label small" htmlFor="durDia">Solo un día</label>
              </div>
              <div className="form-check">
                <input className="form-check-input" type="radio" id="durTodo" checked={tipoDuracion === 'reserva'} onChange={() => setTipoDuracion('reserva')} />
                <label className="form-check-label small" htmlFor="durTodo">Toda la reserva</label>
              </div>
            </div>
            {tipoDuracion === 'dia' && (
              <input type="date" className="form-control" value={fechaSeleccionada} onChange={e => setFechaSeleccionada(e.target.value)} min={minDate} max={maxDate} required />
            )}
            {tipoDuracion === 'reserva' && (
              <small className="text-muted">Se añadirá para los {getFechas().length} días restantes.</small>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label text-muted small fw-semibold">Servicios</label>
            {servicios.map(srv => {
              const q = cantidades[srv.id] || 0;
              return (
                <div key={srv.id} className={`d-flex justify-content-between align-items-center p-2 mb-1 border rounded-3 ${q > 0 ? 'border-primary bg-primary bg-opacity-10' : ''}`}>
                  <div>
                    <div className="fw-semibold small">{srv.nombre}</div>
                    <small className="text-muted">S/. {srv.precioBase.toFixed(2)} / día</small>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <button type="button" className="btn btn-sm btn-outline-secondary rounded-circle p-1" style={{width: '30px', height: '30px'}} onClick={() => handleDecrement(srv.id)} disabled={q === 0}><i className="bi bi-dash"></i></button>
                    <span className="fw-bold small" style={{minWidth: '18px', textAlign: 'center'}}>{q}</span>
                    <button type="button" className="btn btn-sm btn-outline-primary rounded-circle p-1" style={{width: '30px', height: '30px'}} onClick={() => handleIncrement(srv.id)}><i className="bi bi-plus"></i></button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-2 bg-primary bg-opacity-10 rounded-3 mb-3 d-flex justify-content-between">
            <span className="fw-semibold small">Total:</span>
            <strong className="text-primary">S/. {calcularTotal().toFixed(2)}</strong>
          </div>

          {isConfirmada && (
            <div className="border-top pt-3 mb-3">
              <h6 className="fw-bold small mb-2"><i className="bi bi-credit-card me-1"></i>Datos de pago</h6>
              <input type="text" className="form-control form-control-sm mb-2" placeholder="Nombre en tarjeta" value={nombreTarjeta} onChange={e => setNombreTarjeta(e.target.value)} required />
              <input type="text" className="form-control form-control-sm mb-2" placeholder="Número de tarjeta" maxLength={19} value={nroTarjeta} onChange={formatCardNumber} required />
              <div className="row g-2">
                <div className="col-6"><input type="text" className="form-control form-control-sm" placeholder="MM/AA" maxLength={5} value={exp} onChange={formatExpiry} required /></div>
                <div className="col-6"><input type="password" className="form-control form-control-sm" placeholder="CVV" maxLength={4} value={cvv} onChange={e => setCvv(e.target.value)} required /></div>
              </div>
            </div>
          )}

          <div className="d-flex gap-2">
            <button type="button" className="btn btn-outline-secondary w-50 py-2" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary w-50 py-2 fw-semibold" disabled={enviando}>
              {enviando ? 'Procesando...' : isConfirmada ? 'Pagar y Añadir' : 'Añadir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExtraServiceModal;
