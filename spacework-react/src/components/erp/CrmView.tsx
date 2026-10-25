import { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

const CrmView = () => {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<number | null>(null);
  
  const initialEmpresaState = { documentoFiscal: '', razonSocial: '', telefono: '', direccion: '', emailContacto: '', nombreContactoPrincipal: '', sectorIndustria: '', porcentajeDescuentoB2B: 0 };
  const [newEmpresa, setNewEmpresa] = useState(initialEmpresaState);

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const fetchEmpresas = async () => {
    try {
      const response = await apiService.getEmpresas();
      setEmpresas(response.data);
    } catch (error) {
      console.error('Error fetching empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (isEditing && selectedEmpresaId) {
        await apiService.updateEmpresa(selectedEmpresaId, newEmpresa);
      } else {
        await apiService.crearEmpresa(newEmpresa);
      }
      setShowModal(false);
      setNewEmpresa(initialEmpresaState);
      setIsEditing(false);
      setSelectedEmpresaId(null);
      fetchEmpresas();
    } catch (error) {
      console.error('Error saving empresa:', error);
      alert('Hubo un error al guardar la empresa. Verifique los datos.');
    }
  };

  const handleEdit = (empresa: any) => {
    setNewEmpresa({
      documentoFiscal: empresa.documentoFiscal || '',
      razonSocial: empresa.razonSocial || '',
      telefono: empresa.telefono || '',
      direccion: empresa.direccion || '',
      emailContacto: empresa.emailContacto || '',
      nombreContactoPrincipal: empresa.nombreContactoPrincipal || '',
      sectorIndustria: empresa.sectorIndustria || '',
      porcentajeDescuentoB2B: empresa.porcentajeDescuentoB2B || 0
    });
    setSelectedEmpresaId(empresa.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar esta empresa?')) {
      try {
        await apiService.deleteEmpresa(id);
        fetchEmpresas();
      } catch (error) {
        console.error('Error deleting empresa:', error);
        alert('No se pudo eliminar la empresa.');
      }
    }
  };

  const openNewModal = () => {
    setNewEmpresa(initialEmpresaState);
    setIsEditing(false);
    setSelectedEmpresaId(null);
    setShowModal(true);
  };

  return (
    <div className="container-fluid animate__animated animate__fadeIn">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">CRM Empresas</h2>
          <p className="text-muted mb-0">Gestión de clientes corporativos y representantes.</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="position-relative">
            <i className="bi bi-search position-absolute text-muted" style={{ top: '50%', transform: 'translateY(-50%)', left: '15px' }}></i>
            <input 
              type="text" 
              className="form-control rounded-pill ps-5 bg-white border-0 shadow-sm" 
              placeholder="Buscar empresa, RUC, teléfono..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '280px' }}
            />
          </div>
          <button onClick={openNewModal} className="btn btn-primary-custom d-flex align-items-center gap-2 rounded-pill px-4 shadow-sm">
            <i className="bi bi-plus-lg"></i>
            Nueva Empresa
          </button>
        </div>
      </div>

      <div className="glass-panel p-0 overflow-hidden border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead className="table-light text-muted">
              <tr>
                <th className="py-3 px-4 fw-semibold border-bottom-0">RUC/NIT</th>
                <th className="py-3 fw-semibold border-bottom-0">Razón Social</th>
                <th className="py-3 fw-semibold border-bottom-0">Contacto Principal</th>
                <th className="py-3 fw-semibold border-bottom-0">Teléfono</th>
                <th className="py-3 fw-semibold border-bottom-0">Descuento B2B</th>
                <th className="py-3 fw-semibold border-bottom-0">Estado</th>
                <th className="py-3 px-4 text-end fw-semibold border-bottom-0">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-4">Cargando empresas...</td></tr>
              ) : (
                empresas.filter(emp => {
                  if (!searchTerm) return true;
                  const searchLower = searchTerm.toLowerCase();
                  const rucMatch = (emp.documentoFiscal || '').toLowerCase().includes(searchLower);
                  const nameMatch = (emp.razonSocial || '').toLowerCase().includes(searchLower);
                  const contactMatch = (emp.nombreContactoPrincipal || '').toLowerCase().includes(searchLower);
                  const phoneMatch = (emp.telefono || '').toLowerCase().includes(searchLower);
                  const emailMatch = (emp.emailContacto || '').toLowerCase().includes(searchLower);
                  return rucMatch || nameMatch || contactMatch || phoneMatch || emailMatch;
                }).map((emp) => (
                  <tr key={emp.id}>
                    <td className="px-4 py-3 fw-bold text-dark">{emp.documentoFiscal || 'N/A'}</td>
                    <td className="py-3">
                      <div className="fw-semibold text-dark">{emp.razonSocial}</div>
                      {emp.sectorIndustria && <div className="small text-muted">{emp.sectorIndustria}</div>}
                    </td>
                    <td className="py-3">
                      <div className="fw-semibold text-dark">{emp.nombreContactoPrincipal || 'Sin Asignar'}</div>
                      <div className="small text-muted">{emp.emailContacto || ''}</div>
                    </td>
                    <td className="py-3 text-muted">{emp.telefono || 'N/A'}</td>
                    <td className="py-3">
                      <span className="fw-bold text-success">{emp.porcentajeDescuentoB2B || 0}%</span>
                    </td>
                    <td className="py-3">
                      <span className={`badge px-3 py-2 rounded-pill ${emp.estado ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}>
                        {emp.estado ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <button onClick={() => handleEdit(emp)} className="btn btn-sm btn-light rounded-circle p-2 me-2 text-primary" title="Editar"><i className="bi bi-pencil"></i></button>
                      <button onClick={() => handleDelete(emp.id)} className="btn btn-sm btn-light rounded-circle p-2 text-danger" title="Eliminar"><i className="bi bi-trash"></i></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-top bg-white d-flex justify-content-between align-items-center">
          <span className="text-muted small">Mostrando {empresas.length} empresas</span>
          <ul className="pagination pagination-sm mb-0">
            <li className="page-item disabled"><a className="page-link" href="#">Anterior</a></li>
            <li className="page-item active"><a className="page-link" href="#">1</a></li>
            <li className="page-item"><a className="page-link" href="#">Siguiente</a></li>
          </ul>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay d-flex align-items-center justify-content-center">
          <div className="bg-white p-4 rounded-4 shadow-lg" style={{width: '600px', maxHeight: '90vh', overflowY: 'auto'}}>
            <h5 className="fw-bold mb-4">{isEditing ? 'Editar Empresa Corporativa' : 'Nueva Empresa Corporativa'}</h5>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small text-muted">RUC / NIT</label>
                <input type="text" className="form-control" value={newEmpresa.documentoFiscal} onChange={e => setNewEmpresa({...newEmpresa, documentoFiscal: e.target.value})} />
              </div>
              <div className="col-md-6">
                <label className="form-label small text-muted">Razón Social</label>
                <input type="text" className="form-control" value={newEmpresa.razonSocial} onChange={e => setNewEmpresa({...newEmpresa, razonSocial: e.target.value})} />
              </div>
              <div className="col-md-6">
                <label className="form-label small text-muted">Teléfono Central</label>
                <input type="text" className="form-control" value={newEmpresa.telefono} onChange={e => setNewEmpresa({...newEmpresa, telefono: e.target.value})} />
              </div>
              <div className="col-md-6">
                <label className="form-label small text-muted">Sector / Industria</label>
                <input type="text" className="form-control" value={newEmpresa.sectorIndustria} onChange={e => setNewEmpresa({...newEmpresa, sectorIndustria: e.target.value})} />
              </div>
              <div className="col-12 border-top pt-3 mt-3">
                <h6 className="fw-semibold mb-3 text-primary">Datos del Contacto B2B</h6>
              </div>
              <div className="col-md-6">
                <label className="form-label small text-muted">Nombre del Contacto</label>
                <input type="text" className="form-control" value={newEmpresa.nombreContactoPrincipal} onChange={e => setNewEmpresa({...newEmpresa, nombreContactoPrincipal: e.target.value})} />
              </div>
              <div className="col-md-6">
                <label className="form-label small text-muted">Email Corporativo</label>
                <input type="email" className="form-control" value={newEmpresa.emailContacto} onChange={e => setNewEmpresa({...newEmpresa, emailContacto: e.target.value})} />
              </div>
              <div className="col-md-12">
                <label className="form-label small text-muted text-success fw-bold">Beneficio: Descuento (%) para empleados</label>
                <input type="number" className="form-control border-success" value={newEmpresa.porcentajeDescuentoB2B} onChange={e => setNewEmpresa({...newEmpresa, porcentajeDescuentoB2B: parseFloat(e.target.value) || 0})} />
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <button className="btn btn-light" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary-custom" onClick={handleSubmit}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrmView;


