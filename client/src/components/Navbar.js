import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };
  const isActive = (path) => location.pathname === path ? 'active' : '';

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
        {isAdmin && <li><Link to="/reminders" className={isActive('/reminders')}>Recordatorios</Link></li>}
      </ul>
      <div className="navbar-user">
        <span className="user-name">👤 {user?.name}</span>
        <span className="user-role">{user?.role}</span>
        <button onClick={handleLogout} className="btn-logout">Salir</button>
      </div>
    </nav>
  );
};

export default Navbar;