'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface OceanPlaneProps {
  waterColor?: string;
  size?: number;
}

export default function OceanPlane({ waterColor = '#1a5f7a', size = 220 }: OceanPlaneProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      time:       { value: 0 },
      waterColor: { value: new THREE.Color(waterColor) },
      foamColor:  { value: new THREE.Color('#a8d8ea') },
      deepColor:  { value: new THREE.Color('#0a2a40') },
    },
    vertexShader: `
      uniform float time;
      varying vec2 vUv;
      varying float vWave;
      varying float vDist;

      void main() {
        vUv = uv;
        vec3 pos = position;

        // Small ripple waves
        float wave1 = sin(pos.x * 0.4 + time * 1.2) * cos(pos.z * 0.4 + time * 0.8) * 0.25;
        float wave2 = sin(pos.x * 0.8 + time * 0.9 + 1.0) * cos(pos.z * 0.7 + time * 1.1) * 0.12;
        pos.y += wave1 + wave2;
        vWave = wave1 + wave2;

        // Distance from center for depth fade
        vDist = length(uv - 0.5) * 2.0;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 waterColor;
      uniform vec3 foamColor;
      uniform vec3 deepColor;
      uniform float time;
      varying vec2 vUv;
      varying float vWave;
      varying float vDist;

      void main() {
        // Blend surface → deep based on distance from center
        vec3 col = mix(waterColor, deepColor, smoothstep(0.4, 1.0, vDist));

        // Animated shimmer
        float shimmer = sin(vUv.x * 20.0 + time * 2.0) * sin(vUv.y * 20.0 + time * 1.5);
        col += shimmer * 0.04;

        // Wave crest highlights
        float crest = smoothstep(0.1, 0.25, vWave);
        col = mix(col, foamColor, crest * 0.25);

        // Fade alpha at edges
        float alpha = 1.0 - smoothstep(0.75, 1.0, vDist);

        gl_FragColor = vec4(col, alpha * 0.92);
      }
    `,
    transparent: true,
    side: THREE.FrontSide,
    depthWrite: false,
  }), [waterColor]);

  useFrame((state) => {
    if (!meshRef.current) return;
    (meshRef.current.material as THREE.ShaderMaterial).uniforms.time.value =
      state.clock.elapsedTime * 0.5;
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.4, 0]}
      material={material}
      receiveShadow
    >
      <planeGeometry args={[size, size, 80, 80]} />
    </mesh>
  );
}
