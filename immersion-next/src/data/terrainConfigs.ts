export interface TerrainPeak {
  x: number;
  z: number;
  height: number;  // World units added on top of base terrain
  radius: number;  // Gaussian spread in world units
}

export interface TerrainColors {
  water: string;
  lowland: string;
  midland: string;
  highland: string;
  peak: string;
}

export interface TerrainAtmosphereConfig {
  fogColor: string;
  fogDensity: number;
  ambientColor: string;
  sunColor: string;
  sunPosition: [number, number, number];
}

export interface TerrainConfig {
  scale: [number, number, number];  // [width, maxHeight, depth]
  amplitude: number;   // Base noise amplitude 0-1
  frequency: number;   // Base noise frequency
  seed: number;        // Seed for pseudo-random noise
  peaks: TerrainPeak[];
  colors: TerrainColors;
  atmosphere: TerrainAtmosphereConfig;
}

// ---------------------------------------------------------------------------
// Country terrain configurations
// ---------------------------------------------------------------------------

export const COUNTRY_TERRAINS: Record<string, TerrainConfig> = {
  JP: {
    scale: [60, 15, 60],
    amplitude: 0.35,
    frequency: 0.18,
    seed: 7.3,
    peaks: [
      // Mt. Fuji — iconic lone cone
      { x: 6, z: -4, height: 11.5, radius: 4.5 },
      // Japan Alps cluster
      { x: 2, z: -8,  height: 6,   radius: 5   },
      { x: -3, z: -6, height: 5,   radius: 4   },
      // Southern highlands
      { x: -8, z: 4,  height: 3.5, radius: 4   },
    ],
    colors: {
      water:    '#1a5f7a',
      lowland:  '#4a7c59',
      midland:  '#6d9b5c',
      highland: '#9b7b5e',
      peak:     '#f8f4f0',
    },
    atmosphere: {
      fogColor:     '#fce4ec',
      fogDensity:   0.018,
      ambientColor: '#ffe4e1',
      sunColor:     '#fffbe6',
      sunPosition:  [80, 120, 60],
    },
  },

  IT: {
    scale: [50, 12, 70],
    amplitude: 0.30,
    frequency: 0.15,
    seed: 2.8,
    peaks: [
      // Alps along north
      { x: -5, z: -18, height: 9,  radius: 7  },
      { x:  5, z: -18, height: 8,  radius: 6  },
      { x:  0, z: -22, height: 10, radius: 5  },
      // Apennines spine
      { x: -2, z: 0,   height: 4,  radius: 6  },
      { x: -3, z: 8,   height: 3,  radius: 5  },
    ],
    colors: {
      water:    '#1e90ff',
      lowland:  '#9acd32',
      midland:  '#c8b560',
      highland: '#a0714f',
      peak:     '#e8e0d0',
    },
    atmosphere: {
      fogColor:     '#fff8dc',
      fogDensity:   0.012,
      ambientColor: '#ffd88a',
      sunColor:     '#ffe970',
      sunPosition:  [70, 110, 80],
    },
  },

  GB: {
    scale: [40, 9, 65],
    amplitude: 0.25,
    frequency: 0.20,
    seed: 4.1,
    peaks: [
      // Scottish Highlands
      { x: -5, z: -18, height: 6,  radius: 7 },
      { x:  3, z: -20, height: 5,  radius: 6 },
      // Wales
      { x: -8, z: 2,   height: 3.5, radius: 4 },
      // Lake District
      { x: -6, z: -8,  height: 3,   radius: 3 },
    ],
    colors: {
      water:    '#4682b4',
      lowland:  '#2e6b2e',
      midland:  '#5a8a3c',
      highland: '#4a5c3a',
      peak:     '#8a8a8a',
    },
    atmosphere: {
      fogColor:     '#c8d8e8',
      fogDensity:   0.028,
      ambientColor: '#90a8b8',
      sunColor:     '#d0d8e0',
      sunPosition:  [50, 80, 50],
    },
  },

  GR: {
    scale: [50, 11, 50],
    amplitude: 0.28,
    frequency: 0.22,
    seed: 9.6,
    peaks: [
      // Mt. Olympus
      { x: 3, z: -8,   height: 8,  radius: 5 },
      // Pindus mountains
      { x: -6, z: -2,  height: 5,  radius: 5 },
      { x: -4, z: 6,   height: 4,  radius: 4 },
      // Crete (south island bump)
      { x: 2, z: 16,   height: 3,  radius: 6 },
    ],
    colors: {
      water:    '#00aadd',
      lowland:  '#c8b870',
      midland:  '#b09060',
      highland: '#9a7050',
      peak:     '#f5f0e8',
    },
    atmosphere: {
      fogColor:     '#c8e8f8',
      fogDensity:   0.008,
      ambientColor: '#f0e890',
      sunColor:     '#fff060',
      sunPosition:  [100, 130, 40],
    },
  },

  NO: {
    scale: [40, 22, 80],
    amplitude: 0.40,
    frequency: 0.16,
    seed: 1.5,
    peaks: [
      // Galdhøpiggen (highest peak)
      { x: -3, z: -15, height: 14, radius: 4  },
      { x:  4, z: -18, height: 12, radius: 4  },
      // Fjord ridges
      { x: -8, z: -5,  height: 9,  radius: 5  },
      { x:  6, z: -8,  height: 8,  radius: 4  },
      { x: -5, z: 5,   height: 7,  radius: 4  },
      { x:  7, z: 8,   height: 6,  radius: 3  },
    ],
    colors: {
      water:    '#1c3d5a',
      lowland:  '#2e7a4a',
      midland:  '#5a8060',
      highland: '#707070',
      peak:     '#f0f8ff',
    },
    atmosphere: {
      fogColor:     '#d0eaf8',
      fogDensity:   0.020,
      ambientColor: '#b8d8e8',
      sunColor:     '#e8f4ff',
      sunPosition:  [40, 60, 100],
    },
  },

  US: {
    scale: [90, 14, 55],
    amplitude: 0.30,
    frequency: 0.12,
    seed: 6.2,
    peaks: [
      // Rocky Mountains
      { x: -15, z: -8, height: 11, radius: 10 },
      { x: -20, z: 0,  height: 10, radius: 8  },
      // Appalachians (east)
      { x: 20, z: -3,  height: 5,  radius: 8  },
      // Sierra Nevada
      { x: -25, z: 5,  height: 8,  radius: 6  },
    ],
    colors: {
      water:    '#4169e1',
      lowland:  '#7aad42',
      midland:  '#c8a850',
      highland: '#c07040',
      peak:     '#f0ece0',
    },
    atmosphere: {
      fogColor:     '#f0c870',
      fogDensity:   0.010,
      ambientColor: '#ffa050',
      sunColor:     '#ffe080',
      sunPosition:  [80, 120, 60],
    },
  },

  DE: {
    scale: [50, 10, 55],
    amplitude: 0.22,
    frequency: 0.18,
    seed: 3.4,
    peaks: [
      // Bavarian Alps
      { x: 5, z: -18, height: 8,  radius: 7 },
      { x: 0, z: -20, height: 7,  radius: 6 },
      // Black Forest
      { x: -10, z: -5, height: 3, radius: 5 },
    ],
    colors: {
      water:    '#5080c0',
      lowland:  '#508040',
      midland:  '#6a9050',
      highland: '#807050',
      peak:     '#e0dcd0',
    },
    atmosphere: {
      fogColor:     '#c0ccd8',
      fogDensity:   0.015,
      ambientColor: '#a0b0c0',
      sunColor:     '#d8e0e8',
      sunPosition:  [60, 100, 70],
    },
  },

  FR: {
    scale: [55, 11, 55],
    amplitude: 0.26,
    frequency: 0.17,
    seed: 8.1,
    peaks: [
      // Mont Blanc / Alps
      { x: 10, z: -15, height: 10, radius: 7  },
      { x: 5,  z: -18, height: 9,  radius: 6  },
      // Pyrenees
      { x: -5, z: 18,  height: 7,  radius: 7  },
      // Massif Central
      { x: 0,  z: 5,   height: 3,  radius: 6  },
    ],
    colors: {
      water:    '#3070c0',
      lowland:  '#7aaa48',
      midland:  '#a09050',
      highland: '#987060',
      peak:     '#f0ece8',
    },
    atmosphere: {
      fogColor:     '#e8e0d0',
      fogDensity:   0.012,
      ambientColor: '#f0d880',
      sunColor:     '#ffe090',
      sunPosition:  [70, 110, 70],
    },
  },

  EG: {
    scale: [55, 8, 55],
    amplitude: 0.18,
    frequency: 0.14,
    seed: 5.7,
    peaks: [
      // Sinai peninsula
      { x: 12, z: -8, height: 6,  radius: 6 },
      // Eastern Desert hills
      { x: 8,  z: 5,  height: 3,  radius: 7 },
      // Nile valley — lower flat area, no peak
    ],
    colors: {
      water:    '#1890c0',
      lowland:  '#c8a830',
      midland:  '#b88830',
      highland: '#a06830',
      peak:     '#d8c0a0',
    },
    atmosphere: {
      fogColor:     '#f0d890',
      fogDensity:   0.010,
      ambientColor: '#f0c860',
      sunColor:     '#ffe050',
      sunPosition:  [100, 150, 20],
    },
  },

  CN: {
    scale: [80, 16, 65],
    amplitude: 0.32,
    frequency: 0.14,
    seed: 4.9,
    peaks: [
      // Tibetan plateau / Himalayas
      { x: -20, z: -15, height: 14, radius: 12 },
      { x: -10, z: -18, height: 12, radius: 8  },
      // Tian Shan
      { x: -25, z: 5,   height: 8,  radius: 7  },
    ],
    colors: {
      water:    '#4080b0',
      lowland:  '#70a050',
      midland:  '#90a060',
      highland: '#907055',
      peak:     '#f0ece8',
    },
    atmosphere: {
      fogColor:     '#d0c8b0',
      fogDensity:   0.015,
      ambientColor: '#d0b880',
      sunColor:     '#ffe080',
      sunPosition:  [80, 120, 50],
    },
  },

  IN: {
    scale: [60, 12, 65],
    amplitude: 0.26,
    frequency: 0.16,
    seed: 3.3,
    peaks: [
      // Himalayas (north)
      { x: 0,  z: -20, height: 11, radius: 10 },
      { x: 10, z: -18, height: 9,  radius: 7  },
      // Western Ghats
      { x: -15, z: 5,  height: 4,  radius: 5  },
    ],
    colors: {
      water:    '#2880c0',
      lowland:  '#88b050',
      midland:  '#c0a060',
      highland: '#a07858',
      peak:     '#f0ece0',
    },
    atmosphere: {
      fogColor:     '#f0d0a0',
      fogDensity:   0.014,
      ambientColor: '#f0c870',
      sunColor:     '#ffe070',
      sunPosition:  [90, 140, 40],
    },
  },

  RU: {
    scale: [100, 12, 70],
    amplitude: 0.20,
    frequency: 0.11,
    seed: 2.1,
    peaks: [
      // Caucasus
      { x: -20, z: 20,  height: 9,  radius: 8  },
      { x: -15, z: 22,  height: 8,  radius: 7  },
      // Urals (low, ancient)
      { x: 0,  z: -5,  height: 3,  radius: 7  },
    ],
    colors: {
      water:    '#3060a0',
      lowland:  '#608050',
      midland:  '#7a9060',
      highland: '#808070',
      peak:     '#e8e8e0',
    },
    atmosphere: {
      fogColor:     '#c0c8d0',
      fogDensity:   0.018,
      ambientColor: '#a0b0b8',
      sunColor:     '#d0d8e0',
      sunPosition:  [60, 80, 80],
    },
  },

  TR: {
    scale: [65, 11, 50],
    amplitude: 0.25,
    frequency: 0.17,
    seed: 7.8,
    peaks: [
      // Mt. Ararat
      { x: 20, z: -8,  height: 9,  radius: 5 },
      // Pontic Mountains
      { x: 0,  z: -12, height: 5,  radius: 7 },
      // Taurus Mountains
      { x: -5, z: 10,  height: 5,  radius: 7 },
    ],
    colors: {
      water:    '#2090c0',
      lowland:  '#a0a850',
      midland:  '#b09060',
      highland: '#9a7058',
      peak:     '#f0ece0',
    },
    atmosphere: {
      fogColor:     '#e8d8c0',
      fogDensity:   0.012,
      ambientColor: '#f0d070',
      sunColor:     '#ffe060',
      sunPosition:  [90, 130, 50],
    },
  },
};

