'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo } from 'react';
import cafesData from '@/data/cafes.json';

type Cafe = (typeof cafesData)[0];

const BADGE_LABELS: Record<string, string> = {
  wifi:             'WiFi',
  plugs:            'Plugs',
  long_stay:        'Long Stay OK',
  quiet:            'Quiet',
  opens_early:      'Opens Early',
  specialty_coffee: 'Specialty Coffee',
};

const CafeMap = dynamic(() => import('@/components/CafeMap'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%', height: '70vh', minHeight: '480px',
      backgroundColor: '#E8E0D5',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8C7B6B' }}>
        Loading map…
      </p>
    </div>
  ),
});

function Badge({ label }: { label: string }) {
  return (
    <span style={{
      fontFamily:    'var(--font-sans)',
      fontSize:      '0.6rem',
      letterSpacing: '0.1em',
      textTransform: 'uppercase' as const,
      fontWeight:    500,
      color:         '#1A1410',
      border:        '1px solid #1A1410',
      padding:       '0.15rem 0.5rem',
      whiteSpace:    'nowrap' as const,
    }}>
      {label}
    </span>
  );
}

function CafeCard({
  cafe, selected, onShowOnMap,
}: {
  cafe: Cafe;
  selected: boolean;
  onShowOnMap: (id: string) => void;
}) {
  return (
    <article
      id={`cafe-card-${cafe.id}`}
      className="cafe-card"
      style={{
        backgroundColor: '#F0EBE1',
        border:          `1px solid ${selected ? '#C4622D' : '#DDD5C8'}`,
        padding:         '1.5rem',
        transition:      'border-color 0.15s ease',
      }}
    >
      <p style={{
        fontFamily:    'var(--font-sans)',
        fontSize:      '0.62rem',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color:         '#8C7B6B',
        margin:        '0 0 0.4rem',
      }}>
        {cafe.neighborhood}
      </p>
      <h2 style={{
        fontFamily:    'var(--font-serif)',
        fontSize:      'clamp(1.05rem, 2.5vw, 1.4rem)',
        fontWeight:    700,
        lineHeight:    1.15,
        color:         '#1A1410',
        margin:        '0 0 0.65rem',
      }}>
        {cafe.name}
      </h2>
      <p style={{
        fontFamily: 'var(--font-serif)',
        fontSize:   '0.9rem',
        color:      '#8C7B6B',
        lineHeight: 1.65,
        margin:     '0 0 0.9rem',
      }}>
        {cafe.erika_short}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '1rem' }}>
        {cafe.badges.map((b) => (
          <Badge key={b} label={BADGE_LABELS[b] ?? b} />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
        <a
          href={cafe.google_maps_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily:     'var(--font-sans)',
            fontSize:       '0.68rem',
            letterSpacing:  '0.1em',
            textTransform:  'uppercase',
            fontWeight:     600,
            color:          '#C4622D',
            textDecoration: 'none',
          }}
        >
          Open in Maps →
        </a>
        <button
          onClick={() => onShowOnMap(cafe.id)}
          style={{
            fontFamily:          'var(--font-sans)',
            fontSize:            '0.68rem',
            letterSpacing:       '0.1em',
            textTransform:       'uppercase',
            fontWeight:          500,
            color:               '#8C7B6B',
            background:          'none',
            border:              'none',
            cursor:              'pointer',
            padding:             0,
            textDecoration:      'underline',
            textUnderlineOffset: '2px',
          }}
        >
          Show on map →
        </button>
      </div>
    </article>
  );
}

