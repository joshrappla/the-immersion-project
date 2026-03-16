'use client';

import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message }: LoadingScreenProps = {}) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#020510]">
      {/* Static star background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 80 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width:     `${(i % 3) * 0.7 + 0.5}px`,
              height:    `${(i % 3) * 0.7 + 0.5}px`,
              top:       `${((i * 137) % 100)}%`,
              left:      `${((i * 97) % 100)}%`,
              opacity:   ((i % 5) * 0.15 + 0.2),
              animation: `pulse ${1.5 + (i % 4) * 0.5}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center">
        {/* Globe icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-blue-400/40 flex items-center justify-center animate-pulse">
          <span className="text-5xl">🌍</span>
        </div>

        <h2 className="text-white text-2xl font-bold mb-2 tracking-wide">
          {message ?? 'Preparing Your Journey'}
        </h2>
        <p className="text-blue-300/70 text-sm mb-6">
          {message ? `${dots}` : `Loading immersive 3D environment${dots}`}
        </p>

        {/* Progress bar */}
        <div className="w-48 h-0.5 bg-white/10 rounded-full mx-auto overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
            style={{ animation: 'loadBarSweep 2s ease-in-out infinite' }}
          />
        </div>
      </div>

      {/* Animations injected without styled-jsx (avoids Turbopack parse issue) */}
      <style
        // eslint-disable-next-line react/no-unknown-property
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes loadBarSweep {
              0%   { width: 0%;   margin-left: 0;    }
              50%  { width: 80%;  margin-left: 0;    }
              100% { width: 0%;   margin-left: 100%; }
            }
          `,
        }}
      />
    </div>
  );
}
