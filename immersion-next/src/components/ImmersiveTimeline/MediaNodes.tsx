'use client';

import { useState, useMemo } from 'react';
import * as THREE from 'three';
import MediaNode      from './MediaNode';
import ConnectionLines from './ConnectionLines';
import { COUNTRY_TERRAINS, ERA_TERRAINS, DEFAULT_TERRAIN, computeTerrainHeight } from '@/data/terrainConfigs';
import type { MediaItem } from '@/types/media';

// Cap visible nodes to avoid performance cliff with many results
const MAX_NODES = 30;

interface MediaNodesProps {
  items:       MediaItem[];
  country:     string | null;
  era:         string | null;
  onNodeClick: (item: MediaItem) => void;
}

/**
 * Fibonacci sphere / golden-angle spiral spread across the terrain.
 * Nodes float 2.5–4.5 units above the terrain surface.
 */
function buildPositions(items: MediaItem[], country: string | null, era: string | null): THREE.Vector3[] {
  const config = country
    ? (COUNTRY_TERRAINS[country] ?? DEFAULT_TERRAIN)
    : era
    ? (ERA_TERRAINS[era]     ?? DEFAULT_TERRAIN)
    : DEFAULT_TERRAIN;

  const terrainW = config.scale[0] * 0.38; // stay within ~38% of terrain radius
  const terrainD = config.scale[2] * 0.38;

  const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5°

  return items.map((_, i) => {
    // Fibonacci spiral — avoids clustering at centre
    const r     = Math.sqrt((i + 0.5) / items.length);  // 0→1
    const theta = goldenAngle * i;

    const wx = Math.cos(theta) * r * terrainW;
    const wz = Math.sin(theta) * r * terrainD;
    const wy = computeTerrainHeight(wx, wz, config) + 2.8 + (i % 3) * 0.4;

    return new THREE.Vector3(wx, wy, wz);
  });
}

export default function MediaNodes({ items, country, era, onNodeClick }: MediaNodesProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Sort chronologically then cap
  const displayItems = useMemo(() =>
    [...items]
      .sort((a, b) => a.startYear - b.startYear)
      .slice(0, MAX_NODES),
    [items]
  );

  const positions = useMemo(
    () => buildPositions(displayItems, country, era),
    [displayItems, country, era]
  );

  if (displayItems.length === 0) return null;

  return (
    <group>
      <ConnectionLines items={displayItems} positions={positions} hoveredId={hoveredId} />

      {displayItems.map((item, i) => (
        <MediaNode
          key={item.mediaId}
          item={item}
          position={positions[i]}
          isHovered={hoveredId === item.mediaId}
          onHover={() => setHoveredId(item.mediaId)}
          onUnhover={() => setHoveredId(null)}
          onClick={() => onNodeClick(item)}
        />
      ))}
    </group>
  );
}
