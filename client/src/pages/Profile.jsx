import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ImageUpload from '../components/ImageUpload';
import PasswordInput from '../components/PasswordInput';
import './Common.css';

const Profile = () => {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', photo_url: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      setProfile(res.data);
      setForm({ name: res.data.name, email: res.data.email, password: '', photo_url: res.data.photo_url || '' });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'El nombre es obligatorio';
    if (!form.email.trim()) newErrors.email = 'El email es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Email inválido';
    if (form.password) {
      if (form.password.length < 8) newErrors.password = 'Mínimo 8 caracteres';
      else if (!/[A-Z]/.test(form.password)) newErrors.password = 'Debe tener al menos una mayúscula';
      else if (!/[0-9]/.test(form.password)) newErrors.password = 'Debe tener al menos un número';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setError('');
    setSuccess('');
    try {
      const res = await api.put('/auth/profile', form);
      setProfile(res.data);
      login(res.data, localStorage.getItem('token'));
      setEditing(false);
      setSuccess('Perfil actualizado correctamente ✅');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar');
    }
  };

  if (loading) return <div className="page-loading">Cargando perfil...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div><h1>Mi Perfil</h1><p>Gestiona tu información personal</p></div>
      </div>

      <div style={{ maxWidth: '500px' }}>
        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              width: '90px', height: '90px', borderRadius: '50%',
              background: 'var(--accent-light)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem', margin: '0 auto 0.75rem',
              overflow: 'hidden', border: '3px solid var(--accent)'
            }}>
              {profile?.photo_url
                ? <img src={profile.photo_url} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                : profile?.role === 'admin' ? '👑' : '✂️'
              }
            </div>
            <span className="user-role">{profile?.role}</span>
          </div>

          {!editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="modal-detail"><strong>Nombre:</strong> {profile?.name}</div>
              <div className="modal-detail"><strong>Email:</strong> {profile?.email}</div>
              <div className="modal-detail"><strong>Rol:</strong> {profile?.role}</div>
              {profile?.commission_rate > 0 && (
                <div className="modal-detail"><strong>Comisión:</strong> {profile?.commission_rate}%</div>
              )}
              <div className="modal-detail">
                <strong>Miembro desde:</strong>{' '}
                {new Date(profile?.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <button className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={() => setEditing(true)}>
                ✏️ Editar mis datos
              </button>
            </div>
          ) : (
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} noValidate>
              <div className="form-group">
                <label>Nombre *</label>
                <input value={form.name} onChange={e => { setForm({...form, name: e.target.value}); setErrors({...errors, name: ''}); }} style={{ borderColor: errors.name ? 'var(--danger)' : undefined }} />
                {errors.name && <span style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>⚠️ {errors.name}</span>}
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input type="email" value={form.email} onChange={e => { setForm({...form, email: e.target.value}); setErrors({...errors, email: ''}); }} style={{ borderColor: errors.email ? 'var(--danger)' : undefined }} />
                {errors.email && <span style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>⚠️ {errors.email}</span>}
              </div>
              <div className="form-group">
                <label>Nueva contraseña (opcional)</label>
                <PasswordInput
                  value={form.password}
                  onChange={e => { setForm({...form, password: e.target.value}); setErrors({...errors, password: ''}); }}
                  placeholder="Dejar vacío para no cambiar"
                  showStrength={true}
                />
                {errors.password && <span style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>⚠️ {errors.password}</span>}
              </div>
              <div className="form-group">
                <label>Foto de perfil</label>
                <ImageUpload value={form.photo_url} onChange={url => setForm({...form, photo_url: url})} placeholder="URL de tu foto" />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">Guardar cambios</button>
                <button type="button" className="btn-secondary" onClick={() => { setEditing(false); setErrors({}); setError(''); }}>Cancelar</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;