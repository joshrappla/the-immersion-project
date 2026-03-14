'use client';

import { Suspense, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import DuskSky from './DuskSky';
import StarField from './StarField';
import CloudLayer from './CloudLayer';
import CameraController from './CameraController';
import SelectionOverlay from './SelectionOverlay';
import LoadingScreen from './LoadingScreen';

interface ImmersiveSceneProps {
  onExit: () => void;
  initialCountry?: string | null;
}

type Phase = 'sky' | 'descending' | 'landed';

function SceneContent({
  phase,
  selectedCountry,
  onLanded,
}: {
  phase: Phase;
  selectedCountry: string | null;
  onLanded: () => void;
}) {
  return (
    <>
      <DuskSky />
      <StarField count={2200} radius={420} twinkleSpeed={0.7} />
      <CloudLayer
        altitude={55}
        opacity={phase === 'landed' ? 0.05 : 0.18}
        count={24}
        driftSpeed={0.35}
      />

      {/* Ambient + directional light for any 3D objects added later */}
      <ambientLight intensity={0.15} />
      <directionalLight
        position={[200, 100, -100]}
        intensity={0.6}
        color="#ff9060"
      />

      <CameraController
        selectedCountry={selectedCountry}
        phase={phase}
        onLanded={onLanded}
      />
    </>
  );
}

export default function ImmersiveScene({ onExit, initialCountry = null }: ImmersiveSceneProps) {
  const [phase, setPhase] = useState<Phase>('sky');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(initialCountry);
  const [selectedEra, setSelectedEra] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

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
    setPhase('sky');
    setSelectedCountry(null);
    setSelectedEra(null);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#020510]">
      {!isLoaded && <LoadingScreen />}

      {/* R3F Canvas */}
      <Canvas
        camera={{ fov: 60, near: 0.5, far: 1000, position: [0, 350, 0] }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 1.5]}
        onCreated={() => setIsLoaded(true)}
        className="absolute inset-0"
      >
        <Suspense fallback={null}>
          <SceneContent
            phase={phase}
            selectedCountry={selectedCountry}
            onLanded={handleLanded}
          />
        </Suspense>
      </Canvas>

      {/* HTML overlay — rendered outside Canvas */}
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
