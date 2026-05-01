import { useState } from 'react';
import api from '../services/api';

const ImageUpload = ({ value, onChange, placeholder = "URL o sube una imagen" }) => {
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState('url');

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onChange(res.data.url);
    } catch (err) {
      alert('Error al subir imagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="button"
          className={`filter-btn ${mode === 'url' ? 'active' : ''}`}
          onClick={() => setMode('url')}
          style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
        >
          🔗 URL
        </button>
        <button
          type="button"
          className={`filter-btn ${mode === 'file' ? 'active' : ''}`}
          onClick={() => setMode('file')}
          style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
        >
          📁 Subir archivo
        </button>
      </div>

      {mode === 'url' ? (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            padding: '0.75rem 1rem',
            border: '1.5px solid var(--border)',
            borderRadius: '12px',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '0.95rem',
            outline: 'none',
            background: 'var(--bg)'
          }}
        />
      ) : (
        <div style={{
          border: '2px dashed var(--border)',
          borderRadius: '12px',
          padding: '1rem',
          textAlign: 'center',
          background: 'var(--bg)'
        }}>
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            style={{ display: 'none' }}
            id="img-upload"
          />
          <label htmlFor="img-upload" style={{ cursor: 'pointer', color: 'var(--text-light)', fontSize: '0.9rem' }}>
            {uploading ? '⏳ Subiendo...' : '📷 Click para seleccionar imagen'}
          </label>
        </div>
      )}

      {value && (
        <img
          src={value}
          alt="preview"
          style={{
            width: '80px', height: '80px',
            objectFit: 'cover', borderRadius: '8px',
            marginTop: '0.25rem'
          }}
          onError={e => e.target.style.display = 'none'}
        />
      )}
    </div>
  );
};

export default ImageUpload;