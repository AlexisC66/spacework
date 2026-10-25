import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './components/Login';
import Catalogo from './components/Catalogo';
import Reserva from './components/Reserva';
import Dashboard from './components/Dashboard';
import Configuracion from './components/Configuracion';
import Miembros from './components/Miembros';
import Pagos from './components/Pagos';
import MisReservas from './components/MisReservas';
import Inicio from './components/Inicio';
import CrmView from './components/erp/CrmView';
import BillingView from './components/erp/BillingView';
import EspaciosView from './components/erp/EspaciosView';
import ReservasAdminView from './components/erp/ReservasAdminView';
import ServiciosAdicionalesView from './components/erp/ServiciosAdicionalesView';
import SedesView from './components/erp/SedesView';
import CaracteristicasView from './components/erp/CaracteristicasView';
import AuditoriaView from './components/erp/AuditoriaView';

import PublicLayout from './components/layout/PublicLayout';
import AdminLayout from './components/layout/AdminLayout';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rutas Públicas / Cliente */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Inicio />} />
            <Route path="/catalogo" element={<Catalogo />} />
            <Route path="/reserva/:id" element={
              <ProtectedRoute allowedRoles={['CLIENTE', 'ADMIN', 'SUPERADMIN', 'ADMINISTRADOR']}>
                <Reserva />
              </ProtectedRoute>
            } />
            <Route path="/mis-reservas" element={
              <ProtectedRoute allowedRoles={['CLIENTE', 'ADMIN', 'SUPERADMIN', 'ADMINISTRADOR']}>
                <MisReservas />
              </ProtectedRoute>
            } />
            <Route path="/pagos" element={
              <ProtectedRoute allowedRoles={['CLIENTE', 'ADMIN', 'SUPERADMIN', 'ADMINISTRADOR']}>
                <Pagos />
              </ProtectedRoute>
            } />
            <Route path="/configuracion" element={
              <ProtectedRoute allowedRoles={['CLIENTE', 'ADMIN', 'SUPERADMIN', 'ADMINISTRADOR']}>
                <Configuracion />
              </ProtectedRoute>
            } />
          </Route>

          {/* Ruta de Login (sin Layout) */}
          <Route path="/login" element={<Login />} />

          {/* Rutas de Administración ERP */}
          <Route element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN', 'ADMINISTRADOR']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/crm" element={<CrmView />} />
            <Route path="/facturacion" element={<BillingView />} />
            <Route path="/usuarios" element={<Miembros />} />
            <Route path="/espacios" element={<EspaciosView />} />
            <Route path="/reservas" element={<ReservasAdminView />} /> 
            <Route path="/servicios" element={<ServiciosAdicionalesView />} />
            <Route path="/sedes" element={<SedesView />} />
            <Route path="/caracteristicas" element={<CaracteristicasView />} />
            <Route path="/auditoria" element={<AuditoriaView />} />
          </Route>

          {/* Ruta por defecto */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
