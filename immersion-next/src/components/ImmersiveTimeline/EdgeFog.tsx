'use client';

import * as THREE from 'three';

interface EdgeFogProps {
  fogColor?: string;
  radius?: number;
  height?: number;
  opacity?: number;
}

export default function EdgeFog({
  fogColor = '#b0c4de',
  radius  = 50,
  height  = 18,
  opacity = 0.55,
}: EdgeFogProps) {
  const color = new THREE.Color(fogColor);

  // 8 fog panels around the perimeter
  const panels = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    return {
      x:   Math.sin(angle) * radius,
      z:   Math.cos(angle) * radius,
      rot: -angle,
    };
  });

  return (
    <group>
      {panels.map((p, i) => (
        <mesh
          key={i}
          position={[p.x, height * 0.3, p.z]}
          rotation={[0, p.rot, 0]}
        >
          <planeGeometry args={[radius * 1.6, height]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={opacity}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
