'use client';

import { useEffect, useRef, useState } from 'react';
import { getCountryBackground } from '@/data/countryBackgrounds';
import { getCountryName } from '@/lib/countries';
import CountryInfoPanel from './CountryInfoPanel';
import MiniMapNav from './MiniMapNav';
import AtmosphericParticles from './AtmosphericParticles';

interface MediaItem {
  mediaId: string;
  title: string;
  mediaType: string;
  timePeriod: string;
  startYear: number;
  endYear: number;
  description: string;
  imageUrl: string;
  streamingUrl: string;
  country?: string;
  countryCodes?: string[];
}

interface CountryZoomViewProps {
  countryCode: string;
  allMediaItems: MediaItem[];
  onClose: () => void;
  onCountrySwitch?: (code: string) => void;
  particlesEnabled?: boolean;
}

function formatYear(year: number): string {
  return year < 0 ? `${Math.abs(year)} BC` : String(year);
}

const TYPE_COLORS: Record<string, string> = {
  Game: '#10b981', Movie: '#a855f7', 'TV Show': '#3b82f6', TV: '#3b82f6',
};

export default function CountryZoomView({
  countryCode,
  allMediaItems,
  onClose,
  onCountrySwitch,
  particlesEnabled = true,
}: CountryZoomViewProps) {
  const bg = getCountryBackground(countryCode);
  const name = bg.name !== 'Unknown' ? bg.name : getCountryName(countryCode);

  // Animate in/out
  const [phase, setPhase] = useState<'entering' | 'visible' | 'exiting'>('entering');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const scrollOffset = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const countryItems = allMediaItems.filter(item =>
    item.countryCodes?.includes(countryCode)
  ).sort((a, b) => a.startYear - b.startYear);

  useEffect(() => {
    // Small rAF delay to allow CSS transition to register
    const raf = requestAnimationFrame(() => setPhase('visible'));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Track horizontal scroll offset for parallax
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => { scrollOffset.current = el.scrollLeft; };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const handleClose = () => {
    setPhase('exiting');
    setTimeout(onClose, 480);
  };

  const handleCountrySwitch = (code: string) => {
    if (code === countryCode) return;
    onCountrySwitch?.(code);
  };

  // CSS class based on phase
  const phaseClass =
    phase === 'entering' ? 'opacity-0 scale-105' :
    phase === 'visible'  ? 'opacity-100 scale-100' :
                           'opacity-0 scale-95';

  return (
    <div
      className={`fixed inset-0 z-40 transition-all duration-500 ease-out ${phaseClass}`}
      style={{ transformOrigin: 'center center' }}
    >
      {/* ── Background gradient ──────────────────────────────────────────── */}
      <div className="absolute inset-0" style={{ background: bg.gradient }} />

      {/* ── SVG parallax layers ──────────────────────────────────────────── */}
      {bg.layers.map((layer, i) => (
        <div
          key={i}
          className="absolute bottom-0 pointer-events-none"
          style={{
            left: '-10%',
            width: '120%',
            height: layer.height,
            backgroundImage: `url(${layer.image})`,
            backgroundRepeat: 'repeat-x',
            backgroundPosition: 'center bottom',
            backgroundSize: 'auto 100%',
            opacity: layer.opacity,
            mixBlendMode: (layer.blendMode as React.CSSProperties['mixBlendMode']) ?? 'screen',
          }}
        />
      ))}

      {/* ── Atmospheric particles ────────────────────────────────────────── */}
      {particlesEnabled && (
        <AtmosphericParticles
          config={bg.particles}
          scrollOffset={0}
          mode="horizontal"
        />
      )}

      {/* ── Dark content scrim ───────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />

      {/* ── Header bar ──────────────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4
                      bg-black/50 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-4">
          {/* Back button */}
          <button
            onClick={handleClose}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                       transition backdrop-blur-sm"
            style={{
              background: `${bg.accentColor}22`,
              color: bg.textColor,
              border: `1px solid ${bg.accentColor}40`,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = `${bg.accentColor}38`)}
            onMouseLeave={e => (e.currentTarget.style.background = `${bg.accentColor}22`)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            World View
          </button>

          {/* Country title */}
          <div className="flex items-center gap-3">
            <span className="text-3xl leading-none">{bg.flag}</span>
            <div>
              <h1 className="text-white font-bold text-2xl leading-tight">{name}</h1>
              {bg.nativeName && bg.nativeName !== name && (
                <p className="text-sm" style={{ color: bg.textColor }}>{bg.nativeName}</p>
              )}
            </div>
          </div>
        </div>

        {/* Story count badge */}
        <div
          className="px-4 py-2 rounded-full text-sm font-semibold"
          style={{
            background: `${bg.accentColor}22`,
            color: bg.textColor,
            border: `1px solid ${bg.accentColor}40`,
          }}
        >
          {countryItems.length} {countryItems.length === 1 ? 'Story' : 'Stories'}
        </div>
      </div>

      {/* ── Main scrollable content ──────────────────────────────────────── */}
      <div
        ref={scrollContainerRef}
        className="relative z-10 h-[calc(100vh-8rem)] overflow-y-auto overflow-x-hidden px-4 py-6"
      >
        {countryItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <span className="text-6xl opacity-40">{bg.flag}</span>
            <p className="text-gray-400 text-lg">No stories found for {name}</p>
            <p className="text-gray-600 text-sm">Add media items with this country code to see them here</p>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            {/* Section header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 opacity-20" style={{ background: bg.accentColor }} />
              <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: bg.textColor }}>
                Historical Stories
              </h2>
              <div className="h-px flex-1 opacity-20" style={{ background: bg.accentColor }} />
            </div>

            {/* Media cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
              {countryItems.map(item => {
                const color = TYPE_COLORS[item.mediaType] ?? '#6b7280';
                return (
                  <button
                    key={item.mediaId}
                    onClick={() => setSelectedItem(item)}
                    className="text-left rounded-xl border p-4 transition-all duration-200
                               hover:scale-[1.02] hover:shadow-xl backdrop-blur-sm group"
                    style={{
                      background: `${bg.accentColor}0d`,
                      borderColor: `${bg.accentColor}28`,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = `${bg.accentColor}55`)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = `${bg.accentColor}28`)}
                  >
                    {/* Type pill */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: `${color}22`, color }}
                      >
                        {item.mediaType}
                      </span>
                      <span className="text-xs text-gray-500">
                        {item.startYear === item.endYear
                          ? formatYear(item.startYear)
                          : `${formatYear(item.startYear)}–${formatYear(item.endYear)}`}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-white font-bold text-base mb-1 leading-snug group-hover:text-opacity-90">
                      {item.title}
                    </h3>

                    {/* Era badge */}
                    <p className="text-xs mb-2" style={{ color: bg.textColor, opacity: 0.7 }}>
                      {item.timePeriod}
                    </p>

                    {/* Description preview */}
                    {item.description && (
                      <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Country Info Panel (left sidebar) ───────────────────────────── */}
      <CountryInfoPanel
        countryCode={countryCode}
        mediaItems={allMediaItems}
        onClose={handleClose}
      />

      {/* ── Mini Map (bottom-right) ──────────────────────────────────────── */}
      <MiniMapNav
        selectedCountry={countryCode}
        onCountrySelect={handleCountrySwitch}
      />

      {/* ── Media detail modal ───────────────────────────────────────────── */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl border"
            style={{
              background: `linear-gradient(180deg, ${bg.accentColor}18 0%, rgba(10,10,15,0.97) 100%)`,
              borderColor: `${bg.accentColor}40`,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b flex justify-between items-start"
                 style={{ borderColor: `${bg.accentColor}25` }}>
              <div className="flex-1 pr-4">
                <h2 className="text-white text-xl font-bold mb-2">{selectedItem.title}</h2>
                <div className="flex gap-2 flex-wrap">
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{
                      background: `${TYPE_COLORS[selectedItem.mediaType] ?? '#6b7280'}22`,
                      color: TYPE_COLORS[selectedItem.mediaType] ?? '#9ca3af',
                    }}
                  >
                    {selectedItem.mediaType}
                  </span>
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ background: `${bg.accentColor}20`, color: bg.textColor }}
                  >
                    {selectedItem.timePeriod}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full
                           text-gray-400 hover:text-white hover:bg-white/10 transition text-sm"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-300 leading-relaxed mb-6 text-sm">{selectedItem.description}</p>
              {selectedItem.streamingUrl && (
                <a
                  href={selectedItem.streamingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition text-white"
                  style={{ background: bg.accentColor }}
                >
                  View Source
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
