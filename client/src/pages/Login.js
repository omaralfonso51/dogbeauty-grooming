import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import PasswordInput from '../components/PasswordInput';
import './Login.css';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!form.email.trim()) newErrors.email = 'El email es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Email inválido';
    if (!form.password) newErrors.password = 'La contraseña es obligatoria';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError('');
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      setServerError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <span className="login-icon">🐾</span>
          <h1>DogBeauty</h1>
          <p>Peluquería Canina Premium</p>
        </div>

        {serverError && <div className="alert alert-error">{serverError}</div>}

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => { setForm({...form, email: e.target.value}); setErrors({...errors, email: ''}); }}
              placeholder="admin@dogbeauty.com"
              style={{ borderColor: errors.email ? 'var(--danger)' : undefined }}
            />
            {errors.email && <span style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>⚠️ {errors.email}</span>}
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <PasswordInput
              value={form.password}
              onChange={e => { setForm({...form, password: e.target.value}); setErrors({...errors, password: ''}); }}
              placeholder="••••••••"
              required
            />
            {errors.password && <span style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>⚠️ {errors.password}</span>}
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '⏳ Ingresando...' : 'Ingresar'}
          </button>
        </form>
        <p className="login-hint">Admin: admin@dogbeauty.com</p>
      </div>
    </div>
  );
};

export default Login;