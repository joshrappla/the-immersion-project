'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import HorizontalTimeline from '@/components/HorizontalTimeline';

// Dynamic import — no SSR for the Three.js canvas
const ImmersiveScene = dynamic(
  () => import('@/components/ImmersiveTimeline/ImmersiveScene'),
  { ssr: false }
);

export default function TimelinePage() {
  const [immersiveMode, setImmersiveMode] = useState(false);

  return (
    <>
      {/* Standard 2D timeline */}
      <HorizontalTimeline />

      {/* Immersive mode toggle button — top-right fab */}
      {!immersiveMode && (
        <button
          onClick={() => setImmersiveMode(true)}
          className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl
                     font-semibold text-sm shadow-2xl transition-all hover:scale-105 active:scale-95
                     border border-blue-400/30"
          style={{
            background: 'linear-gradient(135deg, #0a0e2a 0%, #1a1040 100%)',
            color: '#a0c8ff',
            boxShadow: '0 0 20px rgba(80,120,255,0.3)',
          }}
          title="Enter immersive 3D mode"
        >
          <span className="text-base">🌌</span>
          <span>3D Explore</span>
        </button>
      )}

      {/* Full-screen immersive R3F scene */}
      {immersiveMode && (
        <ImmersiveScene onExit={() => setImmersiveMode(false)} />
      )}
    </>
  );
}
