import { useState, useEffect } from 'react';
import api from '../services/api';
import BulkActions from '../components/BulkActions';
import ImportCSV from '../components/ImportCSV';
import './Common.css';

const Owners = () => {
  const [owners, setOwners] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!search) return setFiltered(owners);
    setFiltered(owners.filter(o =>
      o.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.phone?.includes(search) ||
      o.email?.toLowerCase().includes(search.toLowerCase())
    ));
    setSelected([]);
    setSelectAll(false);
  }, [owners, search]);

  const loadData = async () => {
    try {
      const res = await api.get('/owners');
      setOwners(res.data);
      setFiltered(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const validateForm = (data) => {
    const errs = {};
    if (!data.name?.trim()) errs.name = 'El nombre es obligatorio';
    if (data.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = 'Email inválido';
    if (data.phone?.trim() && !/^[0-9+\s]{7,15}$/.test(data.phone.replace(/\s/g, ''))) errs.phone = 'Teléfono inválido';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) return setFormErrors(errs);
    try {
      await api.post('/owners', form);
      setShowForm(false);
      setForm({ name: '', phone: '', email: '' });
      setFormErrors({});
      loadData();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const handleEdit = (o) => {
    setEditId(o.id);
    setEditForm({ name: o.name, phone: o.phone || '', email: o.email || '' });
    setEditErrors({});
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const errs = validateForm(editForm);
    if (Object.keys(errs).length > 0) return setEditErrors(errs);
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

  const toggleSelect = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelected([]);
      setSelectAll(false);
    } else {
      setSelected(filtered.map(o => o.id));
      setSelectAll(true);
    }
  };

  if (loading) return <div className="page-loading">Cargando dueños...</div>;

  return (
    <div className="page">
      <BulkActions
        selectedIds={selected}
        entityType="owners"
        onSuccess={loadData}
        onClear={() => { setSelected([]); setSelectAll(false); }}
      />

      <div className="page-header">
        <div><h1>Dueños</h1><p>{owners.length} clientes registrados</p></div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nuevo Dueño'}
        </button>
      </div>

      <ImportCSV
        endpoint="/import/owners"
        entityName="dueños"
        templateHeaders={['name', 'phone', 'email']}
        onSuccess={loadData}
        warnings={['Solo el nombre es obligatorio', 'Los dueños con el mismo email serán omitidos']}
      />

      {showForm && (
        <div className="card form-card">
          <h3>Nuevo Dueño</h3>
          <form onSubmit={handleSubmit} className="grid-form" noValidate>
            <div className="form-group">
              <label>Nombre *</label>
              <input value={form.name} onChange={e => { setForm({...form, name: e.target.value}); setFormErrors({...formErrors, name: ''}); }} style={{ borderColor: formErrors.name ? 'var(--danger)' : undefined }} />
              {formErrors.name && <span style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>⚠️ {formErrors.name}</span>}
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input value={form.phone} onChange={e => { setForm({...form, phone: e.target.value}); setFormErrors({...formErrors, phone: ''}); }} placeholder="3001234567" />
              {formErrors.phone && <span style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>⚠️ {formErrors.phone}</span>}
            </div>
            <div className="form-group">
              <label>Email (opcional)</label>
              <input type="email" value={form.email} onChange={e => { setForm({...form, email: e.target.value}); setFormErrors({...formErrors, email: ''}); }} style={{ borderColor: formErrors.email ? 'var(--danger)' : undefined }} />
              {formErrors.email && <span style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>⚠️ {formErrors.email}</span>}
            </div>
            <div className="form-actions full-width">
              <button type="submit" className="btn-primary">Registrar Dueño</button>
            </div>
          </form>
        </div>
      )}

      <div className="toolbar">
        <input className="search-input" placeholder="Buscar por nombre, teléfono o email..." value={search} onChange={e => setSearch(e.target.value)} />
        {filtered.length > 0 && (
          <button className="btn-secondary btn-sm" onClick={toggleSelectAll}>
            {selectAll ? '☑️ Deseleccionar todo' : '☐ Seleccionar todo'}
          </button>
        )}
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} style={{ cursor: 'pointer' }} />
              </th>
              <th>Nombre</th><th>Teléfono</th><th>Email</th><th>Registrado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id} style={{ background: selected.includes(o.id) ? 'var(--accent-light)' : undefined }}>
                {editId === o.id ? (
                  <td colSpan="6">
                    <form onSubmit={handleUpdate} className="inline-edit-form" noValidate>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <input value={editForm.name} onChange={e => { setEditForm({...editForm, name: e.target.value}); setEditErrors({...editErrors, name: ''}); }} placeholder="Nombre *" style={{ borderColor: editErrors.name ? 'var(--danger)' : undefined }} />
                        {editErrors.name && <span style={{ color: 'var(--danger)', fontSize: '0.72rem' }}>⚠️ {editErrors.name}</span>}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} placeholder="Teléfono" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <input type="email" value={editForm.email} onChange={e => { setEditForm({...editForm, email: e.target.value}); setEditErrors({...editErrors, email: ''}); }} placeholder="Email (opcional)" style={{ borderColor: editErrors.email ? 'var(--danger)' : undefined }} />
                        {editErrors.email && <span style={{ color: 'var(--danger)', fontSize: '0.72rem' }}>⚠️ {editErrors.email}</span>}
                      </div>
                      <button type="submit" className="btn-success btn-sm">✓ Guardar</button>
                      <button type="button" className="btn-secondary btn-sm" onClick={() => setEditId(null)}>✕</button>
                    </form>
                  </td>
                ) : (
                  <>
                    <td>
                      <input type="checkbox" checked={selected.includes(o.id)} onChange={() => toggleSelect(o.id)} style={{ cursor: 'pointer' }} />
                    </td>
                    <td><strong>{o.name}</strong></td>
                    <td>{o.phone || '-'}</td>
                    <td>{o.email || '-'}</td>
                    <td>{new Date(o.created_at).toLocaleDateString('es-CO')}</td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-secondary btn-sm" onClick={() => handleEdit(o)}>✏️</button>
                        <button className="btn-danger btn-sm" onClick={() => handleDelete(o.id)}>🗑️</button>
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