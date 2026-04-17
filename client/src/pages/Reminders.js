import { useState, useEffect } from 'react';
import api from '../services/api';
import './Common.css';

const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await api.get('/reminders');
      setReminders(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleMarkSent = async (id) => {
    try {
      await api.put(`/reminders/${id}/sent`);
      loadData();
    } catch (err) { alert('Error'); }
  };

  const filtered = filter === 'all' ? reminders
    : filter === 'pending' ? reminders.filter(r => !r.sent)
    : reminders.filter(r => r.sent);

  if (loading) return <div className="page-loading">Cargando recordatorios...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div><h1>Recordatorios</h1><p>{reminders.filter(r => !r.sent).length} pendientes de envío</p></div>
      </div>

      <div className="filter-bar">
        {['all', 'pending', 'sent'].map(f => (
          <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendientes' : 'Enviados'}
          </button>
        ))}
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr><th>Mascota</th><th>Dueño</th><th>Servicio</th><th>Cita</th><th>Recordatorio</th><th>Canal</th><th>Estado</th><th>Acción</th></tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id}>
                <td>{r.pet_name}</td>
                <td>
                  <div>{r.owner_name}</div>
                  <small>{r.owner_phone}</small>
                </td>
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
                  {!r.sent && (
                    <button className="btn-success btn-sm" onClick={() => handleMarkSent(r.id)}>
                      Marcar enviado
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="empty-table">No hay recordatorios</div>}
      </div>
    </div>
  );
};

export default Reminders;