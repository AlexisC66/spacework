import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoginTab, setIsLoginTab] = useState(true);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // register form state
  const [selectedRol, setSelectedRol] = useState('CLIENTE');
  const [regData, setRegData] = useState({
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    numeroDocumento: '',
    correoElectronico: '',
    telefono: '',
    contrasena: '',
    tipoCuenta: 'natural',
    ruc: '',
    razonSocial: '',
    direccion: ''
  });

  useEffect(() => {
    if (sessionStorage.getItem('user')) {
      navigate('/catalogo');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const response = await apiService.login(loginEmail, loginPass);
      const data = response.data;
      
      login(data.usuario, data.accessToken);
      
      setSuccessMessage('Ingreso exitoso. Redireccionando...');
      setTimeout(() => {
        // Redirigir según el rol
        const rol = data.usuario?.rol?.nombreRol;
        if (['ADMIN', 'ADMINISTRADOR', 'SUPERADMIN'].includes(rol)) {
          navigate('/dashboard');
        } else {
          navigate('/catalogo');
        }
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Error al iniciar sesión.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const payload: any = {
        nombre: regData.nombre,
        apellidoPaterno: regData.apellidoPaterno,
        apellidoMaterno: regData.apellidoMaterno,
        numeroDocumento: regData.numeroDocumento,
        correoElectronico: regData.correoElectronico,
        telefono: regData.telefono,
        contrasena: regData.contrasena
      };

      if (regData.tipoCuenta === 'empresa') {
        payload.empresa = {
          documentoFiscal: regData.ruc,
          razonSocial: regData.razonSocial,
          direccion: regData.direccion
        };
      }

      await apiService.registro(payload, selectedRol);
      setSuccessMessage('Registro completo. Ya puede iniciar sesión.');
      setRegData({
        nombre: '',
        apellidoPaterno: '',
        apellidoMaterno: '',
        numeroDocumento: '',
        correoElectronico: '',
        telefono: '',
        contrasena: '',
        tipoCuenta: 'natural',
        ruc: '',
        razonSocial: '',
        direccion: ''
      });
      setSelectedRol('CLIENTE');
      setTimeout(() => setIsLoginTab(true), 1500);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Error en el registro.');
    }
  };

  return (
    <div className="login-bg min-vh-100 d-flex align-items-center justify-content-center p-3 animate-fade-in position-relative">
      
      <button 
        onClick={() => navigate('/')} 
        className="btn btn-link text-decoration-none position-absolute" 
        style={{ top: '20px', left: '20px', zIndex: 10, fontSize: '1.1rem', color: 'var(--primary-color)', fontWeight: '500' }}>
        <i className="bi bi-arrow-left me-2"></i> Volver al Inicio
      </button>

      <div className="row g-0 w-100 shadow-lg rounded-4 overflow-hidden" style={{ backgroundColor: 'var(--card-light)', border: '1px solid var(--border-color)', maxWidth: '900px' }}>
        
        {/* Left Side Branding */}
        <div className="col-md-5 d-none d-md-flex flex-column justify-content-center align-items-center p-5 position-relative" style={{ background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)' }}>
          <div className="text-center z-1">
            <h1 className="text-white fw-bold mb-3 d-flex align-items-center justify-content-center gap-2" style={{ fontSize: '2.8rem', letterSpacing: '-1px' }}>
              <i className="bi bi-rocket-takeoff-fill"></i> SpaceWork
            </h1>
            <p className="text-white opacity-75 mb-4">El futuro del trabajo comienza aquí. Encuentra tu espacio ideal.</p>
            <div className="d-flex justify-content-center gap-2">
              <span className="badge bg-white rounded-pill px-3 py-2 shadow-sm" style={{ color: 'var(--primary-color)' }}>Flexible</span>
              <span className="badge bg-white rounded-pill px-3 py-2 shadow-sm" style={{ color: 'var(--primary-color)' }}>Moderno</span>
            </div>
          </div>
          {/* Decorative shapes */}
          <div className="position-absolute rounded-circle" style={{ width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0) 70%)', top: '10%', left: '10%' }}></div>
          <div className="position-absolute rounded-circle" style={{ width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0) 70%)', bottom: '-5%', right: '-10%' }}></div>
        </div>

        {/* Right Side Form */}
        <div className="col-md-7 p-4 p-sm-5" style={{ backgroundColor: 'var(--card-light)' }}>
          
          <div className="d-flex mb-4 gap-2 border-bottom pb-2" style={{ borderColor: 'var(--border-color)' }}>
            <button 
              className={`btn flex-grow-1 fw-bold ${isLoginTab ? 'rounded-0' : 'text-muted border-0'}`}
              onClick={() => { setIsLoginTab(true); setErrorMessage(''); setSuccessMessage(''); }}
              style={{ background: 'none', color: isLoginTab ? 'var(--primary-color)' : 'var(--text-muted)', borderBottom: isLoginTab ? '2px solid var(--primary-color)' : 'none' }}>
              Ingresar
            </button>
            <button 
              className={`btn flex-grow-1 fw-bold ${!isLoginTab ? 'rounded-0' : 'text-muted border-0'}`}
              onClick={() => { setIsLoginTab(false); setErrorMessage(''); setSuccessMessage(''); }}
              style={{ background: 'none', color: !isLoginTab ? 'var(--primary-color)' : 'var(--text-muted)', borderBottom: !isLoginTab ? '2px solid var(--primary-color)' : 'none' }}>
              Registrarse
            </button>
          </div>

          {errorMessage && <div className="alert alert-danger small shadow-sm">{errorMessage}</div>}
          {successMessage && <div className="alert alert-success small shadow-sm">{successMessage}</div>}

          {isLoginTab ? (
            <form onSubmit={handleLogin} className="animate-fade-in">
              <h3 className="fw-bold mb-3" style={{ color: 'var(--text-dark)' }}>Bienvenido de vuelta</h3>
              <div className="mb-3">
                <label className="form-label small text-uppercase fw-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Correo Electrónico</label>
                <input type="email" className="form-control py-2 shadow-none login-input" required
                       value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
              </div>
              <div className="mb-4">
                <label className="form-label small text-uppercase fw-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Contraseña</label>
                <input type="password" className="form-control py-2 shadow-none login-input" required
                       value={loginPass} onChange={(e) => setLoginPass(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary-custom w-100 py-2 fw-bold mb-2">
                Iniciar Sesión
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="animate-fade-in">
              <h3 className="fw-bold mb-3 fs-4" style={{ color: 'var(--text-dark)' }}>Crear una Cuenta</h3>
              
              <div className="mb-3">
                <label className="form-label small text-uppercase fw-semibold mb-2" style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Tipo de Cuenta</label>
                <div className="d-flex gap-3">
                  <div className="form-check">
                    <input className="form-check-input" type="radio" name="tipoCuenta" id="cuentaNatural" 
                           checked={regData.tipoCuenta === 'natural'} onChange={() => setRegData({...regData, tipoCuenta: 'natural'})} />
                    <label className="form-check-label small" htmlFor="cuentaNatural">Persona Natural</label>
                  </div>
                  <div className="form-check">
                    <input className="form-check-input" type="radio" name="tipoCuenta" id="cuentaEmpresa" 
                           checked={regData.tipoCuenta === 'empresa'} onChange={() => setRegData({...regData, tipoCuenta: 'empresa'})} />
                    <label className="form-check-label small" htmlFor="cuentaEmpresa">Empresa</label>
                  </div>
                </div>
              </div>

              {regData.tipoCuenta === 'empresa' && (
                <div className="p-3 mb-3 bg-light rounded-3 border">
                  <h6 className="fw-bold mb-3 small" style={{ color: 'var(--primary-color)' }}>Datos de la Empresa</h6>
                  <div className="row g-2">
                    <div className="col-md-4">
                      <label className="form-label small text-uppercase fw-semibold mb-1" style={{ fontSize: '0.7rem' }}>RUC</label>
                      <input type="text" className="form-control form-control-sm py-2 shadow-none login-input" required={regData.tipoCuenta === 'empresa'}
                             pattern="^[0-9]{11}$" title="El RUC debe tener exactamente 11 dígitos numéricos"
                             value={regData.ruc} onChange={(e) => setRegData({...regData, ruc: e.target.value.replace(/[^0-9]/g, '')})} />
                    </div>
                    <div className="col-md-8">
                      <label className="form-label small text-uppercase fw-semibold mb-1" style={{ fontSize: '0.7rem' }}>Razón Social</label>
                      <input type="text" className="form-control form-control-sm py-2 shadow-none login-input" required={regData.tipoCuenta === 'empresa'}
                             value={regData.razonSocial} onChange={(e) => setRegData({...regData, razonSocial: e.target.value})} />
                    </div>
                    <div className="col-12">
                      <label className="form-label small text-uppercase fw-semibold mb-1" style={{ fontSize: '0.7rem' }}>Dirección Fiscal</label>
                      <input type="text" className="form-control form-control-sm py-2 shadow-none login-input" required={regData.tipoCuenta === 'empresa'}
                             value={regData.direccion} onChange={(e) => setRegData({...regData, direccion: e.target.value})} />
                    </div>
                  </div>
                </div>
              )}

              <h6 className="fw-bold mb-3 small mt-2" style={{ color: 'var(--text-dark)' }}>{regData.tipoCuenta === 'empresa' ? 'Datos del Representante' : 'Tus Datos Personales'}</h6>
              <div className="row g-2">


                <div className="col-md-6">
                  <label className="form-label small text-uppercase fw-semibold mb-1" style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Nombres</label>
                  <input type="text" className="form-control form-control-sm py-2 shadow-none login-input" required
                         value={regData.nombre} onChange={(e) => setRegData({...regData, nombre: e.target.value})} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-uppercase fw-semibold mb-1" style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Apellido Paterno</label>
                  <input type="text" className="form-control form-control-sm py-2 shadow-none login-input" required
                         value={regData.apellidoPaterno} onChange={(e) => setRegData({...regData, apellidoPaterno: e.target.value})} />
                </div>
                
                <div className="col-md-6">
                  <label className="form-label small text-uppercase fw-semibold mb-1" style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Apellido Materno</label>
                  <input type="text" className="form-control form-control-sm py-2 shadow-none login-input"
                         value={regData.apellidoMaterno} onChange={(e) => setRegData({...regData, apellidoMaterno: e.target.value})} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-uppercase fw-semibold mb-1" style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>N° Documento (DNI)</label>
                  <input type="text" className="form-control form-control-sm py-2 shadow-none login-input" required
                         pattern="^[0-9]{8}$" title="El DNI debe tener exactamente 8 dígitos numéricos"
                         value={regData.numeroDocumento} onChange={(e) => setRegData({...regData, numeroDocumento: e.target.value.replace(/[^0-9]/g, '')})} />
                </div>

                <div className="col-md-6">
                  <label className="form-label small text-uppercase fw-semibold mb-1" style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Celular / Teléfono</label>
                  <input type="text" className="form-control form-control-sm py-2 shadow-none login-input"
                         value={regData.telefono} onChange={(e) => setRegData({...regData, telefono: e.target.value})} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-uppercase fw-semibold mb-1" style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Correo Electrónico</label>
                  <input type="email" className="form-control form-control-sm py-2 shadow-none login-input" required
                         value={regData.correoElectronico} onChange={(e) => setRegData({...regData, correoElectronico: e.target.value})} />
                </div>
                <div className="col-12">
                  <label className="form-label small text-uppercase fw-semibold mb-1" style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Contraseña</label>
                  <input type="password" className="form-control form-control-sm py-2 shadow-none login-input" required minLength={8}
                         pattern="(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_.\-])[A-Za-z\d@$!%*?&_.\-]{8,}"
                         title="La contraseña debe tener al menos 8 caracteres, 1 mayúscula, 1 número y 1 carácter especial (@$!%*?&_.-)"
                         value={regData.contrasena} onChange={(e) => setRegData({...regData, contrasena: e.target.value})} />
                </div>
              </div>
              
              <button type="submit" className="btn btn-primary-custom w-100 py-2 fw-bold mt-4">
                Crear Cuenta
              </button>
            </form>
          )}

        </div>
      </div>
      
      <style>{`
        .login-bg {
          background-color: var(--background-light);
          background-image: 
            radial-gradient(at 0% 0%, rgba(2, 136, 209, 0.08) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(30, 58, 138, 0.08) 0px, transparent 50%);
        }
        
        .login-input {
          background-color: #f8fafc;
          border: 1px solid var(--border-color);
          color: var(--text-dark);
          transition: all 0.2s ease;
        }

        .login-input:focus {
          border-color: var(--primary-color) !important;
          box-shadow: 0 0 0 0.25rem rgba(30, 58, 138, 0.15) !important;
          background-color: #ffffff;
        }
      `}</style>
    </div>
  );
};

export default Login;
