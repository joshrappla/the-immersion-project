'use client';

import { useEffect, useState } from 'react';
import { mediaTypeIcon, mediaTypeColor } from '@/types/media';
import type { MediaItem } from '@/types/media';

interface MediaDetailModalProps {
  item:    MediaItem;
  onClose: () => void;
}

export default function MediaDetailModal({ item, onClose }: MediaDetailModalProps) {
  const [visible, setVisible] = useState(false);

  // Trigger CSS transition after mount
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const color    = mediaTypeColor(item.mediaType);
  const icon     = mediaTypeIcon(item.mediaType);
  const yearSpan = item.startYear === item.endYear
    ? String(item.startYear)
    : `${item.startYear} – ${item.endYear}`;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        opacity:    visible ? 1 : 0,
        transition: 'opacity 0.22s ease-out',
      }}
      onClick={onClose}
    >
      {/* Blurred backdrop */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(2,4,16,0.80)',
        backdropFilter: 'blur(6px)',
      }} />

      {/* Modal */}
      <div
        style={{
          position: 'relative', zIndex: 1,
          maxWidth: 560, width: '100%',
          background: 'linear-gradient(160deg, #0c0f1e 0%, #060810 100%)',
          borderRadius: 20,
          border: `1px solid ${color}35`,
          boxShadow: `0 0 60px ${color}25, 0 24px 80px rgba(0,0,0,0.7)`,
          overflow: 'hidden',
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(20px)',
          transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 14, zIndex: 10,
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#ccc', fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ✕
        </button>

        {/* Header image */}
        {item.imageUrl && (
          <div style={{ height: 200, position: 'relative', overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl}
              alt={item.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, #060810 0%, transparent 55%)',
            }} />
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '20px 24px 24px', marginTop: item.imageUrl ? -40 : 0, position: 'relative' }}>
          {/* Type + year badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 28 }}>{icon}</span>
            <span style={{
              padding: '3px 10px', borderRadius: 20,
              background: `${color}20`, border: `1px solid ${color}40`,
              color, fontSize: 11, fontFamily: 'sans-serif', fontWeight: 600,
            }}>
              {item.mediaType.toUpperCase()}
            </span>
            <span style={{
              padding: '3px 10px', borderRadius: 20,
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(200,210,240,0.7)', fontSize: 11, fontFamily: 'sans-serif',
            }}>
              {yearSpan}
            </span>
            {item.timePeriod && (
              <span style={{
                padding: '3px 10px', borderRadius: 20,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)',
                color: 'rgba(160,175,210,0.6)', fontSize: 11, fontFamily: 'sans-serif',
              }}>
                {item.timePeriod}
              </span>
            )}
          </div>

          {/* Title */}
          <h2 style={{
            fontSize: 24, fontWeight: 800, color: '#eef2ff',
            fontFamily: 'sans-serif', marginBottom: 12, lineHeight: 1.25,
          }}>
            {item.title}
          </h2>

          {/* Country codes */}
          {item.countryCodes && item.countryCodes.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {item.countryCodes.map(code => (
                <span
                  key={code}
                  style={{
                    padding: '2px 9px', borderRadius: 14,
                    background: 'rgba(96,165,250,0.12)',
                    border: '1px solid rgba(96,165,250,0.28)',
                    color: '#93c5fd', fontSize: 11, fontFamily: 'sans-serif',
                  }}
                >
                  {code}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {item.description && (
            <p style={{
              color: 'rgba(180,190,220,0.72)', fontSize: 13,
              fontFamily: 'sans-serif', lineHeight: 1.65, marginBottom: 20,
            }}>
              {item.description}
            </p>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            {item.streamingUrl && (
              <a
                href={item.streamingUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '10px 20px', borderRadius: 10,
                  background: color, color: '#000',
                  fontFamily: 'sans-serif', fontWeight: 700, fontSize: 13,
                  textDecoration: 'none', cursor: 'pointer',
                }}
              >
                Watch / Play →
              </a>
            )}
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px', borderRadius: 10,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(200,210,240,0.8)',
                fontFamily: 'sans-serif', fontWeight: 600, fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
