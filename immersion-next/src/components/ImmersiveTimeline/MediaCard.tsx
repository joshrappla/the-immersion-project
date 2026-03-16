'use client';

import { useEffect, useState } from 'react';
import { mediaTypeIcon } from '@/types/media';
import type { MediaItem } from '@/types/media';

interface MediaCardProps {
  item: MediaItem;
  color: string;
}

export default function MediaCard({ item, color }: MediaCardProps) {
  // Mount-triggered CSS transition for smooth pop-in
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const icon = mediaTypeIcon(item.mediaType);
  const year = item.startYear === item.endYear
    ? String(item.startYear)
    : `${item.startYear}–${item.endYear}`;

  return (
    <div
      style={{
        width: 220,
        background: 'rgba(5,8,20,0.92)',
        backdropFilter: 'blur(12px)',
        borderRadius: 12,
        border: `1px solid ${color}40`,
        boxShadow: `0 0 24px ${color}30, 0 8px 32px rgba(0,0,0,0.6)`,
        overflow: 'hidden',
        transform: visible ? 'scale(1) translateY(0)' : 'scale(0.85) translateY(8px)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.18s ease-out, opacity 0.18s ease-out',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {/* Thumbnail */}
      {item.imageUrl && (
        <div style={{ height: 100, overflow: 'hidden', position: 'relative' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.imageUrl}
            alt={item.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(5,8,20,0.9) 0%, transparent 60%)',
          }} />
        </div>
      )}

      <div style={{ padding: '10px 12px 12px' }}>
        {/* Type badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <span style={{
            fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase',
            color: color, fontFamily: 'sans-serif', fontWeight: 700,
          }}>
            {item.mediaType}
          </span>
        </div>

        {/* Title */}
        <div style={{
          fontSize: 13, fontWeight: 700, color: '#f0f4ff',
          fontFamily: 'sans-serif', marginBottom: 4,
          lineHeight: 1.3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {item.title}
        </div>

        {/* Year · Era */}
        <div style={{
          fontSize: 11, color: 'rgba(180,190,220,0.7)',
          fontFamily: 'sans-serif', marginBottom: 6,
        }}>
          {year}
          {item.timePeriod && (
            <span style={{ color: 'rgba(180,190,220,0.4)', margin: '0 5px' }}>·</span>
          )}
          {item.timePeriod}
        </div>

        {/* Description preview */}
        {item.description && (
          <div style={{
            fontSize: 10, color: 'rgba(180,190,220,0.55)',
            fontFamily: 'sans-serif', lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {item.description}
          </div>
        )}

        {/* Click hint */}
        <div style={{
          marginTop: 8, fontSize: 9, color: `${color}80`,
          fontFamily: 'sans-serif', letterSpacing: '0.08em',
        }}>
          Click to explore →
        </div>
      </div>
    </div>
  );
}