export default function HomePage() {
  const cafes = cafesData as Cafe[];

  const [view, setView]                         = useState<'map' | 'list'>('list');
  const [selectedId, setSelectedId]             = useState<string | null>(null);
  const [neighborhoodFilter, setNeighborhoodFilter] = useState('all');

  useEffect(() => {
    if (window.innerWidth >= 640) setView('map');
  }, []);

  useEffect(() => {
    if (view === 'list' && selectedId) {
      const el = document.getElementById(`cafe-card-${selectedId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [view, selectedId]);

  const neighborhoods = useMemo(() => {
    const set = new Set(cafes.map((c) => c.neighborhood));
    return ['all', ...Array.from(set).sort()];
  }, [cafes]);

  const filteredCafes = useMemo(() =>
    neighborhoodFilter === 'all'
      ? cafes
      : cafes.filter((c) => c.neighborhood === neighborhoodFilter),
    [cafes, neighborhoodFilter],
  );

  const handleShowOnMap = (id: string) => {
    setSelectedId(id);
    setView('map');
  };

  const TOGGLE_STYLE = (active: boolean): React.CSSProperties => ({
    fontFamily:    'var(--font-sans)',
    fontSize:      '0.72rem',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    fontWeight:    600,
    color:         active ? '#1A1410' : '#8C7B6B',
    background:    'none',
    border:        'none',
    borderBottom:  active ? '2px solid #C4622D' : '2px solid transparent',
    paddingBottom: '0.25rem',
    cursor:        'pointer',
    transition:    'color 0.15s ease',
  });

  const CHIP_STYLE = (active: boolean): React.CSSProperties => ({
    fontFamily:      'var(--font-sans)',
    fontSize:        '0.68rem',
    letterSpacing:   '0.08em',
    textTransform:   'uppercase',
    fontWeight:      500,
    padding:         '0.35rem 0.85rem',
    cursor:          'pointer',
    backgroundColor: active ? '#1A1410' : '#FAF7F2',
    color:           active ? '#F0EBE1' : '#1A1410',
    border:          `1px solid ${active ? '#1A1410' : '#C4B9A8'}`,
    transition:      'all 0.15s ease',
  });

  return (
    <main style={{ minHeight: '100vh' }}>

      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '3rem 1.25rem 0' }}>
        <header style={{ marginBottom: '2.75rem' }}>
          <h1 style={{
            fontFamily:    'var(--font-serif)',
            fontSize:      'clamp(2.2rem, 6vw, 3.5rem)',
            fontWeight:    700,
            lineHeight:    1.15,
            letterSpacing: '-0.02em',
            color:         '#1A1410',
            margin:        '0 0 0.6rem',
          }}>
            The Tokyo Cafe Map
          </h1>
          <p style={{
            fontFamily: 'var(--font-serif)',
            fontStyle:  'italic',
            fontSize:   '1.05rem',
            color:      '#8C7B6B',
            margin:     0,
          }}>
            Cafes worth going to, curated by Erika.
          </p>
        </header>

        <div style={{ height: '2px', backgroundColor: '#C4622D', marginBottom: '2rem' }} />

        <p style={{
          fontFamily: 'var(--font-serif)',
          fontSize:   '1rem',
          color:      '#1A1410',
          lineHeight: 1.8,
          margin:     '0 0 2.5rem',
        }}>
          Tokyo has no shortage of cafes. These are the ones I keep coming back to — for the coffee,
          the room, or just because they&rsquo;re the right place to be on a given afternoon.
        </p>

        <div style={{ display: 'flex', gap: '1.75rem', marginBottom: '2.25rem' }}>
          <button style={TOGGLE_STYLE(view === 'map')} onClick={() => setView('map')}>Map</button>
          <button style={TOGGLE_STYLE(view === 'list')} onClick={() => setView('list')}>List</button>
        </div>
      </div>

      {view === 'map' && (
        <>
          <CafeMap
            cafes={cafes}
            selectedId={selectedId}
            onSelectCafe={(id) => setSelectedId(id)}
          />
          <div style={{ height: '4rem' }} />
        </>
      )}

      {view === 'list' && (
        <div style={{ maxWidth: '780px', margin: '0 auto', padding: '0 1.25rem 8rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
            {neighborhoods.map((n) => (
              <button
                key={n}
                onClick={() => setNeighborhoodFilter(n)}
                style={CHIP_STYLE(neighborhoodFilter === n)}
              >
                {n === 'all' ? 'All' : n}
              </button>
            ))}
          </div>
          <div className="cafe-grid">
            {filteredCafes.map((cafe) => (
              <CafeCard
                key={cafe.id}
                cafe={cafe}
                selected={selectedId === cafe.id}
                onShowOnMap={handleShowOnMap}
              />
            ))}
          </div>
        </div>
      )}

    </main>
  );
}
