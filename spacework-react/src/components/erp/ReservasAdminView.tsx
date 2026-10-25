import { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

const ReservasAdminView = () => {
  const [reservas, setReservas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [reservaACancelar, setReservaACancelar] = useState<number | null>(null);

  useEffect(() => {
    fetchReservas();
  }, []);

  const fetchReservas = async () => {
    setLoading(true);
    try {
      const response = await apiService.getTodasReservas();
      let data = response.data;
      if (Array.isArray(data)) {
        setReservas(data.sort((a, b) => (b?.id || 0) - (a?.id || 0)));
      } else {
        setReservas([]);
      }
    } catch (error) {
      console.error('Error fetching reservas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAprobar = async (_id: number) => {
    if (window.confirm('¿Deseas confirmar manualmente esta reserva?')) {
      alert('Reserva confirmada exitosamente. (Endpoint en construcción)');
      // await apiService.aprobarReserva(id);
      fetchReservas();
    }
  };

  const iniciarCancelacion = (id: number) => {
    setReservaACancelar(id);
  };

  const confirmarCancelacion = async () => {
    if (!reservaACancelar) return;
    try {
      await apiService.cancelarReserva(reservaACancelar);
      // alert('Reserva cancelada exitosamente.');
      fetchReservas();
    } catch (error: any) {
      console.error('Error al cancelar la reserva:', error);
      alert(error.response?.data?.error || 'No se pudo cancelar la reserva.');
    } finally {
      setReservaACancelar(null);
    }
  };

  const cancelarCancelacion = () => {
    setReservaACancelar(null);
  };

  const formatearFecha = (fecha: string) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const reservasFiltradas = reservas.filter(res => {
    if (!busqueda) return true;
    const lowerB = busqueda.toLowerCase();
    const clienteNombre = `${res.usuario?.nombre || ''} ${res.usuario?.apellidoPaterno || ''}`.toLowerCase();
    return (
      res.codigoReserva?.toLowerCase().includes(lowerB) ||
      clienteNombre.includes(lowerB) ||
      res.espacio?.nombreEspacio?.toLowerCase().includes(lowerB) ||
      res.estadoReserva?.nombreEstado?.toLowerCase().includes(lowerB)
    );
  });

  return (
    <div className="container-fluid animate__animated animate__fadeIn">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Gestión de Reservas</h2>
          <p className="text-muted mb-0">Revisa, aprueba o cancela las solicitudes de alquiler.</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="position-relative">
            <i className="bi bi-search position-absolute text-muted" style={{ top: '50%', transform: 'translateY(-50%)', left: '15px' }}></i>
            <input 
              type="text" 
              className="form-control rounded-pill ps-5 bg-white border-0 shadow-sm" 
              placeholder="Buscar reserva..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ width: '280px' }}
            />
          </div>
          <button className="btn btn-outline-secondary d-flex align-items-center gap-2 rounded-pill px-4 bg-white shadow-sm border-0 text-dark">
            <i className="bi bi-funnel"></i> Filtros
          </button>
        </div>
      </div>

      <div className="glass-panel p-0 overflow-hidden border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead className="table-light text-muted">
              <tr>
                <th className="py-3 px-4 fw-semibold border-bottom-0">Código</th>
                <th className="py-3 fw-semibold border-bottom-0">Cliente</th>
                <th className="py-3 fw-semibold border-bottom-0">Espacio</th>
                <th className="py-3 fw-semibold border-bottom-0">Fecha Inicio</th>
                <th className="py-3 fw-semibold border-bottom-0">Fecha Fin</th>
                <th className="py-3 fw-semibold border-bottom-0">Estado</th>
                <th className="py-3 px-4 text-end fw-semibold border-bottom-0">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-4">Cargando reservas...</td></tr>
              ) : reservasFiltradas.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-5 text-muted">No se encontraron reservas.</td></tr>
              ) : (
                reservasFiltradas.map((res) => {
                  const estado = res.estadoReserva?.nombreEstado;
                  const isPendiente = estado === 'PENDIENTE';
                  return (
                    <tr key={res.id}>
                      <td className="px-4 py-3 fw-bold text-dark">{res.codigoReserva}</td>
                      <td className="py-3">{res.usuario?.nombre} {res.usuario?.apellidoPaterno}</td>
                      <td className="py-3">{res.espacio?.nombreEspacio}</td>
                      <td className="py-3 small text-muted">{formatearFecha(res.fechaInicioReserva)}</td>
                      <td className="py-3 small text-muted">{formatearFecha(res.fechaFinReserva)}</td>
                      <td className="py-3">
                        <span className={`badge 
                          ${estado === 'CONFIRMADA' ? 'bg-success' : ''}
                          ${estado === 'PENDIENTE' ? 'bg-warning text-dark' : ''}
                          ${estado?.startsWith('CANCELADA') ? 'bg-danger' : ''}
                          ${estado === 'FINALIZADA' ? 'bg-info' : ''}
                        `}>
                          {estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-end">
                        {isPendiente && (
                          <button className="btn btn-sm btn-light border p-1 me-2 text-success fw-bold" title="Aprobar" onClick={() => handleAprobar(res.id)}>
                            <i className="bi bi-check-lg"></i>
                          </button>
                        )}
                        {estado !== 'CANCELADA' && estado !== 'FINALIZADA' && new Date(res.fechaInicioReserva) > new Date() && (
                          <button className="btn btn-sm btn-light border p-1 text-danger fw-bold" title="Cancelar" onClick={() => iniciarCancelacion(res.id)}>
                            <i className="bi bi-x-lg"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    
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
              <button className="btn btn-light w-50 fw-semibold text-muted border" onClick={cancelarCancelacion}>Volver</button>
              <button className="btn btn-danger w-50 fw-semibold shadow-sm" onClick={confirmarCancelacion}>Sí, Cancelar</button>
            </div>
          </div>
        </div>
      )}
</div>
  );
};

export default ReservasAdminView;
