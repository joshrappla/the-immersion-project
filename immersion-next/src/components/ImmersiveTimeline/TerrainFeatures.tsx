'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { computeTerrainHeight } from '@/data/terrainConfigs';
import type { TerrainConfig } from '@/data/terrainConfigs';
import type { TerrainFeature } from '@/data/countryFeatures';

// ── Stylised tree (conifer / pine) ────────────────────────────────────────────
function StylizedTree({
  position,
  scale = 1,
  treeColor = '#2d7a2d',
}: {
  position: [number, number, number];
  scale?: number;
  treeColor?: string;
}) {
  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.9, 5]} />
        <meshStandardMaterial color="#6b3a1f" roughness={0.9} />
      </mesh>
      {/* Lower foliage cone */}
      <mesh position={[0, 1.2, 0]}>
        <coneGeometry args={[0.55, 1.2, 6]} />
        <meshStandardMaterial color={treeColor} roughness={0.8} />
      </mesh>
      {/* Upper foliage cone */}
      <mesh position={[0, 2.0, 0]}>
        <coneGeometry args={[0.35, 1.0, 6]} />
        <meshStandardMaterial color={treeColor} roughness={0.8} />
      </mesh>
    </group>
  );
}

// ── Stylised building (house / castle / temple) ───────────────────────────────
function StylizedBuilding({
  position,
  scale = 1,
  type = 'house',
}: {
  position: [number, number, number];
  scale?: number;
  type?: 'house' | 'castle' | 'temple' | 'modern';
}) {
  const wallColors: Record<string, string> = {
    house:  '#d4b896',
    castle: '#909090',
    temple: '#f5f0e0',
    modern: '#6090b0',
  };
  const roofColors: Record<string, string> = {
    house:  '#8b2020',
    castle: '#606060',
    temple: '#c09020',
    modern: '#4070a0',
  };
  const wallColor = wallColors[type] ?? wallColors.house;
  const roofColor = roofColors[type] ?? roofColors.house;

  return (
    <group position={position} scale={scale}>
      {/* Base */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={wallColor} roughness={0.85} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 1.25, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.78, 0.6, 4]} />
        <meshStandardMaterial color={roofColor} roughness={0.8} />
      </mesh>
    </group>
  );
}

// ── Forest cluster ─────────────────────────────────────────────────────────────
function ForestCluster({
  feature,
  config,
  treeColor,
}: {
  feature: TerrainFeature;
  config: TerrainConfig;
  treeColor: string;
}) {
  const [fx, , fz] = feature.position;
  const count  = feature.count  ?? 12;
  const radius = feature.radius ?? 5;

  const trees = useMemo(() => {
    // Deterministic placement using sin/cos seeding
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + Math.sin(i * 2.7) * 0.8;
      const r     = radius * (0.2 + Math.abs(Math.sin(i * 1.3)) * 0.8);
      const tx    = fx + Math.cos(angle) * r;
      const tz    = fz + Math.sin(angle) * r;
      const ty    = computeTerrainHeight(tx, tz, config);
      const scale = 0.4 + Math.abs(Math.sin(i * 3.1)) * 0.35;
      return { tx, ty, tz, scale };
    });
  }, [fx, fz, count, radius, config]);

  return (
    <group>
      {trees.map((t, i) => (
        <StylizedTree
          key={i}
          position={[t.tx, t.ty, t.tz]}
          scale={t.scale}
          treeColor={treeColor}
        />
      ))}
    </group>
  );
}

// ── City cluster ───────────────────────────────────────────────────────────────
function CityCluster({
  feature,
  config,
}: {
  feature: TerrainFeature;
  config: TerrainConfig;
}) {
  const [fx, , fz] = feature.position;
  const count = feature.count ?? 6;

  const buildings = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + Math.sin(i * 1.9) * 0.6;
      const r     = 1.5 + Math.abs(Math.sin(i * 2.3)) * 2.5;
      const bx    = fx + Math.cos(angle) * r;
      const bz    = fz + Math.sin(angle) * r;
      const by    = computeTerrainHeight(bx, bz, config);
      const scale = 0.25 + Math.abs(Math.sin(i * 1.7)) * 0.35;
      const types = ['house', 'house', 'house', 'castle', 'temple'] as const;
      const type  = types[i % types.length];
      return { bx, by, bz, scale, type };
    });
  }, [fx, fz, count, config]);

  return (
    <group>
      {buildings.map((b, i) => (
        <StylizedBuilding
          key={i}
          position={[b.bx, b.by, b.bz]}
          scale={b.scale}
          type={b.type}
        />
      ))}
    </group>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
interface TerrainFeaturesProps {
  features: TerrainFeature[];
  config: TerrainConfig;
  treeColor?: string;
}

export default function TerrainFeatures({
  features,
  config,
  treeColor = '#2d6b2d',
}: TerrainFeaturesProps) {
  return (
    <group>
      {features.map((f, i) => {
        if (f.type === 'forest') {
          return (
            <ForestCluster key={i} feature={f} config={config} treeColor={treeColor} />
          );
        }
        if (f.type === 'city') {
          return <CityCluster key={i} feature={f} config={config} />;
        }
        // 'landmark' markers are rendered as HTML labels in TerrainMap
        return null;
      })}
    </group>
  );
}
