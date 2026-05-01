import { useState, useEffect } from 'react';
import api from '../services/api';
import './Common.css';

const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    let result = reminders;
    if (filter === 'pending') result = result.filter(r => !r.sent);
    if (filter === 'sent') result = result.filter(r => r.sent);
    if (search) result = result.filter(r =>
      r.pet_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.service_type?.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [reminders, filter, search]);

  const loadData = async () => {
    try {
      const res = await api.get('/reminders');
      setReminders(res.data);
      setFiltered(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleMarkSent = async (id) => {
    try {
      await api.put(`/reminders/${id}/sent`);
      loadData();
    } catch (err) { alert('Error al actualizar recordatorio'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este recordatorio?')) return;
    try {
      await api.delete(`/reminders/${id}`);
      loadData();
    } catch (err) { alert('Error al eliminar'); }
  };

  if (loading) return <div className="page-loading">Cargando recordatorios...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Recordatorios</h1>
          <p>{reminders.filter(r => !r.sent).length} pendientes de envío</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="filter-bar">
          {['all', 'pending', 'sent'].map(f => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendientes' : 'Enviados'}
            </button>
          ))}
        </div>
        <input
          className="search-input"
          placeholder="Buscar por mascota, dueño o servicio..."
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
              <th>Teléfono</th>
              <th>Servicio</th>
              <th>Fecha Cita</th>
              <th>Recordatorio</th>
              <th>Canal</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id}>
                <td><strong>{r.pet_name}</strong></td>
                <td>{r.owner_name}</td>
                <td>{r.owner_phone || '-'}</td>
                <td className="capitalize">{r.service_type}</td>
                <td>{new Date(r.appointment_date).toLocaleString('es-CO')}</td>
                <td>{new Date(r.reminder_date).toLocaleString('es-CO')}</td>
                <td><span className="category-badge">{r.channel}</span></td>
                <td>
                  <span className={`status-badge ${r.sent ? 'completed' : 'pending'}`}>
                    {r.sent ? 'Enviado' : 'Pendiente'}
                  </span>
                </td>
                <td>
                  <div className="action-btns">
                    {!r.sent && (
                      <button className="btn-success btn-sm" onClick={() => handleMarkSent(r.id)}>
                        ✓ Enviado
                      </button>
                    )}
                    <button className="btn-danger btn-sm" onClick={() => handleDelete(r.id)}>
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="empty-table">No hay recordatorios que mostrar</div>}
      </div>
    </div>
  );
};

export default Reminders;