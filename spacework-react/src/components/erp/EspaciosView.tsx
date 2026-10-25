import { useState, useEffect } from 'react';
import Select from 'react-select';
import { apiService } from '../../services/api';

const EspaciosView = () => {
  const [espacios, setEspacios] = useState<any[]>([]);
  const [tiposEspacio, setTiposEspacio] = useState<any[]>([]);
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [caracteristicas, setCaracteristicas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  
  const initialForm = {
    id: null,
    codigoEspacio: '',
    nombreEspacio: '',
    tipoEspacio: { id: '' },
    ubicacion: { id: '' },
    capacidad: 1,
    capacidadEquipos: 1,
    metrosCuadrados: 0,
    precioPersonaExtra: 0,
    precio: 0,
    descuento: 0,
    descripcion: '',
    estadoEspacio: 'DISPONIBLE',
    fotos: [] as any[],
    caracteristicas: [] as any[]
  };
  
  const [formData, setFormData] = useState<any>(initialForm);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resEspacios, resTipos, resUbi, resCarac] = await Promise.all([
        apiService.getEspacios(),
        apiService.getTiposEspacio(),
        apiService.getUbicaciones(),
        apiService.getCaracteristicas()
      ]);
      setEspacios(resEspacios.data || []);
      setTiposEspacio(resTipos.data || []);
      setUbicaciones(resUbi.data || []);
      setCaracteristicas(resCarac.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (espacio: any = null) => {
    if (espacio) {
      setEditMode(true);
      setFormData({
        id: espacio.id,
        codigoEspacio: espacio.codigoEspacio,
        nombreEspacio: espacio.nombreEspacio,
        tipoEspacio: { id: espacio.tipoEspacio?.id },
        ubicacion: { id: espacio.ubicacion?.id },
        capacidad: espacio.capacidad,
        capacidadEquipos: espacio.capacidadEquipos || espacio.capacidad,
        metrosCuadrados: espacio.metrosCuadrados || 0,
        precioPersonaExtra: espacio.precioPersonaExtra || 0,
        precio: espacio.precio || 0,
        descuento: espacio.descuento || 0,
        descripcion: espacio.descripcion || '',
        estadoEspacio: espacio.estadoEspacio || 'DISPONIBLE',
        fotos: espacio.fotos?.length > 0 ? [...espacio.fotos] : (espacio.fotoUrl ? [{ urlFoto: espacio.fotoUrl, esPrincipal: true }] : []),
        caracteristicas: espacio.caracteristicas ? espacio.caracteristicas.map((c:any) => ({ id: c.id })) : []
      });
    } else {
      setEditMode(false);
      setFormData({...initialForm, codigoEspacio: ''});
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editMode) {
        await apiService.actualizarEspacio(formData.id, formData);
      } else {
        await apiService.crearEspacio(formData);
      }
      setShowModal(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving espacio:', error);
      const backendError = error.response?.data;
      if (typeof backendError === 'string') {
          alert('Error del servidor:\n' + backendError);
      } else if (backendError && backendError.error) {
          alert('Error del servidor:\n' + backendError.error);
      } else {
          alert('Hubo un error al guardar. Revisa que el código no esté duplicado y todos los campos estén llenos.');
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar (desactivar) este espacio?')) {
      try {
        await apiService.eliminarEspacio(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting espacio:', error);
        alert('Error al eliminar espacio.');
      }
    }
  };

  const handleCaracteristicaToggle = (caracId: number) => {
    const exists = formData.caracteristicas.some((c:any) => c.id === caracId);
    if (exists) {
      setFormData({ ...formData, caracteristicas: formData.caracteristicas.filter((c:any) => c.id !== caracId) });
    } else {
      setFormData({ ...formData, caracteristicas: [...formData.caracteristicas, { id: caracId }] });
    }
  };

  const handleAddFoto = () => {
    setFormData({
      ...formData,
      fotos: [...formData.fotos, { urlFoto: '', esPrincipal: formData.fotos.length === 0 }]
    });
  };

  const handleFotoChange = (index: number, url: string) => {
    const newFotos = [...formData.fotos];
    newFotos[index].urlFoto = url;
    setFormData({ ...formData, fotos: newFotos });
  };

  const handleSetPrincipal = (index: number) => {
    const newFotos = formData.fotos.map((f: any, i: number) => ({
      ...f,
      esPrincipal: i === index
    }));
    setFormData({ ...formData, fotos: newFotos });
  };

  const handleRemoveFoto = (index: number) => {
    const newFotos = formData.fotos.filter((_: any, i: number) => i !== index);
    if (newFotos.length > 0 && formData.fotos[index].esPrincipal) {
      newFotos[0].esPrincipal = true;
    }
    setFormData({ ...formData, fotos: newFotos });
  };

  const espaciosFiltrados = espacios.filter(esp => {
    if (!busqueda) return true;
    const lowerB = busqueda.toLowerCase();
    return (
      esp.codigoEspacio?.toLowerCase().includes(lowerB) ||
      esp.nombreEspacio?.toLowerCase().includes(lowerB) ||
      esp.tipoEspacio?.nombreTipo?.toLowerCase().includes(lowerB)
    );
  });

  return (
    <div className="container-fluid animate__animated animate__fadeIn">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Inventario de Espacios</h2>
          <p className="text-muted mb-0">Gestión completa del catálogo, precios y descuentos.</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="position-relative">
            <i className="bi bi-search position-absolute text-muted" style={{ top: '50%', transform: 'translateY(-50%)', left: '15px' }}></i>
            <input 
              type="text" 
              className="form-control rounded-pill ps-5 bg-white border-0 shadow-sm" 
              placeholder="Buscar espacio..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ width: '280px' }}
            />
          </div>
          <button onClick={() => handleOpenModal()} className="btn btn-primary-custom d-flex align-items-center gap-2 rounded-pill px-4 shadow-sm">
            <i className="bi bi-plus-lg"></i>
            Nuevo Espacio
          </button>
        </div>
      </div>

      <div className="glass-panel p-0 overflow-hidden border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead className="table-light text-muted">
              <tr>
                <th className="py-3 px-4 fw-semibold border-bottom-0">Código</th>
                <th className="py-3 fw-semibold border-bottom-0">Nombre</th>
                <th className="py-3 fw-semibold border-bottom-0">Sede</th>
                <th className="py-3 fw-semibold border-bottom-0">Precio (Día)</th>
                <th className="py-3 fw-semibold border-bottom-0">Descuento</th>
                <th className="py-3 fw-semibold border-bottom-0">Aforo Equip.</th>
                <th className="py-3 fw-semibold border-bottom-0">Aforo Máx.</th>
                <th className="py-3 fw-semibold border-bottom-0">Tamaño</th>
                <th className="py-3 px-4 text-end fw-semibold border-bottom-0">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-4">Cargando catálogo...</td></tr>
              ) : espaciosFiltrados.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-5 text-muted">No se encontraron espacios.</td></tr>
              ) : (
                espaciosFiltrados.map((esp) => (
                  <tr key={esp.id}>
                    <td className="px-4 py-3 fw-medium">{esp.codigoEspacio}</td>
                    <td className="py-3 fw-semibold text-dark">{esp.nombreEspacio}</td>
                    <td className="py-3 text-muted">{esp.ubicacion?.nombreUbicacion || 'Sin Sede'}</td>
                    <td className="py-3 fw-bold text-primary">S/. {esp.precio || '0.00'}</td>
                    <td className="py-3">
                      {esp.descuento > 0 ? (
                        <span className="badge bg-success bg-opacity-10 text-success">S/. {esp.descuento} off</span>
                      ) : <span className="text-muted">-</span>}
                    </td>
                    <td className="py-3 text-warning fw-semibold">{esp.capacidadEquipos || esp.capacidad} eq.</td>
                    <td className="py-3">{esp.capacidad} pers.</td>
                    <td className="py-3">{esp.metrosCuadrados || 0} m²</td>
                    <td className="px-4 py-3 text-end">
                      <button className="btn btn-sm btn-light rounded-circle p-2 me-2 text-primary" onClick={() => handleOpenModal(esp)}><i className="bi bi-pencil"></i></button>
                      <button className="btn btn-sm btn-light rounded-circle p-2 text-danger" onClick={() => handleDelete(esp.id)}><i className="bi bi-trash"></i></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-light border-bottom-0">
                <h5 className="modal-title fw-bold">{editMode ? 'Editar Espacio' : 'Nuevo Espacio'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold text-muted">Código</label>
                    <input 
                      type="text" 
                      className="form-control bg-light" 
                      value={editMode ? formData.codigoEspacio : 'Automático'} 
                      disabled={true} 
                      title="El sistema generará el código secuencial al guardar"
                    />
                  </div>
                  <div className="col-md-8">
                    <label className="form-label small fw-semibold text-muted">Nombre del Espacio</label>
                    <input type="text" className="form-control" value={formData.nombreEspacio} onChange={e => setFormData({...formData, nombreEspacio: e.target.value})} />
                  </div>
                  
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-muted">Tipo de Espacio</label>
                    <select className="form-select" value={formData.tipoEspacio.id} onChange={e => setFormData({...formData, tipoEspacio: { id: e.target.value }})}>
                      <option value="">Seleccione...</option>
                      {tiposEspacio.map(t => <option key={t.id} value={t.id}>{t.nombreTipo}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-muted">Ubicación (Sede)</label>
                    <Select 
                      options={ubicaciones.map(u => ({ value: u.id, label: u.nombreUbicacion }))}
                      value={ubicaciones.map(u => ({ value: u.id, label: u.nombreUbicacion })).find(o => o.value == formData.ubicacion.id) || null}
                      onChange={(option: any) => setFormData({...formData, ubicacion: { id: option ? option.value : '' }})}
                      placeholder="Buscar sede..."
                      isClearable
                      noOptionsMessage={() => "No se encontraron sedes"}
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderColor: '#dee2e6',
                          '&:hover': { borderColor: '#86b7fe' },
                          boxShadow: 'none'
                        })
                      }}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-semibold text-muted">Aforo Físico (Máx)</label>
                    <input type="number" className="form-control border-danger" value={formData.capacidad} onChange={e => setFormData({...formData, capacidad: parseInt(e.target.value)})} title="Límite físico estricto del ambiente" />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small fw-semibold text-muted">Aforo Equipado</label>
                    <input type="number" className="form-control border-warning" value={formData.capacidadEquipos} onChange={e => setFormData({...formData, capacidadEquipos: parseInt(e.target.value)})} title="Cantidad de personas cubiertas con el equipamiento base" />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small fw-semibold text-muted" style={{ fontSize: '0.8rem' }}>S/. Persona Extra</label>
                    <input type="number" step="0.1" className="form-control text-warning fw-bold" value={formData.precioPersonaExtra} onChange={e => setFormData({...formData, precioPersonaExtra: parseFloat(e.target.value)})} title="Costo automático por cada persona que exceda el aforo equipado" />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small fw-semibold text-muted">Tamaño (m²)</label>
                    <input type="number" step="0.1" className="form-control" value={formData.metrosCuadrados} onChange={e => setFormData({...formData, metrosCuadrados: parseFloat(e.target.value)})} />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small fw-semibold text-muted">Precio (S/.)</label>
                    <input type="number" className="form-control" value={formData.precio} onChange={e => setFormData({...formData, precio: parseFloat(e.target.value)})} />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small fw-semibold text-muted">Descuento</label>
                    <input type="number" className="form-control border-success" value={formData.descuento} onChange={e => setFormData({...formData, descuento: parseFloat(e.target.value)})} />
                  </div>

                  <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label small fw-semibold text-muted mb-0">Galería de Imágenes</label>
                      <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleAddFoto}>
                        <i className="bi bi-plus-circle me-1"></i> Añadir Foto
                      </button>
                    </div>
                    {formData.fotos.length === 0 ? (
                      <div className="text-center p-3 bg-light rounded text-muted small border border-dashed">
                        No hay fotos asociadas. Presiona "Añadir Foto" para agregar una URL.
                      </div>
                    ) : (
                      <div className="list-group">
                        {formData.fotos.map((foto: any, index: number) => (
                          <div key={index} className="list-group-item d-flex align-items-center gap-2 bg-light border-0 mb-2 rounded">
                            <button 
                              type="button" 
                              className={`btn btn-sm ${foto.esPrincipal ? 'btn-warning text-dark shadow-sm' : 'btn-outline-secondary border-0'}`} 
                              onClick={() => handleSetPrincipal(index)}
                              title={foto.esPrincipal ? 'Foto Principal' : 'Marcar como Principal'}
                            >
                              <i className={foto.esPrincipal ? 'bi bi-star-fill' : 'bi bi-star'}></i>
                            </button>
                            <input 
                              type="text" 
                              className="form-control form-control-sm" 
                              value={foto.urlFoto} 
                              onChange={(e) => handleFotoChange(index, e.target.value)} 
                              placeholder="https://ejemplo.com/foto.jpg" 
                            />
                            <button 
                              type="button" 
                              className="btn btn-sm btn-outline-danger border-0" 
                              onClick={() => handleRemoveFoto(index)}
                              title="Eliminar Foto"
                            >
                              <i className="bi bi-trash-fill"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-semibold text-muted">Descripción</label>
                    <textarea className="form-control" rows={3} value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})}></textarea>
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-semibold text-muted">Características / Amenities</label>
                    <div className="d-flex flex-wrap gap-2 mt-1">
                      {caracteristicas.map(c => {
                        const isSelected = formData.caracteristicas.some((fc:any) => fc.id === c.id);
                        return (
                          <div 
                            key={c.id} 
                            onClick={() => handleCaracteristicaToggle(c.id)}
                            className={`badge px-3 py-2 cursor-pointer border ${isSelected ? 'bg-primary text-white' : 'bg-light text-dark'}`}
                            style={{cursor: 'pointer'}}
                          >
                            <i className={`bi bi-${c.icono || 'check-circle'} me-1`}></i> {c.nombreCaracteristica}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top-0 bg-light">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="button" className="btn btn-primary-custom" onClick={handleSave}>Guardar Espacio</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EspaciosView;
