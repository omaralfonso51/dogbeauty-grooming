import { useState, useEffect } from 'react';
import api from '../services/api';
import './Common.css';

const Pets = () => {
  const [pets, setPets] = useState([]);
  const [owners, setOwners] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', breed: '', owner_id: '', notes: '', photo_url: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [petsRes, ownersRes] = await Promise.all([api.get('/pets'), api.get('/owners')]);
      setPets(petsRes.data);
      setOwners(ownersRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/pets', form);
      setShowForm(false);
      setForm({ name: '', breed: '', owner_id: '', notes: '', photo_url: '' });
      loadData();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta mascota?')) return;
    try { await api.delete(`/pets/${id}`); loadData(); }
    catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  if (loading) return <div className="page-loading">Cargando mascotas...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div><h1>Mascotas</h1><p>{pets.length} mascotas registradas</p></div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nueva Mascota'}
        </button>
      </div>

      {showForm && (
        <div className="card form-card">
          <h3>Nueva Mascota</h3>
          <form onSubmit={handleSubmit} className="grid-form">
            <div className="form-group">
              <label>Nombre</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Raza</label>
              <input value={form.breed} onChange={e => setForm({...form, breed: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Dueño</label>
              <select value={form.owner_id} onChange={e => setForm({...form, owner_id: e.target.value})} required>
                <option value="">Seleccionar dueño</option>
                {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>URL Foto (opcional)</label>
              <input value={form.photo_url} onChange={e => setForm({...form, photo_url: e.target.value})} placeholder="https://..." />
            </div>
            <div className="form-group full-width">
              <label>Notas</label>
              <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows="2" />
            </div>
            <div className="form-actions full-width">
              <button type="submit" className="btn-primary">Registrar Mascota</button>
            </div>
          </form>
        </div>
      )}

      <div className="cards-grid">
        {pets.map(p => (
          <div key={p.id} className="pet-card">
            <div className="pet-photo">
              {p.photo_url ? <img src={p.photo_url} alt={p.name} /> : <span>🐶</span>}
            </div>
            <div className="pet-info">
              <h3>{p.name}</h3>
              <p className="pet-breed">{p.breed}</p>
              <p className="pet-owner">👤 {p.owner_name}</p>
              {p.notes && <p className="pet-notes">📝 {p.notes}</p>}
            </div>
            <button className="btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Eliminar</button>
          </div>
        ))}
      </div>
      {pets.length === 0 && <div className="empty-table">No hay mascotas registradas</div>}
    </div>
  );
};

export default Pets;