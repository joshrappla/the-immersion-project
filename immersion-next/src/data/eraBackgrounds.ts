export interface ParticleConfig {
  type: 'dust' | 'snow' | 'mist' | 'embers' | 'rain' | 'leaves' | 'stars' | 'smoke';
  count: number;
  color: string;
  minSize: number;
  maxSize: number;
  speed: number;
  direction: 'up' | 'down' | 'left' | 'right' | 'random';
  opacity: number;
  blur: number;
}

export interface EraLayer {
  image: string;
  speed: number;   // parallax multiplier (0 = fixed, 1 = 1:1 with scroll)
  opacity: number;
  height: string;  // CSS height (e.g. '60%')
  blendMode?: string;
}

export interface EraBackground {
  gradient: string;
  accentColor: string;
  name: string;
  years: [number, number];
  particles: ParticleConfig;
  layers: EraLayer[];
}

// ── Shared particle presets ────────────────────────────────────────────────────

const DUST_GOLDEN: ParticleConfig = {
  type: 'dust', count: 50, color: '#D4A574',
  minSize: 1.5, maxSize: 5, speed: 0.3, direction: 'random', opacity: 0.45, blur: 1,
};
const DUST_MARBLE: ParticleConfig = {
  type: 'dust', count: 40, color: '#C9B896',
  minSize: 1.5, maxSize: 4.5, speed: 0.2, direction: 'up', opacity: 0.35, blur: 1,
};
const DUST_BLUE: ParticleConfig = {
  type: 'dust', count: 35, color: '#bfdbfe',
  minSize: 1, maxSize: 4, speed: 0.2, direction: 'random', opacity: 0.35, blur: 1,
};
const SNOW: ParticleConfig = {
  type: 'snow', count: 80, color: '#ffffff',
  minSize: 1.5, maxSize: 6, speed: 0.8, direction: 'down', opacity: 0.65, blur: 0,
};
const MIST: ParticleConfig = {
  type: 'mist', count: 18, color: '#94a3b8',
  minSize: 60, maxSize: 180, speed: 0.15, direction: 'right', opacity: 0.18, blur: 20,
};
const EMBERS: ParticleConfig = {
  type: 'embers', count: 45, color: '#f97316',
  minSize: 1.5, maxSize: 4.5, speed: 1.0, direction: 'up', opacity: 0.75, blur: 0,
};
const SMOKE: ParticleConfig = {
  type: 'smoke', count: 22, color: '#4b5563',
  minSize: 20, maxSize: 90, speed: 0.5, direction: 'up', opacity: 0.22, blur: 14,
};
const STARS_MODERN: ParticleConfig = {
  type: 'stars', count: 60, color: '#a78bfa',
  minSize: 0.8, maxSize: 3.5, speed: 0.08, direction: 'random', opacity: 0.65, blur: 1,
};
const LEAVES: ParticleConfig = {
  type: 'leaves', count: 30, color: '#d97706',
  minSize: 3, maxSize: 8, speed: 0.6, direction: 'down', opacity: 0.60, blur: 0,
};
const DUST_SANDY: ParticleConfig = {
  type: 'dust', count: 45, color: '#fbbf24',
  minSize: 2, maxSize: 6, speed: 0.4, direction: 'random', opacity: 0.40, blur: 1,
};

// ── Era definitions ────────────────────────────────────────────────────────────

