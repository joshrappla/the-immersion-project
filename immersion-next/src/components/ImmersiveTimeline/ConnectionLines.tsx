'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import AnimatedLine from './AnimatedLine';
import type { MediaItem } from '@/types/media';

interface Connection {
  from:     number;
  to:       number;
  type:     'chronological' | 'thematic' | 'geographic';
  strength: number;
}

const LINE_COLORS = {
  chronological: '#c0c8d8',   // soft silver-white
  thematic:      '#fbbf24',   // amber
  geographic:    '#60a5fa',   // blue
};

const LINE_OPACITY = {
  chronological: 0.28,
  thematic:      0.22,
  geographic:    0.18,
};

// Limit per-item connections to avoid O(n²) explosion
const MAX_THEMATIC_PER_ITEM  = 3;
const MAX_GEOGRAPHIC_PER_ITEM = 2;

interface ConnectionLinesProps {
  items:     MediaItem[];
  positions: THREE.Vector3[];
  hoveredId: string | null;
}

export default function ConnectionLines({
  items,
  positions,
  hoveredId,
}: ConnectionLinesProps) {
  const connections = useMemo<Connection[]>(() => {
    const conns: Connection[] = [];
    if (items.length < 2) return conns;

    // ── Chronological: sequential by startYear ──────────────────────────
    const byYear = [...items.map((item, i) => ({ item, i }))]
      .sort((a, b) => a.item.startYear - b.item.startYear);

    for (let k = 0; k < byYear.length - 1; k++) {
      conns.push({
        from:     byYear[k].i,
        to:       byYear[k + 1].i,
        type:     'chronological',
        strength: 1.0,
      });
    }

    // ── Thematic: same timePeriod ────────────────────────────────────────
    const thematicCount = new Array(items.length).fill(0);
    for (let a = 0; a < items.length; a++) {
      for (let b = a + 1; b < items.length; b++) {
        if (
          items[a].timePeriod === items[b].timePeriod &&
          thematicCount[a] < MAX_THEMATIC_PER_ITEM &&
          thematicCount[b] < MAX_THEMATIC_PER_ITEM
        ) {
          conns.push({ from: a, to: b, type: 'thematic', strength: 0.6 });
          thematicCount[a]++;
          thematicCount[b]++;
        }
      }
    }

    // ── Geographic: shared countryCodes ─────────────────────────────────
    const geoCount = new Array(items.length).fill(0);
    for (let a = 0; a < items.length; a++) {
      for (let b = a + 1; b < items.length; b++) {
        const aC = items[a].countryCodes ?? [];
        const bC = items[b].countryCodes ?? [];
        const shared = aC.filter(c => bC.includes(c));
        if (
          shared.length > 0 &&
          geoCount[a] < MAX_GEOGRAPHIC_PER_ITEM &&
          geoCount[b] < MAX_GEOGRAPHIC_PER_ITEM
        ) {
          conns.push({ from: a, to: b, type: 'geographic', strength: 0.4 });
          geoCount[a]++;
          geoCount[b]++;
        }
      }
    }

    return conns;
  }, [items]);

  return (
    <group>
      {connections.map((c, i) => {
        const fromPos = positions[c.from];
        const toPos   = positions[c.to];
        if (!fromPos || !toPos) return null;

        const isHighlighted =
          hoveredId === items[c.from]?.mediaId ||
          hoveredId === items[c.to]?.mediaId;

        return (
          <AnimatedLine
            key={i}
            start={fromPos}
            end={toPos}
            color={LINE_COLORS[c.type]}
            opacity={LINE_OPACITY[c.type] * c.strength}
            isHighlighted={isHighlighted}
            speed={c.type === 'chronological' ? 0.8 : 0.4}
          />
        );
      })}
    </group>
  );
}
