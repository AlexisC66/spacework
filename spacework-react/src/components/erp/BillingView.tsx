import { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BillingView = () => {
  const [facturas, setFacturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedFactura, setSelectedFactura] = useState<any>(null);

  useEffect(() => {
    fetchFacturas();
  }, []);

  const fetchFacturas = async () => {
    try {
      const response = await apiService.getFacturas();
      setFacturas(response.data);
    } catch (error) {
      console.error('Error fetching facturas:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularTotal = () => {
    return facturas.reduce((acc, fac) => acc + (fac.totalGeneral || 0), 0);
  };
  const calcularPendiente = () => {
    return facturas.filter(f => f.estadoFactura === 'PENDIENTE' || f.estadoFactura === 'EMITIDA').reduce((acc, fac) => acc + (fac.totalGeneral || 0), 0);
  };

  const handleExportReport = () => {
    const header = "Nº Factura,Fecha Emisión,Cliente / Empresa,Subtotal (S/.),IGV (S/.),Total General (S/.),Estado\n";
    
    // Filtrar facturas según la vista actual
    const facturasFiltradas = facturas.filter(fac => {
      const numMatch = (fac.numeroFactura || '').toLowerCase().includes(searchTerm.toLowerCase());
      const clientName = (fac.empresa?.razonSocial || (fac.usuario ? `${fac.usuario.nombre} ${fac.usuario.apellidoPaterno}` : 'Cliente')).toLowerCase();
      const searchMatch = numMatch || clientName.includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter ? fac.estadoFactura === statusFilter : true;
      return searchMatch && statusMatch;
    });

    const rows = facturasFiltradas.map(fac => {
      const num = fac.numeroFactura || 'S/N';
      const fecha = new Date(fac.fechaEmision).toLocaleDateString();
      const client = fac.empresa?.razonSocial || (fac.usuario ? `${fac.usuario.nombre} ${fac.usuario.apellidoPaterno}` : 'Cliente');
      const subtotal = (fac.subTotal || 0).toFixed(2);
      const igv = (fac.totalImpuestos || 0).toFixed(2);
      const total = (fac.totalGeneral || 0).toFixed(2);
      const estado = fac.estadoFactura || 'N/A';
      
      // Escape comillas para CSV
      return `"${num}","${fecha}","${client.replace(/"/g, '""')}","${subtotal}","${igv}","${total}","${estado}"`;
    });

    const csvContent = "\uFEFF" + header + rows.join("\n"); // \uFEFF para soportar UTF-8 en Excel
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Reporte_Facturacion_${new Date().toLocaleDateString().replace(/\//g,'-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = (fac: any) => {
    const doc = new jsPDF();
    
    // Configuración de fuentes y colores
    const primaryColor: [number, number, number] = [13, 110, 253]; // #0d6efd
    const darkColor: [number, number, number] = [33, 37, 41];
    
    const clientName = fac.empresa?.razonSocial || (fac.usuario ? `${fac.usuario.nombre} ${fac.usuario.apellidoPaterno}` : 'Cliente Registrado');
    const docNumber = fac.empresa?.documentoFiscal || fac.usuario?.numeroDocumento || 'N/A';
    
    // Header
    doc.setFontSize(24);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('SpaceWork', 14, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Av. Principal 123, Ciudad Empresarial', 14, 32);
    doc.text('contacto@spacework.com | +51 987 654 321', 14, 37);

    // Etiqueta Factura
    doc.setFontSize(20);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text('FACTURA', 140, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Nº ${fac.numeroFactura || 'S/N'}`, 140, 32);
    doc.text(`Fecha: ${new Date(fac.fechaEmision).toLocaleDateString()}`, 140, 37);
    doc.text(`Estado: ${fac.estadoFactura}`, 140, 42);

    // Linea divisoria
    doc.setDrawColor(200);
    doc.line(14, 48, 196, 48);

    // Info Cliente
    doc.setFontSize(12);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text('Facturar a:', 14, 58);
    
    doc.setFontSize(11);
    doc.setTextColor(80);
    doc.text(clientName, 14, 65);
    doc.text(`Doc: ${docNumber}`, 14, 70);
    if (fac.usuario?.correoElectronico) doc.text(fac.usuario.correoElectronico, 14, 75);

    // Info Reserva
    doc.setFontSize(12);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text('Detalles de la Reserva:', 120, 58);
    
    doc.setFontSize(11);
    doc.setTextColor(80);
    doc.text(`Cód: ${fac.reserva?.codigoReserva || 'N/A'}`, 120, 65);
    if (fac.reserva?.espacio) doc.text(`Espacio: ${fac.reserva.espacio.nombreEspacio}`, 120, 70);

    // Tabla de Items
    const tableData = [
      [
        'Alquiler de Espacio ' + (fac.reserva?.espacio?.nombreEspacio ? `(${fac.reserva.espacio.nombreEspacio})` : ''),
        '1',
        `S/. ${(fac.subTotal || 0).toFixed(2)}`,
        `S/. ${(fac.subTotal || 0).toFixed(2)}`
      ]
    ];

    autoTable(doc, {
      startY: 90,
      head: [['Descripción', 'Cant.', 'Precio Unit.', 'Subtotal']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
      styles: { fontSize: 10, cellPadding: 5 }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 120;

    // Totales
    doc.setFontSize(11);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    
    const subtotalText = `Subtotal: S/. ${(fac.subTotal || 0).toFixed(2)}`;
    const igvText = fac.totalImpuestos > 0 
      ? `IGV (18%): S/. ${(fac.totalImpuestos || 0).toFixed(2)}`
      : `IGV (Exonerado): S/. 0.00`;
    const totalText = `Total a Pagar: S/. ${(fac.totalGeneral || 0).toFixed(2)}`;

    doc.text(subtotalText, 140, finalY + 10);
    doc.text(igvText, 140, finalY + 16);
    
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(totalText, 140, finalY + 24);

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('Gracias por preferir SpaceWork.', 105, 280, { align: 'center' });

    doc.save(`Factura_${fac.numeroFactura || 'Borrador'}.pdf`);
  };

  return (
    <div className="container-fluid animate__animated animate__fadeIn">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Facturación y Pagos</h2>
          <p className="text-muted mb-0">Control de comprobantes emitidos y estado de pagos.</p>
        </div>
        <button onClick={handleExportReport} className="btn btn-outline-primary d-flex align-items-center gap-2 fw-semibold hover-lift">
          <i className="bi bi-cloud-download"></i>
          Exportar Reporte
        </button>
      </div>

      {/* Tarjetas de Resumen Financiero */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="glass-panel p-4 h-100 d-flex flex-column justify-content-center position-relative overflow-hidden">
            <div className="position-absolute top-0 end-0 p-3 opacity-25">
              <i className="bi bi-cash-coin" style={{fontSize: '4rem', color: 'var(--primary-color)'}}></i>
            </div>
            <p className="text-muted fw-semibold mb-1">Total Facturado</p>
            <h3 className="fw-bold text-dark mb-0">S/. {calcularTotal().toFixed(2)}</h3>
            <span className="text-success small fw-semibold mt-2"><i className="bi bi-arrow-up-right"></i> Actualizado</span>
          </div>
        </div>
        <div className="col-md-4">
          <div className="glass-panel p-4 h-100 d-flex flex-column justify-content-center position-relative overflow-hidden">
            <div className="position-absolute top-0 end-0 p-3 opacity-25">
              <i className="bi bi-clock-history" style={{fontSize: '4rem', color: '#f59e0b'}}></i>
            </div>
            <p className="text-muted fw-semibold mb-1">Pendiente de Cobro</p>
            <h3 className="fw-bold text-dark mb-0">S/. {calcularPendiente().toFixed(2)}</h3>
            <span className="text-warning small fw-semibold mt-2">Facturas pendientes</span>
          </div>
        </div>
        <div className="col-md-4">
          <div className="glass-panel p-4 h-100 d-flex flex-column justify-content-center position-relative overflow-hidden">
            <div className="position-absolute top-0 end-0 p-3 opacity-25">
              <i className="bi bi-file-earmark-check" style={{fontSize: '4rem', color: '#10b981'}}></i>
            </div>
            <p className="text-muted fw-semibold mb-1">Facturas Emitidas</p>
            <h3 className="fw-bold text-dark mb-0">{facturas.length}</h3>
            <span className="text-muted small fw-semibold mt-2">Registros totales</span>
          </div>
        </div>
      </div>

      {/* Tabla de Facturas */}
      <div className="glass-panel p-0 overflow-hidden border-0 shadow-sm">
        <div className="p-4 border-bottom bg-white d-flex gap-3">
          <div className="input-group" style={{maxWidth: '400px'}}>
            <span className="input-group-text bg-light border-end-0"><i className="bi bi-search text-muted"></i></span>
            <input 
              type="text" 
              className="form-control bg-light border-start-0" 
              placeholder="Buscar por Nº o Cliente..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="form-select bg-light w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos los Estados</option>
            <option value="EMITIDA">Emitida</option>
            <option value="PAGADA">Pagada</option>
            <option value="ANULADA">Anulada</option>
          </select>
        </div>
        
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead className="table-light text-muted">
              <tr>
                <th className="py-3 px-4 fw-semibold border-bottom-0">Nº Factura</th>
                <th className="py-3 fw-semibold border-bottom-0">Fecha Emisión</th>
                <th className="py-3 fw-semibold border-bottom-0">Cliente / Empresa</th>
                <th className="py-3 fw-semibold border-bottom-0">Total</th>
                <th className="py-3 fw-semibold border-bottom-0">Estado</th>
                <th className="py-3 px-4 text-end fw-semibold border-bottom-0">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-4">Cargando facturas...</td></tr>
              ) : facturas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">No hay facturas registradas.</td>
                </tr>
              ) : (
                facturas.filter(fac => {
                  const numMatch = (fac.numeroFactura || '').toLowerCase().includes(searchTerm.toLowerCase());
                  const clientName = (fac.empresa?.razonSocial || (fac.usuario ? `${fac.usuario.nombre} ${fac.usuario.apellidoPaterno}` : 'Cliente')).toLowerCase();
                  const searchMatch = numMatch || clientName.includes(searchTerm.toLowerCase());
                  const statusMatch = statusFilter ? fac.estadoFactura === statusFilter : true;
                  return searchMatch && statusMatch;
                }).map((fac) => (
                  <tr key={fac.id}>
                    <td className="px-4 py-3 fw-bold text-primary-custom">{fac.numeroFactura || 'S/N'}</td>
                    <td className="py-3 text-muted">{new Date(fac.fechaEmision).toLocaleDateString()}</td>
                    <td className="py-3 fw-semibold text-dark">{fac.empresa?.razonSocial || (fac.usuario ? `${fac.usuario.nombre} ${fac.usuario.apellidoPaterno}` : 'Cliente')}</td>
                    <td className="py-3 fw-bold">S/. {(fac.totalGeneral || 0).toFixed(2)}</td>
                    <td className="py-3">
                      <span className={`badge px-3 py-2 rounded-pill ${fac.estadoFactura === 'PAGADA' ? 'bg-success bg-opacity-10 text-success' : 'bg-warning bg-opacity-10 text-warning'}`}>
                        {fac.estadoFactura}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <button onClick={() => setSelectedFactura(fac)} className="btn btn-sm btn-light rounded-circle p-2 me-2 text-secondary" title="Ver Detalles"><i className="bi bi-eye"></i></button>
                      <button onClick={() => handleDownloadPDF(fac)} className="btn btn-sm btn-light rounded-circle p-2 text-danger" title="Descargar PDF"><i className="bi bi-file-pdf"></i></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modal de Detalles de Factura */}
      {selectedFactura && (
        <div className="modal fade show d-block animate__animated animate__fadeIn" style={{backgroundColor: 'rgba(0,0,0,0.5)'}} tabIndex={-1}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{borderRadius: '16px'}}>
              <div className="modal-header bg-light border-bottom-0" style={{borderRadius: '16px 16px 0 0'}}>
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <i className="bi bi-receipt"></i> Detalle de Factura
                </h5>
                <button type="button" className="btn-close" onClick={() => setSelectedFactura(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="row mb-4">
                  <div className="col-sm-6">
                    <h6 className="text-muted fw-semibold mb-1">Empresa / Cliente</h6>
                    <p className="fw-bold fs-5 text-dark mb-0">
                      {selectedFactura.empresa?.razonSocial || (selectedFactura.usuario ? `${selectedFactura.usuario.nombre} ${selectedFactura.usuario.apellidoPaterno}` : 'Cliente')}
                    </p>
                    <p className="text-muted small mb-0">
                      Doc: {selectedFactura.empresa?.documentoFiscal || selectedFactura.usuario?.numeroDocumento || 'N/A'}
                    </p>
                  </div>
                  <div className="col-sm-6 text-sm-end mt-3 mt-sm-0">
                    <h6 className="text-muted fw-semibold mb-1">Nº Factura</h6>
                    <p className="fw-bold fs-5 text-primary-custom mb-0">{selectedFactura.numeroFactura || 'S/N'}</p>
                    <span className={`badge mt-2 ${selectedFactura.estadoFactura === 'PAGADA' ? 'bg-success' : 'bg-warning text-dark'}`}>
                      {selectedFactura.estadoFactura}
                    </span>
                  </div>
                </div>

                <div className="table-responsive border rounded-3 mb-4">
                  <table className="table table-borderless mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="py-3 px-4">Descripción</th>
                        <th className="py-3 text-end">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-3 px-4">
                          <span className="fw-semibold">Alquiler de Espacio</span>
                          {selectedFactura.reserva?.espacio && (
                            <div className="text-muted small mt-1"><i className="bi bi-geo-alt"></i> {selectedFactura.reserva.espacio.nombreEspacio}</div>
                          )}
                          <div className="text-muted small mt-1"><i className="bi bi-calendar"></i> Fecha Reserva: {selectedFactura.reserva?.fechaInicioReserva ? new Date(selectedFactura.reserva.fechaInicioReserva).toLocaleString() : 'N/A'}</div>
                        </td>
                        <td className="py-3 text-end fw-semibold">S/. {(selectedFactura.subTotal || 0).toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="row justify-content-end">
                  <div className="col-sm-5">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Subtotal:</span>
                      <span className="fw-semibold">S/. {(selectedFactura.subTotal || 0).toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-3 border-bottom pb-3">
                      <span className="text-muted">{selectedFactura.totalImpuestos > 0 ? 'IGV (18%):' : 'IGV (Exonerado):'}</span>
                      <span className="fw-semibold">S/. {(selectedFactura.totalImpuestos || 0).toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="fw-bold fs-5 text-dark">Total:</span>
                      <span className="fw-bold fs-5 text-primary-custom">S/. {(selectedFactura.totalGeneral || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light border-top-0" style={{borderRadius: '0 0 16px 16px'}}>
                <button type="button" className="btn btn-outline-secondary" onClick={() => setSelectedFactura(null)}>Cerrar</button>
                <button type="button" className="btn btn-primary-custom d-flex align-items-center gap-2" onClick={() => handleDownloadPDF(selectedFactura)}>
                  <i className="bi bi-download"></i> Descargar PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingView;


