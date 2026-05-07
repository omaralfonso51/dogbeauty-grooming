import { useState } from 'react';

const SafeImage = ({
  src,
  alt,
  style,
  className,
  placeholder = '🐾',
  fallbackStyle = {}
}) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!src || error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '3rem',
        background: 'var(--accent-light)',
        ...fallbackStyle
      }}>
        {placeholder}
      </div>
    );
  }

  return (
    <>
      {!loaded && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--border)',
          ...fallbackStyle
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>⏳</span>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        style={{ ...style, display: loaded ? undefined : 'none' }}
        className={className}
        onError={() => setError(true)}
        onLoad={() => setLoaded(true)}
        referrerPolicy="no-referrer"
      />
    </>
  );
};

export default SafeImage;