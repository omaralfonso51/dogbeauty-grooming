import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const GroomerDashboard = () => {
  const { user } = useAuth();
  const [myAppointments, setMyAppointments] = useState([]);
  const [myCommissions, setMyCommissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [appts, reminders] = await Promise.all([
        api.get('/appointments'),
        api.get('/reminders')
      ]);

      // Filtrar solo las citas del groomer logueado
      const mine = appts.data.filter(a => a.groomer_id === user.id || a.groomer_name === user.name);
      setMyAppointments(mine);

      // Calcular comisiones totales de sus citas completadas
      const completed = mine.filter(a => a.status === 'completed');
      setMyCommissions(completed);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id) => {
    if (!window.confirm('¿Marcar esta cita como completada?')) return;
    try {
      await api.put(`/appointments/${id}/complete`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('¿Cancelar esta cita?')) return;
    try {
      await api.put(`/appointments/${id}/cancel`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const pending = myAppointments.filter(a => a.status === 'pending');
  const completed = myAppointments.filter(a => a.status === 'completed');
  const totalCommissions = myCommissions.reduce((sum, a) => sum + parseFloat(a.price || 0), 0);

  if (loading) return <div className="page-loading">Cargando tu panel...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>¡Hola, {user?.name}! 👋</h1>
          <p>Panel del Groomer — {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Métricas del groomer */}
      <div className="metrics-grid">
        <div className="metric-card accent">
          <div className="metric-icon">📅</div>
          <div className="metric-info">
            <span className="metric-value">{pending.length}</span>
            <span className="metric-label">Citas Pendientes</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">✅</div>
          <div className="metric-info">
            <span className="metric-value">{completed.length}</span>
            <span className="metric-label">Completadas</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">💰</div>
          <div className="metric-info">
            <span className="metric-value">{myAppointments.length}</span>
            <span className="metric-label">Total Citas</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">⭐</div>
          <div className="metric-info">
            <span className="metric-value">${totalCommissions.toFixed(2)}</span>
            <span className="metric-label">Ingresos Generados</span>
          </div>
        </div>
      </div>

      {/* Citas de hoy */}
      <div className="dashboard-grid">
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3>📋 Mis Citas Pendientes</h3>
          {pending.length === 0 ? (
            <p className="empty-msg">No tienes citas pendientes por ahora 🎉</p>
          ) : (
            <table className="table" style={{ marginTop: '0.5rem' }}>
              <thead>
                <tr>
                  <th>Mascota</th>
                  <th>Raza</th>
                  <th>Dueño</th>
                  <th>Servicio</th>
                  <th>Fecha</th>
                  <th>Precio</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pending.map(a => (
                  <tr key={a.id}>
                    <td><strong>{a.pet_name}</strong></td>
                    <td>{a.breed}</td>
                    <td>{a.owner_name}</td>
                    <td className="capitalize">{a.service_type}</td>
                    <td>{new Date(a.date).toLocaleString('es-CO')}</td>
                    <td>${parseFloat(a.price).toFixed(2)}</td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-success btn-sm" onClick={() => handleComplete(a.id)}>✓ Completar</button>
                        <button className="btn-danger btn-sm" onClick={() => handleCancel(a.id)}>✕ Cancelar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3>✅ Historial de Citas Completadas</h3>
          {completed.length === 0 ? (
            <p className="empty-msg">Aún no tienes citas completadas</p>
          ) : (
            <table className="table" style={{ marginTop: '0.5rem' }}>
              <thead>
                <tr>
                  <th>Mascota</th>
                  <th>Dueño</th>
                  <th>Servicio</th>
                  <th>Fecha</th>
                  <th>Precio</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {completed.map(a => (
                  <tr key={a.id}>
                    <td><strong>{a.pet_name}</strong></td>
                    <td>{a.owner_name}</td>
                    <td className="capitalize">{a.service_type}</td>
                    <td>{new Date(a.date).toLocaleString('es-CO')}</td>
                    <td>${parseFloat(a.price).toFixed(2)}</td>
                    <td><span className="status-badge completed">Completada</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroomerDashboard;