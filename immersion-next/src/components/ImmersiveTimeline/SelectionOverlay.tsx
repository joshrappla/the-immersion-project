'use client';

import { useState } from 'react';
import { getCountryBackground } from '@/data/countryBackgrounds';
import { getCountryName } from '@/lib/countries';

const AVAILABLE_COUNTRIES = [
  'JP', 'IT', 'GB', 'US', 'GR', 'NO',
  'DE', 'FR', 'EG', 'CN', 'IN', 'RU', 'TR',
];

const ERA_LIST = [
  { key: 'ancient',      label: 'Ancient World',        icon: '🏛️', years: '3000 BC – 500 BC' },
  { key: 'roman',        label: 'Roman Empire',          icon: '⚔️', years: '500 BC – 476 AD' },
  { key: 'viking',       label: 'Viking Age',            icon: '⛵', years: '793 – 1066 AD' },
  { key: 'medieval',     label: 'Medieval Era',          icon: '🏰', years: '476 – 1400 AD' },
  { key: 'renaissance',  label: 'Renaissance',           icon: '🎨', years: '1400 – 1600 AD' },
  { key: 'colonial',     label: 'Age of Exploration',   icon: '🧭', years: '1500 – 1800 AD' },
  { key: 'industrial',   label: 'Industrial Revolution', icon: '⚙️', years: '1760 – 1900 AD' },
  { key: 'worldwar',     label: 'World Wars',            icon: '🌍', years: '1914 – 1945 AD' },
  { key: 'modern',       label: 'Modern Era',            icon: '🚀', years: '1945 – Present' },
];

interface SelectionOverlayProps {
  phase: 'sky' | 'descending' | 'landed';
  selectedCountry: string | null;
  selectedEra: string | null;
  onSelectCountry: (code: string) => void;
  onSelectEra: (era: string) => void;
  onReturnToSky: () => void;
  onExitImmersive: () => void;
}

export default function SelectionOverlay({
  phase,
  selectedCountry,
  selectedEra,
  onSelectCountry,
  onSelectEra,
  onReturnToSky,
  onExitImmersive,
}: SelectionOverlayProps) {
  const [tab, setTab] = useState<'country' | 'era'>('country');

  const countryBg = selectedCountry ? getCountryBackground(selectedCountry) : null;

  // ── Sky phase: full selection panel ──────────────────────────────────
  if (phase === 'sky') {
    return (
      <div className="absolute inset-0 pointer-events-none z-10">

        {/* Top bar */}
        <div className="pointer-events-auto absolute top-0 left-0 right-0 flex items-center
                        justify-between px-6 py-4 bg-black/40 backdrop-blur-sm
                        border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌌</span>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">The Immersion Verse</h1>
              <p className="text-blue-300/60 text-xs">Immersive Historical Experience</p>
            </div>
          </div>
          <button
            onClick={onExitImmersive}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
                       text-gray-400 hover:text-white bg-white/5 hover:bg-white/10
                       border border-white/10 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Exit 3D Mode
          </button>
        </div>

        {/* Center hero text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center
                        pointer-events-none select-none">
          <h2 className="text-white/90 text-4xl font-bold tracking-wide mb-2"
              style={{ textShadow: '0 0 40px rgba(100,140,255,0.6)' }}>
            Where do you want to explore?
          </h2>
          <p className="text-blue-200/50 text-sm">Select a country or era to begin your descent</p>
        </div>

        {/* Selection panel — bottom center */}
        <div className="pointer-events-auto absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
          <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/60 backdrop-blur-md shadow-2xl">

            {/* Tab bar */}
            <div className="flex border-b border-white/10">
              <button
                className={`flex-1 py-3 text-sm font-semibold transition ${
                  tab === 'country'
                    ? 'text-white bg-white/10'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
                onClick={() => setTab('country')}
              >
                🌍 Countries
              </button>
              <button
                className={`flex-1 py-3 text-sm font-semibold transition ${
                  tab === 'era'
                    ? 'text-white bg-white/10'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
                onClick={() => setTab('era')}
              >
                📜 Eras
              </button>
            </div>

            {/* Country grid */}
            {tab === 'country' && (
              <div className="p-4 grid grid-cols-4 sm:grid-cols-7 gap-2 max-h-48 overflow-y-auto">
                {AVAILABLE_COUNTRIES.map(code => {
                  const bg = getCountryBackground(code);
                  const name = bg.name !== 'Unknown' ? bg.name : getCountryName(code);
                  const isSelected = code === selectedCountry;
                  return (
                    <button
                      key={code}
                      onClick={() => onSelectCountry(code)}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all
                                 hover:scale-105"
                      style={{
                        background: isSelected ? `${bg.accentColor}30` : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isSelected ? bg.accentColor : 'rgba(255,255,255,0.1)'}`,
                      }}
                    >
                      <span className="text-2xl leading-none">{bg.flag}</span>
                      <span className="text-xs text-gray-400 text-center leading-tight truncate w-full">
                        {name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Era list */}
            {tab === 'era' && (
              <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {ERA_LIST.map(era => {
                  const isSelected = era.key === selectedEra;
                  return (
                    <button
                      key={era.key}
                      onClick={() => onSelectEra(era.key)}
                      className="flex items-center gap-3 p-2.5 rounded-xl text-left transition-all hover:scale-[1.02]"
                      style={{
                        background: isSelected ? 'rgba(100,120,200,0.25)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isSelected ? '#6080c0' : 'rgba(255,255,255,0.1)'}`,
                      }}
                    >
                      <span className="text-xl flex-shrink-0">{era.icon}</span>
                      <div className="min-w-0">
                        <p className="text-white text-xs font-semibold truncate">{era.label}</p>
                        <p className="text-gray-500 text-xs">{era.years}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Descending phase: minimal flight UI ───────────────────────────────
  if (phase === 'descending') {
    return (
      <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/80 text-xl font-semibold tracking-wide animate-pulse"
             style={{ textShadow: '0 0 20px rgba(100,160,255,0.8)' }}>
            Descending to{' '}
            {selectedCountry
              ? (getCountryBackground(selectedCountry).flag + ' ' + (getCountryBackground(selectedCountry).name))
              : selectedEra ?? 'destination'}
            …
          </p>
        </div>
      </div>
    );
  }

  // ── Landed phase: bottom HUD ──────────────────────────────────────────
  if (phase === 'landed' && selectedCountry) {
    const bg = getCountryBackground(selectedCountry);
    return (
      <div className="absolute inset-0 pointer-events-none z-10">

        {/* Top-left: country name */}
        <div className="pointer-events-auto absolute top-4 left-4 flex items-center gap-3
                        px-4 py-3 rounded-xl bg-black/50 backdrop-blur-sm
                        border"
             style={{ borderColor: `${bg.accentColor}40` }}>
          <span className="text-3xl">{bg.flag}</span>
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">{bg.name}</h2>
            {bg.nativeName && bg.nativeName !== bg.name && (
              <p className="text-xs" style={{ color: bg.textColor }}>{bg.nativeName}</p>
            )}
          </div>
        </div>

        {/* Top-right: navigation buttons */}
        <div className="pointer-events-auto absolute top-4 right-4 flex flex-col gap-2">
          <button
            onClick={onReturnToSky}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold
                       bg-black/50 backdrop-blur-sm border border-white/10
                       text-gray-300 hover:text-white hover:bg-white/10 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            Back to Sky
          </button>
          <button
            onClick={onExitImmersive}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold
                       bg-black/50 backdrop-blur-sm border border-white/10
                       text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            Exit 3D
          </button>
        </div>

        {/* Bottom landmarks band */}
        {bg.landmarks.length > 0 && (
          <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2
                          flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm
                          border"
               style={{ borderColor: `${bg.accentColor}25` }}>
            <span className="text-xs text-gray-500">Notable Places:</span>
            {bg.landmarks.map(lm => (
              <span
                key={lm}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: `${bg.accentColor}20`,
                  color: bg.textColor,
                  border: `1px solid ${bg.accentColor}30`,
                }}
              >
                {lm}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}
