'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import MediaCard from './MediaCard';
import { mediaTypeColor } from '@/types/media';
import type { MediaItem } from '@/types/media';

interface MediaNodeProps {
  item:      MediaItem;
  position:  THREE.Vector3;
  isHovered: boolean;
  onHover:   () => void;
  onUnhover: () => void;
  onClick:   () => void;
}

export default function MediaNode({
  item,
  position,
  isHovered,
  onHover,
  onUnhover,
  onClick,
}: MediaNodeProps) {
  const groupRef    = useRef<THREE.Group>(null);
  const glowRef     = useRef<THREE.Mesh>(null);
  const ringRef     = useRef<THREE.Mesh>(null);
  const coreMatRef  = useRef<THREE.MeshStandardMaterial>(null);
  const glowMatRef  = useRef<THREE.MeshBasicMaterial>(null);

  const color = mediaTypeColor(item.mediaType);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    // Gentle float
    groupRef.current.position.y =
      position.y + Math.sin(t * 1.8 + position.x * 0.4) * 0.12;

    // Pulsing glow scale
    if (glowRef.current) {
      const pulse = isHovered
        ? 1.55 + Math.sin(t * 6) * 0.05
        : 1.0  + Math.sin(t * 2.5) * 0.08;
      glowRef.current.scale.setScalar(pulse);
    }

    // Glow opacity
    if (glowMatRef.current) {
      glowMatRef.current.opacity = isHovered
        ? 0.50 + Math.sin(t * 5) * 0.05
        : 0.18 + Math.sin(t * 2) * 0.04;
    }

    // Core emissive intensity
    if (coreMatRef.current) {
      coreMatRef.current.emissiveIntensity = isHovered
        ? 2.5 + Math.sin(t * 6) * 0.3
        : 0.9 + Math.sin(t * 2.5) * 0.15;
    }

    // Rotating ring
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * (isHovered ? 2.0 : 0.6);
      ringRef.current.rotation.x = Math.sin(t * 0.8) * 0.3;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        onUnhover();
        document.body.style.cursor = 'default';
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Core sphere */}
      <mesh>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshStandardMaterial
          ref={coreMatRef}
          color={color}
          emissive={color}
          emissiveIntensity={0.9}
          metalness={0.6}
          roughness={0.25}
        />
      </mesh>

      {/* Outer glow — BackSide sphere, pulses in useFrame */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.48, 16, 16]} />
        <meshBasicMaterial
          ref={glowMatRef}
          color={color}
          transparent
          opacity={0.18}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Rotating ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.45, 0.56, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isHovered ? 0.75 : 0.28}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Point light for bloom/glow when hovered */}
      {isHovered && (
        <pointLight color={color} intensity={2.5} distance={6} decay={2} />
      )}

      {/* Year label — always visible */}
      <Html position={[0, -0.7, 0]} center distanceFactor={25} zIndexRange={[0, 5]}>
        <span style={{
          color: 'rgba(200,210,240,0.65)',
          fontSize: 9,
          fontFamily: 'monospace',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
          textShadow: '0 1px 3px rgba(0,0,0,0.8)',
        }}>
          {item.startYear}
        </span>
      </Html>

      {/* Hover card */}
      {isHovered && (
        <Html
          position={[0, 1.6, 0]}
          center
          distanceFactor={22}
          zIndexRange={[10, 20]}
          style={{ pointerEvents: 'none' }}
        >
          <MediaCard item={item} color={color} />
        </Html>
      )}
    </group>
  );
}
