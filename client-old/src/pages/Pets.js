import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ImageUpload from '../components/ImageUpload';
import BulkActions from '../components/BulkActions';
import ImportCSV from '../components/ImportCSV';
import './Common.css';

const PetModal = ({ pet, onClose, onEdit, onDelete, isAdmin }) => (
  <div className="card-modal-overlay" onClick={onClose}>
    <div className="card-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
      <div style={{ position: 'relative', width: '100%', paddingTop: '66%', overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
        {pet.photo_url
          ? <img src={pet.photo_url} alt={pet.name} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6rem' }}>🐶</div>
        }
      </div>
      <div className="card-modal-body">
        <h2>{pet.name}</h2>
        <div className="modal-detail"><strong>Raza:</strong> {pet.breed}</div>
        <div className="modal-detail"><strong>Dueño:</strong> {pet.owner_name}</div>
        <div className="modal-detail"><strong>Teléfono:</strong> {pet.owner_phone || '-'}</div>
        {pet.notes && <div className="modal-detail"><strong>Notas:</strong> {pet.notes}</div>}
        <div className="modal-detail"><strong>Registrado:</strong> {new Date(pet.created_at).toLocaleDateString('es-CO')}</div>
      </div>
      <div className="card-modal-footer">
        {isAdmin && (
          <>
            <button className="btn-secondary btn-sm" onClick={() => { onEdit(pet); onClose(); }}>✏️ Editar</button>
            <button className="btn-danger btn-sm" onClick={() => { onDelete(pet.id); onClose(); }}>🗑️ Eliminar</button>
          </>
        )}
        <button className="btn-primary" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  </div>
);

const Pets = () => {
  const { isAdmin } = useAuth();
  const [pets, setPets] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [owners, setOwners] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [form, setForm] = useState({ name: '', breed: '', owner_id: '', notes: '', photo_url: '' });

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!search) return setFiltered(pets);
    setFiltered(pets.filter(p =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.breed?.toLowerCase().includes(search.toLowerCase()) ||
      p.owner_name?.toLowerCase().includes(search.toLowerCase())
    ));
    setSelected([]);
    setSelectAll(false);
  }, [pets, search]);

  const loadData = async () => {
    try {
      const [petsRes, ownersRes] = await Promise.all([api.get('/pets'), api.get('/owners')]);
      setPets(petsRes.data);
      setFiltered(petsRes.data);
      setOwners(ownersRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const validateForm = (data) => {
    const errs = {};
    if (!data.name?.trim()) errs.name = 'El nombre es obligatorio';
    if (!data.breed?.trim()) errs.breed = 'La raza es obligatoria';
    if (!data.owner_id) errs.owner_id = 'El dueño es obligatorio';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (owners.length === 0) return alert('⚠️ Primero debes registrar un dueño antes de agregar mascotas');
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) return setFormErrors(errs);
    try {
      await api.post('/pets', form);
      setShowForm(false);
      setForm({ name: '', breed: '', owner_id: '', notes: '', photo_url: '' });
      setFormErrors({});
      loadData();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const handleEdit = (pet) => {
    setEditId(pet.id);
    setEditForm({ name: pet.name, breed: pet.breed, notes: pet.notes || '', photo_url: pet.photo_url || '' });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const errs = validateForm({ ...editForm, owner_id: 'ok' });
    if (errs.name || errs.breed) return alert(Object.values(errs).join('\n'));
    try {
      await api.put(`/pets/${editId}`, editForm);
      setEditId(null);
      loadData();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta mascota?')) return;
    try { await api.delete(`/pets/${id}`); loadData(); }
    catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleSelectAll = () => {
    if (selectAll) { setSelected([]); setSelectAll(false); }
    else { setSelected(filtered.map(p => p.id)); setSelectAll(true); }
  };

  if (loading) return <div className="page-loading">Cargando mascotas...</div>;

  return (
    <div className="page">
      <BulkActions selectedIds={selected} entityType="pets" onSuccess={loadData} onClear={() => { setSelected([]); setSelectAll(false); }} />

      {selectedPet && (
        <PetModal pet={selectedPet} onClose={() => setSelectedPet(null)} onEdit={handleEdit} onDelete={handleDelete} isAdmin={isAdmin} />
      )}

      <div className="page-header">
        <div><h1>Mascotas</h1><p>{pets.length} mascotas registradas</p></div>
        <button className="btn-primary" onClick={() => {
          if (owners.length === 0) return alert('⚠️ Primero registra un dueño antes de agregar mascotas');
          setShowForm(!showForm);
        }}>
          {showForm ? 'Cancelar' : '+ Nueva Mascota'}
        </button>
      </div>

      <ImportCSV
        endpoint="/import/pets"
        entityName="mascotas"
        templateHeaders={['name', 'breed', 'owner_email', 'owner_name', 'notes', 'photo_url']}
        onSuccess={loadData}
        warnings={[
          '⚠️ Los dueños deben estar creados ANTES de importar mascotas',
          'Usa owner_email (recomendado) u owner_name para asociar la mascota',
          'Si el dueño no se encuentra, la mascota será omitida'
        ]}
      />

      {showForm && owners.length > 0 && (
        <div className="card form-card">
          <h3>Nueva Mascota</h3>
          <form onSubmit={handleSubmit} className="grid-form" noValidate>
            <div className="form-group">
              <label>Nombre *</label>
              <input value={form.name} onChange={e => { setForm({...form, name: e.target.value}); setFormErrors({...formErrors, name: ''}); }} style={{ borderColor: formErrors.name ? 'var(--danger)' : undefined }} />
              {formErrors.name && <span style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>⚠️ {formErrors.name}</span>}
            </div>
            <div className="form-group">
              <label>Raza *</label>
              <input value={form.breed} onChange={e => { setForm({...form, breed: e.target.value}); setFormErrors({...formErrors, breed: ''}); }} style={{ borderColor: formErrors.breed ? 'var(--danger)' : undefined }} />
              {formErrors.breed && <span style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>⚠️ {formErrors.breed}</span>}
            </div>
            <div className="form-group">
              <label>Dueño *</label>
              <select value={form.owner_id} onChange={e => { setForm({...form, owner_id: e.target.value}); setFormErrors({...formErrors, owner_id: ''}); }} style={{ borderColor: formErrors.owner_id ? 'var(--danger)' : undefined }}>
                <option value="">Seleccionar dueño</option>
                {owners.map(o => <option key={o.id} value={o.id}>{o.name} {o.phone ? `— ${o.phone}` : ''}</option>)}
              </select>
              {formErrors.owner_id && <span style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>⚠️ {formErrors.owner_id}</span>}
            </div>
            <div className="form-group full-width">
              <label>Foto de la mascota</label>
              <ImageUpload value={form.photo_url} onChange={url => setForm({...form, photo_url: url})} placeholder="URL o sube una foto" />
            </div>
            <div className="form-group full-width">
              <label>Notas</label>
              <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows="2" placeholder="Alergias, comportamiento, observaciones..." />
            </div>
            <div className="form-actions full-width">
              <button type="submit" className="btn-primary">Registrar Mascota</button>
            </div>
          </form>
        </div>
      )}

      <div className="toolbar">
        <input className="search-input" placeholder="Buscar por nombre, raza o dueño..." value={search} onChange={e => setSearch(e.target.value)} />
        {filtered.length > 0 && (
          <button className="btn-secondary btn-sm" onClick={toggleSelectAll}>
            {selectAll ? '☑️ Deseleccionar todo' : '☐ Seleccionar todo'}
          </button>
        )}
      </div>

      <div className="cards-grid">
        {filtered.map(p => (
          <div key={p.id} className="pet-card" style={{ position: 'relative' }}
            onClick={() => !editId && setSelectedPet(p)}>
            <input
              type="checkbox"
              checked={selected.includes(p.id)}
              onChange={() => toggleSelect(p.id)}
              onClick={e => e.stopPropagation()}
              style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', zIndex: 2, width: '18px', height: '18px', cursor: 'pointer' }}
            />
            {editId === p.id ? (
              <form onSubmit={handleUpdate} className="edit-form" onClick={e => e.stopPropagation()}>
                <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Nombre *" required />
                <input value={editForm.breed} onChange={e => setEditForm({...editForm, breed: e.target.value})} placeholder="Raza *" required />
                <ImageUpload value={editForm.photo_url} onChange={url => setEditForm({...editForm, photo_url: url})} placeholder="URL Foto" />
                <textarea value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} placeholder="Notas" rows="2" />
                <div className="action-btns">
                  <button type="submit" className="btn-success btn-sm">✓ Guardar</button>
                  <button type="button" className="btn-secondary btn-sm" onClick={() => setEditId(null)}>✕</button>
                </div>
              </form>
            ) : (
              <>
                <div className="pet-photo">
                  {p.photo_url ? <img src={p.photo_url} alt={p.name} /> : <span>🐶</span>}
                </div>
                <div className="pet-info">
                  <h3>{p.name}</h3>
                  <p className="pet-breed">{p.breed}</p>
                  <p className="pet-owner">👤 {p.owner_name}</p>
                  {p.notes && <p className="pet-notes">📝 {p.notes}</p>}
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-light)', textAlign: 'center' }}>Click para ver más</p>
              </>
            )}
          </div>
        ))}
      </div>
      {filtered.length === 0 && <div className="empty-table">No hay mascotas registradas</div>}
    </div>
  );
};

export default Pets;