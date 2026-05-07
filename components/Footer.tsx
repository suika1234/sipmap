export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#F0EBE1', marginTop: '4rem' }}>
      <div style={{ height: '2px', backgroundColor: '#C4622D' }} />
      <div style={{ borderTop: '1px solid #DDD5C8', marginTop: '0' }}>
        <p style={{
          fontFamily:    'var(--font-sans)',
          fontSize:      '0.65rem',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          fontWeight:    500,
          color:         '#8C7B6B',
          textAlign:     'center',
          padding:       '1.25rem',
          margin:        0,
        }}>
          © Sip Map · Tokyo · Made by Erika
        </p>
      </div>
    </footer>
  );
}
