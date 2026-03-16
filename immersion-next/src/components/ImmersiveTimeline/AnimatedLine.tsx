'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AnimatedLineProps {
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: string;
  opacity: number;
  isHighlighted: boolean;
  speed?: number;  // dashOffset animation speed
}

export default function AnimatedLine({
  start,
  end,
  color,
  opacity,
  isHighlighted,
  speed = 0.6,
}: AnimatedLineProps) {
  // Stable material ref so we can mutate opacity/dashOffset each frame
  const material = useMemo(() => new THREE.LineDashedMaterial({
    color:       new THREE.Color(color),
    transparent: true,
    opacity,
    dashSize:    0.35,
    gapSize:     0.18,
    linewidth:   1,
  }), [color, opacity]);

  // Arc geometry: raise midpoint for a subtle curve
  const lineObject = useMemo(() => {
    const mid = new THREE.Vector3()
      .addVectors(start, end)
      .multiplyScalar(0.5);
    mid.y += start.distanceTo(end) * 0.18 + 0.5;

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const pts   = curve.getPoints(48);
    const geo   = new THREE.BufferGeometry().setFromPoints(pts);
    const line  = new THREE.Line(geo, material);
    line.computeLineDistances();         // required for dashed rendering
    return line;
  }, [start, end, material]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mat = material as any;
  useFrame((_, delta) => {
    mat.dashOffset -= delta * speed;
    mat.opacity = isHighlighted
      ? Math.min(1, opacity * 2.8)
      : opacity;
  });

  return <primitive object={lineObject} />;
}
