import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { extractApiError } from '../types';

interface ReservationPaymentModalProps {
  /** Data needed to create the reservation */
  reservaData: {
    usuarioId: number;
    espacioId: number;
    fechaInicio?: string;
    fechaFin?: string;
    montoTotal: number;
    descuentoAplicado: number;
    observaciones: string;
    asistentes: number;
    serviciosAdicionales: Record<number, number>;
  };
  /** Billing info from TermsModal */
  datosFacturacion: {
    tipoComprobante: string;
    documento: string;
    razonSocial: string;
    direccion: string;
  };
  onClose: () => void;
}

const isValidLuhn = (num: string): boolean => {
  const cleanNum = num.replace(/\D/g, '');
  if (!cleanNum) return false;
  let sum = 0, isEven = false;
  for (let i = cleanNum.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNum.charAt(i), 10);
    if (isEven) { digit *= 2; if (digit > 9) digit -= 9; }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
};

const isValidExpiry = (exp: string): boolean => {
  const clean = exp.replace(/\D/g, '');
  if (clean.length !== 4) return false;
  const month = parseInt(clean.substring(0, 2), 10);
  const year = parseInt(clean.substring(2, 4), 10) + 2000;
  if (month < 1 || month > 12) return false;
  const now = new Date();
  return new Date(year, month, 0) >= new Date(now.getFullYear(), now.getMonth(), 1);
};

const isValidCVV = (cvv: string): boolean => /^\d{3,4}$/.test(cvv);

