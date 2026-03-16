'use client';

import { Suspense, useState, useCallback } from 'react';
import { Canvas }          from '@react-three/fiber';
import { OrbitControls }   from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

import DuskSky           from './DuskSky';
import StarField         from './StarField';
import CloudLayer        from './CloudLayer';
import CameraController  from './CameraController';
import TerrainMap        from './TerrainMap';
import MediaNodes        from './MediaNodes';
import SelectionOverlay  from './SelectionOverlay';
import LoadingScreen     from './LoadingScreen';
import type { MediaItem } from '@/types/media';

interface ImmersiveSceneProps {
  onExit:          () => void;
  initialCountry?: string | null;
  mediaItems?:     MediaItem[];
  onMediaSelect?:  (item: MediaItem) => void;
}

type Phase = 'sky' | 'descending' | 'landed';

// ── Scene inner (rendered inside Canvas) ─────────────────────────────────────
function SceneContent({
  phase,
  selectedCountry,
  selectedEra,
  mediaItems,
  onLanded,
  onMediaSelect,
}: {
  phase:           Phase;
  selectedCountry: string | null;
  selectedEra:     string | null;
  mediaItems:      MediaItem[];
  onLanded:        () => void;
  onMediaSelect:   (item: MediaItem) => void;
}) {
  const terrainVisible = phase === 'landed';

  return (
    <>
      <DuskSky />
      <StarField count={2200} radius={420} twinkleSpeed={0.7} />

      {phase !== 'landed' && (
        <CloudLayer altitude={55} opacity={0.18} count={24} driftSpeed={0.35} />
      )}

      <TerrainMap
        visible={terrainVisible}
        country={selectedCountry}
        era={selectedEra}
      />

      {/* Media nodes — only once terrain is fully shown */}
      {phase === 'landed' && mediaItems.length > 0 && (
        <MediaNodes
          items={mediaItems}
          country={selectedCountry}
          era={selectedEra}
          onNodeClick={onMediaSelect}
        />
      )}

      {/* Sky/descent lighting */}
      {phase !== 'landed' && (
        <>
          <ambientLight intensity={0.15} />
          <directionalLight position={[200, 100, -100]} intensity={0.6} color="#ff9060" />
        </>
      )}

      <CameraController selectedCountry={selectedCountry} phase={phase} onLanded={onLanded} />

      {phase === 'landed' && (
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.06}
          minDistance={8}
          maxDistance={120}
          maxPolarAngle={Math.PI * 0.48}
          target={[0, 2, 0]}
        />
      )}

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.45}
          luminanceSmoothing={0.85}
          intensity={phase === 'landed' ? 0.25 : 0.40}
        />
        <Vignette
          offset={0.35}
          darkness={phase === 'landed' ? 0.40 : 0.60}
        />
      </EffectComposer>
    </>
  );
}

// ── Connection type legend ─────────────────────────────────────────────────
function ConnectionLegend() {
  return (
    <div style={{
      position: 'fixed', bottom: 88, left: 16, zIndex: 30,
      background: 'rgba(2,4,16,0.72)', backdropFilter: 'blur(8px)',
      borderRadius: 10, padding: '10px 14px',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      <p style={{
        color: 'rgba(160,175,210,0.55)', fontSize: 9,
        fontFamily: 'sans-serif', letterSpacing: '0.12em',
        textTransform: 'uppercase', marginBottom: 7,
      }}>
        Connections
      </p>
      {[
        { color: '#c0c8d8', label: 'Chronological' },
        { color: '#fbbf24', label: 'Same Era'       },
        { color: '#60a5fa', label: 'Same Region'    },
      ].map(({ color, label }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 18, height: 1.5, background: color, borderRadius: 2, flexShrink: 0 }} />
          <span style={{ color: 'rgba(200,210,240,0.7)', fontSize: 11, fontFamily: 'sans-serif' }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main exported component ───────────────────────────────────────────────────
export default function ImmersiveScene({
  onExit,
  initialCountry = null,
  mediaItems     = [],
  onMediaSelect  = () => {},
}: ImmersiveSceneProps) {
  const [phase,           setPhase]           = useState<Phase>('sky');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(initialCountry);
  const [selectedEra,     setSelectedEra]     = useState<string | null>(null);
  const [isLoaded,        setIsLoaded]        = useState(false);

  const handleSelectCountry = useCallback((code: string) => {
    setSelectedCountry(code);
    setSelectedEra(null);
    setPhase('descending');
  }, []);

  const handleSelectEra = useCallback((era: string) => {
    setSelectedEra(era);
    setSelectedCountry(null);
    setPhase('descending');
  }, []);

  const handleLanded      = useCallback(() => setPhase('landed'), []);
  const handleReturnToSky = useCallback(() => {
    setSelectedCountry(null);
    setSelectedEra(null);
    setPhase('sky');
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#020510]">
      {!isLoaded && <LoadingScreen />}

      <Canvas
        camera={{ fov: 60, near: 0.5, far: 1000, position: [0, 350, 0] }}
        gl={{ antialias: true, alpha: false }}
        shadows
        dpr={[1, 1.5]}
        onCreated={() => setIsLoaded(true)}
        className="absolute inset-0"
      >
        <Suspense fallback={null}>
          <SceneContent
            phase={phase}
            selectedCountry={selectedCountry}
            selectedEra={selectedEra}
            mediaItems={mediaItems}
            onLanded={handleLanded}
            onMediaSelect={onMediaSelect}
          />
        </Suspense>
      </Canvas>

      {isLoaded && (
        <SelectionOverlay
          phase={phase}
          selectedCountry={selectedCountry}
          selectedEra={selectedEra}
          onSelectCountry={handleSelectCountry}
          onSelectEra={handleSelectEra}
          onReturnToSky={handleReturnToSky}
          onExitImmersive={onExit}
        />
      )}

      {/* Connection legend — only visible in terrain view with nodes */}
      {phase === 'landed' && mediaItems.length > 0 && (
        <ConnectionLegend />
      )}
    </div>
  );
}
