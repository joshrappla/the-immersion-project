'use client';

import { useState, useEffect } from 'react';

const HINTS = [
  { icon: '🖱️', text: 'Drag to orbit'    },
  { icon: '🔍', text: 'Scroll to zoom'   },
  { icon: '✨', text: 'Hover nodes'      },
  { icon: '⎋',  text: 'ESC to return'   },
];

interface HelpTooltipsProps {
  phase: 'sky' | 'descending' | 'landed';
}

export default function HelpTooltips({ phase }: HelpTooltipsProps) {
  const [visible, setVisible]   = useState(false);
  const [fadeOut, setFadeOut]   = useState(false);

  useEffect(() => {
    if (phase !== 'landed') {
      setVisible(false);
      setFadeOut(false);
      return;
    }

    // Appear 0.8 s after landing
    const showTimer = setTimeout(() => setVisible(true), 800);
    // Start fading at 5 s
    const fadeTimer = setTimeout(() => setFadeOut(true), 5800);
    // Remove from DOM at 6 s
    const hideTimer = setTimeout(() => setVisible(false), 6600);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [phase]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 130, left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 30,
      opacity: fadeOut ? 0 : 1,
      transition: 'opacity 0.7s ease-out',
      pointerEvents: 'none',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 20,
        background: 'rgba(4,6,20,0.70)', backdropFilter: 'blur(10px)',
        borderRadius: 30, padding: '10px 22px',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      }}>
        {HINTS.map(({ icon, text }) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>{icon}</span>
            <span style={{
              color: 'rgba(200,210,240,0.65)', fontSize: 11,
              fontFamily: 'sans-serif', whiteSpace: 'nowrap',
            }}>
              {text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
