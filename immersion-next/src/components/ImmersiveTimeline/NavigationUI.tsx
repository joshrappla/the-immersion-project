'use client';

import { useState, useEffect } from 'react';
import { getCountryBackground }  from '@/data/countryBackgrounds';
import type { MediaItem }        from '@/types/media';
import { MEDIA_TYPE_COLORS }     from '@/types/media';

interface NavigationUIProps {
  phase:           'sky' | 'descending' | 'landed';
  selectedCountry: string | null;
  selectedEra:     string | null;
  mediaItems:      MediaItem[];
}

export default function NavigationUI({
  phase,
  selectedCountry,
  selectedEra,
  mediaItems,
}: NavigationUIProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (phase === 'landed') {
      const id = setTimeout(() => setVisible(true), 350);
      return () => clearTimeout(id);
    } else {
      setVisible(false);
    }
  }, [phase]);

  if (phase !== 'landed') return null;

  // Build per-type counts
  const typeCounts: Record<string, number> = {};
  for (const item of mediaItems) {
    const t = item.mediaType.toLowerCase();
    typeCounts[t] = (typeCounts[t] ?? 0) + 1;
  }

  const countryBg   = selectedCountry ? getCountryBackground(selectedCountry) : null;
  const label       = countryBg?.name ?? selectedEra ?? 'World';
  const nativeName  = countryBg?.nativeName;
  const flag        = countryBg?.flag ?? '';
  const accentColor = countryBg?.accentColor ?? '#6080c0';

  return (
    <div style={{
      position: 'fixed', top: 88, left: 16, zIndex: 30,
      transform: visible ? 'translateX(0)' : 'translateX(-24px)',
      opacity:   visible ? 1 : 0,
      transition: 'transform 0.4s ease-out, opacity 0.4s ease-out',
    }}>
      {/* Exploration breadcrumb */}
      <div style={{
        background: 'rgba(2,4,16,0.70)', backdropFilter: 'blur(8px)',
        borderRadius: 10, padding: '8px 12px',
        border: `1px solid ${accentColor}30`,
        marginBottom: 8,
      }}>
        <div style={{
          color: 'rgba(160,175,210,0.5)', fontSize: 9,
          fontFamily: 'sans-serif', letterSpacing: '0.12em',
          textTransform: 'uppercase', marginBottom: 3,
        }}>
          Exploring
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {flag && <span style={{ fontSize: 18, lineHeight: 1 }}>{flag}</span>}
          <div>
            <div style={{
              color: '#eef2ff', fontFamily: 'sans-serif',
              fontWeight: 700, fontSize: 14, lineHeight: 1.2,
            }}>
              {label}
            </div>
            {nativeName && nativeName !== label && (
              <div style={{
                color: `${accentColor}c0`, fontSize: 10,
                fontFamily: 'sans-serif',
              }}>
                {nativeName}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Media type breakdown */}
      {mediaItems.length > 0 && (
        <div style={{
          background: 'rgba(2,4,16,0.65)', backdropFilter: 'blur(8px)',
          borderRadius: 10, padding: '8px 12px',
          border: '1px solid rgba(255,255,255,0.07)',
        }}>
          <div style={{
            color: 'rgba(160,175,210,0.5)', fontSize: 9,
            fontFamily: 'sans-serif', letterSpacing: '0.12em',
            textTransform: 'uppercase', marginBottom: 5,
          }}>
            {mediaItems.length} Media Node{mediaItems.length !== 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {Object.entries(typeCounts).map(([type, count]) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: MEDIA_TYPE_COLORS[type] ?? '#94a3b8',
                  flexShrink: 0,
                }} />
                <span style={{
                  color: 'rgba(200,210,240,0.7)', fontSize: 11,
                  fontFamily: 'sans-serif', textTransform: 'capitalize',
                }}>
                  {type}
                </span>
                <span style={{
                  color: 'rgba(160,175,210,0.45)', fontSize: 11,
                  fontFamily: 'sans-serif', marginLeft: 'auto',
                }}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
