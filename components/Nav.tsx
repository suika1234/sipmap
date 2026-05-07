'use client';

import Link from 'next/link';

export default function Nav() {
  return (
    <header>
      <div style={{
        maxWidth:       '780px',
        margin:         '0 auto',
        padding:        '1.5rem 1.25rem',
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
      }}>
        <Link
          href="/"
          className="nav-link"
          style={{
            fontFamily:     'var(--font-sans)',
            fontSize:       '0.9rem',
            fontWeight:     700,
            letterSpacing:  '0.18em',
            textTransform:  'uppercase',
            textDecoration: 'none',
            color:          '#1A1410',
          }}
        >
          Sip Map
        </Link>

        <p style={{
          fontFamily: 'var(--font-serif)',
          fontStyle:  'italic',
          fontSize:   '0.85rem',
          color:      '#8C7B6B',
          margin:     0,
        }}>
          Tokyo cafes, by Erika.
        </p>
      </div>
      <div style={{ borderBottom: '1px solid #DDD5C8' }} />
    </header>
  );
}
