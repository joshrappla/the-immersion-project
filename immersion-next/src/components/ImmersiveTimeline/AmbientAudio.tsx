'use client';

import { useEffect, useRef, useState } from 'react';

interface AmbientAudioProps {
  phase:   'sky' | 'descending' | 'landed';
  country: string | null;
}

export default function AmbientAudio({ phase, country }: AmbientAudioProps) {
  const audioRef  = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(true);   // start muted (browser autoplay policy)
  const [error, setError] = useState(false);  // hide button if no audio available

  // Attempt to play / pause based on state
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    if (phase === 'landed' && !muted) {
      const src = country
        ? `/audio/ambient/${country.toLowerCase()}.mp3`
        : '/audio/ambient/sky.mp3';

      if (el.src !== src) {
        el.src = src;
        el.volume = 0.3;
        el.loop = true;
      }

      el.play().catch(() => setError(true));
    } else {
      el.pause();
    }
  }, [phase, country, muted]);

  // Hide the button if audio files aren't present
  if (error) return null;

  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} />

      <button
        onClick={() => setMuted(m => !m)}
        title={muted ? 'Enable ambient audio' : 'Mute ambient audio'}
        style={{
          position: 'fixed', bottom: 92, right: 16, zIndex: 30,
          width: 38, height: 38, borderRadius: '50%',
          background: 'rgba(4,6,20,0.70)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.10)',
          color: muted ? 'rgba(160,175,210,0.45)' : '#a0c8ff',
          fontSize: 16, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'color 0.2s, border-color 0.2s',
        }}
      >
        {muted ? '🔇' : '🔊'}
      </button>
    </>
  );
}
