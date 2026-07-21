import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { apiService } from '../services/api';

/**
 * Pantalla para restablecer la contraseña.
 * El usuario llega aquí desde el enlace que recibió por correo.
 * El token viene en la URL: /reset-password/{token}
 */
const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValido, setTokenValido] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Al cargar el componente, validamos el token
  useEffect(() => {
    if (!token) {
      setError('Enlace inválido. No se encontró el token de recuperación.');
      setValidating(false);
      return;
    }

    const validarToken = async () => {
      try {
        const response = await apiService.validateResetToken(token);
        if (response.data.valido) {
          setTokenValido(true);
          setError('');
        } else {
          setError('El enlace no es válido.');
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'El enlace ha expirado o ya fue utilizado.');
      } finally {
        setValidating(false);
      }
    };

    // Pequeña pausa para que se vea el loader
    const timer = setTimeout(() => validarToken(), 800);
    return () => clearTimeout(timer);
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const response = await apiService.resetPassword(token!, password);
      setMessage(response.data.mensaje);
      // Redirigir al login después de 3 segundos
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg min-vh-100 d-flex align-items-center justify-content-center p-3 animate-fade-in position-relative">
      
      <button 
        onClick={() => navigate('/login')} 
        className="btn btn-link text-decoration-none position-absolute" 
        style={{ top: '20px', left: '20px', zIndex: 10, fontSize: '1.1rem', color: 'var(--primary-color)', fontWeight: '500' }}>
        <i className="bi bi-arrow-left me-2"></i> Volver
      </button>

      <div className="row g-0 w-100 shadow-lg rounded-4 overflow-hidden" style={{ backgroundColor: 'var(--card-light)', border: '1px solid var(--border-color)', maxWidth: '800px' }}>
        
        {/* Left Side Branding */}
        <div className="col-md-5 d-none d-md-flex flex-column justify-content-center align-items-center p-4 position-relative" style={{ background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)' }}>
          <div className="text-center z-1">
            <div className="display-3 text-white mb-3">
              <i className="bi bi-shield-check"></i>
            </div>
            <h2 className="text-white fw-bold mb-2" style={{ fontSize: '1.6rem' }}>Nueva Contraseña</h2>
            <p className="text-white opacity-75 small">Elige una contraseña segura que no hayas usado antes.</p>
          </div>
          <div className="position-absolute rounded-circle" style={{ width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0) 70%)', bottom: '10%', left: '5%' }}></div>
        </div>

        {/* Right Side Form */}
        <div className="col-md-7 p-4 p-sm-5" style={{ backgroundColor: 'var(--card-light)' }}>
          
          {/* Estado: Validando token */}
          {validating && (
            <div className="text-center py-5">
              <div className="spinner-border mb-3" style={{ color: 'var(--primary-color)', width: '3rem', height: '3rem' }} role="status">
                <span className="visually-hidden">Validando...</span>
              </div>
              <p className="text-muted">Validando enlace de recuperación...</p>
            </div>
          )}

          {/* Estado: Token inválido */}
          {!validating && !tokenValido && (
            <div className="text-center py-4">
              <div className="display-4 text-danger mb-3">
                <i className="bi bi-exclamation-triangle-fill"></i>
              </div>
              <h5 className="fw-bold mb-3" style={{ color: 'var(--text-dark)' }}>Enlace inválido</h5>
              <p className="text-muted small mb-4">{error}</p>
              <div className="d-flex flex-column gap-2">
                <Link to="/forgot-password" className="btn btn-primary-custom py-2 fw-bold">
                  <i className="bi bi-send me-2"></i>Solicitar nuevo enlace
                </Link>
                <Link to="/login" className="btn btn-outline-secondary py-2 fw-bold">
                  <i className="bi bi-box-arrow-in-right me-2"></i>Ir a iniciar sesión
                </Link>
              </div>
            </div>
          )}

          {/* Estado: Token válido - formulario */}
          {!validating && tokenValido && (
            <>
              <div className="text-center mb-4">
                <h4 className="fw-bold" style={{ color: 'var(--text-dark)' }}>
                  <i className="bi bi-shield-lock me-2" style={{ color: 'var(--primary-color)' }}></i>
                  Restablecer Contraseña
                </h4>
                <p className="text-muted small">Ingresa tu nueva contraseña.</p>
              </div>

              {error && <div className="alert alert-danger small shadow-sm">{error}</div>}
              {message && (
                <div className="alert alert-success small shadow-sm">
                  <i className="bi bi-check-circle-fill me-2"></i>{message}
                  <p className="mb-0 mt-2 small">Redirigiendo al inicio de sesión...</p>
                </div>
              )}

              {!message && (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label small text-uppercase fw-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                      <i className="bi bi-lock me-1"></i> Nueva Contraseña
                    </label>
                    <div className="input-group">
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        className="form-control py-2 shadow-none login-input" 
                        placeholder="Mín. 8 caracteres"
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        minLength={8}
                        disabled={loading}
                      />
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary" 
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                      </button>
                    </div>
                    <small className="text-muted">Mínimo 8 caracteres, 1 mayúscula, 1 número y 1 símbolo</small>
                  </div>

                  <div className="mb-4">
                    <label className="form-label small text-uppercase fw-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                      <i className="bi bi-lock-fill me-1"></i> Confirmar Contraseña
                    </label>
                    <div className="input-group">
                      <input 
                        type={showConfirm ? 'text' : 'password'} 
                        className="form-control py-2 shadow-none login-input" 
                        placeholder="Repite la contraseña"
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        required 
                        minLength={8}
                        disabled={loading}
                      />
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary" 
                        onClick={() => setShowConfirm(!showConfirm)}
                        tabIndex={-1}
                      >
                        <i className={`bi ${showConfirm ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary-custom w-100 py-2 fw-bold mb-3"
                    disabled={loading}
                  >
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Restableciendo...</>
                    ) : (
                      <><i className="bi bi-check-lg me-2"></i>Restablecer Contraseña</>
                    )}
                  </button>
                </form>
              )}

              {!message && (
                <div className="text-center">
                  <Link to="/login" className="text-decoration-none small" style={{ color: 'var(--primary-color)' }}>
                    <i className="bi bi-box-arrow-in-right me-1"></i> Volver a iniciar sesión
                  </Link>
                </div>
              )}
            </>
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

export default ResetPassword;
