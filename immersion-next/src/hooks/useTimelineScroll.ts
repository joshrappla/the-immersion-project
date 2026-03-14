'use client';

import { useState, useEffect, useRef, type RefObject } from 'react';
import { getEraFromYear, getEraBackground, type EraBackground } from '@/data/eraBackgrounds';

export interface TimelineScrollResult {
  scrollOffset: number;   // scrollLeft (horizontal) or scrollY (vertical)
  currentYear: number;
  currentEra: string;
  eraBackground: EraBackground;
}

interface UseTimelineScrollOptions {
  /** The scrollable container (horizontal mode only). */
  containerRef?: RefObject<HTMLElement | null>;
  /** Leftmost visible year at scroll=0. */
  minYear: number;
  /** Rightmost/bottommost year (used in vertical mode for fraction calc). */
  maxYear: number;
  /** Pixels per year — used in horizontal mode. */
  zoomLevel: number;
  mode?: 'horizontal' | 'vertical';
}

export function useTimelineScroll({
  containerRef,
  minYear,
  maxYear,
  zoomLevel,
  mode = 'horizontal',
}: UseTimelineScrollOptions): TimelineScrollResult {
  const [scrollOffset, setScrollOffset] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (mode === 'horizontal') {
          setScrollOffset(containerRef?.current?.scrollLeft ?? 0);
        } else {
          setScrollOffset(window.scrollY);
        }
      });
    };

    if (mode === 'horizontal') {
      const el = containerRef?.current;
      if (!el) return;
      el.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        el.removeEventListener('scroll', handleScroll);
        cancelAnimationFrame(rafRef.current);
      };
    } else {
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        window.removeEventListener('scroll', handleScroll);
        cancelAnimationFrame(rafRef.current);
      };
    }
  }, [containerRef, mode]);

  let currentYear: number;

  if (mode === 'horizontal') {
    // Center of viewport = scroll + half viewport width
    const halfViewport = typeof window !== 'undefined' ? window.innerWidth / 2 : 400;
    const centerScroll = scrollOffset + halfViewport;
    currentYear = zoomLevel > 0 ? Math.round(centerScroll / zoomLevel + minYear) : minYear;
  } else {
    // Estimate year from fraction of total scroll height
    const scrollHeight =
      typeof document !== 'undefined'
        ? document.documentElement.scrollHeight - window.innerHeight
        : 1;
    const fraction = scrollHeight > 0 ? Math.min(1, scrollOffset / scrollHeight) : 0;
    currentYear = Math.round(minYear + fraction * (maxYear - minYear));
  }

  const currentEra = getEraFromYear(currentYear);
  const eraBackground = getEraBackground(currentEra);

  return { scrollOffset, currentYear, currentEra, eraBackground };
}
