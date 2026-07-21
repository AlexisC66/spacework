import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';

/**
 * Pantalla "Olvidé mi contraseña".
 * El usuario ingresa su correo y recibe un enlace de recuperación.
 */
const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await apiService.forgotPassword(email);
      setMessage(response.data.mensaje);
      setEmail('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al procesar la solicitud.');
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
        
        {/* Left Side Branding (más angosta en este caso) */}
        <div className="col-md-5 d-none d-md-flex flex-column justify-content-center align-items-center p-4 position-relative" style={{ background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)' }}>
          <div className="text-center z-1">
            <div className="display-3 text-white mb-3">
              <i className="bi bi-shield-lock-fill"></i>
            </div>
            <h2 className="text-white fw-bold mb-2" style={{ fontSize: '1.6rem' }}>¿Olvidaste tu contraseña?</h2>
            <p className="text-white opacity-75 small">No te preocupes, te ayudamos a recuperarla.</p>
          </div>
          <div className="position-absolute rounded-circle" style={{ width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0) 70%)', top: '15%', right: '5%' }}></div>
        </div>

        {/* Right Side Form */}
        <div className="col-md-7 p-4 p-sm-5" style={{ backgroundColor: 'var(--card-light)' }}>
          
          <div className="text-center mb-4">
            <h4 className="fw-bold" style={{ color: 'var(--text-dark)' }}>
              <i className="bi bi-key me-2" style={{ color: 'var(--primary-color)' }}></i>
              Recuperar Contraseña
            </h4>
            <p className="text-muted small">Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.</p>
          </div>

          {error && <div className="alert alert-danger small shadow-sm">{error}</div>}
          {message && <div className="alert alert-success small shadow-sm">{message}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="form-label small text-uppercase fw-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                <i className="bi bi-envelope me-1"></i> Correo Electrónico
              </label>
              <input 
                type="email" 
                className="form-control py-2 shadow-none login-input" 
                placeholder="tu@correo.com"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary-custom w-100 py-2 fw-bold mb-3"
              disabled={loading}
            >
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Enviando...</>
              ) : (
                <><i className="bi bi-send me-2"></i>Enviar Enlace</>
              )}
            </button>
          </form>

          <div className="text-center">
            <Link to="/login" className="text-decoration-none small" style={{ color: 'var(--primary-color)' }}>
              <i className="bi bi-box-arrow-in-right me-1"></i> Volver a iniciar sesión
            </Link>
          </div>

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

export default ForgotPassword;
