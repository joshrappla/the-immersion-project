'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';

// A large sphere with a custom shader gradient from deep night to dusk horizon
export default function DuskSky() {
  const { scene } = useThree();

  const skyMesh = useMemo(() => {
    const geometry = new THREE.SphereGeometry(500, 32, 16);

    // Flip normals inward
    geometry.scale(-1, 1, 1);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        topColor:    { value: new THREE.Color('#020510') },    // deep night blue
        midColor:    { value: new THREE.Color('#0a0e2a') },    // dark indigo
        horizonColor:{ value: new THREE.Color('#1a1040') },    // deep purple at horizon
        glowColor:   { value: new THREE.Color('#ff6030') },    // orange dusk glow
        groundColor: { value: new THREE.Color('#050208') },    // near-black ground
        exponent:    { value: 0.5 },
        glowPower:   { value: 3.5 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 horizonColor;
        uniform vec3 glowColor;
        uniform vec3 groundColor;
        uniform float exponent;
        uniform float glowPower;
        varying vec3 vWorldPosition;

        void main() {
          float h = normalize(vWorldPosition).y;

          // Base sky gradient
          vec3 sky;
          if (h > 0.0) {
            float t = pow(h, exponent);
            sky = mix(horizonColor, mix(midColor, topColor, t), t);
          } else {
            sky = groundColor;
          }

          // Dusk glow near horizon (orange band)
          float glowFactor = pow(max(0.0, 1.0 - abs(h) * glowPower), 4.0);
          sky = mix(sky, glowColor, glowFactor * 0.6);

          // Slight warm tint at very bottom of sky
          float warmFactor = pow(max(0.0, 0.15 - h), 2.0) * 20.0;
          sky = mix(sky, vec3(0.4, 0.15, 0.05), clamp(warmFactor, 0.0, 0.4));

          gl_FragColor = vec4(sky, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });

    return new THREE.Mesh(geometry, material);
  }, []);

  // Set scene background to match sky top color
  scene.background = new THREE.Color('#020510');

  return <primitive object={skyMesh} />;
}
