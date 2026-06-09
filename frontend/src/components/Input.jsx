/*// src/components/Input.jsx
import React from 'react';

const Input = ({ label, type = 'text', value, onChange }) => (
  <div style={{ marginBottom: '1rem' }}>
    <label style={{ display: 'block', marginBottom: '0.5rem' }}>{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      style={{
        padding: '0.5rem',
        width: '100%',
        border: '1px solid #ccc',
        borderRadius: '4px',
      }}
    />
  </div>
);

export default Input;*/


// src/components/Input.jsx
import React from 'react';

const Input = ({ label, type = 'text', value, onChange }) => (
  <div style={{ marginBottom: '1.25rem' }}>
    <label
      style={{
        display: 'block',
        marginBottom: '0.6rem',
        color: '#ffffff',
        fontSize: '0.9rem',
        fontWeight: '500',
        letterSpacing: '0.3px',
      }}
    >
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      style={{
        padding: '0.85rem 1rem',
        width: '100%',
        border: '1px solid #1e3a5f',
        borderRadius: '8px',
        backgroundColor: '#0a1929',
        color: '#ffffff',
        fontSize: '0.95rem',
        transition: 'all 0.3s ease',
        boxSizing: 'border-box',
        outline: 'none',
      }}
      onFocus={(e) => {
        e.target.style.borderColor = '#dc2626';
        e.target.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.1)';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = '#1e3a5f';
        e.target.style.boxShadow = 'none';
      }}
    />
  </div>
);

export default Input;


