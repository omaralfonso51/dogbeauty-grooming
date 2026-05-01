import { useState } from 'react';
import api from '../services/api';

const BulkActions = ({ selectedIds, entityType, onSuccess, onClear }) => {
  const [loading, setLoading] = useState(false);

  if (selectedIds.length === 0) return null;

  const endpointMap = {
    owners: '/owners',
    pets: '/pets',
    products: '/products',
    cuts: '/cuts'
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(
      `⚠️ ¿Eliminar ${selectedIds.length} ${entityType} seleccionados?\n\nEsta acción no se puede deshacer fácilmente.`
    )) return;

    setLoading(true);
    const errors = [];

    for (const id of selectedIds) {
      try {
        await api.delete(`${endpointMap[entityType]}/${id}`);
      } catch (err) {
        errors.push(`ID ${id}: ${err.response?.data?.error || 'Error'}`);
      }
    }

    setLoading(false);
    onClear();

    if (errors.length > 0) {
      alert(`Se eliminaron ${selectedIds.length - errors.length} registros.\n\nErrores:\n${errors.join('\n')}`);
    } else {
      alert(`✅ ${selectedIds.length} registros eliminados correctamente`);
    }
    onSuccess();
  };

  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', left: '50%',
      transform: 'translateX(-50%)', zIndex: 150,
      background: 'var(--primary)', color: 'white',
      borderRadius: '16px', padding: '0.875rem 1.5rem',
      display: 'flex', alignItems: 'center', gap: '1rem',
      boxShadow: '0 8px 32px rgba(44,24,16,0.4)',
      animation: 'slideUp 0.2s ease',
      flexWrap: 'wrap', justifyContent: 'center',
      maxWidth: '90vw'
    }}>
      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
        ✅ {selectedIds.length} seleccionado{selectedIds.length > 1 ? 's' : ''}
      </span>
      <button
        className="btn-danger btn-sm"
        onClick={handleBulkDelete}
        disabled={loading}
        style={{ background: '#E53935', color: 'white', border: 'none' }}
      >
        {loading ? '⏳ Eliminando...' : `🗑️ Eliminar ${selectedIds.length}`}
      </button>
      <button
        className="btn-secondary btn-sm"
        onClick={onClear}
        style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
      >
        ✕ Cancelar
      </button>
    </div>
  );
};

export default BulkActions;