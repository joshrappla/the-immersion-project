'use client';

import dynamic  from 'next/dynamic';
import { useState, useEffect, useCallback } from 'react';
import HorizontalTimeline from '@/components/HorizontalTimeline';
import MediaDetailModal   from '@/components/ImmersiveTimeline/MediaDetailModal';
import MobileTimeline     from '@/components/ImmersiveTimeline/MobileTimeline';
import LoadingScreen      from '@/components/ImmersiveTimeline/LoadingScreen';
import type { MediaItem } from '@/types/media';

// Three.js scene — client-only, no SSR
const ImmersiveScene = dynamic(
  () => import('@/components/ImmersiveTimeline/ImmersiveScene'),
  { ssr: false }
);

/** Detect whether the device / browser can run a WebGL 3D scene well. */
function checkIsLowPerf(): boolean {
  if (typeof window === 'undefined') return false;

  // Touch-first viewport → treat as mobile
  if (window.innerWidth < 768) return true;

  // No WebGL support
  try {
    const c = document.createElement('canvas');
    if (!c.getContext('webgl') && !c.getContext('experimental-webgl')) return true;
  } catch {
    return true;
  }

  // Very low CPU core count
  if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency != null
      && navigator.hardwareConcurrency <= 2) return true;

  return false;
}

export default function TimelinePage() {
  const [immersiveMode,   setImmersiveMode]   = useState(false);
  const [useMobile,       setUseMobile]       = useState(false);
  const [deviceChecked,   setDeviceChecked]   = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedEra,     setSelectedEra]     = useState<string | null>(null);
  const [mediaItems,      setMediaItems]      = useState<MediaItem[]>([]);
  const [selectedMedia,   setSelectedMedia]   = useState<MediaItem | null>(null);
  const [isFetching,      setIsFetching]      = useState(false);

  // ── Device detection + URL param read (client only) ──────────────────────
  useEffect(() => {
    // Check capabilities
    setUseMobile(checkIsLowPerf());
    setDeviceChecked(true);

    // Re-check on resize
    const onResize = () => setUseMobile(checkIsLowPerf());
    window.addEventListener('resize', onResize);

    // Read URL params for deep-linking: /timeline?country=JP or ?era=medieval
    const params = new URLSearchParams(window.location.search);
    const country = params.get('country');
    const era     = params.get('era');
    if (country || era) {
      if (country) setSelectedCountry(country);
      if (era)     setSelectedEra(era);
      setImmersiveMode(true);
    }

    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ── Write URL when selection changes ─────────────────────────────────────
  useEffect(() => {
    if (!deviceChecked) return;
    const params = new URLSearchParams();
    if (selectedCountry) params.set('country', selectedCountry);
    if (selectedEra)     params.set('era',     selectedEra);
    const qs  = params.toString();
    const url = qs ? `/timeline?${qs}` : '/timeline';
    window.history.replaceState(null, '', url);
  }, [selectedCountry, selectedEra, deviceChecked]);

  // ── Fetch media when in immersive mode and a country/era is selected ──────
  useEffect(() => {
    if (!immersiveMode) return;
    if (!selectedCountry && !selectedEra) {
      setMediaItems([]);
      return;
    }

    let cancelled = false;
    setIsFetching(true);

    (async () => {
      try {
        const params = new URLSearchParams();
        if (selectedCountry) params.set('country', selectedCountry);
        if (selectedEra)     params.set('era',     selectedEra);

        const res = await fetch(`/api/media?${params}`, {
          signal: AbortSignal.timeout(12_000),
        });
        if (!res.ok) throw new Error(`API ${res.status}`);

        const data = await res.json();
        const items: MediaItem[] = Array.isArray(data)           ? data
          : Array.isArray(data.items)   ? data.items
          : Array.isArray(data.media)   ? data.media
          : Array.isArray(data.results) ? data.results
          : Object.values(data) as MediaItem[];

        if (!cancelled) setMediaItems(items);
      } catch (err) {
        console.error('[ImmersiveTimeline] media fetch failed:', err);
        if (!cancelled) setMediaItems([]);
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    })();

    return () => { cancelled = true; };
  }, [immersiveMode, selectedCountry, selectedEra]);

  const handleExit = useCallback(() => {
    setImmersiveMode(false);
    setSelectedCountry(null);
    setSelectedEra(null);
    setMediaItems([]);
  }, []);

  const handleMediaSelect  = useCallback((item: MediaItem) => setSelectedMedia(item), []);
  const handleCloseMedia   = useCallback(() => setSelectedMedia(null), []);

  // ── Render ────────────────────────────────────────────────────────────────

  // Waiting for client device check
  if (!deviceChecked && immersiveMode) {
    return <LoadingScreen message="Detecting device capabilities" />;
  }

  // ── Immersive mode: mobile / low-perf fallback ────────────────────────────
  if (immersiveMode && useMobile) {
    return (
      <>
        <MobileTimeline
          mediaItems={mediaItems}
          selectedCountry={selectedCountry}
          selectedEra={selectedEra}
          onSelectCountry={setSelectedCountry}
          onSelectEra={setSelectedEra}
          onMediaSelect={handleMediaSelect}
          onExitMobile={handleExit}
        />
        {selectedMedia && (
          <MediaDetailModal item={selectedMedia} onClose={handleCloseMedia} />
        )}
      </>
    );
  }

  // ── Standard page (desktop) ───────────────────────────────────────────────
  return (
    <>
      <HorizontalTimeline />

      {/* 3D Explore FAB */}
      {!immersiveMode && (
        <button
          onClick={() => setImmersiveMode(true)}
          className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5
                     rounded-xl font-semibold text-sm shadow-2xl transition-all
                     hover:scale-105 active:scale-95 border border-blue-400/30"
          style={{
            background: 'linear-gradient(135deg, #0a0e2a 0%, #1a1040 100%)',
            color:      '#a0c8ff',
            boxShadow:  '0 0 20px rgba(80,120,255,0.3)',
          }}
          title="Enter immersive 3D mode"
        >
          <span className="text-base">🌌</span>
          <span>{useMobile ? '📱 Mobile View' : '3D Explore'}</span>
        </button>
      )}

      {/* Immersive overlay */}
      {immersiveMode && (
        <ImmersiveScene
          onExit={handleExit}
          mediaItems={mediaItems}
          onMediaSelect={handleMediaSelect}
        />
      )}

      {/* Fetching indicator (inside immersive mode) */}
      {immersiveMode && isFetching && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[55]
                        px-4 py-1.5 rounded-full text-xs font-medium
                        bg-black/60 backdrop-blur border border-white/10 text-blue-300/70">
          Loading media nodes…
        </div>
      )}

      {/* Media detail modal */}
      {selectedMedia && (
        <MediaDetailModal item={selectedMedia} onClose={handleCloseMedia} />
      )}
    </>
  );
}