export const DEFAULT_TERRAIN: TerrainConfig = {
  scale: [60, 10, 60],
  amplitude: 0.28,
  frequency: 0.18,
  seed: 1.0,
  peaks: [
    { x: 0, z: 0, height: 5, radius: 8 },
  ],
  colors: {
    water:    '#4169e1',
    lowland:  '#228b22',
    midland:  '#9acd32',
    highland: '#8b4513',
    peak:     '#ffffff',
  },
  atmosphere: {
    fogColor:     '#b0c4de',
    fogDensity:   0.018,
    ambientColor: '#ffffff',
    sunColor:     '#fffbe6',
    sunPosition:  [80, 120, 60],
  },
};

// Era terrain overrides (reuses country configs as base for era-themed variants)
export const ERA_TERRAINS: Record<string, TerrainConfig> = {
  ancient:     { ...COUNTRY_TERRAINS.EG,  scale: [60, 8, 60]  },
  roman:       { ...COUNTRY_TERRAINS.IT,  scale: [55, 11, 60] },
  viking:      { ...COUNTRY_TERRAINS.NO,  scale: [50, 20, 70] },
  medieval:    { ...COUNTRY_TERRAINS.GB,  scale: [50, 10, 60] },
  renaissance: { ...COUNTRY_TERRAINS.IT                       },
  colonial:    { ...COUNTRY_TERRAINS.GB,  scale: [55, 9, 70]  },
  industrial:  { ...COUNTRY_TERRAINS.GB                       },
  worldwar:    { ...COUNTRY_TERRAINS.FR                       },
  modern:      { ...DEFAULT_TERRAIN                           },
};

