'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CloudLayerProps {
  altitude?: number;
  opacity?: number;
  count?: number;
  driftSpeed?: number;
}

export default function CloudLayer({
  altitude = 60,
  opacity = 0.18,
  count = 28,
  driftSpeed = 0.4,
}: CloudLayerProps) {
  const groupRef = useRef<THREE.Group>(null);

  const clouds = useMemo(() => {
    const items: { x: number; y: number; z: number; scale: number; rot: number; speed: number }[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
      const r = 80 + Math.random() * 140;
      items.push({
        x: Math.cos(angle) * r,
        y: altitude + (Math.random() - 0.5) * 20,
        z: Math.sin(angle) * r,
        scale: 20 + Math.random() * 35,
        rot: Math.random() * Math.PI * 2,
        speed: (0.5 + Math.random()) * driftSpeed,
      });
    }
    return items;
  }, [count, altitude, driftSpeed]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      child.rotation.y += delta * (clouds[i]?.speed ?? 0.1) * 0.005;
    });
    groupRef.current.rotation.y += delta * 0.003;
  });

  return (
    <group ref={groupRef}>
      {clouds.map((c, i) => (
        <mesh key={i} position={[c.x, c.y, c.z]} rotation={[0, c.rot, 0]}>
          <planeGeometry args={[c.scale * 2.5, c.scale]} />
          <meshBasicMaterial
            color="#8090c0"
            transparent
            opacity={opacity * (0.5 + Math.random() * 0.5)}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
