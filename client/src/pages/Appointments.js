import { useState, useEffect } from 'react';
import api, { formatCOP } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Common.css';

const Appointments = () => {
  const { isAdmin } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [pets, setPets] = useState([]);
  const [groomers, setGroomers] = useState([]);
  const [cuts, setCuts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    pet_id: '', groomer_id: '', service_type: 'baño',
    cut_id: '', date: '', price: '', notes: ''
  });

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    let result = appointments;
    if (statusFilter !== 'all') result = result.filter(a => a.status === statusFilter);
    if (search) result = result.filter(a =>
      a.pet_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.groomer_name?.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [appointments, statusFilter, search]);

  const loadData = async () => {
    try {
      const [appts, petsRes, cutsRes, groomersRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/pets'),
        api.get('/cuts'),
        api.get('/auth/groomers')
      ]);
      setAppointments(appts.data);
      setFiltered(appts.data);
      setPets(petsRes.data);
      setCuts(cutsRes.data);
      setGroomers(groomersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/appointments', {
        ...form,
        cut_id: form.cut_id === '' ? null : form.cut_id,
        groomer_id: form.groomer_id === '' ? null : form.groomer_id,
      });
      setShowForm(false);
      setForm({ pet_id: '', groomer_id: '', service_type: 'baño', cut_id: '', date: '', price: '', notes: '' });
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al crear cita');
    }
  };

  const handleEdit = (a) => {
    setEditId(a.id);
    setEditForm({
      service_type: a.service_type,
      cut_id: a.cut_id || '',
      groomer_id: a.groomer_id || '',
      date: new Date(a.date).toISOString().slice(0, 16),
      price: a.price,
      notes: a.notes || ''
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/appointments/${editId}`, {
        ...editForm,
        cut_id: editForm.cut_id === '' ? null : editForm.cut_id,
        groomer_id: editForm.groomer_id === '' ? null : editForm.groomer_id,
      });
      setEditId(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al actualizar');
    }
  };

  const handleComplete = async (id) => {
    if (!window.confirm('¿Marcar como completada?')) return;
    try { await api.put(`/appointments/${id}/complete`); loadData(); }
    catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('¿Cancelar esta cita?')) return;
    try { await api.put(`/appointments/${id}/cancel`); loadData(); }
    catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  if (loading) return <div className="page-loading">Cargando citas...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Agenda de Citas</h1>
          <p>{appointments.length} citas registradas</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nueva Cita'}
        </button>
      </div>

      {showForm && (
        <div className="card form-card">
          <h3>Nueva Cita</h3>
          <form onSubmit={handleSubmit} className="grid-form">
            <div className="form-group">
              <label>Mascota *</label>
              <select value={form.pet_id} onChange={e => setForm({...form, pet_id: e.target.value})} required>
                <option value="">Seleccionar mascota</option>
                {pets.map(p => <option key={p.id} value={p.id}>{p.name} ({p.breed})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Groomer *</label>
              <select value={form.groomer_id} onChange={e => setForm({...form, groomer_id: e.target.value})} required>
                <option value="">Seleccionar groomer</option>
                {groomers.map(g => (
                  <option key={g.id} value={g.id}>{g.name} — {g.commission_rate}% comisión</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Tipo de Servicio</label>
              <select value={form.service_type} onChange={e => setForm({...form, service_type: e.target.value})}>
                <option value="baño">Baño</option>
                <option value="corte">Corte</option>
                <option value="baño y corte">Baño y Corte</option>
              </select>
            </div>
            <div className="form-group">
              <label>Corte (opcional)</label>
              <select value={form.cut_id} onChange={e => setForm({...form, cut_id: e.target.value})}>
                <option value="">Sin corte específico</option>
                {cuts.map(c => <option key={c.id} value={c.id}>{c.name} — {c.breed}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Fecha y Hora *</label>
              <input type="datetime-local" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Precio (COP) *</label>
              <input type="number" step="100" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="Ej: 50000" required />
            </div>
            <div className="form-group full-width">
              <label>Notas</label>
              <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows="2" />
            </div>
            <div className="form-actions full-width">
              <button type="submit" className="btn-primary">Crear Cita</button>
            </div>
          </form>
        </div>
      )}

      <div className="toolbar">
        <div className="filter-bar">
          {['all', 'pending', 'completed', 'cancelled'].map(f => (
            <button key={f} className={`filter-btn ${statusFilter === f ? 'active' : ''}`} onClick={() => setStatusFilter(f)}>
              {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendientes' : f === 'completed' ? 'Completadas' : 'Canceladas'}
            </button>
          ))}
        </div>
        <input
          className="search-input"
          placeholder="Buscar por mascota, dueño o groomer..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Mascota</th>
              <th>Dueño</th>
              <th>Groomer</th>
              <th>Servicio</th>
              <th>Fecha</th>
              <th>Precio</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id}>
                {editId === a.id ? (
                  <td colSpan="8">
                    <form onSubmit={handleUpdate} className="inline-edit-form">
                      <select value={editForm.groomer_id} onChange={e => setEditForm({...editForm, groomer_id: e.target.value})}>
                        <option value="">Sin groomer</option>
                        {groomers.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                      <select value={editForm.service_type} onChange={e => setEditForm({...editForm, service_type: e.target.value})}>
                        <option value="baño">Baño</option>
                        <option value="corte">Corte</option>
                        <option value="baño y corte">Baño y Corte</option>
                      </select>
                      <select value={editForm.cut_id} onChange={e => setEditForm({...editForm, cut_id: e.target.value})}>
                        <option value="">Sin corte</option>
                        {cuts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <input type="datetime-local" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} required />
                      <input type="number" step="100" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} placeholder="Precio COP" required />
                      <input value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} placeholder="Notas" />
                      <button type="submit" className="btn-success btn-sm">✓ Guardar</button>
                      <button type="button" className="btn-secondary btn-sm" onClick={() => setEditId(null)}>✕ Cancelar</button>
                    </form>
                  </td>
                ) : (
                  <>
                    <td><strong>{a.pet_name}</strong><br /><small>{a.breed}</small></td>
                    <td>{a.owner_name}</td>
                    <td>{a.groomer_name}</td>
                    <td className="capitalize">{a.service_type}</td>
                    <td>{new Date(a.date).toLocaleString('es-CO')}</td>
                    <td>{formatCOP(a.price)}</td>
                    <td><span className={`status-badge ${a.status}`}>{a.status}</span></td>
                    <td>
                      <div className="action-btns">
                        {a.status === 'pending' && (
                          <>
                            <button className="btn-secondary btn-sm" onClick={() => handleEdit(a)}>✏️</button>
                            <button className="btn-success btn-sm" onClick={() => handleComplete(a.id)}>✓</button>
                            <button className="btn-danger btn-sm" onClick={() => handleCancel(a.id)}>✕</button>
                          </>
                        )}
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="empty-table">No hay citas que mostrar</div>}
      </div>
    </div>
  );
};

export default Appointments;