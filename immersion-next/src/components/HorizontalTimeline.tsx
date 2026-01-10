'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import both timeline versions
const VerticalTimeline = dynamic(() => import('./VerticalTimeline'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white text-2xl">Loading timeline...</div>
    </div>
  ),
});

const HorizontalTimelineDesktop = dynamic(() => import('./HorizontalTimelineDesktop'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white text-2xl">Loading timeline...</div>
    </div>
  ),
});

export default function HorizontalTimeline() {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check screen size
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl">Loading timeline...</div>
      </div>
    );
  }

  return isMobile ? <VerticalTimeline /> : <HorizontalTimelineDesktop />;
}
