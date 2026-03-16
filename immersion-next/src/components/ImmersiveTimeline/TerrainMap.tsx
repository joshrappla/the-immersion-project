'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

import OceanPlane        from './OceanPlane';
import TerrainMesh       from './TerrainMesh';
import TerrainAtmosphere from './TerrainAtmosphere';
import EdgeFog           from './EdgeFog';
import TerrainFeatures   from './TerrainFeatures';

import {
  COUNTRY_TERRAINS,
  ERA_TERRAINS,
  DEFAULT_TERRAIN,
  computeTerrainHeight,
  type TerrainConfig,
} from '@/data/terrainConfigs';
import { COUNTRY_FEATURES } from '@/data/countryFeatures';
import type { TerrainFeature } from '@/data/countryFeatures';

// Map country code → tree colour for biome feel
const TREE_COLORS: Record<string, string> = {
  JP: '#3d8060',  // lush green-teal (bamboo / cedar)
  IT: '#5a7a30',  // Tuscan olive
  GB: '#2e6b2e',  // British racing green
  GR: '#7a9030',  // Mediterranean dry green
  NO: '#1a5530',  // dark pine
  US: '#4a8040',
  DE: '#2d6040',
  FR: '#4a7a30',
  EG: '#6a8020',  // arid scrub
  CN: '#3a7030',
  IN: '#5a9020',
  RU: '#2a5030',
  TR: '#7a8030',
};

interface TerrainMapProps {
  visible: boolean;
  country: string | null;
  era: string | null;
  onTerrainReady?: () => void;
}

export default function TerrainMap({ visible, country, era, onTerrainReady }: TerrainMapProps) {
  const groupRef  = useRef<THREE.Group>(null);
  const fadeRef   = useRef({ opacity: 0 });

  // Select the right terrain config
  const terrainConfig: TerrainConfig = useMemo(() => {
    if (country && COUNTRY_TERRAINS[country]) return COUNTRY_TERRAINS[country];
    if (era    && ERA_TERRAINS[era])          return ERA_TERRAINS[era];
    return DEFAULT_TERRAIN;
  }, [country, era]);

  // Feature set for the current selection
  const features: TerrainFeature[] = useMemo(() => {
    if (country && COUNTRY_FEATURES[country]) return COUNTRY_FEATURES[country];
    return [];
  }, [country]);

  // HTML landmark labels (only landmarks — forests/cities are 3D meshes)
  const landmarks = useMemo(
    () => features.filter(f => f.type === 'landmark'),
    [features]
  );

  // Notify parent when terrain is ready
  useEffect(() => {
    if (visible) onTerrainReady?.();
  }, [visible, onTerrainReady]);

  // Fade in/out the whole group
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const target  = visible ? 1 : 0;
    fadeRef.current.opacity = THREE.MathUtils.lerp(
      fadeRef.current.opacity,
      target,
      delta * 1.8,
    );
    groupRef.current.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        const mat = (obj as THREE.Mesh).material;
        if (mat && 'opacity' in mat) {
          (mat as THREE.Material).transparent = true;
          (mat as THREE.Material & { opacity: number }).opacity = fadeRef.current.opacity;
        }
      }
    });
  });

  if (!visible && fadeRef.current.opacity < 0.01) return null;

  return (
    <group ref={groupRef}>
      {/* Ocean / sea plane beneath and around terrain */}
      <OceanPlane waterColor={terrainConfig.colors.water} />

      {/* Main landmass */}
      <TerrainMesh config={terrainConfig} />

      {/* Per-country atmosphere: fog + lighting */}
      <TerrainAtmosphere config={terrainConfig} />

      {/* Soft fog walls at map edges */}
      <EdgeFog
        fogColor={terrainConfig.atmosphere.fogColor}
        radius={terrainConfig.scale[0] * 0.9}
        height={terrainConfig.scale[1] * 1.4}
      />

      {/* 3D feature geometry: trees + buildings */}
      <TerrainFeatures
        features={features}
        config={terrainConfig}
        treeColor={country ? (TREE_COLORS[country] ?? '#2d7a2d') : '#2d7a2d'}
      />

      {/* HTML landmark labels floating above terrain */}
      {landmarks.map((lm, i) => {
        const [lx, , lz] = lm.position;
        const ly = computeTerrainHeight(lx, lz, terrainConfig) + 4;
        return (
          <Html
            key={i}
            position={[lx, ly, lz]}
            center
            distanceFactor={40}
            zIndexRange={[0, 10]}
          >
            <div
              style={{
                background: 'rgba(0,0,0,0.55)',
                color: '#fff',
                padding: '3px 8px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                fontFamily: 'sans-serif',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              {lm.icon} {lm.name}
            </div>
          </Html>
        );
      })}

      {/* City name labels */}
      {features
        .filter(f => f.type === 'city' && f.name)
        .map((city, i) => {
          const [cx, , cz] = city.position;
          const cy = computeTerrainHeight(cx, cz, terrainConfig) + 3.5;
          return (
            <Html
              key={`city-${i}`}
              position={[cx, cy, cz]}
              center
              distanceFactor={30}
              zIndexRange={[0, 10]}
            >
              <div
                style={{
                  background: 'rgba(10,15,30,0.65)',
                  color: '#e8e8ff',
                  padding: '2px 7px',
                  borderRadius: 5,
                  fontSize: 10,
                  fontFamily: 'sans-serif',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  border: '1px solid rgba(160,180,255,0.25)',
                }}
              >
                {city.icon && <span style={{ marginRight: 3 }}>{city.icon}</span>}
                {city.name}
              </div>
            </Html>
          );
        })}
    </group>
  );
}
