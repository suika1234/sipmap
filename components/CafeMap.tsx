'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export type Cafe = {
  id: string;
  name: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  google_maps_url: string;
  erika_short: string;
  badges: string[];
};

const BADGE_LABELS: Record<string, string> = {
  wifi:             'WiFi',
  plugs:            'Plugs',
  long_stay:        'Long Stay OK',
  quiet:            'Quiet',
  opens_early:      'Opens Early',
  specialty_coffee: 'Specialty Coffee',
};

// ── Warm editorial map style ───────────────────────────────────────────────

function applyWarmStyle(m: mapboxgl.Map) {
  const layers = m.getStyle().layers ?? [];
  for (const layer of layers) {
    const id = layer.id;
    // Remove POI icons and transit entirely
    if (/poi|transit/.test(id)) {
      try { m.setLayoutProperty(id, 'visibility', 'none'); } catch (_) {}
      continue;
    }
    try {
      if (layer.type === 'background') {
        m.setPaintProperty(id, 'background-color', '#F0EBE1');
      } else if (/water|waterway/.test(id)) {
        if (layer.type === 'fill') m.setPaintProperty(id, 'fill-color', '#DDD5C8');
        if (layer.type === 'line') m.setPaintProperty(id, 'line-color', '#DDD5C8');
      } else if (/park|national|landuse|landcover/.test(id) && layer.type === 'fill') {
        m.setPaintProperty(id, 'fill-color', '#E2DDD5');
      } else if (/building/.test(id)) {
        if (layer.type === 'fill') m.setPaintProperty(id, 'fill-color', '#E8E0D5');
        if (layer.type === 'line') m.setPaintProperty(id, 'line-color', '#DDD5C8');
      } else if (layer.type === 'line' && /road|tunnel|bridge|path|aeroway/.test(id)) {
        const isMajor = /primary|motorway|trunk|secondary/.test(id);
        m.setPaintProperty(id, 'line-color', isMajor ? '#C8BFB0' : '#D8D0C4');
      } else if (layer.type === 'symbol') {
        try { m.setPaintProperty(id, 'text-color', '#8C7B6B'); } catch (_) {}
        try { m.setPaintProperty(id, 'text-halo-color', '#F0EBE1'); } catch (_) {}
      }
    } catch (_) {}
  }
}

// ── Side panel content ─────────────────────────────────────────────────────

function PanelContent({ cafe, onClose }: { cafe: Cafe; onClose: () => void }) {
  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
        <button
          onClick={onClose}
          aria-label="Close panel"
          style={{
            background:  'none',
            border:      'none',
            cursor:      'pointer',
            color:       '#8C7B6B',
            fontSize:    '1rem',
            lineHeight:  1,
            padding:     0,
          }}
        >
          ✕
        </button>
      </div>

      <p style={{
        fontFamily:    'var(--font-sans)',
        fontSize:      '0.62rem',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color:         '#8C7B6B',
        margin:        '0 0 0.5rem',
      }}>
        {cafe.neighborhood}
      </p>

      <h2 style={{
        fontFamily:    'var(--font-serif)',
        fontSize:      '1.4rem',
        fontWeight:    700,
        color:         '#1A1410',
        lineHeight:    1.15,
        margin:        '0 0 1rem',
      }}>
        {cafe.name}
      </h2>

      <p style={{
        fontFamily: 'var(--font-serif)',
        fontStyle:  'italic',
        fontSize:   '0.9rem',
        color:      '#1A1410',
        lineHeight: 1.7,
        margin:     '0 0 1.25rem',
      }}>
        {cafe.erika_short}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '1.25rem' }}>
        {cafe.badges.map((b) => (
          <span key={b} style={{
            fontFamily:    'var(--font-sans)',
            fontSize:      '0.6rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontWeight:    500,
            color:         '#1A1410',
            border:        '1px solid #1A1410',
            padding:       '0.15rem 0.5rem',
            whiteSpace:    'nowrap',
          }}>
            {BADGE_LABELS[b] ?? b}
          </span>
        ))}
      </div>

      <div style={{ borderBottom: '1px solid #DDD5C8', marginBottom: '1.25rem' }} />

      <a
        href={cafe.google_maps_url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontFamily:    'var(--font-sans)',
          fontSize:      '0.65rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          fontWeight:    600,
          color:         '#C4622D',
          textDecoration: 'none',
          display:       'block',
        }}
      >
        Open in Google Maps →
      </a>
    </div>
  );
}

// ── Map component ──────────────────────────────────────────────────────────

interface CafeMapProps {
  cafes: Cafe[];
  selectedId: string | null;
  onSelectCafe: (id: string | null) => void;
}

