'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { TerrainConfig } from '@/data/terrainConfigs';

interface TerrainAtmosphereProps {
  config: TerrainConfig;
}

export default function TerrainAtmosphere({ config }: TerrainAtmosphereProps) {
  const { scene } = useThree();
  const { atmosphere } = config;

  useEffect(() => {
    scene.fog = new THREE.FogExp2(
      new THREE.Color(atmosphere.fogColor).getHex(),
      atmosphere.fogDensity,
    );
    return () => { scene.fog = null; };
  }, [scene, atmosphere.fogColor, atmosphere.fogDensity]);

  return (
    <>
      {/* Warm ambient fill */}
      <ambientLight color={atmosphere.ambientColor} intensity={0.55} />

      {/* Main sun directional light */}
      <directionalLight
        color={atmosphere.sunColor}
        intensity={1.1}
        position={atmosphere.sunPosition}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={300}
        shadow-camera-near={1}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />

      {/* Sky hemisphere — sky above, ground bounce below */}
      <hemisphereLight
        args={[atmosphere.fogColor, '#1a2a1a', 0.35]}
        position={[0, 60, 0]}
      />
    </>
  );
}
