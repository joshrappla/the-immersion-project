'use client';

import { getCountryBackground } from '@/data/countryBackgrounds';
import { getCountryName } from '@/lib/countries';

interface MediaItem {
  mediaId: string;
  title: string;
  mediaType: string;
  timePeriod: string;
  startYear: number;
  endYear: number;
  countryCodes?: string[];
}

interface CountryInfoPanelProps {
  countryCode: string;
  mediaItems: MediaItem[];
  onClose: () => void;
}

function formatYear(year: number): string {
  return year < 0 ? `${Math.abs(year)} BC` : `${year} AD`;
}

export default function CountryInfoPanel({ countryCode, mediaItems, onClose }: CountryInfoPanelProps) {
  const bg = getCountryBackground(countryCode);
  const name = bg.name !== 'Unknown' ? bg.name : getCountryName(countryCode);

  const countryItems = mediaItems.filter(item => item.countryCodes?.includes(countryCode));
  const erasSet = new Set(countryItems.map(i => i.timePeriod));
  const allYears = countryItems.flatMap(i => [i.startYear, i.endYear]);
  const minYear = allYears.length ? Math.min(...allYears) : 0;
  const maxYear = allYears.length ? Math.max(...allYears) : 0;

  // Era breakdown
  const eraCounts: Record<string, number> = {};
  countryItems.forEach(item => {
    eraCounts[item.timePeriod] = (eraCounts[item.timePeriod] ?? 0) + 1;
  });
  const eraBreakdown = Object.entries(eraCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Media type counts
  const typeCounts: Record<string, number> = {};
  countryItems.forEach(item => {
    const t = item.mediaType;
    typeCounts[t] = (typeCounts[t] ?? 0) + 1;
  });

  const typeColors: Record<string, string> = {
    Game: '#10b981', Movie: '#a855f7', 'TV Show': '#3b82f6', TV: '#3b82f6',
  };

  return (
    <div
      className="country-info-panel fixed left-4 top-20 w-72 rounded-xl border overflow-hidden z-30
                 shadow-2xl backdrop-blur-md"
      style={{
        background: `linear-gradient(180deg, ${bg.accentColor}18 0%, rgba(0,0,0,0.85) 100%)`,
        borderColor: `${bg.accentColor}40`,
      }}
    >
      {/* Header */}
      <div
        className="p-5 border-b"
        style={{ borderColor: `${bg.accentColor}30`, background: `${bg.accentColor}12` }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl leading-none">{bg.flag}</span>
            <div>
              <h2 className="text-white font-bold text-xl leading-tight">{name}</h2>
              {bg.nativeName && bg.nativeName !== name && (
                <p className="text-sm mt-0.5" style={{ color: bg.textColor }}>{bg.nativeName}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-gray-400
                       hover:text-white hover:bg-white/10 transition text-sm"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 space-y-2.5 border-b" style={{ borderColor: `${bg.accentColor}20` }}>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Stories</span>
          <span className="text-white font-semibold">{countryItems.length}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Eras Covered</span>
          <span className="text-white font-semibold">{erasSet.size}</span>
        </div>
        {allYears.length > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Time Span</span>
            <span className="text-white font-semibold text-xs">
              {formatYear(minYear)} – {formatYear(maxYear)}
            </span>
          </div>
        )}
      </div>

      {/* Media type breakdown */}
      {Object.keys(typeCounts).length > 0 && (
        <div className="px-4 pt-3 pb-2 border-b" style={{ borderColor: `${bg.accentColor}20` }}>
          <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-2">Media Types</h3>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(typeCounts).map(([type, count]) => (
              <span
                key={type}
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  background: `${typeColors[type] ?? '#6b7280'}25`,
                  color: typeColors[type] ?? '#9ca3af',
                  border: `1px solid ${typeColors[type] ?? '#6b7280'}40`,
                }}
              >
                {type} ({count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Era breakdown */}
      {eraBreakdown.length > 0 && (
        <div className="px-4 pt-3 pb-2 border-b" style={{ borderColor: `${bg.accentColor}20` }}>
          <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-2">By Era</h3>
          <div className="space-y-1.5">
            {eraBreakdown.map(([era, count]) => (
              <div key={era} className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: bg.accentColor }}
                />
                <span className="text-xs text-gray-300 flex-1 truncate">{era}</span>
                <span className="text-xs text-gray-500">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Landmarks */}
      {bg.landmarks.length > 0 && (
        <div className="px-4 pt-3 pb-2 border-b" style={{ borderColor: `${bg.accentColor}20` }}>
          <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-2">Landmarks</h3>
          <div className="flex flex-wrap gap-1">
            {bg.landmarks.map(lm => (
              <span key={lm} className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-300">{lm}</span>
            ))}
          </div>
        </div>
      )}

      {/* Back button */}
      <div className="p-4">
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-lg text-sm font-semibold transition
                     flex items-center justify-center gap-2"
          style={{
            background: `${bg.accentColor}20`,
            color: bg.textColor,
            border: `1px solid ${bg.accentColor}35`,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = `${bg.accentColor}35`)}
          onMouseLeave={e => (e.currentTarget.style.background = `${bg.accentColor}20`)}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Return to World View
        </button>
      </div>
    </div>
  );
}
