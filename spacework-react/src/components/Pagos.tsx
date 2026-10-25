import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Pagos: React.FC = () => {
  const navigate = useNavigate();

  const [pagos, setPagos] = useState<any[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');



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

    cargarPagos();
  }, [navigate]);

  const cargarPagos = async () => {
    try {
      const response = await apiService.getTodosPagos();
      const data = response.data;
      if (data && data.length > 0) {
        const sorted = data.sort((a: any, b: any) => b.id - a.id);
        setPagos(sorted.map((p: any) => ({
          id: p.id,
          factura: p.referenciaTransaccion || ('PAG-' + p.id),
          cliente: p.reserva?.usuario ? `${p.reserva.usuario.nombre} ${p.reserva.usuario.apellidoPaterno}` : 'Cliente Web',
          espacio: p.reserva?.espacio?.nombreEspacio || 'Espacio Cowork',
          fecha: p.fechaPago,
          metodo: p.formaPago?.nombreForma || 'Otro',
          monto: p.montoPago,
          estado: p.estadoPago || 'PAGADO'
        })));
      } else {
        setPagos([]);
      }
    } catch (err) {
      console.error('Error al cargar pagos reales:', err);
      setPagos([]);
    }
  };

  const validarTransferencia = async (pagoId: number) => {
    setSuccessMessage('');
    setErrorMessage('');
    if (window.confirm('¿Confirma que ha verificado los fondos en la cuenta bancaria y desea aprobar este pago?')) {
      try {
        await apiService.aprobarPago(pagoId);
        setSuccessMessage('Pago validado y reserva confirmada con éxito.');
        cargarPagos();
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err: any) {
        setErrorMessage(err.response?.data?.error || 'Error al validar la transferencia.');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    }
  };

  const descargarPDF = (p: any) => {
    const doc = new jsPDF();
    
    // cabecera
    doc.setFontSize(22);
    doc.setTextColor(14, 165, 233);
    doc.text("SpaceWork", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Coworking & Espacios Flexibles", 14, 28);
    doc.text("RUC: 20123456789", 14, 34);
    
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text("BOLETA DE PAGO", 140, 22);
    doc.setFontSize(12);
    doc.text(`Nro: ${p.factura}`, 140, 28);
    doc.text(`Fecha: ${new Date(p.fecha).toLocaleDateString()}`, 140, 34);

    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(14, 45, 196, 45);

    // datos
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`Cliente: ${p.cliente}`, 14, 55);
    doc.text(`Forma de Pago: ${p.metodo}`, 14, 62);
    doc.text(`Estado del Pago: ${p.estado}`, 14, 69);

    // tabla
    autoTable(doc, {
      startY: 85,
      head: [['Descripción del Servicio', 'Cantidad', 'Importe']],
      body: [
        [`Alquiler de espacio: ${p.espacio}`, '1', `S/. ${Number(p.monto).toFixed(2)}`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [14, 165, 233] }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 120;
    
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(`TOTAL: S/. ${Number(p.monto).toFixed(2)}`, 140, finalY + 15);

    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Gracias por elegir SpaceWork.", 105, 280, { align: 'center' });

    doc.save(`Boleta_${p.factura}.pdf`);
  };

  return (
    <div className="container py-3 animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-dark fw-bold mb-0">Control de Facturas y Pagos</h2>
          <p className="text-muted small">Historial de transacciones de reservas de espacios y facturación</p>
        </div>
      </div>

      {successMessage && (
        <div className="alert alert-success bg-success bg-opacity-25 border-0 text-success mb-3 animate-fade-in" role="alert">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="alert alert-danger bg-danger bg-opacity-25 border-0 text-danger mb-3 animate-fade-in" role="alert">
          {errorMessage}
        </div>
      )}

      <div className="card glass-panel p-4 border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr className="text-muted">
                <th>Factura / Transacción</th>
                <th>Cliente</th>
                <th>Espacio Reservado</th>
                <th>Fecha de Emisión</th>
                <th>Forma de Pago</th>
                <th>Monto Total</th>
                <th>Estado</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pagos.length > 0 ? pagos.map((p, index) => (
                <tr key={p.id || index}>
                  <td>
                    <strong className="text-dark">{p.factura}</strong>
                  </td>
                  <td>{p.cliente}</td>
                  <td>{p.espacio}</td>
                  <td>{new Date(p.fecha).toISOString().slice(0, 16).replace('T', ' ')}</td>
                  <td>
                    <span className="d-flex align-items-center gap-2">
                      <i className="bi bi-wallet2 text-muted"></i> {p.metodo}
                    </span>
                  </td>
                  <td>
                    <strong className="text-dark">S/. {Number(p.monto).toFixed(2)}</strong>
                  </td>
                  <td>
                    <span className={`badge 
                      ${p.estado === 'PAGADO' ? 'bg-success' : ''} 
                      ${p.estado === 'PENDIENTE_VERIFICACION' ? 'bg-warning' : ''}
                      ${p.estado === 'PENDIENTE' ? 'bg-secondary' : ''}
                      ${p.estado === 'CANCELADO' ? 'bg-danger' : ''}
                    `}>
                      {p.estado === 'PENDIENTE_VERIFICACION' ? 'VERIFICAR PAGO' : p.estado}
                    </span>
                  </td>
                  <td className="text-end">
                    <div className="d-flex gap-2 justify-content-end">
                      {p.estado === 'PENDIENTE_VERIFICACION' && p.id && (
                        <button className="btn btn-sm btn-success" onClick={() => validarTransferencia(p.id)}>
                          <i className="bi bi-check-lg"></i> Validar
                        </button>
                      )}
                      <button className="btn btn-sm btn-outline-primary" onClick={() => descargarPDF(p)}>
                        <i className="bi bi-file-earmark-pdf-fill me-1"></i> PDF
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-4">No se han registrado transacciones en el sistema.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Pagos;
