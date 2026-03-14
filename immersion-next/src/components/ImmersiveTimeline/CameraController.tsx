'use client';

import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';

// Country/era-specific camera landing positions
const LANDING_POSITIONS: Record<string, { x: number; y: number; z: number; lookAt: [number, number, number] }> = {
  JP: { x:  80, y: 20, z:  80, lookAt: [0, 0, 0] },
  IT: { x: -60, y: 18, z:  90, lookAt: [0, 0, 0] },
  GB: { x: -90, y: 22, z:  50, lookAt: [0, 0, 0] },
  US: { x:  50, y: 16, z: -80, lookAt: [0, 0, 0] },
  GR: { x:  70, y: 20, z: -70, lookAt: [0, 0, 0] },
  NO: { x: -70, y: 25, z: -60, lookAt: [0, 0, 0] },
  DE: { x: -50, y: 18, z:  70, lookAt: [0, 0, 0] },
  FR: { x: -40, y: 18, z:  80, lookAt: [0, 0, 0] },
  EG: { x:  60, y: 15, z:  60, lookAt: [0, 0, 0] },
  CN: { x:  90, y: 22, z: -50, lookAt: [0, 0, 0] },
  IN: { x:  80, y: 18, z:  40, lookAt: [0, 0, 0] },
  RU: { x: -80, y: 30, z: -40, lookAt: [0, 0, 0] },
  TR: { x:  40, y: 18, z: -80, lookAt: [0, 0, 0] },
};

const DEFAULT_LANDING = { x: 0, y: 20, z: 100, lookAt: [0, 0, 0] as [number, number, number] };

// Start high above, looking down
const START_POS   = { x: 0, y: 350, z: 0 };
const ORBITAL_POS = { x: 0, y: 120, z: 160 };

interface CameraControllerProps {
  selectedCountry: string | null;
  phase: 'sky' | 'descending' | 'landed';
  onLanded?: () => void;
}

export default function CameraController({ selectedCountry, phase, onLanded }: CameraControllerProps) {
  const { camera } = useThree();
  const targetRef  = useRef(new THREE.Vector3(0, 0, 0));
  const tweenRef   = useRef<gsap.core.Timeline | null>(null);
  const orbAngle   = useRef(0);

  // Initial camera setup
  useEffect(() => {
    camera.position.set(START_POS.x, START_POS.y, START_POS.z);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  // Sky → orbital drift
  useEffect(() => {
    if (phase !== 'sky') return;

    tweenRef.current?.kill();
    tweenRef.current = gsap.timeline()
      .to(camera.position, {
        x: ORBITAL_POS.x,
        y: ORBITAL_POS.y,
        z: ORBITAL_POS.z,
        duration: 3.5,
        ease: 'power2.inOut',
        onUpdate: () => camera.lookAt(0, 5, 0),
      });
  }, [camera, phase]);

  // Sky → descending → landed
  useEffect(() => {
    if (phase !== 'descending' || !selectedCountry) return;

    const landing = LANDING_POSITIONS[selectedCountry] ?? DEFAULT_LANDING;
    tweenRef.current?.kill();

    // Intermediate sweep point for cinematic arc
    const sweepPos = {
      x: landing.x * 0.4,
      y: 80,
      z: landing.z * 0.4,
    };

    tweenRef.current = gsap.timeline({
      onComplete: () => onLanded?.(),
    })
      // Swoop up first for drama
      .to(camera.position, {
        x: sweepPos.x,
        y: sweepPos.y,
        z: sweepPos.z,
        duration: 2.0,
        ease: 'power3.in',
        onUpdate: () => camera.lookAt(0, 10, 0),
      })
      // Then dive down to landing position
      .to(camera.position, {
        x: landing.x,
        y: landing.y,
        z: landing.z,
        duration: 2.5,
        ease: 'power2.out',
        onUpdate: () => {
          targetRef.current.lerp(new THREE.Vector3(...landing.lookAt), 0.06);
          camera.lookAt(targetRef.current);
        },
      });
  }, [camera, phase, selectedCountry, onLanded]);

  // Slow orbital drift when in sky mode
  useFrame((_, delta) => {
    if (phase !== 'sky') return;
    orbAngle.current += delta * 0.06;
    const r = 160;
    camera.position.x = Math.sin(orbAngle.current) * r;
    camera.position.z = Math.cos(orbAngle.current) * r;
    camera.position.y = 120 + Math.sin(orbAngle.current * 0.5) * 15;
    camera.lookAt(0, 5, 0);
  });

  return null;
}
