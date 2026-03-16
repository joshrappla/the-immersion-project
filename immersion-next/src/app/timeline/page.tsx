'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback } from 'react';
import HorizontalTimeline from '@/components/HorizontalTimeline';
import MediaDetailModal   from '@/components/ImmersiveTimeline/MediaDetailModal';
import type { MediaItem }  from '@/types/media';

// Three.js scene — no SSR
const ImmersiveScene = dynamic(
  () => import('@/components/ImmersiveTimeline/ImmersiveScene'),
  { ssr: false }
);

export default function TimelinePage() {
  const [immersiveMode,   setImmersiveMode]   = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedEra,     setSelectedEra]     = useState<string | null>(null);
  const [mediaItems,      setMediaItems]      = useState<MediaItem[]>([]);
  const [selectedMedia,   setSelectedMedia]   = useState<MediaItem | null>(null);
  const [isFetching,      setIsFetching]      = useState(false);

  // Fetch filtered media whenever country/era selection changes while in immersive mode
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

        // Normalise different response shapes
        const items: MediaItem[] = Array.isArray(data)
          ? data
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

  // When exiting immersive mode, clear selection state
  const handleExit = useCallback(() => {
    setImmersiveMode(false);
    setSelectedCountry(null);
    setSelectedEra(null);
    setMediaItems([]);
  }, []);

  const handleMediaSelect = useCallback((item: MediaItem) => {
    setSelectedMedia(item);
  }, []);

  return (
    <>
      {/* Standard 2D timeline always present in the background */}
      <HorizontalTimeline />

      {/* 3D Explore FAB button (hidden while in immersive mode) */}
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
          <span>3D Explore</span>
        </button>
      )}

      {/* Full-screen immersive R3F scene */}
      {immersiveMode && (
        <ImmersiveScene
          onExit={handleExit}
          mediaItems={mediaItems}
          onMediaSelect={handleMediaSelect}
        />
      )}

      {/* Subtle fetching indicator (shown inside 3D mode) */}
      {immersiveMode && isFetching && (
        <div
          className="fixed top-16 left-1/2 -translate-x-1/2 z-[55]
                     px-4 py-1.5 rounded-full text-xs font-medium
                     bg-black/60 backdrop-blur border border-white/10 text-blue-300/70"
        >
          Loading media nodes…
        </div>
      )}

      {/* Media detail modal */}
      {selectedMedia && (
        <MediaDetailModal
          item={selectedMedia}
          onClose={() => setSelectedMedia(null)}
        />
      )}
    </>
  );
}
