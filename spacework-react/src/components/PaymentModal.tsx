import React, { useState } from 'react';
import { apiService } from '../services/api';
import { extractApiError } from '../types';

interface PaymentModalProps {
  reservaId: number;
  montoTotal: number;
  onClose: () => void;
  onSuccess: () => void;
}

const isValidLuhn = (num: string): boolean => {
  const digits = num.replace(/\D/g, '');
  if (!digits || digits.length < 13) return false;
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits.charAt(i), 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
};

const PaymentModal: React.FC<PaymentModalProps> = ({ reservaId, montoTotal, onClose, onSuccess }) => {
  const [metodoPago, setMetodoPago] = useState<'card' | 'transfer'>('card');
  const [nombreTarjeta, setNombreTarjeta] = useState('');
  const [nroTarjeta, setNroTarjeta] = useState('');
  const [exp, setExp] = useState('');
  const [cvv, setCvv] = useState('');
  const [referencia, setReferencia] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const formatCardNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = input.match(/.{1,4}/g)?.join(' ') || input;
    setNroTarjeta(formatted);
  };

  const formatExpiry = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (input.length >= 2) {
      input = input.slice(0, 2) + '/' + input.slice(2);
    }
    setExp(input);
  };

  const procesarPago = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (metodoPago === 'card') {
      const numeroLimpio = nroTarjeta.replace(/\s/g, '');
      if (!isValidLuhn(numeroLimpio)) {
        setError('El número de tarjeta no es válido.');
        return;
      }
    }

    setEnviando(true);
    try {
      const formaPagoId = metodoPago === 'card' ? 1 : 3;
      const ref = metodoPago === 'card'
        ? 'CARD-' + nroTarjeta.slice(-4) + '-' + Math.floor(Math.random() * 10000)
        : referencia;

      await apiService.procesarPago({
        reservaId,
        formaPagoId,
        montoPago: montoTotal,
        referenciaTransaccion: ref
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="modal-overlay d-flex align-items-center justify-content-center" style={{ position: 'fixed', inset: 0, zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white p-4 rounded-4 shadow-lg animate__animated animate__fadeIn" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0">
            <i className="bi bi-credit-card me-2 text-primary"></i>Procesar Pago
          </h5>
          <button className="btn-close" onClick={onClose}></button>
        </div>

        <div className="bg-light rounded-3 p-3 mb-4 text-center">
          <span className="text-muted small">Monto a pagar</span>
          <h3 className="fw-bold text-dark mb-0">S/. {montoTotal.toFixed(2)}</h3>
        </div>

        {error && <div className="alert alert-danger py-2 small">{error}</div>}

        <form onSubmit={procesarPago}>
          <div className="mb-3">
            <label className="form-label text-muted small">Método de Pago</label>
            <div className="d-flex gap-2">
              <button type="button" className={`btn flex-fill ${metodoPago === 'card' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setMetodoPago('card')}>
                <i className="bi bi-credit-card me-1"></i> Tarjeta
              </button>
              <button type="button" className={`btn flex-fill ${metodoPago === 'transfer' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setMetodoPago('transfer')}>
                <i className="bi bi-bank me-1"></i> Transferencia
              </button>
            </div>
          </div>

          {metodoPago === 'card' ? (
            <>
              <div className="mb-3">
                <label className="form-label text-muted small">Nombre del Tarjetahabiente</label>
                <input type="text" className="form-control bg-light border-0 py-2" value={nombreTarjeta} onChange={(e) => setNombreTarjeta(e.target.value)} required placeholder="Ej. Juan Pérez" />
              </div>
              <div className="mb-3">
                <label className="form-label text-muted small">Número de Tarjeta</label>
                <input type="text" className="form-control bg-light border-0 py-2" value={nroTarjeta} onChange={formatCardNumber} required placeholder="4000 1234 5678 9010" maxLength={19} />
              </div>
              <div className="row mb-3">
                <div className="col-6">
                  <label className="form-label text-muted small">Vencimiento</label>
                  <input type="text" className="form-control bg-light border-0 py-2" value={exp} onChange={formatExpiry} required placeholder="MM/AA" maxLength={5} />
                </div>
                <div className="col-6">
                  <label className="form-label text-muted small">CVV</label>
                  <input type="password" className="form-control bg-light border-0 py-2" value={cvv} onChange={(e) => setCvv(e.target.value)} required placeholder="•••" maxLength={4} />
                </div>
              </div>
            </>
          ) : (
            <div className="mb-3">
              <label className="form-label text-muted small">Número de Operación / Referencia</label>
              <input type="text" className="form-control bg-light border-0 py-2" value={referencia} onChange={(e) => setReferencia(e.target.value)} required placeholder="Ej. N° Operación" />
            </div>
          )}

          <div className="d-flex gap-2 mt-4">
            <button type="button" className="btn btn-outline-secondary w-50 py-2" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-success w-50 py-2 fw-semibold" disabled={enviando}>
              {enviando ? 'Procesando...' : `Pagar S/. ${montoTotal.toFixed(2)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
