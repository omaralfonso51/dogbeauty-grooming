import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => { logout(); navigate('/login'); };
  const isActive = (path) => location.pathname === path ? 'active' : '';

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand-icon">🐾</span>
        <span className="brand-name">DogBeauty</span>
      </div>
      <ul className="navbar-links">
        {isAdmin ? (
          <li><Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link></li>
        ) : (
          <li><Link to="/groomer" className={isActive('/groomer')}>Mi Panel</Link></li>
        )}
        <li><Link to="/appointments" className={isActive('/appointments')}>Citas</Link></li>
        <li><Link to="/pets" className={isActive('/pets')}>Mascotas</Link></li>
        <li><Link to="/owners" className={isActive('/owners')}>Dueños</Link></li>
        <li><Link to="/products" className={isActive('/products')}>Productos</Link></li>
        <li><Link to="/cuts" className={isActive('/cuts')}>Cortes</Link></li>
        {isAdmin && (
          <>
            <li><Link to="/reminders" className={isActive('/reminders')}>Recordatorios</Link></li>
            <li><Link to="/groomers" className={isActive('/groomers')}>Groomers</Link></li>
            <li><Link to="/import-history" className={isActive('/import-history')}>📦 Importaciones</Link></li>
          </>
        )}
      </ul>
      <div className="navbar-user" ref={menuRef}>
        <span className="user-role">{user?.role}</span>
        <button className="btn-settings" onClick={() => setMenuOpen(!menuOpen)}>⚙️</button>
        {menuOpen && (
          <div className="settings-dropdown">
            <div className="dropdown-header">
              <strong>{user?.name}</strong>
              <span>{user?.email}</span>
            </div>
            <Link to="/profile" className="dropdown-item" onClick={() => setMenuOpen(false)}>
              👤 Ver mis datos
            </Link>
            <button className="dropdown-item danger" onClick={handleLogout}>
              🚪 Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;