import { useState, useEffect } from 'react';
import api, { formatCOP } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ImageUpload from '../components/ImageUpload';
import './Common.css';

const CutModal = ({ cut, onClose, onEdit, onDelete, isAdmin }) => (
  <div className="card-modal-overlay" onClick={onClose}>
    <div className="card-modal" onClick={e => e.stopPropagation()}>
      {cut.image_url
        ? <img src={cut.image_url} alt={cut.name} className="card-modal-image" />
        : <div className="card-modal-placeholder">✂️</div>
      }

      <div className="card-modal-body">
        <h2>{cut.name}</h2>
        <div className="modal-detail">
          <strong>Raza:</strong> {cut.breed || 'Todas las razas'}
        </div>

        {cut.description && (
          <div className="modal-detail">
            <strong>Descripción:</strong> {cut.description}
          </div>
        )}

        <div className="card-modal-price">
          {formatCOP(cut.price)}
        </div>
      </div>

      <div className="card-modal-footer">
        {isAdmin && (
          <>
            <button
              className="btn-secondary btn-sm"
              onClick={() => { onEdit(cut); onClose(); }}
            >
              ✏️ Editar
            </button>

            <button
              className="btn-danger btn-sm"
              onClick={() => { onDelete(cut.id); onClose(); }}
            >
              🗑️ Eliminar
            </button>
          </>
        )}

        <button className="btn-primary" onClick={onClose}>
          Cerrar
        </button>
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

  // ✅ FIX: evitar error de inputs controlados
  const [editForm, setEditForm] = useState({
    name: '',
    breed: '',
    description: '',
    image_url: '',
    price: ''
  });

  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: '',
    breed: '',
    description: '',
    image_url: '',
    price: ''
  });

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!search) return setFiltered(cuts);

    setFiltered(
      cuts.filter(c =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.breed?.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [cuts, search]);

  const loadData = async () => {
    try {
      const res = await api.get('/cuts');
      setCuts(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/cuts', form);
      setShowForm(false);
      setForm({
        name: '',
        breed: '',
        description: '',
        image_url: '',
        price: ''
      });
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const handleEdit = (c) => {
    setEditId(c.id);
    setEditForm({
      name: c.name || '',
      breed: c.breed || '',
      description: c.description || '',
      image_url: c.image_url || '',
      price: c.price || ''
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/cuts/${editId}`, editForm);
      setEditId(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este corte?')) return;

    try {
      await api.delete(`/cuts/${id}`);
      loadData();
    } catch (err) {
      const msg = err.response?.data?.error || '';

      if (msg.includes('foreign key')) {
        alert('No puedes eliminar este corte porque tiene citas asociadas');
      } else {
        alert(msg || 'Error');
      }
    }
  };

  if (loading) return <div className="page-loading">Cargando catálogo...</div>;

  return (
    <div className="page">

      {/* MODAL */}
      {selectedCut && (
        <CutModal
          cut={selectedCut}
          onClose={() => setSelectedCut(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isAdmin={isAdmin}
        />
      )}

      <div className="page-header">
        <div>
          <h1>Catálogo de Cortes</h1>
          <p>{cuts.length} cortes disponibles</p>
        </div>

        {isAdmin && (
          <button
            className="btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancelar' : '+ Nuevo Corte'}
          </button>
        )}
      </div>

      {/* FORM */}
      {showForm && isAdmin && (
        <div className="card form-card">
          <h3>Nuevo Corte</h3>

          <form onSubmit={handleSubmit} className="grid-form">

            <div className="form-group">
              <label>Nombre *</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Raza</label>
              <input
                value={form.breed}
                onChange={e => setForm({ ...form, breed: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Precio (COP)</label>
              <input
                type="number"
                step="100"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                placeholder="Ej: 35000"
              />
            </div>

            <div className="form-group full-width">
              <label>Imagen</label>
              <ImageUpload
                value={form.image_url}
                onChange={url => setForm({ ...form, image_url: url })}
              />
            </div>

            <div className="form-group full-width">
              <label>Descripción</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="form-actions full-width">
              <button type="submit" className="btn-primary">
                Crear Corte
              </button>
            </div>

          </form>
        </div>
      )}

      {/* SEARCH */}
      <div className="toolbar">
        <input
          className="search-input"
          placeholder="Buscar..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* CARDS */}
      <div className="cards-grid">
        {filtered.map(c => (
          <div
            key={c.id}
            className="cut-card"
            onClick={() => !editId && setSelectedCut(c)}
          >

            {editId === c.id ? (
              <form
                onSubmit={handleUpdate}
                className="edit-form"
                onClick={e => e.stopPropagation()}
              >

                <input
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                />

                <input
                  value={editForm.breed}
                  onChange={e => setEditForm({ ...editForm, breed: e.target.value })}
                />

                <input
                  type="number"
                  value={editForm.price}
                  onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                />

                <ImageUpload
                  value={editForm.image_url}
                  onChange={url => setEditForm({ ...editForm, image_url: url })}
                />

                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                />

                <div className="action-btns">
                  <button type="submit" className="btn-success btn-sm">✓</button>
                  <button type="button" className="btn-secondary btn-sm" onClick={() => setEditId(null)}>✕</button>
                </div>

              </form>
            ) : (
              <>
                {c.image_url
                  ? <img src={c.image_url} alt={c.name} className="cut-image" />
                  : <div className="cut-placeholder">✂️</div>
                }

                <div className="cut-info">
                  <h3>{c.name}</h3>
                  <p>🐾 {c.breed || 'Todas las razas'}</p>
                  <p>{formatCOP(c.price)}</p>
                </div>

                {isAdmin && (
                  <div className="action-btns">
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(c); }}>✏️</button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}>🗑️</button>
                  </div>
                )}
              </>
            )}

          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-table">No hay cortes que mostrar</div>
      )}
    </div>
  );
};

export default Cuts;