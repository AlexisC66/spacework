import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  // La cookie HttpOnly se enviará automáticamente gracias a withCredentials: true
  // Ya no inyectamos el token en los headers manualmente
  if (config.headers) {
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers['Pragma'] = 'no-cache';
    config.headers['Expires'] = '0';
  }
  
  // agregar parámetro dinámico para evitar caché agresiva en navegadores (Chrome/Edge)
  if (config.method?.toLowerCase() === 'get') {
    config.params = {
      ...config.params,
      _t: new Date().getTime()
    };
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response && error.response.status === 401) {
    // El backend podría limpiar la cookie en logout, pero en el frontend solo borramos el usuario
    sessionStorage.removeItem('user');
    window.location.href = '/login';
  }
  return Promise.reject(error);
});

export const apiService = {
  // auth Endpoints
  registro: (usuario: Record<string, unknown>, rol: string = 'USUARIO', tipoDoc: string = 'DNI') => {
    return api.post(`/auth/registro?rol=${rol}&tipoDoc=${tipoDoc}`, usuario);
  },
  login: (correo: string, contrasena: string) => {
    return api.post(`/auth/login`, { correoElectronico: correo, contrasena: contrasena });
  },

  // users Endpoints
  getUsuarios: () => api.get(`/usuarios`),
  actualizarPerfil: (id: number, data: Record<string, unknown>) => api.put(`/usuarios/${id}`, data),
  actualizarMiembro: (id: number, data: Record<string, unknown>, nombreRol: string) => api.put(`/usuarios/admin/${id}?nombreRol=${nombreRol}`, data),
  desbloquearMiembro: (id: number) => api.put(`/usuarios/admin/${id}/desbloquear`),
  eliminarMiembro: (id: number) => api.delete(`/usuarios/${id}`),
  cambiarContrasena: (id: number, contrasenaActual: string, nuevaContrasena: string) => 
    api.post(`/usuarios/${id}/cambiar-contrasena`, { contrasenaActual, nuevaContrasena }),


  // CRM Endpoints
  getEmpresas: () => api.get(`/empresas`),
  crearEmpresa: (empresaData: Record<string, unknown>) => api.post(`/empresas`, empresaData),
  updateEmpresa: (id: number, empresaData: Record<string, unknown>) => api.put(`/empresas/${id}`, empresaData),
  deleteEmpresa: (id: number) => api.delete(`/empresas/${id}`),

  // Billing Endpoints
  getFacturas: () => api.get(`/facturas`),

  // spaces Endpoints
  getEspacios: () => api.get(`/espacios`),
  getEspaciosFiltrados: (tipoEspacioId: number) => api.get(`/espacios/filtrar?tipoEspacioId=${tipoEspacioId}`),
  getTiposEspacio: () => api.get(`/espacios/tipos`),
  getUbicaciones: () => api.get(`/ubicaciones`),
  crearUbicacion: (data: Record<string, unknown>) => api.post(`/ubicaciones`, data),
  updateUbicacion: (id: number, data: Record<string, unknown>) => api.put(`/ubicaciones/${id}`, data),
  deleteUbicacion: (id: number) => api.delete(`/ubicaciones/${id}`),

  getCaracteristicas: () => api.get(`/caracteristicas`),
  crearCaracteristica: (data: Record<string, unknown>) => api.post(`/caracteristicas`, data),
  updateCaracteristica: (id: number, data: Record<string, unknown>) => api.put(`/caracteristicas/${id}`, data),
  deleteCaracteristica: (id: number) => api.delete(`/caracteristicas/${id}`),
  crearEspacio: (espacioData: Record<string, unknown>) => api.post(`/espacios`, espacioData),
  actualizarEspacio: (id: number, espacioData: Record<string, unknown>) => api.put(`/espacios/${id}`, espacioData),
  eliminarEspacio: (id: number) => api.delete(`/espacios/${id}`),

  // reservations Endpoints
  crearReserva: (reservaData: Record<string, unknown>) => api.post(`/reservas/crear`, reservaData),
  getReservasPorUsuario: (usuarioId: number) => api.get(`/reservas/usuario/${usuarioId}`),
  getTodasReservas: () => api.get(`/reservas`),
  getServiciosAdicionales: () => api.get(`/servicios-adicionales`),
  crearServicioAdicional: (data: Record<string, unknown>) => api.post(`/servicios-adicionales`, data),
  updateServicioAdicional: (id: number, data: Record<string, unknown>) => api.put(`/servicios-adicionales/${id}`, data),
  deleteServicioAdicional: (id: number) => api.delete(`/servicios-adicionales/${id}`),
  agregarServicioExtraReserva: (id: number, data: unknown[]) => api.post(`/reservas/${id}/agregar-servicio`, data),
  cancelarReserva: (id: number) => api.put(`/reservas/${id}/cancelar`),

  // payments Endpoints
  procesarPago: (pagoData: Record<string, unknown>) => api.post(`/pagos/procesar`, pagoData),
  getTodosPagos: () => api.get(`/pagos`),
  aprobarPago: (id: number) => api.put(`/pagos/${id}/aprobar`),

  // POI Excel Export Endpoint
  descargarReporteExcel: () => api.get(`/reportes/excel`, { responseType: 'blob' }),

  // Reseñas Endpoints
  crearResena: (resenaData: Record<string, unknown>) => api.post(`/resenas`, resenaData),
  getPromedioEspacio: (espacioId: number) => api.get(`/resenas/espacio/${espacioId}`),
  chequearResenaReserva: (reservaId: number) => api.get(`/resenas/reserva/${reservaId}`),
  getResenasDashboard: () => api.get(`/resenas/admin/dashboard`),

  // Auditoria
  getAuditoria: () => api.get(`/auditoria`)
};

export default api;
