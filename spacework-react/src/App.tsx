import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicLayout from './components/layout/PublicLayout';
import AdminLayout from './components/layout/AdminLayout';
import Loading from './components/Loading';

// Lazy-loaded components — se cargan bajo demanda
const Login = lazy(() => import('./components/Login'));
const ForgotPassword = lazy(() => import('./components/ForgotPassword'));
const ResetPassword = lazy(() => import('./components/ResetPassword'));
const Inicio = lazy(() => import('./components/Inicio'));
const Catalogo = lazy(() => import('./components/Catalogo'));
const Reserva = lazy(() => import('./components/Reserva'));
const MisReservas = lazy(() => import('./components/MisReservas'));
const Pagos = lazy(() => import('./components/Pagos'));
const Configuracion = lazy(() => import('./components/Configuracion'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const Miembros = lazy(() => import('./components/Miembros'));
const CrmView = lazy(() => import('./components/erp/CrmView'));
const BillingView = lazy(() => import('./components/erp/BillingView'));
const EspaciosView = lazy(() => import('./components/erp/EspaciosView'));
const ReservasAdminView = lazy(() => import('./components/erp/ReservasAdminView'));
const ServiciosAdicionalesView = lazy(() => import('./components/erp/ServiciosAdicionalesView'));
const SedesView = lazy(() => import('./components/erp/SedesView'));
const CaracteristicasView = lazy(() => import('./components/erp/CaracteristicasView'));
const AuditoriaView = lazy(() => import('./components/erp/AuditoriaView'));

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<Loading />}>
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

            {/* Rutas de autenticación (sin Layout) */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

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
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
