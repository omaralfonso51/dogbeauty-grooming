import { useState, useEffect } from 'react';
import api from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(res => {
      setData(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Cargando dashboard...</div>;
  if (!data) return <div className="page-loading">No hay datos disponibles</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Resumen general de DogBeauty Grooming</p>
      </div>

      <div className="metrics-grid">
        <div className="metric-card accent">
          <div className="metric-icon">💰</div>
          <div className="metric-info">
            <span className="metric-value">${data.income.total.toFixed(2)}</span>
            <span className="metric-label">Ingresos Totales</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">✂️</div>
          <div className="metric-info">
            <span className="metric-value">${data.income.services.toFixed(2)}</span>
            <span className="metric-label">Por Servicios</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">🛒</div>
          <div className="metric-info">
            <span className="metric-value">${data.income.products.toFixed(2)}</span>
            <span className="metric-label">Por Productos</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">⭐</div>
          <div className="metric-info">
            <span className="metric-value">{data.top_groomer?.name || 'N/A'}</span>
            <span className="metric-label">Mejor Groomer</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3>Citas por Estado</h3>
          <div className="status-list">
            {data.appointments_by_status.map(s => (
              <div key={s.status} className="status-item">
                <span className={`status-badge ${s.status}`}>{s.status}</span>
                <span className="status-count">{s.total}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>Comisiones por Groomer</h3>
          <div className="commission-list">
            {data.commissions_by_groomer.map(g => (
              <div key={g.name} className="commission-item">
                <span>{g.name}</span>
                <span className="commission-amount">${parseFloat(g.total_commissions).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>⚠️ Stock Bajo</h3>
          {data.low_stock_products.length === 0
            ? <p className="empty-msg">Todos los productos tienen stock suficiente</p>
            : data.low_stock_products.map(p => (
              <div key={p.name} className="stock-item">
                <span>{p.name}</span>
                <span className="stock-badge">{p.stock} unidades</span>
              </div>
            ))
          }
        </div>

        <div className="card">
          <h3>Servicio Más Solicitado</h3>
          {data.top_service
            ? <div className="top-service">
                <span className="service-name">{data.top_service.service_type}</span>
                <span className="service-count">{data.top_service.total} veces</span>
              </div>
            : <p className="empty-msg">Sin datos aún</p>
          }
        </div>
      </div>
    </div>
  );
};

export default Dashboard;