/**
 * Compute procedural terrain height at world-space (x, z).
 * Returns a value in 0..scale[1] range.
 */
export function computeTerrainHeight(wx: number, wz: number, cfg: TerrainConfig): number {
  const { amplitude, frequency, seed: s, peaks, scale } = cfg;

  // Multi-octave sin/cos noise (deterministic fBm approximation)
  let n = 0;
  n += Math.sin(wx * frequency       + s * 0.10) * Math.cos(wz * frequency       + s * 0.20);
  n += Math.sin(wx * frequency * 2.1 + s * 0.30) * Math.cos(wz * frequency * 2.1 + s * 0.70) * 0.50;
  n += Math.sin(wx * frequency * 4.3 + s * 1.10) * Math.cos(wz * frequency * 4.3 + s * 1.50) * 0.25;
  n += Math.sin(wx * frequency * 8.7 + s * 2.30) * Math.cos(wz * frequency * 8.7 + s * 2.90) * 0.125;

  // Remap from [-~1.875, +1.875] → [0,1]
  n = (n / 1.875 + 1) * 0.5;
  n = Math.max(0, Math.min(1, n)) * amplitude;

  // Add landmark peaks via Gaussian
  for (const peak of peaks) {
    const dx = wx - peak.x;
    const dz = wz - peak.z;
    const g = Math.exp(-(dx * dx + dz * dz) / (peak.radius * peak.radius));
    n += (peak.height / scale[1]) * g;
  }

  // Island-shape edge fade (smooth cubic falloff)
  const nx = wx / (scale[0] * 0.48);
  const nz = wz / (scale[2] * 0.48);
  const d = Math.sqrt(nx * nx + nz * nz);
  const fade = Math.max(0, 1 - d * d * d);
  n *= fade;

  return Math.max(0, n) * scale[1];
}
