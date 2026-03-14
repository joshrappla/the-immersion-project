'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface StarFieldProps {
  count?: number;
  radius?: number;
  twinkleSpeed?: number;
}

export default function StarField({ count = 2000, radius = 400, twinkleSpeed = 0.8 }: StarFieldProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  const { positions, sizes, phases } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Distribute stars in upper hemisphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.9 - 0.05); // Mostly upper hemisphere
      const r = radius * (0.7 + Math.random() * 0.3);

      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      sizes[i] = 0.5 + Math.random() * 2.5;
      phases[i] = Math.random() * Math.PI * 2;
    }

    return { positions, sizes, phases };
  }, [count, radius]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes.slice(), 1));
    return geo;
  }, [positions, sizes]);

  const material = useMemo(() => new THREE.PointsMaterial({
    color: new THREE.Color('#e8f0ff'),
    size: 1.5,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.85,
    vertexColors: false,
  }), []);

  useFrame((_, delta) => {
    timeRef.current += delta * twinkleSpeed;
    if (!pointsRef.current) return;

    const sizesAttr = pointsRef.current.geometry.attributes.size as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      const twinkle = 0.6 + 0.4 * Math.sin(timeRef.current + phases[i]);
      sizesAttr.array[i] = sizes[i] * twinkle;
    }
    sizesAttr.needsUpdate = true;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}