const ReservationPaymentModal: React.FC<ReservationPaymentModalProps> = ({ reservaData, datosFacturacion, onClose }) => {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [metodoPago, setMetodoPago] = useState<'card' | 'transfer'>('card');
  const [nombreTarjeta, setNombreTarjeta] = useState('');
  const [nroTarjeta, setNroTarjeta] = useState('');
  const [exp, setExp] = useState('');
  const [cvv, setCvv] = useState('');
  const [referencia, setReferencia] = useState('');

  const formatCardNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '').slice(0, 16);
    setNroTarjeta(input.match(/.{1,4}/g)?.join(' ') || input);
  };

  const formatExpiry = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (input.length > 2) input = input.substring(0, 2) + '/' + input.substring(2);
    setExp(input);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (metodoPago === 'card') {
      if (!isValidLuhn(nroTarjeta)) { setError('El número de tarjeta no es válido.'); return; }
      if (!isValidExpiry(exp)) { setError('La fecha de expiración es inválida.'); return; }
      if (!isValidCVV(cvv)) { setError('El CVV debe tener 3 o 4 dígitos.'); return; }
      if (!nombreTarjeta.trim()) { setError('Ingresa el nombre del titular.'); return; }
    }

    setCargando(true);

    const body = {
      ...reservaData,
      tipoComprobante: datosFacturacion.tipoComprobante,
      documentoIdentidad: datosFacturacion.documento,
      razonSocial: datosFacturacion.razonSocial,
      direccion: datosFacturacion.direccion
    };

    try {
      // 1. Crear reserva
      const resReserva = await apiService.crearReserva(body);
      const reservaCreada = resReserva.data;

      // 2. Procesar pago
      const formaPagoId = metodoPago === 'card' ? 1 : 3;
      const ref = metodoPago === 'card'
        ? 'CARD-' + nroTarjeta.slice(-4) + '-' + Math.floor(Math.random() * 10000)
        : referencia;

      await apiService.procesarPago({
        reservaId: reservaCreada.id,
        formaPagoId,
        montoPago: reservaData.montoTotal,
        referenciaTransaccion: ref
      });

      onClose();
      setTimeout(() => navigate('/mis-reservas'), 200);
    } catch (err: unknown) {
      setError(extractApiError(err));
      setCargando(false);
    }
  };

  return (
    <div className="modal-overlay d-flex justify-content-center align-items-center animate-fade-in" style={{ position: 'fixed', inset: 0, zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white p-4 rounded-4 shadow-lg" style={{ width: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0"><i className="bi bi-credit-card me-2 text-primary"></i>Pasarela de Pago</h5>
          <button className="btn-close" onClick={onClose} disabled={cargando}></button>
        </div>

        <div className="bg-light rounded-3 p-3 mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <small className="text-muted d-block">Monto a pagar</small>
              <strong className="fs-4">S/. {reservaData.montoTotal.toFixed(2)}</strong>
            </div>
            <small className="text-muted text-end">
              {reservaData.asistentes} asistente{reservaData.asistentes > 1 ? 's' : ''}
            </small>
          </div>
        </div>

        {error && <div className="alert alert-danger py-2 small">{error}</div>}

        {cargando ? (
          <div className="d-flex flex-column align-items-center py-5">
            <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }} />
            <p className="text-muted fw-semibold mb-0">Procesando tu reserva y pago...</p>
            <small className="text-muted">Por favor no cierres esta ventana.</small>
          </div>
        ) : (
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="mb-3">
              <label className="form-label text-muted small">Método de pago</label>
              <div className="d-flex gap-2">
                <button type="button" className={`btn flex-fill ${metodoPago === 'card' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setMetodoPago('card')}>
                  <i className="bi bi-credit-card me-1"></i> Tarjeta
                </button>
                <button type="button" className={`btn flex-fill ${metodoPago === 'transfer' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setMetodoPago('transfer')}>
                  <i className="bi bi-bank me-1"></i> Transferencia
                </button>
              </div>
            </div>

            {metodoPago === 'card' && (
              <>
                <div className="mb-3">
                  <label className="form-label text-muted small">Nombre del Titular</label>
                  <input type="text" className="form-control bg-light border-0 py-2" value={nombreTarjeta} onChange={e => setNombreTarjeta(e.target.value)} required placeholder="Ej. Juan Pérez" autoComplete="cc-name" />
                </div>
                <div className="mb-3">
                  <label className="form-label text-muted small">Número de Tarjeta</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-0 text-muted"><i className="bi bi-credit-card-fill"></i></span>
                    <input type="text" className="form-control bg-light border-0 py-2" value={nroTarjeta} onChange={formatCardNumber} required placeholder="4000 1234 5678 9010" maxLength={19} autoComplete="cc-number" />
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label text-muted small">Expiración</label>
                    <input type="text" className="form-control bg-light border-0 py-2" value={exp} onChange={formatExpiry} required placeholder="MM/AA" maxLength={5} autoComplete="cc-exp" />
                  </div>
                  <div className="col-6">
                    <label className="form-label text-muted small">CVV</label>
                    <input type="password" className="form-control bg-light border-0 py-2" value={cvv} onChange={e => setCvv(e.target.value)} required placeholder="•••" maxLength={4} autoComplete="cc-csc" />
                  </div>
                </div>
              </>
            )}

            {metodoPago === 'transfer' && (
              <div className="mb-3">
                <div className="p-3 bg-light rounded-3 mb-3 border">
                  <small className="text-muted d-block">Cuenta de Ahorros BCP (Soles)</small>
                  <strong>193-98765432-0-12</strong>
                  <small className="text-muted d-block mt-2">CCI (Transferencia interbancaria)</small>
                  <strong>002-19309876543201214</strong>
                </div>
                <label className="form-label text-muted small">Número de Operación / Referencia</label>
                <input type="text" className="form-control bg-light border-0 py-2" value={referencia} onChange={e => setReferencia(e.target.value)} required placeholder="Ej. 981240" />
              </div>
            )}

            <div className="d-flex gap-2 mt-4">
              <button type="button" className="btn btn-outline-secondary w-50 py-2" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-success w-50 py-2 fw-semibold">
                Pagar y Reservar — S/. {reservaData.montoTotal.toFixed(2)}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReservationPaymentModal;
