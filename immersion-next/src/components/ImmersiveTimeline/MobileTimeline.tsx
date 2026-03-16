'use client';

import { useState, useEffect } from 'react';
import { mediaTypeIcon, mediaTypeColor } from '@/types/media';
import type { MediaItem } from '@/types/media';

const COUNTRIES = [
  { code: 'JP', label: '🇯🇵 Japan'          },
  { code: 'IT', label: '🇮🇹 Italy'          },
  { code: 'GB', label: '🇬🇧 United Kingdom' },
  { code: 'US', label: '🇺🇸 United States'  },
  { code: 'GR', label: '🇬🇷 Greece'         },
  { code: 'NO', label: '🇳🇴 Norway'         },
  { code: 'DE', label: '🇩🇪 Germany'        },
  { code: 'FR', label: '🇫🇷 France'         },
  { code: 'EG', label: '🇪🇬 Egypt'          },
  { code: 'CN', label: '🇨🇳 China'          },
  { code: 'IN', label: '🇮🇳 India'          },
  { code: 'RU', label: '🇷🇺 Russia'         },
  { code: 'TR', label: '🇹🇷 Turkey'         },
];

const ERAS = [
  { key: 'ancient',     label: '🏛️ Ancient World'        },
  { key: 'roman',       label: '⚔️ Roman Empire'         },
  { key: 'viking',      label: '⛵ Viking Age'           },
  { key: 'medieval',    label: '🏰 Medieval Era'         },
  { key: 'renaissance', label: '🎨 Renaissance'          },
  { key: 'colonial',    label: '🧭 Age of Exploration'  },
  { key: 'industrial',  label: '⚙️ Industrial Revolution'},
  { key: 'worldwar',    label: '🌍 World Wars'           },
  { key: 'modern',      label: '🚀 Modern Era'           },
];

interface MobileTimelineProps {
  mediaItems:      MediaItem[];
  selectedCountry: string | null;
  selectedEra:     string | null;
  onSelectCountry: (code: string | null) => void;
  onSelectEra:     (era: string | null) => void;
  onMediaSelect:   (item: MediaItem) => void;
  onExitMobile:    () => void;
}

function MobileCard({
  item,
  index,
  onSelect,
}: {
  item:     MediaItem;
  index:    number;
  onSelect: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const color = mediaTypeColor(item.mediaType);
  const icon  = mediaTypeIcon(item.mediaType);
  const isLeft = index % 2 === 0;
  const year = item.startYear === item.endYear
    ? String(item.startYear)
    : `${item.startYear}–${item.endYear}`;

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), index * 55 + 80);
    return () => clearTimeout(id);
  }, [index]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isLeft ? 'flex-start' : 'flex-end',
        paddingLeft: isLeft ? 0 : '52%',
        paddingRight: isLeft ? '52%' : 0,
        marginBottom: 16,
        transform: visible ? 'translateX(0)' : `translateX(${isLeft ? '-40px' : '40px'})`,
        opacity: visible ? 1 : 0,
        transition: 'transform 0.35s ease-out, opacity 0.35s ease-out',
      }}
    >
      <button
        onClick={onSelect}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${color}40`,
          borderRadius: 12,
          padding: '12px 14px',
          textAlign: 'left',
          cursor: 'pointer',
          boxShadow: `0 0 12px ${color}15`,
        }}
      >
        <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
        <div style={{
          color: '#eef2ff', fontFamily: 'sans-serif',
          fontWeight: 700, fontSize: 13, lineHeight: 1.3, marginBottom: 4,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {item.title}
        </div>
        <div style={{
          color: `${color}cc`, fontSize: 10, fontFamily: 'sans-serif',
          fontWeight: 600,
        }}>
          {year}
        </div>
        {item.timePeriod && (
          <div style={{
            color: 'rgba(180,190,220,0.5)', fontSize: 10,
            fontFamily: 'sans-serif', marginTop: 2,
          }}>
            {item.timePeriod}
          </div>
        )}
      </button>
    </div>
  );
}

export default function MobileTimeline({
  mediaItems,
  selectedCountry,
  selectedEra,
  onSelectCountry,
  onSelectEra,
  onMediaSelect,
  onExitMobile,
}: MobileTimelineProps) {
  const sorted = [...mediaItems].sort((a, b) => a.startYear - b.startYear);

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(180deg, #060818 0%, #0d0828 50%, #060818 100%)',
      position: 'relative',
    }}>
      {/* Static stars */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {Array.from({ length: 60 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: `${(i % 3) * 0.8 + 0.5}px`,
            height: `${(i % 3) * 0.8 + 0.5}px`,
            background: '#fff',
            borderRadius: '50%',
            top:  `${(i * 137) % 100}%`,
            left: `${(i * 97)  % 100}%`,
            opacity: ((i % 5) * 0.12 + 0.15),
            animation: `pulse ${1.5 + (i % 4) * 0.6}s ease-in-out infinite`,
          }} />
        ))}
      </div>

      {/* Sticky header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(6,8,24,0.88)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '14px 16px 12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h1 style={{
            color: '#c8d8ff', fontFamily: 'sans-serif', fontWeight: 800,
            fontSize: 15, letterSpacing: '0.12em', textTransform: 'uppercase',
          }}>
            🌌 The Immersion Verse
          </h1>
          <button
            onClick={onExitMobile}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(200,210,240,0.7)', borderRadius: 8, padding: '5px 10px',
              fontSize: 11, fontFamily: 'sans-serif', cursor: 'pointer',
            }}
          >
            ✕ Exit
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={selectedCountry ?? ''}
            onChange={e => onSelectCountry(e.target.value || null)}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8, padding: '8px 10px',
              color: '#e0e8ff', fontSize: 12, fontFamily: 'sans-serif',
              appearance: 'none', cursor: 'pointer',
            }}
          >
            <option value="">All Countries</option>
            {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>

          <select
            value={selectedEra ?? ''}
            onChange={e => onSelectEra(e.target.value || null)}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8, padding: '8px 10px',
              color: '#e0e8ff', fontSize: 12, fontFamily: 'sans-serif',
              appearance: 'none', cursor: 'pointer',
            }}
          >
            <option value="">All Eras</option>
            {ERAS.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
          </select>
        </div>
      </header>

      {/* Timeline body */}
      <main style={{ position: 'relative', padding: '24px 16px 48px' }}>
        {/* Central spine */}
        <div style={{
          position: 'absolute', left: '50%', top: 0, bottom: 0,
          width: 1, transform: 'translateX(-50%)',
          background: 'linear-gradient(to bottom, transparent, #6060c0 15%, #6060c0 85%, transparent)',
          opacity: 0.3,
        }} />

        {sorted.map((item, i) => (
          <MobileCard
            key={item.mediaId}
            item={item}
            index={i}
            onSelect={() => onMediaSelect(item)}
          />
        ))}

        {sorted.length === 0 && (
          <div style={{
            textAlign: 'center', paddingTop: 80,
            color: 'rgba(160,175,220,0.4)', fontFamily: 'sans-serif', fontSize: 14,
          }}>
            Select a country or era to explore media
          </div>
        )}
      </main>
    </div>
  );
}
