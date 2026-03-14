'use client';

import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { getCountryBackground } from '@/data/countryBackgrounds';
import { getCountryName } from '@/lib/countries';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// ISO numeric → ISO alpha-2 mapping (subset of common countries)
const NUMERIC_TO_ALPHA2: Record<string, string> = {
  '392': 'JP', '380': 'IT', '826': 'GB', '840': 'US', '300': 'GR', '578': 'NO',
  '276': 'DE', '250': 'FR', '818': 'EG', '156': 'CN', '356': 'IN', '643': 'RU',
  '792': 'TR', '724': 'ES', '620': 'PT', '040': 'AT', '528': 'NL', '056': 'BE',
  '752': 'SE', '208': 'DK', '246': 'FI', '372': 'IE', '756': 'CH', '616': 'PL',
  '100': 'BG', '642': 'RO', '348': 'HU', '203': 'CZ', '703': 'SK',
  '036': 'AU', '554': 'NZ', '032': 'AR', '076': 'BR', '484': 'MX',
  '410': 'KR', '682': 'SA', '764': 'TH', '704': 'VN', '360': 'ID',
  '404': 'KE', '710': 'ZA', '566': 'NG',
};

interface MiniMapNavProps {
  selectedCountry: string;
  onCountrySelect?: (code: string) => void;
}

export default function MiniMapNav({ selectedCountry, onCountrySelect }: MiniMapNavProps) {
  const bg = getCountryBackground(selectedCountry);
  const name = bg.name !== 'Unknown' ? bg.name : getCountryName(selectedCountry);

  return (
    <div
      className="fixed bottom-28 right-4 w-52 rounded-xl border overflow-hidden z-30
                 shadow-2xl backdrop-blur-md"
      style={{
        background: 'rgba(0,0,0,0.75)',
        borderColor: `${bg.accentColor}40`,
      }}
    >
      {/* Map */}
      <div className="relative w-full h-28 overflow-hidden">
        <ComposableMap
          width={208}
          height={112}
          projectionConfig={{ scale: 100, center: [0, 20] }}
          style={{ width: '100%', height: '100%' }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => {
                const numericId = String(geo.id).padStart(3, '0');
                const alpha2 = NUMERIC_TO_ALPHA2[numericId];
                const isSelected = alpha2 === selectedCountry;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => {
                      if (alpha2 && onCountrySelect) onCountrySelect(alpha2);
                    }}
                    style={{
                      default: {
                        fill: isSelected ? bg.accentColor : '#1a2030',
                        stroke: '#2a3040',
                        strokeWidth: 0.3,
                        outline: 'none',
                        opacity: isSelected ? 0.9 : 0.55,
                        cursor: alpha2 ? 'pointer' : 'default',
                      },
                      hover: {
                        fill: alpha2 ? (isSelected ? bg.accentColor : '#2a3848') : '#1a2030',
                        stroke: '#3a4050',
                        strokeWidth: 0.3,
                        outline: 'none',
                        opacity: 0.8,
                      },
                      pressed: { fill: bg.accentColor, outline: 'none' },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </div>

      {/* Label */}
      <div
        className="px-3 py-2 flex items-center gap-2"
        style={{ borderTop: `1px solid ${bg.accentColor}25` }}
      >
        <span className="text-base leading-none">{bg.flag}</span>
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-medium truncate">{name}</p>
          <p className="text-gray-500 text-xs">📍 You are here</p>
        </div>
      </div>
    </div>
  );
}
