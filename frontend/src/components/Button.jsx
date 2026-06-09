/*import React from 'react';
import colors from '../theme/colors';

const Button = ({ children }) => {
  return (
    <button
      style={{
        padding: '0.5rem 1rem',
        backgroundColor: colors.primary,
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
};

export default Button;*/ 

import React from 'react';
import colors from '../theme/colors';

const Button = ({ children }) => {
  return (
    <button
      style={{
        padding: '0.7rem 1.8rem',
        backgroundColor: colors.primary,
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '0.95rem',
        fontWeight: '600',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        letterSpacing: '0.3px',
      }}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = '#b91c1c';
        e.target.style.transform = 'translateY(-2px)';
        e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = colors.primary;
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      }}
    >
      {children}
    </button>
  );
};

export default Button;
