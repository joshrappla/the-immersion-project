import type { ParticleConfig } from './eraBackgrounds';

export interface CountryLayer {
  image: string;
  speed: number;
  opacity: number;
  height: string;
  blendMode?: string;
}

export interface CountryBackground {
  name: string;
  nativeName: string;
  gradient: string;
  accentColor: string;
  textColor: string;
  layers: CountryLayer[];
  particles: ParticleConfig;
  landmarks: string[];
  flag: string; // emoji flag
}

export const COUNTRY_BACKGROUNDS: Record<string, CountryBackground> = {
  JP: {
    name: 'Japan',
    nativeName: '日本',
    gradient: 'linear-gradient(160deg, #1a0a10 0%, #3d0f1e 40%, #7f1734 70%, #a01030 100%)',
    accentColor: '#DC143C',
    textColor: '#FFB7C5',
    flag: '🇯🇵',
    layers: [
      { image: '/backgrounds/countries/japan/back-fuji.svg',    speed: 0.06, opacity: 0.82, height: '65%', blendMode: 'screen' },
      { image: '/backgrounds/countries/japan/mid-pagoda.svg',   speed: 0.18, opacity: 0.65, height: '52%', blendMode: 'screen' },
      { image: '/backgrounds/countries/japan/front-cherry.svg', speed: 0.32, opacity: 0.55, height: '36%', blendMode: 'screen' },
    ],
    particles: {
      type: 'leaves', count: 55, color: '#FFB7C5',
      minSize: 3, maxSize: 9, speed: 0.5, direction: 'down', opacity: 0.55, blur: 0,
    },
    landmarks: ['Mt. Fuji', 'Kyoto', 'Tokyo', 'Nara'],
  },

  IT: {
    name: 'Italy',
    nativeName: 'Italia',
    gradient: 'linear-gradient(160deg, #1a0a04 0%, #3d1a06 40%, #7f3a0a 70%, #a05010 100%)',
    accentColor: '#D4822A',
    textColor: '#F5DEB3',
    flag: '🇮🇹',
    layers: [
      { image: '/backgrounds/countries/italy/back-tuscany.svg',   speed: 0.06, opacity: 0.80, height: '65%', blendMode: 'screen' },
      { image: '/backgrounds/countries/italy/mid-colosseum.svg',  speed: 0.18, opacity: 0.65, height: '52%', blendMode: 'screen' },
      { image: '/backgrounds/countries/italy/front-cypress.svg',  speed: 0.32, opacity: 0.55, height: '34%', blendMode: 'screen' },
    ],
    particles: {
      type: 'dust', count: 35, color: '#F5DEB3',
      minSize: 1.5, maxSize: 5, speed: 0.25, direction: 'random', opacity: 0.35, blur: 1,
    },
    landmarks: ['Rome', 'Florence', 'Venice', 'Pompeii'],
  },

  GB: {
    name: 'United Kingdom',
    nativeName: 'United Kingdom',
    gradient: 'linear-gradient(160deg, #040e08 0%, #0a1e10 40%, #102810 70%, #0c1e14 100%)',
    accentColor: '#4A7C4E',
    textColor: '#a8d4aa',
    flag: '🇬🇧',
    layers: [
      { image: '/backgrounds/countries/uk/back-hills.svg',  speed: 0.05, opacity: 0.78, height: '65%', blendMode: 'screen' },
      { image: '/backgrounds/countries/uk/mid-castle.svg',  speed: 0.16, opacity: 0.65, height: '55%', blendMode: 'screen' },
      { image: '/backgrounds/countries/uk/front-fog.svg',   speed: 0.28, opacity: 0.52, height: '30%', blendMode: 'screen' },
    ],
    particles: {
      type: 'rain', count: 80, color: '#94A3B8',
      minSize: 1, maxSize: 2, speed: 1.0, direction: 'down', opacity: 0.30, blur: 0,
    },
    landmarks: ['London', 'Edinburgh', 'Stonehenge', 'Oxford'],
  },

  US: {
    name: 'United States',
    nativeName: 'United States',
    gradient: 'linear-gradient(160deg, #1a0804 0%, #3d1506 40%, #7f2e08 70%, #b03808 100%)',
    accentColor: '#D2691E',
    textColor: '#F4A460',
    flag: '🇺🇸',
    layers: [
      { image: '/backgrounds/countries/usa/back-canyon.svg',  speed: 0.06, opacity: 0.82, height: '68%', blendMode: 'screen' },
      { image: '/backgrounds/countries/usa/mid-desert.svg',   speed: 0.18, opacity: 0.65, height: '50%', blendMode: 'screen' },
      { image: '/backgrounds/countries/usa/front-cactus.svg', speed: 0.32, opacity: 0.58, height: '34%', blendMode: 'screen' },
    ],
    particles: {
      type: 'dust', count: 40, color: '#D2691E',
      minSize: 2, maxSize: 6, speed: 0.4, direction: 'right', opacity: 0.35, blur: 1,
    },
    landmarks: ['New York', 'Washington D.C.', 'Grand Canyon', 'Gettysburg'],
  },

  GR: {
    name: 'Greece',
    nativeName: 'Ελλάδα',
    gradient: 'linear-gradient(160deg, #05101e 0%, #091828 40%, #0f2540 70%, #163060 100%)',
    accentColor: '#2E6FBC',
    textColor: '#9bc8f0',
    flag: '🇬🇷',
    layers: [
      { image: '/backgrounds/countries/greece/back-acropolis.svg', speed: 0.06, opacity: 0.80, height: '65%', blendMode: 'screen' },
      { image: '/backgrounds/countries/greece/mid-columns.svg',    speed: 0.18, opacity: 0.65, height: '52%', blendMode: 'screen' },
      { image: '/backgrounds/countries/greece/front-sea.svg',      speed: 0.30, opacity: 0.55, height: '30%', blendMode: 'screen' },
    ],
    particles: {
      type: 'dust', count: 25, color: '#FFFFFF',
      minSize: 1, maxSize: 4, speed: 0.15, direction: 'up', opacity: 0.22, blur: 1,
    },
    landmarks: ['Athens', 'Sparta', 'Olympia', 'Delphi'],
  },

  NO: {
    name: 'Norway',
    nativeName: 'Norge',
    gradient: 'linear-gradient(160deg, #050d1a 0%, #091420 40%, #0a1e30 70%, #061428 100%)',
    accentColor: '#1a6fa0',
    textColor: '#7dcff5',
    flag: '🇳🇴',
    layers: [
      { image: '/backgrounds/countries/norway/back-fjords.svg',  speed: 0.05, opacity: 0.85, height: '70%', blendMode: 'screen' },
      { image: '/backgrounds/countries/norway/mid-village.svg',  speed: 0.16, opacity: 0.65, height: '52%', blendMode: 'screen' },
      { image: '/backgrounds/countries/norway/front-aurora.svg', speed: 0.25, opacity: 0.60, height: '35%', blendMode: 'screen' },
    ],
    particles: {
      type: 'snow', count: 70, color: '#ffffff',
      minSize: 1.5, maxSize: 5, speed: 0.7, direction: 'down', opacity: 0.55, blur: 0,
    },
    landmarks: ['Oslo', 'Bergen', 'Tromsø', 'Lofoten'],
  },

  // ── Additional countries reusing or sharing nearby SVGs ───────────────────

  DE: {
    name: 'Germany',
    nativeName: 'Deutschland',
    gradient: 'linear-gradient(160deg, #0a0a0a 0%, #1a1a1a 40%, #2a2a2a 70%, #1a1208 100%)',
    accentColor: '#e8a000',
    textColor: '#ffd060',
    flag: '🇩🇪',
    layers: [
      { image: '/backgrounds/medieval/back-castle.svg', speed: 0.07, opacity: 0.72, height: '65%', blendMode: 'screen' },
      { image: '/backgrounds/medieval/mid-forest.svg',  speed: 0.18, opacity: 0.60, height: '48%', blendMode: 'screen' },
    ],
    particles: {
      type: 'mist', count: 16, color: '#c8d8c8',
      minSize: 50, maxSize: 160, speed: 0.12, direction: 'right', opacity: 0.16, blur: 18,
    },
    landmarks: ['Berlin', 'Munich', 'Neuschwanstein', 'Cologne'],
  },

  FR: {
    name: 'France',
    nativeName: 'France',
    gradient: 'linear-gradient(160deg, #0a0614 0%, #1a0e28 40%, #2e1a40 70%, #1e1230 100%)',
    accentColor: '#9060c0',
    textColor: '#c8a0f0',
    flag: '🇫🇷',
    layers: [
      { image: '/backgrounds/renaissance/back-florence.svg', speed: 0.07, opacity: 0.68, height: '65%', blendMode: 'screen' },
      { image: '/backgrounds/renaissance/mid-arches.svg',    speed: 0.18, opacity: 0.55, height: '48%', blendMode: 'screen' },
      { image: '/backgrounds/medieval/front-fog.svg',        speed: 0.30, opacity: 0.45, height: '28%', blendMode: 'screen' },
    ],
    particles: {
      type: 'leaves', count: 28, color: '#e0b080',
      minSize: 3, maxSize: 7, speed: 0.4, direction: 'down', opacity: 0.45, blur: 0,
    },
    landmarks: ['Paris', 'Versailles', 'Mont Saint-Michel', 'Bordeaux'],
  },

  EG: {
    name: 'Egypt',
    nativeName: 'مصر',
    gradient: 'linear-gradient(160deg, #1a0c04 0%, #3d1e06 40%, #7f4008 70%, #a05010 100%)',
    accentColor: '#d4a030',
    textColor: '#f0d070',
    flag: '🇪🇬',
    layers: [
      { image: '/backgrounds/ancient/back-pyramids.svg', speed: 0.07, opacity: 0.85, height: '65%', blendMode: 'screen' },
      { image: '/backgrounds/ancient/mid-columns.svg',   speed: 0.20, opacity: 0.65, height: '48%', blendMode: 'screen' },
      { image: '/backgrounds/ancient/front-sand.svg',    speed: 0.38, opacity: 0.58, height: '28%', blendMode: 'screen' },
    ],
    particles: {
      type: 'dust', count: 45, color: '#fbbf24',
      minSize: 2, maxSize: 6, speed: 0.4, direction: 'random', opacity: 0.38, blur: 1,
    },
    landmarks: ['Cairo', 'Luxor', 'Alexandria', 'Abu Simbel'],
  },

  CN: {
    name: 'China',
    nativeName: '中国',
    gradient: 'linear-gradient(160deg, #1a0404 0%, #3d0808 40%, #7f1010 70%, #a01818 100%)',
    accentColor: '#c0382e',
    textColor: '#f0a070',
    flag: '🇨🇳',
    layers: [
      { image: '/backgrounds/countries/japan/back-fuji.svg',  speed: 0.07, opacity: 0.65, height: '65%', blendMode: 'screen' },
      { image: '/backgrounds/countries/japan/mid-pagoda.svg', speed: 0.18, opacity: 0.62, height: '52%', blendMode: 'screen' },
    ],
    particles: {
      type: 'leaves', count: 32, color: '#e07030',
      minSize: 3, maxSize: 8, speed: 0.5, direction: 'down', opacity: 0.48, blur: 0,
    },
    landmarks: ['Beijing', 'Xi\'an', 'Shanghai', 'The Great Wall'],
  },

  IN: {
    name: 'India',
    nativeName: 'भारत',
    gradient: 'linear-gradient(160deg, #1a0a04 0%, #3d1e06 40%, #7f3a08 70%, #a06010 100%)',
    accentColor: '#e08828',
    textColor: '#f0d060',
    flag: '🇮🇳',
    layers: [
      { image: '/backgrounds/ancient/mid-columns.svg',  speed: 0.18, opacity: 0.68, height: '52%', blendMode: 'screen' },
      { image: '/backgrounds/ancient/front-sand.svg',   speed: 0.35, opacity: 0.52, height: '28%', blendMode: 'screen' },
    ],
    particles: {
      type: 'dust', count: 40, color: '#e0a040',
      minSize: 2, maxSize: 5, speed: 0.35, direction: 'random', opacity: 0.35, blur: 1,
    },
    landmarks: ['Delhi', 'Agra', 'Varanasi', 'Mumbai'],
  },

  RU: {
    name: 'Russia',
    nativeName: 'Россия',
    gradient: 'linear-gradient(160deg, #040a14 0%, #081420 40%, #0c1e30 70%, #081628 100%)',
    accentColor: '#2060a0',
    textColor: '#80b8e8',
    flag: '🇷🇺',
    layers: [
      { image: '/backgrounds/viking/back-mountains.svg', speed: 0.06, opacity: 0.72, height: '65%', blendMode: 'screen' },
      { image: '/backgrounds/medieval/mid-forest.svg',   speed: 0.18, opacity: 0.58, height: '48%', blendMode: 'screen' },
    ],
    particles: {
      type: 'snow', count: 60, color: '#ffffff',
      minSize: 1.5, maxSize: 5, speed: 0.65, direction: 'down', opacity: 0.50, blur: 0,
    },
    landmarks: ['Moscow', 'St. Petersburg', 'Novgorod', 'Kiev'],
  },

  TR: {
    name: 'Turkey / Ottoman Empire',
    nativeName: 'Türkiye',
    gradient: 'linear-gradient(160deg, #1a0a04 0%, #3d1406 40%, #7f2808 70%, #a03010 100%)',
    accentColor: '#c03820',
    textColor: '#f08060',
    flag: '🇹🇷',
    layers: [
      { image: '/backgrounds/ancient/mid-columns.svg',  speed: 0.18, opacity: 0.65, height: '48%', blendMode: 'screen' },
      { image: '/backgrounds/ancient/front-sand.svg',   speed: 0.35, opacity: 0.50, height: '28%', blendMode: 'screen' },
    ],
    particles: {
      type: 'dust', count: 35, color: '#D4A574',
      minSize: 1.5, maxSize: 5, speed: 0.3, direction: 'random', opacity: 0.35, blur: 1,
    },
    landmarks: ['Istanbul', 'Ankara', 'Ephesus', 'Troy'],
  },
};

// Fallback for countries without custom config
export const DEFAULT_COUNTRY_BACKGROUND: CountryBackground = {
  name: 'Unknown',
  nativeName: '',
  gradient: 'linear-gradient(160deg, #0a0a14 0%, #141428 40%, #1e1e3c 70%, #141430 100%)',
  accentColor: '#6060a0',
  textColor: '#a0a0d0',
  flag: '🌍',
  layers: [],
  particles: {
    type: 'stars', count: 30, color: '#94a3b8',
    minSize: 0.5, maxSize: 2.5, speed: 0.05, direction: 'random', opacity: 0.40, blur: 0,
  },
  landmarks: [],
};

export function getCountryBackground(code: string): CountryBackground {
  return COUNTRY_BACKGROUNDS[code] ?? DEFAULT_COUNTRY_BACKGROUND;
}

/** Return flag emoji for a country code */
export function getCountryFlag(code: string): string {
  return COUNTRY_BACKGROUNDS[code]?.flag ?? '🌍';
}
