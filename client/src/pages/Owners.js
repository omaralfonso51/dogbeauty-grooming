import { useState, useEffect } from 'react';
import api from '../services/api';
import './Common.css';

const Owners = () => {
  const [owners, setOwners] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!search) return setFiltered(owners);
    setFiltered(owners.filter(o =>
      o.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.phone?.includes(search) ||
      o.email?.toLowerCase().includes(search.toLowerCase())
    ));
  }, [owners, search]);

  const loadData = async () => {
    try {
      const res = await api.get('/owners');
      setOwners(res.data);
      setFiltered(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/owners', form);
      setShowForm(false);
      setForm({ name: '', phone: '', email: '' });
      loadData();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const handleEdit = (o) => {
    setEditId(o.id);
    setEditForm({ name: o.name, phone: o.phone || '', email: o.email || '' });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/owners/${editId}`, editForm);
      setEditId(null);
      loadData();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este dueño y todas sus mascotas?')) return;
    try { await api.delete(`/owners/${id}`); loadData(); }
    catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  if (loading) return <div className="page-loading">Cargando dueños...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div><h1>Dueños</h1><p>{owners.length} clientes registrados</p></div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nuevo Dueño'}
        </button>
      </div>

      {showForm && (
        <div className="card form-card">
          <h3>Nuevo Dueño</h3>
          <form onSubmit={handleSubmit} className="grid-form">
            <div className="form-group">
              <label>Nombre *</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Email (opcional)</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
            <div className="form-actions full-width">
              <button type="submit" className="btn-primary">Registrar Dueño</button>
            </div>
          </form>
        </div>
      )}

      <div className="toolbar">
        <input
          className="search-input"
          placeholder="Buscar por nombre, teléfono o email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Registrado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id}>
                {editId === o.id ? (
                  <td colSpan="5">
                    <form onSubmit={handleUpdate} className="inline-edit-form">
                      <input
                        value={editForm.name}
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                        placeholder="Nombre *"
                        required
                      />
                      <input
                        value={editForm.phone}
                        onChange={e => setEditForm({...editForm, phone: e.target.value})}
                        placeholder="Teléfono"
                      />
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={e => setEditForm({...editForm, email: e.target.value})}
                        placeholder="Email (opcional)"
                      />
                      <button type="submit" className="btn-success btn-sm">✓ Guardar</button>
                      <button type="button" className="btn-secondary btn-sm" onClick={() => setEditId(null)}>✕ Cancelar</button>
                    </form>
                  </td>
                ) : (
                  <>
                    <td><strong>{o.name}</strong></td>
                    <td>{o.phone || '-'}</td>
                    <td>{o.email || '-'}</td>
                    <td>{new Date(o.created_at).toLocaleDateString('es-CO')}</td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-secondary btn-sm" onClick={() => handleEdit(o)}>✏️ Editar</button>
                        <button className="btn-danger btn-sm" onClick={() => handleDelete(o.id)}>🗑️ Eliminar</button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="empty-table">No hay dueños registrados</div>}
      </div>
    </div>
  );
};

export default Owners;