'use client';

import { useEffect, useState } from 'react';

export default function LoadingScreen() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#020510]">
      {/* Starfield background effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 80 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width:  `${Math.random() * 2 + 0.5}px`,
              height: `${Math.random() * 2 + 0.5}px`,
              top:    `${Math.random() * 100}%`,
              left:   `${Math.random() * 100}%`,
              opacity: Math.random() * 0.7 + 0.2,
              animation: `pulse ${1.5 + Math.random() * 2}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center">
        {/* Globe icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-blue-400/40
                        flex items-center justify-center
                        animate-pulse">
          <span className="text-5xl">🌍</span>
        </div>

        <h2 className="text-white text-2xl font-bold mb-2 tracking-wide">
          Preparing Your Journey
        </h2>
        <p className="text-blue-300/70 text-sm mb-6">
          Loading immersive 3D environment{dots}
        </p>

        {/* Progress bar */}
        <div className="w-48 h-0.5 bg-white/10 rounded-full mx-auto overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
            style={{ animation: 'loadBar 2s ease-in-out infinite' }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes loadBar {
          0%   { width: 0%; transform: translateX(0); }
          50%  { width: 100%; }
          100% { width: 0%; transform: translateX(200px); }
        }
      `}</style>
    </div>
  );
}
