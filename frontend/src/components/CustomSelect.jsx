import React, { useEffect, useRef, useState } from 'react';

/*
  CustomSelect
  - props:
    - options: [{ value, label }]
    - value
    - onChange(value)
    - placeholder
    - className (optional)
  - searchable, keyboard accessible, fully stylable with Tailwind/CSS
*/

const CustomSelect = ({ options = [], value, onChange, placeholder = 'Choose...', className = '', buttonClassName, buttonStyle }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
        setHighlight(0);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  //search/filter logic
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.trim().toLowerCase())
  );

  const selectedLabel = options.find((o) => o.value === value)?.label || '';

  const handleToggle = () => setOpen((v) => !v);

  const handleSelect = (val) => {
    onChange && onChange(val);
    setOpen(false);
    setQuery('');
  };

  const onKeyDown = (e) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setHighlight((h) => Math.max(h - 1, 0));
      e.preventDefault();
    } else if (e.key === 'Enter') {
      const pick = filtered[highlight];
      if (pick) handleSelect(pick.value);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        onKeyDown={onKeyDown}
        className={buttonClassName ? buttonClassName : "w-full rounded-xl border border-[#1c3660] px-4 py-3 text-left text-white focus:outline-none flex items-center justify-between"}
        style={buttonStyle ? buttonStyle : { backgroundColor: '#0c2546' }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`truncate ${selectedLabel ? '' : 'text-white/60'}`}>
          {selectedLabel || placeholder}
        </span>
        <svg className="ml-2 h-5 w-5 text-white/60" viewBox="0 0 20 20" fill="none">
          <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-lg shadow-lg" style={{ background: '#0a2341', maxHeight: '320px', overflow: 'hidden' }}>
          <div className="px-3 py-2">
            <input
              className="w-full rounded-md border border-[#173059] bg-[#05203b] px-3 py-2 text-white placeholder:text-white/50 focus:outline-none"
              placeholder="Search..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setHighlight(0); }}
              onKeyDown={onKeyDown}
              autoFocus
            />
          </div>

          <ul role="listbox" tabIndex={-1} className="max-h-64 overflow-auto px-1 py-1">
            {filtered.length === 0 && (
              <li className="px-4 py-2 text-sm text-white/60">No results</li>
            )}
            {filtered.map((opt, idx) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={value === opt.value}
                onClick={() => handleSelect(opt.value)}
                onMouseEnter={() => setHighlight(idx)}
                className={`cursor-pointer px-4 py-2 text-sm ${highlight === idx ? 'bg-[#0f3a5f] text-white' : 'text-white/90'}`}
              >
                <div className="flex items-center gap-2">
                  <span className="truncate">{opt.label}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
