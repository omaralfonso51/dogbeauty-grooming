import { useState } from 'react';
import api from '../services/api';

const ImportCSV = ({ endpoint, templateHeaders, entityName, onSuccess, warnings = [] }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [show, setShow] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [recovering, setRecovering] = useState(false);

  const handleImport = async (e) => {
    e.preventDefault();
    if (!file) return alert('Selecciona un archivo CSV');

    setLoading(true);
    setResult(null);
    setProgress(0);

    // Simular progreso
    const progressInterval = setInterval(() => {
      setProgress(prev => prev < 85 ? prev + Math.random() * 15 : prev);
    }, 300);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProgress(100);
      setResult(res.data);
      if (res.data.success > 0 && onSuccess) onSuccess();
    } catch (err) {
      setResult({
        message: err.response?.data?.error || 'Error al importar',
        errors: [], success: 0, canUndo: false
      });
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  const handleUndo = async () => {
    if (!result?.batchId) return;
    if (!window.confirm(
      `⚠️ ¿Deshacer la importación "${result.batchId}"?\n\nEsto eliminará los ${result.success} registros importados.\n\nPodrás recuperarlos después si es necesario.`
    )) return;

    setUndoing(true);
    try {
      const res = await api.post(`/import/undo/${result.batchId}`);
      alert(`✅ ${res.data.message}`);
      setResult(prev => ({ ...prev, canUndo: false, undone: true, canRecover: true }));
      if (onSuccess) onSuccess();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al deshacer');
    } finally {
      setUndoing(false);
    }
  };

  const handleRecover = async () => {
    if (!result?.batchId) return;
    if (!window.confirm(`¿Recuperar los registros del lote "${result.batchId}"?`)) return;

    setRecovering(true);
    try {
      const res = await api.post(`/import/recover/${result.batchId}`);
      alert(`✅ ${res.data.message}`);
      setResult(prev => ({ ...prev, canUndo: true, undone: false, canRecover: false }));
      if (onSuccess) onSuccess();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al recuperar');
    } finally {
      setRecovering(false);
    }
  };

  const downloadTemplate = () => {
    const exampleRow = templateHeaders.map(h => {
      const examples = {
        name: 'Juan Pérez', phone: '3001234567', email: 'juan@email.com',
        breed: 'Golden Retriever', owner_email: 'juan@email.com', owner_name: 'Juan Pérez',
        notes: 'Observaciones', photo_url: 'https://...', price: '25000',
        category: 'shampoo', stock: '50', description: 'Descripción del producto',
        image_url: 'https://...', 'breed(raza)': 'Poodle'
      };
      return examples[h] || '';
    });
    const csv = [templateHeaders.join(','), exampleRow.join(',')].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
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
        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}
      >
        📥 {show ? 'Ocultar importación' : 'Importar CSV'}
      </button>

      {show && (
        <div className="card" style={{ padding: '1.5rem', marginTop: '0.75rem', border: '2px solid var(--accent-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ fontFamily: 'Playfair Display, serif', color: 'var(--primary)', margin: 0 }}>
              📥 Importar {entityName} desde CSV
            </h4>
            <button
              type="button"
              onClick={() => setShow(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-light)' }}
            >✕</button>
          </div>

          {/* Advertencias */}
          {warnings.length > 0 && (
            <div style={{
              background: '#FFF3E0', border: '1px solid #FFB74D',
              borderRadius: '10px', padding: '0.75rem', marginBottom: '1rem'
            }}>
              {warnings.map((w, i) => (
                <p key={i} style={{ margin: '0.2rem 0', fontSize: '0.83rem', color: '#E65100' }}>⚠️ {w}</p>
              ))}
            </div>
          )}

          {/* Columnas */}
          <div style={{
            background: 'var(--accent-light)', borderRadius: '10px',
            padding: '0.75rem', marginBottom: '1rem'
          }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--primary)' }}>
              Columnas del CSV:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {templateHeaders.map(h => (
                <span key={h} style={{
                  background: 'white', border: '1px solid var(--border)',
                  borderRadius: '6px', padding: '0.15rem 0.5rem',
                  fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--secondary)'
                }}>{h}</span>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleImport}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              <input
                type="file"
                accept=".csv"
                onChange={e => { setFile(e.target.files[0]); setResult(null); }}
                style={{
                  flex: 1, padding: '0.5rem 0.75rem',
                  border: '1.5px solid var(--border)', borderRadius: '10px',
                  fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem',
                  minWidth: '200px', background: 'var(--bg)'
                }}
              />
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={downloadTemplate}
                style={{ whiteSpace: 'nowrap' }}
              >
                📄 Descargar plantilla
              </button>
            </div>

            {/* Barra de progreso */}
            {loading && (
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Procesando...</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--secondary)' }}>{Math.round(progress)}%</span>
                </div>
                <div style={{
                  height: '8px', background: 'var(--border)',
                  borderRadius: '10px', overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%', width: `${progress}%`,
                    background: 'linear-gradient(90deg, var(--secondary), var(--accent))',
                    borderRadius: '10px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !file}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {loading ? '⏳ Importando...' : '📥 Importar ahora'}
              </button>
            </div>
          </form>

          {/* Resultado */}
          {result && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{
                background: result.success > 0 ? '#E8F5E9' : '#FFEBEE',
                border: `1px solid ${result.success > 0 ? '#A5D6A7' : '#EF9A9A'}`,
                borderRadius: '10px', padding: '0.875rem',
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem'
              }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>{result.message}</p>
                  {result.batchId && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', margin: '0.25rem 0 0', fontFamily: 'monospace' }}>
                      ID: {result.batchId}
                    </p>
                  )}
                </div>
                {/* Botones deshacer/recuperar */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {result.canUndo && !result.undone && (
                    <button
                      type="button"
                      className="btn-danger btn-sm"
                      onClick={handleUndo}
                      disabled={undoing}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {undoing ? '⏳...' : '↩️ Deshacer importación'}
                    </button>
                  )}
                  {(result.undone || result.canRecover) && (
                    <button
                      type="button"
                      className="btn-success btn-sm"
                      onClick={handleRecover}
                      disabled={recovering}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {recovering ? '⏳...' : '♻️ Recuperar datos'}
                    </button>
                  )}
                </div>
              </div>

              {/* Errores/advertencias detalladas */}
              {result.errors && result.errors.length > 0 && (
                <details style={{ marginTop: '0.5rem' }}>
                  <summary style={{
                    cursor: 'pointer', fontSize: '0.85rem',
                    color: 'var(--warning)', fontWeight: 600, padding: '0.4rem'
                  }}>
                    ⚠️ {result.errors.length} advertencia(s) — click para ver
                  </summary>
                  <div style={{
                    background: '#FFFDE7', border: '1px solid #FFF59D',
                    borderRadius: '8px', padding: '0.75rem', marginTop: '0.25rem',
                    maxHeight: '180px', overflowY: 'auto'
                  }}>
                    {result.errors.map((e, i) => (
                      <p key={i} style={{ fontSize: '0.8rem', color: '#795548', margin: '0.2rem 0' }}>
                        • {e}
                      </p>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImportCSV;