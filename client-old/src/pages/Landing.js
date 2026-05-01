import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

const slides = [
  {
    title: "Tu mejor amigo merece lo mejor",
    subtitle: "Servicios de grooming premium para tu mascota",
    emoji: "🐾",
    bg: "#2C1810"
  },
  {
    title: "Groomers certificados y profesionales",
    subtitle: "Más de 50 razas atendidas con amor y experiencia",
    emoji: "✂️",
    bg: "#8B4513"
  },
  {
    title: "Agenda en línea 24/7",
    subtitle: "Gestiona citas, historial y recordatorios desde un solo lugar",
    emoji: "📅",
    bg: "#5C3317"
  }
];

const services = [
  { icon: "🛁", title: "Baño Premium", desc: "Shampoo hipoalergénico, secado y perfumado" },
  { icon: "✂️", title: "Corte a la Medida", desc: "Más de 30 estilos según la raza de tu perro" },
  { icon: "🐾", title: "Baño y Corte", desc: "El paquete completo para tu mejor amigo" },
  { icon: "🛍️", title: "Tienda de Productos", desc: "Shampoos, accesorios y más para tu mascota" },
];

const Landing = () => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="landing">
      {/* NAVBAR */}
      <nav className="landing-nav">
        <div className="landing-brand">
          <span>🐾</span>
          <span>DogBeauty</span>
        </div>
        <div className="landing-nav-links">
          <a href="#servicios">Servicios</a>
          <a href="#nosotros">Nosotros</a>
          <a href="#contacto">Contacto</a>
          <button className="landing-btn-primary" onClick={() => navigate('/login')}>
            Iniciar sesión
          </button>
        </div>
      </nav>

      {/* CARRUSEL HERO */}
      <section className="hero">
        {slides.map((s, i) => (
          <div key={i} className={`slide ${i === current ? 'active' : ''}`} style={{ background: s.bg }}>
            <div className="slide-content">
              <span className="slide-emoji">{s.emoji}</span>
              <h1>{s.title}</h1>
              <p>{s.subtitle}</p>
              <button className="landing-btn-accent" onClick={() => navigate('/login')}>
                Acceder al sistema →
              </button>
            </div>
          </div>
        ))}
        <div className="slide-dots">
          {slides.map((_, i) => (
            <button key={i} className={`dot ${i === current ? 'active' : ''}`} onClick={() => setCurrent(i)} />
          ))}
        </div>
      </section>

      {/* SERVICIOS */}
      <section className="landing-section" id="servicios">
        <div className="landing-container">
          <h2>Nuestros Servicios</h2>
          <p className="section-subtitle">Todo lo que tu mascota necesita en un solo lugar</p>
          <div className="services-grid">
            {services.map((s, i) => (
              <div key={i} className="service-card">
                <span className="service-icon">{s.icon}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NOSOTROS */}
      <section className="landing-section alt" id="nosotros">
        <div className="landing-container two-col">
          <div className="about-text">
            <h2>Sobre DogBeauty</h2>
            <p>Somos una peluquería canina premium comprometida con el bienestar y la belleza de tu mascota. Nuestro equipo de groomers certificados trabaja con amor y profesionalismo.</p>
            <ul className="about-list">
              <li>✅ Más de 5 años de experiencia</li>
              <li>✅ Productos hipoalergénicos certificados</li>
              <li>✅ Groomers certificados internacionalmente</li>
              <li>✅ Sistema de agenda y recordatorios online</li>
            </ul>
          </div>
          <div className="about-visual">
            <span>🐶</span>
          </div>
        </div>
      </section>

      {/* CONTACTO */}
      <section className="landing-section" id="contacto">
        <div className="landing-container">
          <h2>Contáctanos</h2>
          <p className="section-subtitle">Estamos aquí para atenderte</p>
          <div className="contact-grid">
            <div className="contact-card">
              <span>📍</span>
              <h3>Dirección</h3>
              <p>Calle 123 #45-67, Bogotá, Colombia</p>
            </div>
            <div className="contact-card">
              <span>📞</span>
              <h3>Teléfono</h3>
              <p>+57 300 123 4567</p>
            </div>
            <div className="contact-card">
              <span>📧</span>
              <h3>Email</h3>
              <p>contacto@dogbeauty.com</p>
            </div>
            <div className="contact-card">
              <span>🕐</span>
              <h3>Horario</h3>
              <p>Lun - Sáb: 8am - 6pm</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="landing-brand">
          <span>🐾</span>
          <span>DogBeauty Grooming</span>
        </div>
        <p>© 2026 DogBeauty. Todos los derechos reservados.</p>
        <button className="landing-btn-primary" onClick={() => navigate('/login')}>
          Acceder al sistema
        </button>
      </footer>
    </div>
  );
};

export default Landing;