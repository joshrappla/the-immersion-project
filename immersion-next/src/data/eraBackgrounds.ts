export interface EraBackground {
  gradient: string;       // CSS gradient string
  accentColor: string;    // Hex color for glow/particle tinting
  name: string;           // Display name
  years: [number, number];
}

export const ERA_BACKGROUNDS: Record<string, EraBackground> = {
  'Ancient Period': {
    gradient: 'linear-gradient(135deg, #78350f 0%, #92400e 55%, #d97706 100%)',
    accentColor: '#d97706',
    name: 'Ancient World',
    years: [-3000, 500],
  },
  'Ancient Rome': {
    gradient: 'linear-gradient(135deg, #7f1d1d 0%, #92400e 50%, #57534e 100%)',
    accentColor: '#dc2626',
    name: 'Roman Empire',
    years: [-753, 476],
  },
  'Ancient Greece': {
    gradient: 'linear-gradient(135deg, #0c4a6e 0%, #1d4ed8 50%, #475569 100%)',
    accentColor: '#3b82f6',
    name: 'Ancient Greece',
    years: [-800, -31],
  },
  'Viking Age': {
    gradient: 'linear-gradient(135deg, #0f172a 0%, #164e63 45%, #1e3a5f 100%)',
    accentColor: '#06b6d4',
    name: 'Viking Age',
    years: [793, 1066],
  },
  'Medieval Period': {
    gradient: 'linear-gradient(135deg, #1c1917 0%, #064e3b 50%, #1e293b 100%)',
    accentColor: '#10b981',
    name: 'Medieval Era',
    years: [500, 1500],
  },
  'The Crusades': {
    gradient: 'linear-gradient(135deg, #1c1917 0%, #134e4a 50%, #450a0a 100%)',
    accentColor: '#14b8a6',
    name: 'The Crusades',
    years: [1095, 1291],
  },
  'Third Crusade': {
    gradient: 'linear-gradient(135deg, #1c1917 0%, #134e4a 50%, #450a0a 100%)',
    accentColor: '#14b8a6',
    name: 'The Crusades',
    years: [1189, 1192],
  },
  'Renaissance': {
    gradient: 'linear-gradient(135deg, #92400e 0%, #9f1239 50%, #581c87 100%)',
    accentColor: '#f43f5e',
    name: 'Renaissance',
    years: [1400, 1600],
  },
  'Italian Renaissance': {
    gradient: 'linear-gradient(135deg, #92400e 0%, #9f1239 50%, #581c87 100%)',
    accentColor: '#f43f5e',
    name: 'Italian Renaissance',
    years: [1400, 1600],
  },
  'Colonial Era': {
    gradient: 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #134e4a 100%)',
    accentColor: '#f59e0b',
    name: 'Age of Exploration',
    years: [1500, 1800],
  },
  'Industrial Revolution': {
    gradient: 'linear-gradient(135deg, #1f2937 0%, #374151 50%, #52525b 100%)',
    accentColor: '#9ca3af',
    name: 'Industrial Revolution',
    years: [1760, 1840],
  },
  'Industrial Age': {
    gradient: 'linear-gradient(135deg, #1f2937 0%, #374151 50%, #52525b 100%)',
    accentColor: '#9ca3af',
    name: 'Industrial Age',
    years: [1760, 1900],
  },
  'World War Era': {
    gradient: 'linear-gradient(135deg, #0f172a 0%, #450a0a 50%, #1f2937 100%)',
    accentColor: '#ef4444',
    name: 'World Wars',
    years: [1914, 1945],
  },
  'Post-WWI': {
    gradient: 'linear-gradient(135deg, #0f172a 0%, #450a0a 50%, #1f2937 100%)',
    accentColor: '#ef4444',
    name: 'Post-War Era',
    years: [1918, 1950],
  },
  'Modern Era': {
    gradient: 'linear-gradient(135deg, #1e1b4b 0%, #5b21b6 50%, #701a75 100%)',
    accentColor: '#a855f7',
    name: 'Modern Era',
    years: [1945, 2025],
  },
  'Wild West': {
    gradient: 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #92400e 100%)',
    accentColor: '#f59e0b',
    name: 'Wild West',
    years: [1865, 1900],
  },
  'Meiji Restoration': {
    gradient: 'linear-gradient(135deg, #064e3b 0%, #0f766e 50%, #1e1b4b 100%)',
    accentColor: '#2dd4bf',
    name: 'Meiji Restoration',
    years: [1868, 1912],
  },
  'American Revolution': {
    gradient: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 50%, #4338ca 100%)',
    accentColor: '#60a5fa',
    name: 'American Revolution',
    years: [1775, 1783],
  },
};

const DEFAULT_BACKGROUND: EraBackground = {
  gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
  accentColor: '#64748b',
  name: 'Unknown Era',
  years: [0, 0],
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
