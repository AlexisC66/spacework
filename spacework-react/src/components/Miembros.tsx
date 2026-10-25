import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

const Miembros: React.FC = () => {
  const navigate = useNavigate();

  const [miembros, setMiembros] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  // estados del modal
  const [modalVisible, setModalVisible] = useState(false);
  const [miembroEditando, setMiembroEditando] = useState<any>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    telefono: '',
    estado: true,
    rol: 'USUARIO',
    numeroDocumento: '',
    correoElectronico: '',
    contrasena: '',
    empresaId: ''
  });
  const [empresaSearch, setEmpresaSearch] = useState('');
  const [showEmpresaDropdown, setShowEmpresaDropdown] = useState(false);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUsuarios();
      const data = response.data;
      // mapear los datos del backend al formato esperado por la tabla
      const mappedData = data.map((u: any) => ({
        id: u.id,
        nombre: u.nombre,
        apellidoPaterno: u.apellidoPaterno,
        apellidoMaterno: u.apellidoMaterno,
        apellido: `${u.apellidoPaterno} ${u.apellidoMaterno}`,
        departamento: 'General',
        doc: u.numeroDocumento,
        correo: u.correoElectronico,
        telefono: u.telefono || 'No registrado',
        rol: u.rol?.nombreRol || 'USUARIO',
        fecha: u.fechaRegistro,
        ultimoAcceso: u.ultimoAcceso,
        estado: u.estado,
        bloqueado: u.bloqueado,
        empresa: u.empresa || null,
        avatar: `https://ui-avatars.com/api/?name=${u.nombre}+${u.apellidoPaterno}&background=random`
      }));
      setMiembros(mappedData);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmpresas = async () => {
    try {
      const response = await apiService.getEmpresas();
      setEmpresas(response.data);
    } catch (error) {
      console.error('Error al obtener empresas:', error);
    }
  };

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

    fetchUsuarios();
    fetchEmpresas();
  }, [navigate]);

  const agregarMiembro = () => {
    setMiembroEditando(null);
    setFormData({
      nombre: '',
      apellidoPaterno: '',
      apellidoMaterno: '',
      telefono: '',
      estado: true,
      rol: 'USUARIO',
      numeroDocumento: '',
      correoElectronico: '',
      contrasena: '',
      empresaId: ''
    });
    setEmpresaSearch('');
    setModalVisible(true);
  };

  const editarMiembro = (m: any) => {
    setMiembroEditando(m);
    setFormData({
      nombre: m.nombre,
      apellidoPaterno: m.apellidoPaterno,
      apellidoMaterno: m.apellidoMaterno,
      telefono: m.telefono === 'No registrado' ? '' : m.telefono,
      estado: m.estado,
      rol: m.rol,
      numeroDocumento: m.doc || '',
      correoElectronico: m.correo || '',
      contrasena: '',
      empresaId: m.empresa?.id || ''
    });
    setEmpresaSearch(m.empresa?.razonSocial || '');
    setModalVisible(true);
  };

  const guardarEdicion = async () => {
    try {
      if (miembroEditando) {
        const payload: any = { ...formData };
        if (formData.empresaId) payload.empresa = { id: parseInt(formData.empresaId) };
        else payload.empresa = null;
        await apiService.actualizarMiembro(miembroEditando.id, payload, formData.rol);
      } else {
        await apiService.registro({
          nombre: formData.nombre,
          apellidoPaterno: formData.apellidoPaterno,
          apellidoMaterno: formData.apellidoMaterno,
          telefono: formData.telefono,
          numeroDocumento: formData.numeroDocumento,
          correoElectronico: formData.correoElectronico,
          contrasena: formData.contrasena
        }, formData.rol, 'DNI');
      }
      setModalVisible(false);
      fetchUsuarios();
    } catch (error: any) {
      console.error('Error guardando edición:', error);
      alert(error.response?.data?.error || 'Error al guardar los cambios');
    }
  };

  const eliminarMiembro = async (m: any) => {
    if (window.confirm(`¿Desea desactivar el acceso de ${m.nombre} ${m.apellido} al sistema?`)) {
      try {
        await apiService.eliminarMiembro(m.id);
        fetchUsuarios();
      } catch (error) {
        console.error('Error al desactivar usuario:', error);
        alert('Error al desactivar el usuario');
      }
    }
  };

  const desbloquearMiembro = async (m: any) => {
    if (window.confirm(`¿Desea desbloquear la cuenta de ${m.nombre} ${m.apellido}?`)) {
      try {
        await apiService.desbloquearMiembro(m.id);
        alert('Cuenta desbloqueada correctamente');
        fetchUsuarios();
      } catch (error) {
        console.error('Error al desbloquear usuario:', error);
        alert('Error al desbloquear el usuario');
      }
    }
  };

  const miembrosFiltrados = miembros.filter(m => {
    if (!busqueda) return true;
    const lowerB = busqueda.toLowerCase();
    const fullName = `${m.nombre || ''} ${m.apellido || ''}`.toLowerCase();
    return (
      fullName.includes(lowerB) ||
      m.correo?.toLowerCase().includes(lowerB) ||
      m.doc?.toLowerCase().includes(lowerB)
    );
  });

  return (
    <div className="container py-3 animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-dark fw-bold mb-0">Miembros del Sistema</h2>
          <p className="text-muted small">Lista de usuarios registrados y administración de accesos</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="position-relative">
            <i className="bi bi-search position-absolute text-muted" style={{ top: '50%', transform: 'translateY(-50%)', left: '15px' }}></i>
            <input 
              type="text" 
              className="form-control rounded-pill ps-5 bg-white border-0 shadow-sm" 
              placeholder="Buscar usuario..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ width: '280px' }}
            />
          </div>
          <button className="btn btn-primary-custom d-flex align-items-center gap-2 rounded-pill px-4 shadow-sm" onClick={agregarMiembro}>
            <i className="bi bi-plus-lg"></i> Añadir Miembro
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2 text-muted">Cargando miembros...</p>
        </div>
      ) : (
        <div className="card glass-panel p-4">
          <div className="table-responsive">
            <table className="table table-hover table-sm align-middle text-nowrap small" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr className="text-muted">
                  <th>Usuario</th>
                  <th>N° Documento</th>
                  <th>Correo Electrónico</th>
                  <th>Empresa B2B</th>
                  <th>Rol</th>
                  <th>Fecha Registro</th>
                  <th>Último Acceso</th>
                  <th>Estado</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {miembrosFiltrados.length === 0 && !loading ? (
                  <tr><td colSpan={9} className="text-center py-5 text-muted">No se encontraron usuarios.</td></tr>
                ) : (
                  miembrosFiltrados.map((m, i) => (
                    <tr key={i}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <img src={m.avatar} className="rounded-circle border" style={{ width: '40px', height: '40px', objectFit: 'cover' }} alt="Avatar" />
                        <div>
                          <strong className="text-dark d-block">{m.nombre} {m.apellido}</strong>
                        </div>
                      </div>
                    </td>
                    <td>{m.doc}</td>
                    <td>{m.correo}</td>
                    <td>{m.empresa ? <span className="badge bg-light text-dark border"><i className="bi bi-building me-1"></i>{m.empresa.razonSocial}</span> : <span className="text-muted small">-</span>}</td>
                    <td>
                      <span className={`badge ${['ADMIN', 'ADMINISTRADOR', 'SUPERADMIN'].includes(m.rol) ? 'bg-primary' : 'bg-info'}`}>
                        {m.rol}
                      </span>
                    </td>
                    <td>{new Date(m.fecha).toISOString().split('T')[0]}</td>
                    <td>{m.ultimoAcceso ? new Date(m.ultimoAcceso).toLocaleString() : 'Nunca'}</td>
                    <td>
                      {m.bloqueado ? (
                        <span className="badge bg-warning bg-opacity-10 text-warning px-2 py-1">Bloqueado</span>
                      ) : m.estado ? (
                        <span className="badge bg-success bg-opacity-10 text-success px-2 py-1">Activo</span>
                      ) : (
                        <span className="badge bg-danger bg-opacity-10 text-danger px-2 py-1">Inactivo</span>
                      )}
                    </td>
                    <td className="text-end">
                      {m.bloqueado ? (
                        <button className="btn btn-sm btn-light border p-1 me-1 text-success" onClick={() => desbloquearMiembro(m)} title="Desbloquear">
                          <i className="bi bi-unlock-fill"></i>
                        </button>
                      ) : (
                        <button className="btn btn-sm btn-light border p-1 me-1 text-danger" onClick={() => eliminarMiembro(m)} title={m.estado ? "Desactivar" : "Inactivo"} disabled={!m.estado}>
                          <i className="bi bi-trash-fill"></i>
                        </button>
                      )}
                      <button className="btn btn-sm btn-light border p-1" onClick={() => editarMiembro(m)} title="Editar">
                        <i className="bi bi-pencil-fill text-muted"></i>
                      </button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {modalVisible && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-bottom-0">
                <h5 className="modal-title fw-bold text-dark">{miembroEditando ? 'Editar Usuario' : 'Nuevo Miembro'}</h5>
                <button type="button" className="btn-close" onClick={() => setModalVisible(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted">Nombre</label>
                  <input type="text" className="form-control" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} />
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label small fw-semibold text-muted">Apellido Paterno</label>
                    <input type="text" className="form-control" value={formData.apellidoPaterno} onChange={(e) => setFormData({...formData, apellidoPaterno: e.target.value})} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label small fw-semibold text-muted">Apellido Materno</label>
                    <input type="text" className="form-control" value={formData.apellidoMaterno} onChange={(e) => setFormData({...formData, apellidoMaterno: e.target.value})} />
                  </div>
                </div>
                {!miembroEditando && (
                  <>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label small fw-semibold text-muted">N° Documento (DNI)</label>
                        <input type="text" className="form-control" value={formData.numeroDocumento} onChange={(e) => setFormData({...formData, numeroDocumento: e.target.value})} required={!miembroEditando} />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label small fw-semibold text-muted">Teléfono</label>
                        <input type="text" className="form-control" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label small fw-semibold text-muted">Correo Electrónico</label>
                        <input type="email" className="form-control" value={formData.correoElectronico} onChange={(e) => setFormData({...formData, correoElectronico: e.target.value})} required={!miembroEditando} />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label small fw-semibold text-muted">Contraseña</label>
                        <input type="password" className="form-control" value={formData.contrasena} onChange={(e) => setFormData({...formData, contrasena: e.target.value})} required={!miembroEditando} />
                      </div>
                    </div>
                  </>
                )}
                {miembroEditando && (
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label small fw-semibold text-muted">Teléfono</label>
                      <input type="text" className="form-control" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label small fw-semibold text-muted">Empresa Vinculada (B2B)</label>
                      <div className="position-relative">
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="Buscar empresa..."
                          value={empresaSearch}
                          onChange={(e) => {
                            setEmpresaSearch(e.target.value);
                            setShowEmpresaDropdown(true);
                            if (e.target.value === '') setFormData({...formData, empresaId: ''});
                          }}
                          onFocus={() => setShowEmpresaDropdown(true)}
                          onBlur={() => setTimeout(() => setShowEmpresaDropdown(false), 200)}
                        />
                        {showEmpresaDropdown && (
                          <ul className="list-group position-absolute w-100 shadow-sm" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                            <li className="list-group-item list-group-item-action" style={{cursor: 'pointer'}} onClick={() => {
                              setFormData({...formData, empresaId: ''});
                              setEmpresaSearch('');
                              setShowEmpresaDropdown(false);
                            }}>
                              <em>Ninguna</em>
                            </li>
                            {empresas.filter(emp => emp.razonSocial.toLowerCase().includes(empresaSearch.toLowerCase())).map(emp => (
                              <li 
                                key={emp.id} 
                                className="list-group-item list-group-item-action"
                                style={{cursor: 'pointer'}}
                                onClick={() => {
                                  setFormData({...formData, empresaId: emp.id.toString()});
                                  setEmpresaSearch(emp.razonSocial);
                                  setShowEmpresaDropdown(false);
                                }}
                              >
                                {emp.razonSocial}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label small fw-semibold text-muted">Rol</label>
                    <select className="form-select" value={formData.rol} onChange={(e) => setFormData({...formData, rol: e.target.value})}>
                      <option value="USUARIO">Usuario Regular</option>
                      <option value="GESTOR">Gestor</option>
                      <option value="ADMINISTRADOR">Administrador</option>
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label small fw-semibold text-muted">Estado</label>
                    <select className="form-select" value={formData.estado ? "true" : "false"} onChange={(e) => setFormData({...formData, estado: e.target.value === "true"})}>
                      <option value="true">Activo</option>
                      <option value="false">Inactivo (Desactivado)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top-0">
                <button type="button" className="btn btn-secondary" onClick={() => setModalVisible(false)}>Cancelar</button>
                <button type="button" className="btn btn-primary-custom" onClick={guardarEdicion}>Guardar Cambios</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Miembros;
