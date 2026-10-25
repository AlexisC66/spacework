import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

const Inicio: React.FC = () => {
  const navigate = useNavigate();
  const [espaciosDestacados, setEspaciosDestacados] = useState<any[]>([]);

  useEffect(() => {
    const fetchDestacados = async () => {
      try {
        const response = await apiService.getEspacios();
        if (Array.isArray(response.data)) {
          setEspaciosDestacados(response.data.slice(0, 3));
        }
      } catch (err) {
        console.error("Error cargando espacios destacados", err);
      }
    };
    fetchDestacados();
  }, []);

  const handleReservarClick = () => {
    const userStr = sessionStorage.getItem('user');
    if (!userStr) {
      navigate('/login');
    } else {
      navigate('/catalogo');
    }
  };
  return (
    <div className="landing-page">
      {/* Navbar Transparente Específico de la Landing Page */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-transparent position-absolute w-100" style={{ zIndex: 10 }}>
        <div className="container mt-3">
          <Link className="navbar-brand fw-bold fs-3 text-white" to="/">
            <i className="bi bi-rocket-takeoff-fill me-2"></i>SpaceWork
          </Link>
          <div className="d-flex align-items-center gap-3">
            <Link to="/login" className="btn btn-outline-light rounded-pill px-4 fw-bold">
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section d-flex align-items-center position-relative">
        <div className="overlay"></div>
        <div className="container position-relative z-index-1 text-center text-white">
          <h1 className="display-3 fw-bolder mb-4 animate-fade-up">El Futuro del Trabajo <br/><span className="text-gradient" style={{ background: 'linear-gradient(135deg, #22d3ee 0%, #818cf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Es Flexible</span></h1>
          <p className="lead mb-5 mx-auto animate-fade-up delay-1" style={{ maxWidth: '700px', fontWeight: 300, fontSize: '1.25rem', color: '#e2e8f0' }}>
            Descubre, reserva y gestiona espacios de trabajo colaborativos y oficinas premium adaptadas a las necesidades de tu equipo en tiempo real.
          </p>
          <div className="d-flex justify-content-center gap-3 animate-fade-up delay-2">
            <Link to="/catalogo" className="btn btn-primary-custom btn-lg px-5 py-3 rounded-pill fw-bold d-flex align-items-center shadow-lg hover-lift">
              Explorar Espacios <i className="bi bi-arrow-right ms-2 fs-5"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-5" style={{ backgroundColor: 'var(--background-light)' }}>
        <div className="container py-5">
          <div className="text-center mb-5">
            <h2 className="fw-bold mb-3 text-gradient">¿Por qué elegir SpaceWork?</h2>
            <p className="text-muted">Diseñado para maximizar la productividad y comodidad de tu equipo.</p>
          </div>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="glass-card p-4 text-center hover-lift h-100">
                <div className="icon-circle bg-primary bg-opacity-10 text-primary mx-auto mb-4 d-flex align-items-center justify-content-center rounded-circle" style={{ width: '80px', height: '80px' }}>
                  <i className="bi bi-geo-alt fs-1"></i>
                </div>
                <h4 className="fw-bold text-dark mb-3">Ubicaciones Premium</h4>
                <p className="text-muted small">Accede a las mejores sedes empresariales de Lima con todas las comodidades modernas a tu alcance.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="glass-card p-4 text-center hover-lift h-100">
                <div className="icon-circle bg-success bg-opacity-10 text-success mx-auto mb-4 d-flex align-items-center justify-content-center rounded-circle" style={{ width: '80px', height: '80px' }}>
                  <i className="bi bi-lightning-charge fs-1"></i>
                </div>
                <h4 className="fw-bold text-dark mb-3">Reserva Instantánea</h4>
                <p className="text-muted small">Gestiona tus espacios en segundos. Sin papeleos, con un sistema 100% digital y en tiempo real.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="glass-card p-4 text-center hover-lift h-100">
                <div className="icon-circle bg-warning bg-opacity-10 text-warning mx-auto mb-4 d-flex align-items-center justify-content-center rounded-circle" style={{ width: '80px', height: '80px' }}>
                  <i className="bi bi-shield-check fs-1"></i>
                </div>
                <h4 className="fw-bold text-dark mb-3">Gestión Segura</h4>
                <p className="text-muted small">Plataforma segura con control de acceso y gestión integral para administradores y usuarios.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Espacios Destacados Section */}
      {espaciosDestacados.length > 0 && (
        <section className="py-5" style={{ backgroundColor: 'var(--card-light)' }}>
          <div className="container py-5">
            <div className="text-center mb-5">
              <h2 className="fw-bold mb-3 text-gradient">Espacios Destacados</h2>
              <p className="text-muted">Explora algunas de nuestras opciones premium disponibles para ti.</p>
            </div>
            <div className="row g-4">
              {espaciosDestacados.map((espacio) => (
                <div key={espacio.id} className="col-md-4 animate-fade-in">
                  <div className="card h-100 shadow-sm border-0 hover-lift rounded-4 overflow-hidden" style={{ backgroundColor: 'var(--background-light)' }}>
                    <div className="position-relative" style={{ height: '220px' }}>
                      {espacio.fotos && espacio.fotos.length > 0 ? (
                        <img src={espacio.fotos[0].urlFoto} alt={espacio.descripcion} className="w-100 h-100 object-fit-cover" />
                      ) : (
                        <div className="w-100 h-100 bg-secondary bg-opacity-25 d-flex align-items-center justify-content-center">
                          <i className="bi bi-image fs-1 text-muted"></i>
                        </div>
                      )}
                      <div className="position-absolute top-0 end-0 m-3">
                        <span className="badge bg-primary px-3 py-2 rounded-pill shadow-sm">
                          {espacio.tipoEspacio?.nombreTipo || 'Oficina'}
                        </span>
                      </div>
                    </div>
                    <div className="card-body p-4 d-flex flex-column">
                      <h5 className="fw-bold text-dark mb-2 text-truncate" title={espacio.descripcion}>
                        {espacio.descripcion}
                      </h5>
                      <p className="text-muted small mb-3 flex-grow-1">
                        <i className="bi bi-geo-alt-fill text-primary me-2"></i>
                        {espacio.ubicacion?.nombreUbicacion} - {espacio.ubicacion?.ciudad}
                      </p>
                      <button 
                        onClick={handleReservarClick}
                        className="btn btn-outline-primary rounded-pill w-100 fw-bold hover-lift"
                      >
                        Reservar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-5">
              <Link to="/catalogo" className="btn btn-primary-custom px-5 py-3 rounded-pill fw-bold shadow-sm hover-lift">
                Ver todos los espacios <i className="bi bi-grid ms-2"></i>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer Minimalista */}
      <footer className="py-4 text-center" style={{ backgroundColor: 'var(--background-darker)' }}>
        <div className="container">
          <p className="mb-0 text-muted small">&copy; 2026 SpaceWork. Todos los derechos reservados.</p>
        </div>
      </footer>

      <style>{`
        .landing-page {
          overflow-x: hidden;
        }
        .hero-section {
          height: 100vh;
          min-height: 600px;
          background-image: url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1920&h=1080');
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
        }
        .hero-section .overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(30,58,138,0.7) 100%);
          z-index: 0;
        }
        .z-index-1 {
          z-index: 1;
        }
        
        /* Animaciones */
        .animate-fade-up {
          animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
          transform: translateY(30px);
        }
        .delay-1 { animation-delay: 0.2s; }
        .delay-2 { animation-delay: 0.4s; }
        
        @keyframes fadeUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Inicio;
