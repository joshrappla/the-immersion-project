'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { type TerrainConfig, computeTerrainHeight } from '@/data/terrainConfigs';

const SEGMENTS = 128;

interface TerrainMeshProps {
  config: TerrainConfig;
}

export default function TerrainMesh({ config }: TerrainMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // ---------- Geometry —— computed on CPU from terrain config ----------
  const geometry = useMemo(() => {
    const [width, , depth] = config.scale;
    const geo = new THREE.PlaneGeometry(width, depth, SEGMENTS, SEGMENTS);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position.array as Float32Array;
    // pos layout after rotateX: [x, y, z] where y=height, x/z are the plane coords
    for (let i = 0; i < pos.length; i += 3) {
      const wx = pos[i];
      const wz = pos[i + 2];
      pos[i + 1] = computeTerrainHeight(wx, wz, config);
    }

    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, [config]);

  // ---------- Shader material — Civ-style height-band coloring ----------
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uWater:    { value: new THREE.Color(config.colors.water)    },
      uLowland:  { value: new THREE.Color(config.colors.lowland)  },
      uMidland:  { value: new THREE.Color(config.colors.midland)  },
      uHighland: { value: new THREE.Color(config.colors.highland) },
      uPeak:     { value: new THREE.Color(config.colors.peak)     },
      uMaxH:     { value: config.scale[1]                         },
      uTime:     { value: 0                                       },
    },
    vertexShader: `
      varying float vHeight;
      varying vec3  vNormal;
      varying vec3  vWorldPos;
      varying vec2  vUv;

      void main() {
        vHeight   = position.y;
        vNormal   = normalize(normalMatrix * normal);
        vUv       = uv;
        vec4 wp   = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3  uWater;
      uniform vec3  uLowland;
      uniform vec3  uMidland;
      uniform vec3  uHighland;
      uniform vec3  uPeak;
      uniform float uMaxH;
      uniform float uTime;

      varying float vHeight;
      varying vec3  vNormal;
      varying vec3  vWorldPos;
      varying vec2  vUv;

      // Simple 2D hash for micro-detail noise
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      float smoothNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      void main() {
        float h = clamp(vHeight / uMaxH, 0.0, 1.0);

        // Smooth height-band colour ramp
        vec3 col;
        if (h < 0.08) {
          col = mix(uWater,    uLowland,  h / 0.08);
        } else if (h < 0.35) {
          col = mix(uLowland,  uMidland,  (h - 0.08) / 0.27);
        } else if (h < 0.65) {
          col = mix(uMidland,  uHighland, (h - 0.35) / 0.30);
        } else {
          col = mix(uHighland, uPeak,     (h - 0.65) / 0.35);
        }

        // Micro detail noise to break up flat bands
        float detail = smoothNoise(vWorldPos.xz * 0.6) * 0.08 - 0.04;
        col += detail;

        // Diffuse lighting (sun at 45°)
        vec3 lightDir = normalize(vec3(0.6, 1.0, 0.5));
        float diff    = max(dot(vNormal, lightDir), 0.0);
        float ambient = 0.38;
        col *= ambient + diff * 0.62;

        // Civ-style slope darkening (steeper = darker)
        float slope = 1.0 - abs(dot(vNormal, vec3(0.0, 1.0, 0.0)));
        col *= 1.0 - slope * 0.30;

        // Stylised contour lines (subtle)
        float contour = abs(fract(h * 18.0) - 0.5);
        col = mix(col, col * 0.82, smoothstep(0.45, 0.5, contour));

        gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
      }
    `,
    side: THREE.FrontSide,
  }), [config.colors, config.scale]);

  useFrame((state) => {
    if (!meshRef.current) return;
    (meshRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value =
      state.clock.elapsedTime;
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={[0, 0, 0]}
      receiveShadow
      castShadow
    />
  );
}
