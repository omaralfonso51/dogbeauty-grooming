import { useState, useEffect } from 'react';
import api from '../services/api';
import './Common.css';

const Groomers = () => {
  const [groomers, setGroomers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', password: '', commission_rate: ''
  });

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!search) return setFiltered(groomers);
    setFiltered(groomers.filter(g =>
      g.name?.toLowerCase().includes(search.toLowerCase()) ||
      g.email?.toLowerCase().includes(search.toLowerCase())
    ));
  }, [groomers, search]);

  const loadData = async () => {
    try {
      const res = await api.get('/auth/groomers');
      setGroomers(res.data);
      setFiltered(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/auth/groomers', form);
      setShowForm(false);
      setForm({ name: '', email: '', password: '', commission_rate: '' });
      setSuccess('✅ Groomer registrado exitosamente');
      setTimeout(() => setSuccess(''), 3000);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar groomer');
    }
  };

  if (loading) return <div className="page-loading">Cargando groomers...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Groomers</h1>
          <p>{groomers.length} groomers registrados</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nuevo Groomer'}
        </button>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="card form-card">
          <h3>Registrar Nuevo Groomer</h3>
          <form onSubmit={handleSubmit} className="grid-form">
            <div className="form-group">
              <label>Nombre completo *</label>
              <input
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                placeholder="Ej: Carlos Rodríguez"
                required
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                placeholder="carlos@dogbeauty.com"
                required
              />
            </div>
            <div className="form-group">
              <label>Contraseña temporal *</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>
            <div className="form-group">
              <label>Porcentaje de comisión (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.commission_rate}
                onChange={e => setForm({...form, commission_rate: e.target.value})}
                placeholder="Ej: 20"
              />
            </div>
            <div className="form-actions full-width">
              <button type="submit" className="btn-primary">Registrar Groomer</button>
            </div>
          </form>
        </div>
      )}

      <div className="toolbar">
        <input
          className="search-input"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="cards-grid">
        {filtered.map(g => (
          <div key={g.id} className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'var(--accent-light)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', margin: '0 auto 1rem'
            }}>
              ✂️
            </div>
            <h3 style={{
              fontFamily: 'Playfair Display, serif',
              color: 'var(--primary)',
              marginBottom: '0.4rem'
            }}>
              {g.name}
            </h3>
            <p style={{
              color: 'var(--text-light)',
              fontSize: '0.85rem',
              marginBottom: '0.75rem'
            }}>
              {g.email}
            </p>
            <span className="category-badge">
              Comisión: {g.commission_rate}%
            </span>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-table">No hay groomers registrados</div>
      )}
    </div>
  );
};

export default Groomers;