export const ERA_BACKGROUNDS: Record<string, EraBackground> = {
  'Ancient Period': {
    gradient: 'linear-gradient(135deg, #78350f 0%, #92400e 55%, #d97706 100%)',
    accentColor: '#d97706',
    name: 'Ancient World',
    years: [-3000, 500],
    particles: DUST_GOLDEN,
    layers: [
      { image: '/backgrounds/ancient/back-pyramids.svg', speed: 0.08, opacity: 0.75, height: '65%', blendMode: 'screen' },
      { image: '/backgrounds/ancient/mid-columns.svg',   speed: 0.20, opacity: 0.60, height: '45%', blendMode: 'screen' },
      { image: '/backgrounds/ancient/front-sand.svg',    speed: 0.40, opacity: 0.55, height: '28%', blendMode: 'screen' },
    ],
  },
  'Ancient Rome': {
    gradient: 'linear-gradient(135deg, #7f1d1d 0%, #92400e 50%, #57534e 100%)',
    accentColor: '#dc2626',
    name: 'Roman Empire',
    years: [-753, 476],
    particles: DUST_MARBLE,
    layers: [
      { image: '/backgrounds/roman/back-colosseum.svg', speed: 0.08, opacity: 0.72, height: '65%', blendMode: 'screen' },
      { image: '/backgrounds/roman/mid-aqueduct.svg',   speed: 0.20, opacity: 0.55, height: '48%', blendMode: 'screen' },
      { image: '/backgrounds/roman/front-columns.svg',  speed: 0.38, opacity: 0.50, height: '30%', blendMode: 'screen' },
    ],
  },
  'Ancient Greece': {
    gradient: 'linear-gradient(135deg, #0c4a6e 0%, #1d4ed8 50%, #475569 100%)',
    accentColor: '#3b82f6',
    name: 'Ancient Greece',
    years: [-800, -31],
    particles: DUST_BLUE,
    layers: [
      { image: '/backgrounds/ancient/back-pyramids.svg', speed: 0.08, opacity: 0.55, height: '60%', blendMode: 'screen' },
      { image: '/backgrounds/ancient/mid-columns.svg',   speed: 0.20, opacity: 0.60, height: '45%', blendMode: 'screen' },
      { image: '/backgrounds/roman/front-columns.svg',   speed: 0.38, opacity: 0.45, height: '28%', blendMode: 'screen' },
    ],
  },
  'Viking Age': {
    gradient: 'linear-gradient(135deg, #0f172a 0%, #164e63 45%, #1e3a5f 100%)',
    accentColor: '#06b6d4',
    name: 'Viking Age',
    years: [793, 1066],
    particles: SNOW,
    layers: [
      { image: '/backgrounds/viking/back-mountains.svg', speed: 0.06, opacity: 0.80, height: '65%', blendMode: 'screen' },
      { image: '/backgrounds/viking/mid-longship.svg',   speed: 0.18, opacity: 0.65, height: '48%', blendMode: 'screen' },
      { image: '/backgrounds/viking/front-waves.svg',    speed: 0.35, opacity: 0.55, height: '32%', blendMode: 'screen' },
    ],
  },
  'Medieval Period': {
    gradient: 'linear-gradient(135deg, #1c1917 0%, #064e3b 50%, #1e293b 100%)',
    accentColor: '#10b981',
    name: 'Medieval Era',
    years: [500, 1500],
    particles: MIST,
    layers: [
      { image: '/backgrounds/medieval/back-castle.svg', speed: 0.07, opacity: 0.78, height: '65%', blendMode: 'screen' },
      { image: '/backgrounds/medieval/mid-forest.svg',  speed: 0.18, opacity: 0.65, height: '48%', blendMode: 'screen' },
      { image: '/backgrounds/medieval/front-fog.svg',   speed: 0.32, opacity: 0.55, height: '28%', blendMode: 'screen' },
    ],
  },
  'The Crusades': {
    gradient: 'linear-gradient(135deg, #1c1917 0%, #134e4a 50%, #450a0a 100%)',
    accentColor: '#14b8a6',
    name: 'The Crusades',
    years: [1095, 1291],
    particles: EMBERS,
    layers: [
      { image: '/backgrounds/medieval/back-castle.svg', speed: 0.07, opacity: 0.72, height: '65%', blendMode: 'screen' },
      { image: '/backgrounds/medieval/mid-forest.svg',  speed: 0.18, opacity: 0.58, height: '48%', blendMode: 'screen' },
      { image: '/backgrounds/medieval/front-fog.svg',   speed: 0.32, opacity: 0.50, height: '28%', blendMode: 'screen' },
    ],
  },
  'Third Crusade': {
    gradient: 'linear-gradient(135deg, #1c1917 0%, #134e4a 50%, #450a0a 100%)',
    accentColor: '#14b8a6',
    name: 'The Crusades',
    years: [1189, 1192],
    particles: EMBERS,
    layers: [
      { image: '/backgrounds/medieval/back-castle.svg', speed: 0.07, opacity: 0.72, height: '65%', blendMode: 'screen' },
      { image: '/backgrounds/medieval/mid-forest.svg',  speed: 0.18, opacity: 0.58, height: '48%', blendMode: 'screen' },
      { image: '/backgrounds/medieval/front-fog.svg',   speed: 0.32, opacity: 0.50, height: '28%', blendMode: 'screen' },
    ],
  },
  'Renaissance': {
    gradient: 'linear-gradient(135deg, #92400e 0%, #9f1239 50%, #581c87 100%)',
    accentColor: '#f43f5e',
    name: 'Renaissance',
    years: [1400, 1600],
    particles: { ...DUST_GOLDEN, color: '#fcd34d', count: 30, speed: 0.2, opacity: 0.50 },
    layers: [
      { image: '/backgrounds/renaissance/back-florence.svg', speed: 0.07, opacity: 0.75, height: '65%', blendMode: 'screen' },
      { image: '/backgrounds/renaissance/mid-arches.svg',    speed: 0.18, opacity: 0.60, height: '48%', blendMode: 'screen' },
      { image: '/backgrounds/renaissance/front-curtain.svg', speed: 0.30, opacity: 0.50, height: '32%', blendMode: 'screen' },
    ],
  },
  'Italian Renaissance': {
    gradient: 'linear-gradient(135deg, #92400e 0%, #9f1239 50%, #581c87 100%)',
    accentColor: '#f43f5e',
    name: 'Italian Renaissance',
    years: [1400, 1600],
    particles: { ...DUST_GOLDEN, color: '#fcd34d', count: 30, speed: 0.2, opacity: 0.50 },
    layers: [
      { image: '/backgrounds/renaissance/back-florence.svg', speed: 0.07, opacity: 0.75, height: '65%', blendMode: 'screen' },
      { image: '/backgrounds/renaissance/mid-arches.svg',    speed: 0.18, opacity: 0.60, height: '48%', blendMode: 'screen' },
      { image: '/backgrounds/renaissance/front-curtain.svg', speed: 0.30, opacity: 0.50, height: '32%', blendMode: 'screen' },
    ],
  },
  'Colonial Era': {
    gradient: 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #134e4a 100%)',
    accentColor: '#f59e0b',
    name: 'Age of Exploration',
    years: [1500, 1800],
    particles: LEAVES,
    layers: [
      { image: '/backgrounds/colonial/back-ships.svg', speed: 0.08, opacity: 0.75, height: '65%', blendMode: 'screen' },
      { image: '/backgrounds/colonial/mid-port.svg',   speed: 0.20, opacity: 0.62, height: '48%', blendMode: 'screen' },
      { image: '/backgrounds/colonial/front-waves.svg',speed: 0.38, opacity: 0.55, height: '30%', blendMode: 'screen' },
    ],
  },
  'Industrial Revolution': {
    gradient: 'linear-gradient(135deg, #1f2937 0%, #374151 50%, #52525b 100%)',
    accentColor: '#9ca3af',
    name: 'Industrial Revolution',
    years: [1760, 1840],
    particles: SMOKE,
    layers: [
      { image: '/backgrounds/industrial/back-factories.svg', speed: 0.07, opacity: 0.78, height: '65%', blendMode: 'screen' },
      { image: '/backgrounds/industrial/mid-bridge.svg',     speed: 0.18, opacity: 0.62, height: '48%', blendMode: 'screen' },
      { image: '/backgrounds/industrial/front-steam.svg',    speed: 0.32, opacity: 0.52, height: '30%', blendMode: 'screen' },
    ],
  },
  'Industrial Age': {
    gradient: 'linear-gradient(135deg, #1f2937 0%, #374151 50%, #52525b 100%)',
    accentColor: '#9ca3af',
    name: 'Industrial Age',
    years: [1760, 1900],
    particles: SMOKE,
    layers: [
      { image: '/backgrounds/industrial/back-factories.svg', speed: 0.07, opacity: 0.78, height: '65%', blendMode: 'screen' },
      { image: '/backgrounds/industrial/mid-bridge.svg',     speed: 0.18, opacity: 0.62, height: '48%', blendMode: 'screen' },
      { image: '/backgrounds/industrial/front-steam.svg',    speed: 0.32, opacity: 0.52, height: '30%', blendMode: 'screen' },
    ],
  },
  'World War Era': {
    gradient: 'linear-gradient(135deg, #0f172a 0%, #450a0a 50%, #1f2937 100%)',
    accentColor: '#ef4444',
    name: 'World Wars',
    years: [1914, 1945],
    particles: { ...EMBERS, color: '#ef4444', count: 55, speed: 1.2 },
    layers: [
      { image: '/backgrounds/worldwar/back-cityscape.svg', speed: 0.07, opacity: 0.80, height: '65%', blendMode: 'screen' },
      { image: '/backgrounds/worldwar/mid-ruins.svg',      speed: 0.18, opacity: 0.65, height: '48%', blendMode: 'screen' },
      { image: '/backgrounds/worldwar/front-debris.svg',   speed: 0.32, opacity: 0.55, height: '30%', blendMode: 'screen' },
    ],
  },
  'Post-WWI': {
    gradient: 'linear-gradient(135deg, #0f172a 0%, #450a0a 50%, #1f2937 100%)',
    accentColor: '#ef4444',
    name: 'Post-War Era',
    years: [1918, 1950],
    particles: { ...SMOKE, color: '#6b7280', count: 18, opacity: 0.18 },
    layers: [
      { image: '/backgrounds/worldwar/back-cityscape.svg', speed: 0.07, opacity: 0.72, height: '65%', blendMode: 'screen' },
      { image: '/backgrounds/worldwar/mid-ruins.svg',      speed: 0.18, opacity: 0.58, height: '48%', blendMode: 'screen' },
      { image: '/backgrounds/worldwar/front-debris.svg',   speed: 0.32, opacity: 0.48, height: '30%', blendMode: 'screen' },
    ],
  },
  'Modern Era': {
    gradient: 'linear-gradient(135deg, #1e1b4b 0%, #5b21b6 50%, #701a75 100%)',
    accentColor: '#a855f7',
    name: 'Modern Era',
    years: [1945, 2025],
    particles: STARS_MODERN,
    layers: [
      { image: '/backgrounds/modern/back-skyline.svg',   speed: 0.06, opacity: 0.75, height: '65%', blendMode: 'screen' },
      { image: '/backgrounds/modern/mid-buildings.svg',  speed: 0.16, opacity: 0.60, height: '48%', blendMode: 'screen' },
      { image: '/backgrounds/modern/front-lights.svg',   speed: 0.28, opacity: 0.52, height: '30%', blendMode: 'screen' },
    ],
  },
  'Wild West': {
    gradient: 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #92400e 100%)',
    accentColor: '#f59e0b',
    name: 'Wild West',
    years: [1865, 1900],
    particles: DUST_SANDY,
    layers: [
      { image: '/backgrounds/ancient/back-pyramids.svg', speed: 0.08, opacity: 0.50, height: '60%', blendMode: 'screen' },
      { image: '/backgrounds/ancient/front-sand.svg',    speed: 0.32, opacity: 0.55, height: '28%', blendMode: 'screen' },
    ],
  },
  'Meiji Restoration': {
    gradient: 'linear-gradient(135deg, #064e3b 0%, #0f766e 50%, #1e1b4b 100%)',
    accentColor: '#2dd4bf',
    name: 'Meiji Restoration',
    years: [1868, 1912],
    particles: { ...LEAVES, color: '#fda4af', count: 25, opacity: 0.55 },
    layers: [
      { image: '/backgrounds/medieval/back-castle.svg', speed: 0.07, opacity: 0.55, height: '60%', blendMode: 'screen' },
      { image: '/backgrounds/medieval/mid-forest.svg',  speed: 0.18, opacity: 0.50, height: '45%', blendMode: 'screen' },
    ],
  },
  'American Revolution': {
    gradient: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 50%, #4338ca 100%)',
    accentColor: '#60a5fa',
    name: 'American Revolution',
    years: [1775, 1783],
    particles: DUST_MARBLE,
    layers: [
      { image: '/backgrounds/colonial/back-ships.svg', speed: 0.08, opacity: 0.65, height: '60%', blendMode: 'screen' },
      { image: '/backgrounds/colonial/mid-port.svg',   speed: 0.20, opacity: 0.52, height: '45%', blendMode: 'screen' },
    ],
  },
};

const DEFAULT_BACKGROUND: EraBackground = {
  gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
  accentColor: '#64748b',
  name: 'Unknown Era',
  years: [0, 0],
  particles: {
    type: 'stars', count: 30, color: '#94a3b8',
    minSize: 0.5, maxSize: 2, speed: 0.05, direction: 'random', opacity: 0.40, blur: 0,
  },
  layers: [],
};

export function getEraBackground(era: string): EraBackground {
  return ERA_BACKGROUNDS[era] ?? DEFAULT_BACKGROUND;
}

/**
 * Map a calendar year to the closest named era.
 * Used by useTimelineScroll to determine the current era from scroll position.
 */
export function getEraFromYear(year: number): string {
  if (year < -700) return 'Ancient Period';
  if (year < 31)   return 'Ancient Greece';
  if (year < 500)  return 'Ancient Rome';
  if (year < 793)  return 'Medieval Period';
  if (year < 1066) return 'Viking Age';
  if (year < 1400) return 'Medieval Period';
  if (year < 1600) return 'Renaissance';
  if (year < 1760) return 'Colonial Era';
  if (year < 1900) return 'Industrial Age';
  if (year < 1945) return 'World War Era';
  return 'Modern Era';
}
