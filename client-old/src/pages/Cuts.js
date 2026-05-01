import { useState, useEffect } from 'react';
import api, { formatCOP } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ImageUpload from '../components/ImageUpload';
import BulkActions from '../components/BulkActions';
import ImportCSV from '../components/ImportCSV';
import './Common.css';

const CutModal = ({ cut, onClose, onEdit, onDelete, isAdmin }) => (
  <div className="card-modal-overlay" onClick={onClose}>
    <div className="card-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
      <div style={{ position: 'relative', width: '100%', paddingTop: '66%', overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
        {cut.image_url
          ? <img src={cut.image_url} alt={cut.name} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6rem' }}>✂️</div>
        }
      </div>
      <div className="card-modal-body">
        <h2>{cut.name}</h2>
        <div className="modal-detail"><strong>Raza:</strong> {cut.breed || 'Todas las razas'}</div>
        {cut.description && <div className="modal-detail"><strong>Descripción:</strong> {cut.description}</div>}
        <div className="card-modal-price">{formatCOP(cut.price)}</div>
      </div>
      <div className="card-modal-footer">
        {isAdmin && (
          <>
            <button className="btn-secondary btn-sm" onClick={() => { onEdit(cut); onClose(); }}>✏️ Editar</button>
            <button className="btn-danger btn-sm" onClick={() => { onDelete(cut.id); onClose(); }}>🗑️ Eliminar</button>
          </>
        )}
        <button className="btn-primary" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  </div>
);

const Cuts = () => {
  const { isAdmin } = useAuth();
  const [cuts, setCuts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedCut, setSelectedCut] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', breed: '', description: '', image_url: '', price: '' });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [form, setForm] = useState({ name: '', breed: '', description: '', image_url: '', price: '' });

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!search) return setFiltered(cuts);
    setFiltered(cuts.filter(c =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.breed?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase())
    ));
    setSelected([]);
    setSelectAll(false);
  }, [cuts, search]);

  const loadData = async () => {
    try {
      const res = await api.get('/cuts');
      setCuts(res.data);
      setFiltered(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) return alert('El nombre del corte es obligatorio');
    try {
      await api.post('/cuts', form);
      setShowForm(false);
      setForm({ name: '', breed: '', description: '', image_url: '', price: '' });
      loadData();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const handleEdit = (c) => {
    setEditId(c.id);
    setEditForm({ name: c.name || '', breed: c.breed || '', description: c.description || '', image_url: c.image_url || '', price: c.price || '' });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editForm.name?.trim()) return alert('El nombre es obligatorio');
    try {
      await api.put(`/cuts/${editId}`, editForm);
      setEditId(null);
      loadData();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este corte?')) return;
    try { await api.delete(`/cuts/${id}`); loadData(); }
    catch (err) { alert(err.response?.data?.error || 'Error al eliminar'); }
  };

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleSelectAll = () => {
    if (selectAll) { setSelected([]); setSelectAll(false); }
    else { setSelected(filtered.map(c => c.id)); setSelectAll(true); }
  };

  if (loading) return <div className="page-loading">Cargando catálogo...</div>;

  return (
    <div className="page">
      <BulkActions selectedIds={selected} entityType="cuts" onSuccess={loadData} onClear={() => { setSelected([]); setSelectAll(false); }} />

      {selectedCut && (
        <CutModal cut={selectedCut} onClose={() => setSelectedCut(null)} onEdit={handleEdit} onDelete={handleDelete} isAdmin={isAdmin} />
      )}

      <div className="page-header">
        <div><h1>Catálogo de Cortes</h1><p>{cuts.length} cortes disponibles</p></div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancelar' : '+ Nuevo Corte'}
          </button>
        )}
      </div>

      {isAdmin && (
        <ImportCSV
          endpoint="/import/cuts"
          entityName="cortes"
          templateHeaders={['name', 'breed', 'description', 'price', 'image_url']}
          onSuccess={loadData}
          warnings={['Solo el nombre es obligatorio', 'Los cortes con el mismo nombre y raza serán omitidos']}
        />
      )}

      {showForm && isAdmin && (
        <div className="card form-card">
          <h3>Nuevo Corte</h3>
          <form onSubmit={handleSubmit} className="grid-form">
            <div className="form-group">
              <label>Nombre *</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Raza</label>
              <input value={form.breed} onChange={e => setForm({...form, breed: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Precio (COP)</label>
              <input type="number" step="100" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="Ej: 35000" />
            </div>
            <div className="form-group full-width">
              <label>Imagen</label>
              <ImageUpload value={form.image_url} onChange={url => setForm({...form, image_url: url})} />
            </div>
            <div className="form-group full-width">
              <label>Descripción</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows="2" />
            </div>
            <div className="form-actions full-width">
              <button type="submit" className="btn-primary">Crear Corte</button>
            </div>
          </form>
        </div>
      )}

      <div className="toolbar">
        <input className="search-input" placeholder="Buscar por nombre, raza o descripción..." value={search} onChange={e => setSearch(e.target.value)} />
        {filtered.length > 0 && (
          <button className="btn-secondary btn-sm" onClick={toggleSelectAll}>
            {selectAll ? '☑️ Deseleccionar todo' : '☐ Seleccionar todo'}
          </button>
        )}
      </div>

      <div className="cards-grid">
        {filtered.map(c => (
          <div key={c.id} className="cut-card" style={{ position: 'relative' }} onClick={() => !editId && setSelectedCut(c)}>
            <input
              type="checkbox"
              checked={selected.includes(c.id)}
              onChange={() => toggleSelect(c.id)}
              onClick={e => e.stopPropagation()}
              style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', zIndex: 2, width: '18px', height: '18px', cursor: 'pointer' }}
            />
            {editId === c.id ? (
              <form onSubmit={handleUpdate} className="edit-form" onClick={e => e.stopPropagation()}>
                <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Nombre *" required />
                <input value={editForm.breed} onChange={e => setEditForm({...editForm, breed: e.target.value})} placeholder="Raza" />
                <input type="number" step="100" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} placeholder="Precio" />
                <ImageUpload value={editForm.image_url} onChange={url => setEditForm({...editForm, image_url: url})} />
                <textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} placeholder="Descripción" rows="2" />
                <div className="action-btns">
                  <button type="submit" className="btn-success btn-sm">✓</button>
                  <button type="button" className="btn-secondary btn-sm" onClick={() => setEditId(null)}>✕</button>
                </div>
              </form>
            ) : (
              <>
                {c.image_url ? <img src={c.image_url} alt={c.name} className="cut-image" /> : <div className="cut-placeholder">✂️</div>}
                <div className="cut-info">
                  <h3>{c.name}</h3>
                  <p>🐾 {c.breed || 'Todas las razas'}</p>
                  <p>{formatCOP(c.price)}</p>
                </div>
                {isAdmin && (
                  <div className="action-btns" onClick={e => e.stopPropagation()}>
                    <button className="btn-secondary btn-sm" onClick={() => handleEdit(c)}>✏️</button>
                    <button className="btn-danger btn-sm" onClick={() => handleDelete(c.id)}>🗑️</button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
      {filtered.length === 0 && <div className="empty-table">No hay cortes que mostrar</div>}
    </div>
  );
};

export default Cuts;