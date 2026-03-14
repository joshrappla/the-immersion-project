export interface TerrainFeature {
  type: 'forest' | 'city' | 'landmark';
  position: [number, number, number];  // x, y (height offset), z in terrain space
  name?: string;
  count?: number;    // number of trees / buildings
  radius?: number;   // spread radius for clusters
  scale?: number;    // uniform scale override
  icon?: string;     // emoji for HTML label
}

export const COUNTRY_FEATURES: Record<string, TerrainFeature[]> = {
  JP: [
    // Tokyo metro
    { type: 'city',   position: [8, 0, 2],   name: 'Tokyo',  count: 10, icon: '🗼' },
    // Osaka / Kyoto corridor
    { type: 'city',   position: [2, 0, 6],   name: 'Kyoto',  count: 7,  icon: '⛩️' },
    // Mt. Fuji marker (no tree cluster — above snowline)
    { type: 'landmark', position: [6, 0, -4], name: 'Mt. Fuji', icon: '🗻' },
    // Forested highlands
    { type: 'forest', position: [-2, 0, -3],  count: 18, radius: 5 },
    { type: 'forest', position: [4, 0, 8],    count: 14, radius: 4 },
    { type: 'forest', position: [-6, 0, 5],   count: 12, radius: 4 },
    { type: 'forest', position: [0, 0, -10],  count: 16, radius: 5 },
  ],

  IT: [
    { type: 'city',   position: [0, 0, 6],    name: 'Rome',     count: 12, icon: '🏛️' },
    { type: 'city',   position: [-2, 0, 0],   name: 'Florence', count: 7,  icon: '🎨' },
    { type: 'city',   position: [5, 0, -5],   name: 'Venice',   count: 5,  icon: '🚣' },
    { type: 'city',   position: [-5, 0, 8],   name: 'Naples',   count: 6,  icon: '🍕' },
    { type: 'forest', position: [-6, 0, 2],   count: 14, radius: 4 },  // Tuscan hills
    { type: 'forest', position: [0, 0, -16],  count: 22, radius: 6 },  // Alpine forests
  ],

  GB: [
    { type: 'city',   position: [5, 0, 8],    name: 'London',     count: 14, icon: '🎡' },
    { type: 'city',   position: [-3, 0, -8],  name: 'Edinburgh',  count: 8,  icon: '🏰' },
    { type: 'city',   position: [-6, 0, 2],   name: 'Cardiff',    count: 5,  icon: '🐉' },
    { type: 'forest', position: [0, 0, 0],    count: 30, radius: 9 },
    { type: 'forest', position: [-7, 0, 3],   count: 20, radius: 6 },
    { type: 'forest', position: [3, 0, -5],   count: 16, radius: 5 },
  ],

  GR: [
    { type: 'city',     position: [5, 0, 10],   name: 'Athens',  count: 8,  icon: '🏛️' },
    { type: 'city',     position: [-4, 0, 2],   name: 'Thessaloniki', count: 5, icon: '🕌' },
    { type: 'landmark', position: [3, 0, -8],   name: 'Mt. Olympus', icon: '⛰️' },
    { type: 'forest',   position: [-5, 0, -2],  count: 10, radius: 4 },
  ],

  NO: [
    { type: 'city',   position: [2, 0, 15],   name: 'Oslo',    count: 7,  icon: '🏙️' },
    { type: 'city',   position: [-3, 0, 5],   name: 'Bergen',  count: 5,  icon: '⛵' },
    { type: 'forest', position: [0, 0, 5],    count: 25, radius: 7 },  // Pine forests
    { type: 'forest', position: [-5, 0, -5],  count: 18, radius: 5 },
    { type: 'forest', position: [5, 0, 0],    count: 16, radius: 5 },
  ],

  US: [
    { type: 'city',   position: [18, 0, 0],   name: 'New York',    count: 14, icon: '🗽' },
    { type: 'city',   position: [-22, 0, 5],  name: 'Los Angeles', count: 10, icon: '🎬' },
    { type: 'city',   position: [-5, 0, 2],   name: 'Chicago',     count: 9,  icon: '🌆' },
    { type: 'forest', position: [5, 0, 5],    count: 20, radius: 6 },
    { type: 'forest', position: [-15, 0, -3], count: 18, radius: 6 },
    { type: 'forest', position: [10, 0, -3],  count: 15, radius: 5 },
  ],

  DE: [
    { type: 'city',   position: [2, 0, -2],   name: 'Berlin',  count: 10, icon: '🐻' },
    { type: 'city',   position: [-2, 0, 8],   name: 'Munich',  count: 8,  icon: '🍺' },
    { type: 'forest', position: [-8, 0, -3],  count: 20, radius: 6 },  // Black Forest
    { type: 'forest', position: [5, 0, 0],    count: 16, radius: 5 },
  ],

  FR: [
    { type: 'city',   position: [-2, 0, 2],   name: 'Paris',  count: 12, icon: '🗼' },
    { type: 'city',   position: [5, 0, 8],    name: 'Lyon',   count: 6,  icon: '🦁' },
    { type: 'city',   position: [-6, 0, 12],  name: 'Marseille', count: 5, icon: '⚓' },
    { type: 'forest', position: [0, 0, -5],   count: 18, radius: 5 },
    { type: 'forest', position: [-8, 0, 0],   count: 14, radius: 4 },
  ],

  EG: [
    { type: 'city',     position: [-2, 0, -8],  name: 'Cairo',      count: 12, icon: '🕌' },
    { type: 'city',     position: [-5, 0, -12], name: 'Alexandria', count: 7,  icon: '🏛️' },
    { type: 'landmark', position: [-3, 0, -9],  name: 'Pyramids',   icon: '🔺' },
    // Nile delta — a few small forest clusters
    { type: 'forest',   position: [-4, 0, -6],  count: 6, radius: 2 },
  ],

  CN: [
    { type: 'city',     position: [15, 0, -5],  name: 'Beijing',  count: 14, icon: '🏯' },
    { type: 'city',     position: [18, 0, 2],   name: 'Shanghai', count: 12, icon: '🌆' },
    { type: 'landmark', position: [12, 0, -10], name: 'Great Wall', icon: '🧱' },
    { type: 'forest',   position: [5, 0, 0],    count: 16, radius: 5 },
    { type: 'forest',   position: [10, 0, 8],   count: 14, radius: 5 },
  ],

  IN: [
    { type: 'city',   position: [5, 0, 5],    name: 'Delhi',   count: 12, icon: '🕌' },
    { type: 'city',   position: [8, 0, 12],   name: 'Mumbai',  count: 10, icon: '🏙️' },
    { type: 'city',   position: [2, 0, 2],    name: 'Agra',    count: 5,  icon: '🕌' },
    { type: 'forest', position: [-5, 0, 5],   count: 14, radius: 5 },
    { type: 'forest', position: [0, 0, 10],   count: 12, radius: 4 },
  ],

  RU: [
    { type: 'city',   position: [-5, 0, 0],   name: 'Moscow',       count: 14, icon: '🏯' },
    { type: 'city',   position: [-12, 0, -5], name: 'St. Petersburg', count: 9, icon: '💎' },
    { type: 'forest', position: [0, 0, -5],   count: 35, radius: 12 },  // Siberian taiga
    { type: 'forest', position: [-8, 0, 5],   count: 25, radius: 8  },
  ],

  TR: [
    { type: 'city',     position: [-5, 0, -3], name: 'Istanbul',  count: 12, icon: '🕌' },
    { type: 'city',     position: [5, 0, 2],   name: 'Ankara',    count: 7,  icon: '🏛️' },
    { type: 'landmark', position: [20, 0, -8], name: 'Mt. Ararat', icon: '🏔️' },
    { type: 'forest',   position: [-8, 0, -8], count: 10, radius: 4 },
  ],
};
