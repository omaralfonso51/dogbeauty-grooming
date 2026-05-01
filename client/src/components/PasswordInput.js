import { useState } from 'react';

const PasswordInput = ({ value, onChange, placeholder = 'Contraseña', required = false, showStrength = false }) => {
  const [show, setShow] = useState(false);

  const getStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    if (pass.length >= 12) score++;
    const levels = [
      { score: 0, label: '', color: '' },
      { score: 1, label: 'Muy débil', color: '#F44336' },
      { score: 2, label: 'Débil', color: '#FF9800' },
      { score: 3, label: 'Regular', color: '#FFC107' },
      { score: 4, label: 'Fuerte', color: '#8BC34A' },
      { score: 5, label: 'Muy fuerte', color: '#4CAF50' },
    ];
    return levels[score] || levels[0];
  };

  const strength = showStrength ? getStrength(value) : null;

  const checks = [
    { label: 'Mínimo 8 caracteres', ok: value?.length >= 8 },
    { label: 'Una mayúscula', ok: /[A-Z]/.test(value || '') },
    { label: 'Un número', ok: /[0-9]/.test(value || '') },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          style={{ width: '100%', paddingRight: '3rem' }}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          style={{
            position: 'absolute', right: '0.75rem', top: '50%',
            transform: 'translateY(-50%)', background: 'none',
            border: 'none', cursor: 'pointer', fontSize: '1rem',
            color: 'var(--text-light)'
          }}
        >
          {show ? '🙈' : '👁️'}
        </button>
      </div>

      {showStrength && value && (
        <>
          <div style={{ height: '4px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(strength.score / 5) * 100}%`,
              background: strength.color,
              transition: 'width 0.3s, background 0.3s',
              borderRadius: '4px'
            }} />
          </div>
          {strength.label && (
            <span style={{ fontSize: '0.75rem', color: strength.color, fontWeight: 500 }}>
              {strength.label}
            </span>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {checks.map(c => (
              <span key={c.label} style={{
                fontSize: '0.72rem',
                color: c.ok ? 'var(--success)' : 'var(--text-light)'
              }}>
                {c.ok ? '✅' : '○'} {c.label}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PasswordInput;