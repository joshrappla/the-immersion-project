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
import SelectionOverlay  from './SelectionOverlay';
import LoadingScreen     from './LoadingScreen';

interface ImmersiveSceneProps {
  onExit: () => void;
  initialCountry?: string | null;
}

type Phase = 'sky' | 'descending' | 'landed';

// ── Scene inner (rendered inside Canvas) ─────────────────────────────────────
function SceneContent({
  phase,
  selectedCountry,
  selectedEra,
  onLanded,
}: {
  phase: Phase;
  selectedCountry: string | null;
  selectedEra: string | null;
  onLanded: () => void;
}) {
  const showTerrain = phase === 'descending' || phase === 'landed';
  const terrainFullyVisible = phase === 'landed';

  return (
    <>
      {/* Sky always present; stars fade out conceptually as we near terrain */}
      <DuskSky />
      <StarField count={2200} radius={420} twinkleSpeed={0.7} />

      {/* Clouds shown in sky mode and during early descent */}
      {phase !== 'landed' && (
        <CloudLayer altitude={55} opacity={0.18} count={24} driftSpeed={0.35} />
      )}

      {/* Terrain appears as camera descends and is fully visible when landed */}
      <TerrainMap
        visible={terrainFullyVisible}
        country={selectedCountry}
        era={selectedEra}
      />

      {/* Ambient light — always on for sky scene */}
      {phase !== 'landed' && (
        <>
          <ambientLight intensity={0.15} />
          <directionalLight position={[200, 100, -100]} intensity={0.6} color="#ff9060" />
        </>
      )}

      {/* Camera — GSAP-animated during sky/descent; orbit controls take over when landed */}
      <CameraController
        selectedCountry={selectedCountry}
        phase={phase}
        onLanded={onLanded}
      />

      {/* Orbit controls — only active after landing */}
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

      {/* Post-processing — cinematic bloom + vignette */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.55}
          luminanceSmoothing={0.85}
          intensity={phase === 'landed' ? 0.20 : 0.40}
        />
        <Vignette
          offset={0.35}
          darkness={phase === 'landed' ? 0.40 : 0.60}
        />
      </EffectComposer>
    </>
  );
}

// ── Main exported component ────────────────────────────────────────────────────
export default function ImmersiveScene({ onExit, initialCountry = null }: ImmersiveSceneProps) {
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

  const handleLanded = useCallback(() => {
    setPhase('landed');
  }, []);

  const handleReturnToSky = useCallback(() => {
    setSelectedCountry(null);
    setSelectedEra(null);
    setPhase('sky');
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#020510]">
      {!isLoaded && <LoadingScreen />}

      {/* Three.js canvas */}
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
            onLanded={handleLanded}
          />
        </Suspense>
      </Canvas>

      {/* HTML overlay — outside Canvas so it can use normal DOM events */}
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
    </div>
  );
}
