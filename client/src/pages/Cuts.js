import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Common.css';

const Cuts = () => {
  const { isAdmin } = useAuth();
  const [cuts, setCuts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', breed: '', description: '', image_url: '', price: '' });

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!search) return setFiltered(cuts);
    setFiltered(cuts.filter(c =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.breed?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase())
    ));
  }, [cuts, search]);

  const loadData = async () => {
    try {
      const res = await api.get('/cuts');
      setCuts(res.data);
      setFiltered(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/cuts', form);
      setShowForm(false);
      setForm({ name: '', breed: '', description: '', image_url: '', price: '' });
      loadData();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const handleEdit = (c) => {
    setEditId(c.id);
    setEditForm({ name: c.name, breed: c.breed || '', description: c.description || '', image_url: c.image_url || '', price: c.price });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/cuts/${editId}`, editForm);
      setEditId(null);
      loadData();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este corte?')) return;
    try { await api.delete(`/cuts/${id}`); loadData(); }
    catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  if (loading) return <div className="page-loading">Cargando catálogo...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div><h1>Catálogo de Cortes</h1><p>{cuts.length} cortes disponibles</p></div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancelar' : '+ Nuevo Corte'}
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <div className="card form-card">
          <h3>Nuevo Corte</h3>
          <form onSubmit={handleSubmit} className="grid-form">
            <div className="form-group">
              <label>Nombre</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Raza</label>
              <input value={form.breed} onChange={e => setForm({...form, breed: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Precio ($)</label>
              <input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
            </div>
            <div className="form-group">
              <label>URL Imagen</label>
              <input value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} />
            </div>
            <div className="form-group full-width">
              <label>Descripción</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows="2" />
            </div>
            <div className="form-actions full-width">
              <button type="submit" className="btn-primary">Crear Corte</button>
            </div>
          </form>
        </div>
      )}

      <div className="toolbar">
        <input className="search-input" placeholder="Buscar por nombre, raza o descripción..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="cards-grid">
        {filtered.map(c => (
          <div key={c.id} className="cut-card">
            {editId === c.id ? (
              <form onSubmit={handleUpdate} className="edit-form">
                <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Nombre" required />
                <input value={editForm.breed} onChange={e => setEditForm({...editForm, breed: e.target.value})} placeholder="Raza" />
                <input type="number" step="0.01" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} placeholder="Precio" />
                <input value={editForm.image_url} onChange={e => setEditForm({...editForm, image_url: e.target.value})} placeholder="URL Imagen" />
                <textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} placeholder="Descripción" rows="2" />
                <div className="action-btns">
                  <button type="submit" className="btn-success btn-sm">✓ Guardar</button>
                  <button type="button" className="btn-secondary btn-sm" onClick={() => setEditId(null)}>✕ Cancelar</button>
                </div>
              </form>
            ) : (
              <>
                {c.image_url
                  ? <img src={c.image_url} alt={c.name} className="cut-image" />
                  : <div className="cut-placeholder">✂️</div>
                }
                <div className="cut-info">
                  <h3>{c.name}</h3>
                  <p className="cut-breed">🐾 {c.breed || 'Todas las razas'}</p>
                  {c.description && <p className="cut-desc">{c.description}</p>}
                  <p className="cut-price">${parseFloat(c.price).toFixed(2)}</p>
                </div>
                {isAdmin && (
                  <div className="action-btns" style={{ justifyContent: 'center' }}>
                    <button className="btn-secondary btn-sm" onClick={() => handleEdit(c)}>✏️ Editar</button>
                    <button className="btn-danger btn-sm" onClick={() => handleDelete(c.id)}>🗑️ Eliminar</button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
      {filtered.length === 0 && <div className="empty-table">No hay cortes que mostrar</div>}
    </div>
  );
};

export default Cuts;