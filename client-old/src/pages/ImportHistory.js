import { useState, useEffect } from 'react';
import api from '../services/api';
import './Common.css';

const ImportHistory = () => {
  const [batches, setBatches] = useState([]);
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState('batches');
  const [loading, setLoading] = useState(true);
  const [undoing, setUndoing] = useState(null);
  const [recovering, setRecovering] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [batchRes, logRes] = await Promise.all([
        api.get('/import/batches'),
        api.get('/import/audit?limit=100')
      ]);
      setBatches(batchRes.data);
      setLogs(logRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleUndo = async (batchId, successRows) => {
    if (!window.confirm(
      `⚠️ ¿Deshacer importación "${batchId}"?\n\nEsto eliminará ${successRows} registros (recuperables).`
    )) return;

    setUndoing(batchId);
    try {
      const res = await api.post(`/import/undo/${batchId}`);
      alert(`✅ ${res.data.message}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al deshacer');
    } finally {
      setUndoing(null);
    }
  };

  const handleRecover = async (batchId) => {
    if (!window.confirm(`¿Recuperar todos los registros del lote "${batchId}"?`)) return;

    setRecovering(batchId);
    try {
      const res = await api.post(`/import/recover/${batchId}`);
      alert(`✅ ${res.data.message}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al recuperar');
    } finally {
      setRecovering(null);
    }
  };

  const entityEmoji = { owners: '👤', pets: '🐶', products: '🛍️', cuts: '✂️' };
  const actionColor = {
    IMPORT_CREATE: '#4CAF50', UNDO_IMPORT: '#FF9800',
    RECOVER_IMPORT: '#2196F3', DELETE: '#F44336',
    UPDATE: '#9C27B0', CREATE: '#4CAF50'
  };

  if (loading) return <div className="page-loading">Cargando historial...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Historial de Importaciones</h1>
          <p>Control de lotes y auditoría del sistema</p>
        </div>
      </div>

      <div className="filter-bar" style={{ marginBottom: '1.5rem' }}>
        <button className={`filter-btn ${tab === 'batches' ? 'active' : ''}`} onClick={() => setTab('batches')}>
          📦 Lotes ({batches.length})
        </button>
        <button className={`filter-btn ${tab === 'audit' ? 'active' : ''}`} onClick={() => setTab('audit')}>
          📋 Auditoría ({logs.length})
        </button>
      </div>

      {tab === 'batches' && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>ID Lote</th>
                <th>Entidad</th>
                <th>Total</th>
                <th>Importados</th>
                <th>Omitidos</th>
                <th>Errores</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Por</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {batches.map(b => (
                <tr key={b.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{b.id}</td>
                  <td>{entityEmoji[b.entity_type]} {b.entity_type}</td>
                  <td>{b.total_rows}</td>
                  <td style={{ color: 'var(--success)', fontWeight: 600 }}>{b.success_rows}</td>
                  <td style={{ color: 'var(--warning)' }}>{b.skipped_rows}</td>
                  <td style={{ color: b.error_rows > 0 ? 'var(--danger)' : 'inherit' }}>{b.error_rows}</td>
                  <td>
                    <span className={`status-badge ${b.undone ? 'cancelled' : 'completed'}`}>
                      {b.undone ? '↩️ Deshecho' : '✅ Activo'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>{new Date(b.created_at).toLocaleString('es-CO')}</td>
                  <td>{b.created_by_name || '-'}</td>
                  <td>
                    <div className="action-btns">
                      {!b.undone && b.success_rows > 0 && (
                        <button
                          className="btn-danger btn-sm"
                          onClick={() => handleUndo(b.id, b.success_rows)}
                          disabled={undoing === b.id}
                          style={{ fontSize: '0.75rem' }}
                        >
                          {undoing === b.id ? '⏳' : '↩️ Deshacer'}
                        </button>
                      )}
                      {b.undone && (
                        <button
                          className="btn-success btn-sm"
                          onClick={() => handleRecover(b.id)}
                          disabled={recovering === b.id}
                          style={{ fontSize: '0.75rem' }}
                        >
                          {recovering === b.id ? '⏳' : '♻️ Recuperar'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {batches.length === 0 && <div className="empty-table">No hay importaciones registradas</div>}
        </div>
      )}

      {tab === 'audit' && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Acción</th>
                <th>Entidad</th>
                <th>ID</th>
                <th>Usuario</th>
                <th>Lote</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id}>
                  <td>
                    <span style={{
                      background: actionColor[l.action] + '20',
                      color: actionColor[l.action],
                      padding: '0.2rem 0.5rem', borderRadius: '6px',
                      fontSize: '0.75rem', fontWeight: 600
                    }}>
                      {l.action}
                    </span>
                  </td>
                  <td>{entityEmoji[l.entity_type]} {l.entity_type}</td>
                  <td style={{ fontSize: '0.8rem' }}>{l.entity_id || '-'}</td>
                  <td>{l.user_name || '-'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>{l.import_batch_id || '-'}</td>
                  <td style={{ fontSize: '0.8rem' }}>{new Date(l.created_at).toLocaleString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && <div className="empty-table">No hay registros de auditoría</div>}
        </div>
      )}
    </div>
  );
};

export default ImportHistory;