import { useState } from 'react';
import api from '../services/api';

const ImportCSV = ({ endpoint, templateHeaders, entityName, onSuccess, warnings = [] }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [show, setShow] = useState(false);

  const handleImport = async (e) => {
    e.preventDefault();
    if (!file) return alert('Selecciona un archivo CSV');
    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
      if (res.data.success > 0 && onSuccess) onSuccess();
    } catch (err) {
      setResult({ message: err.response?.data?.error || 'Error al importar', errors: [], success: 0 });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csv = templateHeaders.join(',') + '\n' + templateHeaders.map(() => '').join(',');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plantilla_${entityName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      <button
        type="button"
        className="btn-secondary"
        onClick={() => setShow(!show)}
        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
      >
        📥 Importar CSV
      </button>

      {show && (
        <div className="card" style={{ padding: '1.25rem', marginTop: '0.75rem' }}>
          <h4 style={{ fontFamily: 'Playfair Display, serif', color: 'var(--primary)', marginBottom: '0.75rem' }}>
            Importar {entityName} desde CSV
          </h4>

          {/* Advertencias */}
          {warnings.length > 0 && (
            <div style={{
              background: '#FFF3E0', border: '1px solid #FFB74D',
              borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem'
            }}>
              {warnings.map((w, i) => <p key={i}>⚠️ {w}</p>)}
            </div>
          )}

          {/* Columnas requeridas */}
          <div style={{
            background: 'var(--accent-light)', borderRadius: '8px',
            padding: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem'
          }}>
            <strong>Columnas del CSV:</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem' }}>
              {templateHeaders.map(h => (
                <span key={h} style={{
                  background: 'white', border: '1px solid var(--border)',
                  borderRadius: '6px', padding: '0.15rem 0.5rem',
                  fontFamily: 'monospace', fontSize: '0.8rem'
                }}>{h}</span>
              ))}
            </div>
          </div>

          <form onSubmit={handleImport} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="file"
                accept=".csv"
                onChange={e => { setFile(e.target.files[0]); setResult(null); }}
                style={{
                  flex: 1, padding: '0.5rem',
                  border: '1.5px solid var(--border)', borderRadius: '10px',
                  fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem',
                  minWidth: '200px'
                }}
              />
              <button type="button" className="btn-secondary btn-sm" onClick={downloadTemplate}>
                📄 Descargar plantilla
              </button>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn-primary" disabled={loading || !file}>
                {loading ? '⏳ Importando...' : '📥 Importar'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => { setShow(false); setResult(null); setFile(null); }}
              >
                Cancelar
              </button>
            </div>
          </form>

          {/* Resultado */}
          {result && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{
                background: result.success > 0 ? '#E8F5E9' : '#FFEBEE',
                border: `1px solid ${result.success > 0 ? '#C8E6C9' : '#FFCDD2'}`,
                borderRadius: '8px', padding: '0.75rem', fontSize: '0.875rem'
              }}>
                <strong>{result.message}</strong>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div style={{
                  marginTop: '0.75rem', background: '#FFF8E1',
                  border: '1px solid #FFE082', borderRadius: '8px',
                  padding: '0.75rem', maxHeight: '200px', overflowY: 'auto'
                }}>
                  <strong style={{ fontSize: '0.85rem' }}>
                    ⚠️ Advertencias ({result.errors.length}):
                  </strong>
                  {result.errors.map((e, i) => (
                    <p key={i} style={{ fontSize: '0.8rem', color: '#795548', margin: '0.25rem 0' }}>
                      • {e}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImportCSV;