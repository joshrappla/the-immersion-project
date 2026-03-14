'use client';

import { useEffect, useRef, useState } from 'react';
import { getEraBackground } from '@/data/eraBackgrounds';

interface EraIndicatorProps {
  currentEra: string;
  currentYear: number;
}

export default function EraIndicator({ currentEra, currentYear }: EraIndicatorProps) {
  const [displayEra,  setDisplayEra]  = useState(currentEra);
  const [animKey,     setAnimKey]     = useState(0);
  const didMountRef = useRef(false);

  // Re-trigger animation whenever the era changes (not on first mount)
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (currentEra === displayEra) return;
    setDisplayEra(currentEra);
    setAnimKey(k => k + 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEra]);

  const bg = getEraBackground(displayEra);

  const yearLabel = currentYear < 0
    ? `${Math.abs(currentYear)} BC`
    : `${currentYear} AD`;

  return (
    <div
      className="fixed bottom-24 left-4 z-20 pointer-events-none select-none"
      style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.6))' }}
    >
      <div
        key={animKey}
        className="era-indicator-enter flex flex-col gap-0.5 px-4 py-3 rounded-xl backdrop-blur-sm border"
        style={{
          background: `${bg.accentColor}18`,
          borderColor: `${bg.accentColor}40`,
        }}
      >
        <span
          className="text-[10px] font-bold tracking-widest uppercase"
          style={{ color: `${bg.accentColor}cc` }}
        >
          {bg.name}
        </span>
        <span className="text-white/60 text-xs font-mono">
          {yearLabel}
        </span>
      </div>
    </div>
  );
}
