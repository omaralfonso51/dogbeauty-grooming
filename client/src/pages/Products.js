import { useState, useEffect } from 'react';
import api, { formatCOP } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ImageUpload from '../components/ImageUpload';
import './Common.css';

const Products = () => {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showSell, setShowSell] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '', category: 'shampoo', price: '',
    stock: '', description: '', image_url: ''
  });
  const [sellForm, setSellForm] = useState({ quantity: 1, owner_id: '' });
  const [owners, setOwners] = useState([]);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!search) return setFiltered(products);
    setFiltered(products.filter(p =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
    ));
  }, [products, search]);

  const loadData = async () => {
    try {
      const [prodRes, ownersRes] = await Promise.all([
        api.get('/products'),
        api.get('/owners')
      ]);
      setProducts(prodRes.data);
      setFiltered(prodRes.data);
      setOwners(ownersRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/products', form);
      setShowForm(false);
      setForm({ name: '', category: 'shampoo', price: '', stock: '', description: '', image_url: '' });
      loadData();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const handleEdit = (p) => {
    setEditId(p.id);
    setEditForm({
      name: p.name, category: p.category,
      price: p.price, stock: p.stock,
      description: p.description || '',
      image_url: p.image_url || ''
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/products/${editId}`, editForm);
      setEditId(null);
      loadData();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    try { await api.delete(`/products/${id}`); loadData(); }
    catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const handleSell = async (e) => {
    e.preventDefault();
    try {
      await api.post('/products/sell', { product_id: showSell, ...sellForm });
      setShowSell(null);
      setSellForm({ quantity: 1, owner_id: '' });
      loadData();
      alert('Venta registrada exitosamente');
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  if (loading) return <div className="page-loading">Cargando productos...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div><h1>Productos</h1><p>{products.length} productos en catálogo</p></div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancelar' : '+ Nuevo Producto'}
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <div className="card form-card">
          <h3>Nuevo Producto</h3>
          <form onSubmit={handleSubmit} className="grid-form">
            <div className="form-group">
              <label>Nombre *</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Categoría</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                <option value="shampoo">Shampoo</option>
                <option value="accesorio">Accesorio</option>
                <option value="medicamento">Medicamento</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div className="form-group">
              <label>Precio (COP) *</label>
              <input
                type="number" step="100"
                value={form.price}
                onChange={e => setForm({...form, price: e.target.value})}
                placeholder="Ej: 25000" required
              />
            </div>
            <div className="form-group">
              <label>Stock</label>
              <input
                type="number"
                value={form.stock}
                onChange={e => setForm({...form, stock: e.target.value})}
              />
            </div>
            <div className="form-group full-width">
              <label>Descripción</label>
              <textarea
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                rows="2"
              />
            </div>
            <div className="form-group full-width">
              <label>Imagen del producto</label>
              <ImageUpload
                value={form.image_url}
                onChange={url => setForm({...form, image_url: url})}
                placeholder="URL de la imagen"
              />
            </div>
            <div className="form-actions full-width">
              <button type="submit" className="btn-primary">Crear Producto</button>
            </div>
          </form>
        </div>
      )}

      {showSell && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Registrar Venta</h3>
            <form onSubmit={handleSell} className="grid-form">
              <div className="form-group">
                <label>Cantidad</label>
                <input
                  type="number" min="1"
                  value={sellForm.quantity}
                  onChange={e => setSellForm({...sellForm, quantity: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Cliente (opcional)</label>
                <select
                  value={sellForm.owner_id}
                  onChange={e => setSellForm({...sellForm, owner_id: e.target.value})}
                >
                  <option value="">Sin cliente</option>
                  {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div className="form-actions full-width">
                <button type="submit" className="btn-primary">Confirmar Venta</button>
                <button type="button" className="btn-secondary" onClick={() => setShowSell(null)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de edición completa */}
      {editId && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '550px' }}>
            <h3>Editar Producto</h3>
            <form onSubmit={handleUpdate} className="grid-form">
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  value={editForm.name}
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <select
                  value={editForm.category}
                  onChange={e => setEditForm({...editForm, category: e.target.value})}
                >
                  <option value="shampoo">Shampoo</option>
                  <option value="accesorio">Accesorio</option>
                  <option value="medicamento">Medicamento</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div className="form-group">
                <label>Precio (COP) *</label>
                <input
                  type="number" step="100"
                  value={editForm.price}
                  onChange={e => setEditForm({...editForm, price: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Stock</label>
                <input
                  type="number"
                  value={editForm.stock}
                  onChange={e => setEditForm({...editForm, stock: e.target.value})}
                />
              </div>
              <div className="form-group full-width">
                <label>Descripción</label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm({...editForm, description: e.target.value})}
                  rows="2"
                />
              </div>
              <div className="form-group full-width">
                <label>Imagen del producto</label>
                <ImageUpload
                  value={editForm.image_url}
                  onChange={url => setEditForm({...editForm, image_url: url})}
                  placeholder="URL de la imagen"
                />
              </div>
              <div className="form-actions full-width">
                <button type="submit" className="btn-primary">Guardar cambios</button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditId(null)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="toolbar">
        <input
          className="search-input"
          placeholder="Buscar por nombre, categoría..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="cards-grid">
        {filtered.map(p => (
          <div key={p.id} className="cut-card">
            {p.image_url
              ? <img src={p.image_url} alt={p.name} className="cut-image" onError={e => e.target.style.display = 'none'} />
              : <div className="cut-placeholder">🛍️</div>
            }
            <div className="cut-info">
              <h3>{p.name}</h3>
              <span className="category-badge">{p.category}</span>
              {p.description && <p className="cut-desc">{p.description}</p>}
              <p className="cut-price">{formatCOP(p.price)}</p>
              <p style={{ fontSize: '0.85rem', color: p.stock < 10 ? 'var(--danger)' : 'var(--success)' }}>
                Stock: {p.stock} unidades
              </p>
            </div>
            <div className="action-btns" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn-success btn-sm" onClick={() => setShowSell(p.id)}>🛒 Vender</button>
              {isAdmin && (
                <>
                  <button className="btn-secondary btn-sm" onClick={() => handleEdit(p)}>✏️ Editar</button>
                  <button className="btn-danger btn-sm" onClick={() => handleDelete(p.id)}>🗑️</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <div className="empty-table">No hay productos</div>}
    </div>
  );
};

export default Products;