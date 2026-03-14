'use client';

import { useEffect, useRef, useState } from 'react';
import { getEraBackground } from '@/data/eraBackgrounds';

interface ParallaxBackgroundProps {
  /** scrollLeft for horizontal, scrollY for vertical */
  scrollOffset: number;
  currentEra: string;
  mode?: 'horizontal' | 'vertical';
}

// Hardcoded layer shapes — stable positions (no Math.random on render)

const BACK_SHAPES = [
  { cx: 8,  cy: 14, r: 200, opacity: 0.14 },
  { cx: 50, cy: 72, r: 160, opacity: 0.10 },
  { cx: 84, cy: 22, r: 240, opacity: 0.11 },
  { cx: 28, cy: 82, r: 140, opacity: 0.08 },
];

const MID_SHAPES = [
  { cx: 18, cy: 32, r: 85,  opacity: 0.09 },
  { cx: 40, cy: 65, r: 70,  opacity: 0.07 },
  { cx: 63, cy: 18, r: 95,  opacity: 0.08 },
  { cx: 80, cy: 50, r: 75,  opacity: 0.07 },
  { cx: 95, cy: 78, r: 80,  opacity: 0.06 },
];

// Deterministic star particles — (i * prime + offset) % 100 gives stable spread
const STARS = Array.from({ length: 26 }, (_, i) => ({
  x: (i * 41 + 7)  % 100,
  y: (i * 67 + 19) % 100,
  r: 1 + (i % 3),
  o: 0.07 + (i % 7) * 0.02,
}));

// Unique key counter — incremented only in effects, never during render
let _uid = 0;

export default function ParallaxBackground({
  scrollOffset,
  currentEra,
  mode = 'horizontal',
}: ParallaxBackgroundProps) {
  // Gradient layer state
  const [displayEra,  setDisplayEra]  = useState(currentEra);
  const [currentKey,  setCurrentKey]  = useState(0);   // 0 = no fade-in animation on mount
  const [fadeOutEra,  setFadeOutEra]  = useState<string | null>(null);
  const [fadeOutKey,  setFadeOutKey]  = useState(0);

  const didMountRef = useRef(false);
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Skip first run (mount) — no animation needed
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (currentEra === displayEra) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    // Fade the old gradient out
    setFadeOutEra(displayEra);
    setFadeOutKey(++_uid);

    // Fade the new gradient in
    setDisplayEra(currentEra);
    setCurrentKey(++_uid);

    // Remove the fade-out layer once the animation completes
    timerRef.current = setTimeout(() => setFadeOutEra(null), 1400);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEra]);

  const bg    = getEraBackground(displayEra);
  const prevBg = fadeOutEra ? getEraBackground(fadeOutEra) : null;

  // Parallax offsets — slower = further away
  const axis = mode === 'horizontal' ? 'X' : 'Y';
  const t1 = `translate${axis}(${-(scrollOffset * 0.04).toFixed(2)}px)`;
  const t2 = `translate${axis}(${-(scrollOffset * 0.12).toFixed(2)}px)`;
  const t3 = `translate${axis}(${-(scrollOffset * 0.22).toFixed(2)}px)`;

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">

      {/* ── Gradient base layers ──────────────────────────────────────── */}

      {/* Previous era — fades out */}
      {prevBg && (
        <div
          key={fadeOutKey}
          className="absolute inset-0 era-fade-out"
          style={{ background: prevBg.gradient }}
        />
      )}

      {/* Current era — fades in (or static on mount when currentKey === 0) */}
      <div
        key={currentKey}
        className="absolute inset-0"
        style={{
          background: bg.gradient,
          animation: currentKey > 0 ? 'eraFadeIn 1.2s ease-in-out forwards' : 'none',
        }}
      />

      {/* ── Parallax Layer 1 — Back (large celestial blobs) ──────────── */}
      <div className="parallax-layer" style={{ transform: t1 }}>
        {BACK_SHAPES.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left:   `${s.cx}%`,
              top:    `${s.cy}%`,
              width:  `${s.r * 2}px`,
              height: `${s.r * 2}px`,
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(circle, ${bg.accentColor}65 0%, transparent 70%)`,
              filter: 'blur(52px)',
              opacity: s.opacity,
            }}
          />
        ))}
      </div>

      {/* ── Parallax Layer 2 — Mid (ambient orbs) ────────────────────── */}
      <div className="parallax-layer" style={{ transform: t2 }}>
        {MID_SHAPES.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left:   `${s.cx}%`,
              top:    `${s.cy}%`,
              width:  `${s.r * 2}px`,
              height: `${s.r * 2}px`,
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(circle, ${bg.accentColor}85 0%, transparent 70%)`,
              filter: 'blur(24px)',
              opacity: s.opacity,
            }}
          />
        ))}
      </div>

      {/* ── Parallax Layer 3 — Front (star particles) ────────────────── */}
      <div className="parallax-layer" style={{ transform: t3 }}>
        {STARS.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left:   `${p.x}%`,
              top:    `${p.y}%`,
              width:  `${p.r * 2}px`,
              height: `${p.r * 2}px`,
              opacity: p.o,
            }}
          />
        ))}
      </div>

    </div>
  );
}
