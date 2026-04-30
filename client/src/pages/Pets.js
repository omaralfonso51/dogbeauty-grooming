import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ImageUpload from '../components/ImageUpload';
import './Common.css';
import ImportCSV from '../components/ImportCSV';

const PetModal = ({ pet, onClose, onEdit, onDelete, isAdmin }) => (
  <div className="card-modal-overlay" onClick={onClose}>
    <div className="card-modal" onClick={e => e.stopPropagation()}>
      {pet.photo_url
        ? <img src={pet.photo_url} alt={pet.name} className="card-modal-image" />
        : <div className="card-modal-placeholder">🐶</div>
      }
      <div className="card-modal-body">
        <h2>{pet.name}</h2>
        <div className="modal-detail"><strong>Raza:</strong> {pet.breed}</div>
        <div className="modal-detail"><strong>Dueño:</strong> {pet.owner_name}</div>
        <div className="modal-detail"><strong>Teléfono:</strong> {pet.owner_phone || '-'}</div>
        {pet.notes && <div className="modal-detail"><strong>Notas:</strong> {pet.notes}</div>}
        <div className="modal-detail">
          <strong>Registrado:</strong> {new Date(pet.created_at).toLocaleDateString('es-CO')}
        </div>
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
  const [form, setForm] = useState({
    name: '', breed: '', owner_id: '', notes: '', photo_url: ''
  });

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!search) return setFiltered(pets);
    setFiltered(pets.filter(p =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.breed?.toLowerCase().includes(search.toLowerCase()) ||
      p.owner_name?.toLowerCase().includes(search.toLowerCase())
    ));
  }, [pets, search]);

  const loadData = async () => {
    try {
      const [petsRes, ownersRes] = await Promise.all([
        api.get('/pets'),
        api.get('/owners')
      ]);
      setPets(petsRes.data);
      setFiltered(petsRes.data);
      setOwners(ownersRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/pets', form);
      setShowForm(false);
      setForm({ name: '', breed: '', owner_id: '', notes: '', photo_url: '' });
      loadData();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const handleEdit = (pet) => {
    setEditId(pet.id);
    setEditForm({
      name: pet.name,
      breed: pet.breed,
      notes: pet.notes || '',
      photo_url: pet.photo_url || ''
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
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

  if (loading) return <div className="page-loading">Cargando mascotas...</div>;

  return (
    <div className="page">
      {selectedPet && (
        <PetModal
          pet={selectedPet}
          onClose={() => setSelectedPet(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isAdmin={isAdmin}
        />
      )}

      <div className="page-header">
        <div><h1>Mascotas</h1><p>{pets.length} mascotas registradas</p></div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
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
          'Usa owner_email (recomendado) u owner_name para asociar la mascota al dueño',
          'Si el dueño no se encuentra, la mascota será omitida'
        ]}
      />

      {showForm && (
        <div className="card form-card">
          <h3>Nueva Mascota</h3>
          <form onSubmit={handleSubmit} className="grid-form">
            <div className="form-group">
              <label>Nombre *</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Raza *</label>
              <input value={form.breed} onChange={e => setForm({...form, breed: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Dueño *</label>
              <select value={form.owner_id} onChange={e => setForm({...form, owner_id: e.target.value})} required>
                <option value="">Seleccionar dueño</option>
                {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div className="form-group full-width">
              <label>Foto de la mascota</label>
              <ImageUpload
                value={form.photo_url}
                onChange={url => setForm({...form, photo_url: url})}
                placeholder="URL de la foto"
              />
            </div>
            <div className="form-group full-width">
              <label>Notas</label>
              <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows="2" />
            </div>
            <div className="form-actions full-width">
              <button type="submit" className="btn-primary">Registrar Mascota</button>
            </div>
          </form>
        </div>
      )}

      <div className="toolbar">
        <input
          className="search-input"
          placeholder="Buscar por nombre, raza o dueño..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="cards-grid">
        {filtered.map(p => (
          <div key={p.id} className="pet-card" onClick={() => !editId && setSelectedPet(p)}>
            {editId === p.id ? (
              <form onSubmit={handleUpdate} className="edit-form" onClick={e => e.stopPropagation()}>
                <input
                  value={editForm.name}
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  placeholder="Nombre"
                  required
                />
                <input
                  value={editForm.breed}
                  onChange={e => setEditForm({...editForm, breed: e.target.value})}
                  placeholder="Raza"
                  required
                />
                <ImageUpload
                  value={editForm.photo_url}
                  onChange={url => setEditForm({...editForm, photo_url: url})}
                  placeholder="URL Foto"
                />
                <textarea
                  value={editForm.notes}
                  onChange={e => setEditForm({...editForm, notes: e.target.value})}
                  placeholder="Notas"
                  rows="2"
                />
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
                <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', textAlign: 'center' }}>
                  Click para ver más
                </p>
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