export default function CafeMap({ cafes, selectedId, onSelectCafe }: CafeMapProps) {
  const mapContainer  = useRef<HTMLDivElement>(null);
  const map           = useRef<mapboxgl.Map | null>(null);
  const markerEls     = useRef<Record<string, HTMLDivElement>>({});
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 640);
  }, []);

  const selectedCafe = selectedId ? (cafes.find((c) => c.id === selectedId) ?? null) : null;
  const panelOpen    = selectedCafe !== null;

  // ── Init map (once) ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style:     'mapbox://styles/mapbox/light-v11',
      center:    [139.6503, 35.6762],
      zoom:      12,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      'top-right',
    );

    map.current.on('load', () => {
      applyWarmStyle(map.current!);

      cafes.forEach((cafe) => {
        const el = document.createElement('div');
        el.style.cssText = `
          width: 10px; height: 10px;
          border-radius: 50%;
          background-color: #C4622D;
          border: 2px solid #F0EBE1;
          cursor: pointer;
          transition: width 0.15s ease, height 0.15s ease, background-color 0.15s ease;
          box-shadow: 0 1px 4px rgba(0,0,0,0.18);
        `;
        markerEls.current[cafe.id] = el;

        new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([cafe.longitude, cafe.latitude])
          .addTo(map.current!);

        el.addEventListener('mouseenter', () => {
          if (cafe.id !== selectedIdRef.current) {
            el.style.width  = '14px';
            el.style.height = '14px';
          }
        });
        el.addEventListener('mouseleave', () => {
          if (cafe.id !== selectedIdRef.current) {
            el.style.width  = '10px';
            el.style.height = '10px';
          }
        });

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onSelectCafe(cafe.id);
        });
      });

      // Close panel when clicking map background
      map.current!.on('click', () => {
        if (selectedIdRef.current) onSelectCafe(null);
      });

      // Handle cafe already selected when map first mounted
      const initialId = selectedIdRef.current;
      if (initialId) {
        const c = cafes.find((x) => x.id === initialId);
        if (c) {
          map.current!.flyTo({ center: [c.longitude, c.latitude], zoom: 14, duration: 0 });
          const mel = markerEls.current[initialId];
          if (mel) { mel.style.backgroundColor = '#1A1410'; mel.style.width = '14px'; mel.style.height = '14px'; }
        }
      }
    });

    return () => { map.current?.remove(); map.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Update markers + fly-to when selectedId changes ──────────────────────
  useEffect(() => {
    // Always update marker visuals
    Object.values(markerEls.current).forEach((m) => {
      m.style.backgroundColor = '#C4622D';
      m.style.width  = '10px';
      m.style.height = '10px';
    });
    if (selectedId) {
      const mel = markerEls.current[selectedId];
      if (mel) { mel.style.backgroundColor = '#1A1410'; mel.style.width = '14px'; mel.style.height = '14px'; }
    }

    if (!selectedId || !map.current?.loaded()) return;
    const cafe = cafes.find((c) => c.id === selectedId);
    if (!cafe) return;

    const mobile = window.innerWidth < 640;
    map.current.flyTo({
      center:   [cafe.longitude, cafe.latitude],
      zoom:     14,
      duration: 900,
      offset:   mobile ? [0, 60] : [-160, 0],
    });
  }, [selectedId, cafes]);

  // ── Resize map after panel animation completes ────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => map.current?.resize(), 260);
    return () => clearTimeout(t);
  }, [selectedId]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="cafe-map-container"
      style={{
        display:  'flex',
        height:   '70vh',
        minHeight: '480px',
        position: 'relative',
      }}
    >
      {/* Map canvas */}
      <div ref={mapContainer} style={{ flex: 1, minWidth: 0, height: '100%' }} />

      {/* Desktop side panel — flex sibling so map resizes */}
      {!isMobile && (
        <div style={{
          width:      panelOpen ? '320px' : '0',
          overflow:   'hidden',
          transition: 'width 0.25s ease-out',
          flexShrink: 0,
          height:     '100%',
        }}>
          <div style={{
            width:           '320px',
            height:          '100%',
            backgroundColor: '#F0EBE1',
            borderLeft:      '1px solid #DDD5C8',
            overflowY:       'auto',
          }}>
            {selectedCafe && (
              <PanelContent cafe={selectedCafe} onClose={() => onSelectCafe(null)} />
            )}
          </div>
        </div>
      )}

      {/* Mobile bottom sheet — absolute so map stays full height */}
      {isMobile && (
        <div style={{
          position:        'absolute',
          left:            0,
          right:           0,
          bottom:          0,
          height:          '60%',
          backgroundColor: '#F0EBE1',
          borderTop:       '1px solid #DDD5C8',
          transform:       panelOpen ? 'translateY(0)' : 'translateY(100%)',
          transition:      'transform 0.25s ease-out',
          overflowY:       'auto',
          zIndex:          10,
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '0.75rem' }}>
            <div style={{
              width:           '32px',
              height:          '3px',
              borderRadius:    '2px',
              backgroundColor: '#C4B9A8',
            }} />
          </div>
          {selectedCafe && (
            <PanelContent cafe={selectedCafe} onClose={() => onSelectCafe(null)} />
          )}
        </div>
      )}
    </div>
  );
}
