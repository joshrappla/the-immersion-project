'use client';

import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

/** ISO alpha-2 → Natural Earth country name (same set used by CountryMap). */
const ISO_A2_TO_NAME: Record<string, string> = {
  AU: 'Australia', CA: 'Canada', DE: 'Germany', DK: 'Denmark', EG: 'Egypt',
  ES: 'Spain', FR: 'France', GB: 'United Kingdom', GR: 'Greece', IE: 'Ireland',
  IN: 'India', IS: 'Iceland', IT: 'Italy', NO: 'Norway', NZ: 'New Zealand',
  SE: 'Sweden', TR: 'Turkey', ZA: 'South Africa', RS: 'Serbia', BG: 'Bulgaria',
  HU: 'Hungary', RO: 'Romania', SA: 'Saudi Arabia', IQ: 'Iraq', SY: 'Syria',
  LY: 'Libya', TN: 'Tunisia', DZ: 'Algeria', JO: 'Jordan', MN: 'Mongolia',
  CN: 'China', RU: 'Russia', KZ: 'Kazakhstan', KG: 'Kyrgyzstan', UZ: 'Uzbekistan',
  TM: 'Turkmenistan', AF: 'Afghanistan', IR: 'Iran', UA: 'Ukraine', PL: 'Poland',
  CZ: 'Czech Republic', AT: 'Austria', CH: 'Switzerland', NL: 'Netherlands',
  BE: 'Belgium', PT: 'Portugal', LB: 'Lebanon', IL: 'Israel', MA: 'Morocco',
  NG: 'Nigeria', ET: 'Ethiopia', KE: 'Kenya', US: 'United States of America',
  MX: 'Mexico', BR: 'Brazil', AR: 'Argentina', PE: 'Peru', CO: 'Colombia',
  JP: 'Japan', KR: 'South Korea', VN: 'Vietnam', TH: 'Thailand', ID: 'Indonesia',
  PK: 'Pakistan', MM: 'Myanmar', PH: 'Philippines', MY: 'Malaysia',
};

interface Props {
  /** ISO 3166-1 alpha-2 codes to highlight. */
  countries: string[];
  /** Height of the map container (default 140px). */
  height?: number;
}

/**
 * Compact world map that highlights a set of countries.
 * Used in the regions admin interface to preview a mapping.
 */
export default function RegionMapPreview({ countries, height = 140 }: Props) {
  const highlighted = new Set(
    countries.map((c) => ISO_A2_TO_NAME[c.toUpperCase()] ?? '')
  );

  return (
    <div
      className="w-full rounded-lg overflow-hidden bg-gray-900 border border-gray-700"
      style={{ height }}
    >
      <ComposableMap
        projectionConfig={{ scale: 110 }}
        width={500}
        height={260}
        style={{ width: '100%', height: '100%' }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const name: string = geo.properties?.name ?? '';
              const isActive = highlighted.has(name);
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={isActive ? '#7c3aed' : '#1f2937'}
                  stroke="#374151"
                  strokeWidth={0.4}
                  style={{
                    default: { outline: 'none' },
                    hover:   { outline: 'none', fill: isActive ? '#9333ea' : '#374151' },
                    pressed: { outline: 'none' },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
}
