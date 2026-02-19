'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';

interface MediaItem {
  mediaId: string;
  title: string;
  mediaType: string;
  timePeriod: string;
  startYear: number;
  endYear: number;
  description: string;
  imageUrl: string;
  streamingUrl: string;
}

interface Era {
  name: string;
  startYear: number;
  endYear: number;
  color: string;
}

interface PositionedMediaItem extends MediaItem {
  position: number;
  stackLevel: number;
}

// Generate starfield once
const generateStarfield = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    opacity: Math.random() * 0.7 + 0.3,
    delay: Math.random() * 3,
    duration: Math.random() * 2 + 2,
  }));
};

export default function HorizontalTimelineDesktop() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [mediaTypeFilter, setMediaTypeFilter] = useState('');
  const [eraFilter, setEraFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(2);
  const setZoomLevelSync = (newZoom: number) => {
    zoomLevelRef.current = newZoom;
    setZoomLevel(newZoom);
  };
  const [mounted, setMounted] = useState(false); // Fix hydration error
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [contributeTab, setContributeTab] = useState<'media' | 'feedback'>('media');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const zoomLevelRef = useRef(2);
  const minYearRef = useRef(0);

  // Stable starfield - only generate on client
  const stars = useMemo(() => generateStarfield(200), []);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Predefined era colors
  const eraColors: { [key: string]: string } = {
    'Ancient Period': '#1e1b4b',
    'Ancient Rome': '#1e1b4b',
    'Ancient Greece': '#1e1b4b',
    'Medieval Period': '#1e293b',
    'Viking Age': '#064e3b',
    'The Crusades': '#134e4a',
    'Third Crusade': '#134e4a',
    'Renaissance': '#422006',
    'Italian Renaissance': '#422006',
    'Meiji Restoration': '#0f766e',
    'Industrial Age': '#0f766e',
    'Modern Era': '#7f1d1d',
    'Wild West': '#78350f',
    'Post-WWI': '#7f1d1d',
    'American Revolution': '#1e40af',
  };

  // Set mounted state - fixes hydration error
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch media items
  useEffect(() => {
    fetch(`${API_URL}/media`)
      .then((res) => res.json())
      .then((data) => {
        setMediaItems(data.items || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching media:', error);
        setLoading(false);
      });
  }, []);

  // Filter items
  const filteredItems = mediaItems.filter((item) => {
    const typeMatch = !mediaTypeFilter || item.mediaType.toLowerCase() === mediaTypeFilter;
    const eraMatch = !eraFilter || item.timePeriod === eraFilter;
    return typeMatch && eraMatch;
  });

  // Get unique eras from data
  const uniqueEras = [...new Set(mediaItems.map(item => item.timePeriod))].sort();

  // Calculate dynamic era range from actual data
  const eraRanges = useMemo(() => {
    const ranges: { [key: string]: { min: number; max: number } } = {};
    
    mediaItems.forEach(item => {
      if (!ranges[item.timePeriod]) {
        ranges[item.timePeriod] = {
          min: item.startYear,
          max: item.endYear,
        };
      } else {
        ranges[item.timePeriod].min = Math.min(ranges[item.timePeriod].min, item.startYear);
        ranges[item.timePeriod].max = Math.max(ranges[item.timePeriod].max, item.endYear);
      }
    });
    
    return ranges;
  }, [mediaItems]);

  // Calculate year range based on filter
  let minYear: number;
  let maxYear: number;

  if (eraFilter && eraRanges[eraFilter]) {
    const padding = 50;
    minYear = eraRanges[eraFilter].min - padding;
    maxYear = eraRanges[eraFilter].max + padding;
  } else {
    minYear = -500;
    maxYear = 2000;
  }

  const yearRange = maxYear - minYear;

  // Convert year to pixel position
  const yearToPixel = (year: number) => {
    return (year - minYear) * zoomLevel;
  };

  // Handle mouse wheel zoom (plain scroll = zoom, no modifier key needed)
  const handleWheelNative = (e: WheelEvent) => {
    e.preventDefault();

    const container = timelineRef.current;
    if (!container) return;

    const currentZoom = zoomLevelRef.current;
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const scrollX = container.scrollLeft;
    const mousePositionOnTimeline = mouseX + scrollX;

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(20, currentZoom * zoomFactor));

    const currentMinYear = minYearRef.current;
    const yearAtMouse = (mousePositionOnTimeline / currentZoom) + currentMinYear;

    setZoomLevelSync(newZoom);

    setTimeout(() => {
      if (container) {
        const newPositionOnTimeline = (yearAtMouse - currentMinYear) * newZoom;
        container.scrollLeft = newPositionOnTimeline - mouseX;
      }
    }, 0);
  };

  // Keep React synthetic handler for compatibility but defer to native
  const handleWheel = (_e: React.WheelEvent<HTMLDivElement>) => { /* handled natively */ };

  // Pinch-to-zoom for mobile
  const touchStartRef = useRef<{ distance: number; zoom: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      // Two fingers - start pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      touchStartRef.current = { distance, zoom: zoomLevel };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchStartRef.current) {
      e.preventDefault();
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      // Calculate zoom change
      const scale = currentDistance / touchStartRef.current.distance;
      const newZoom = Math.max(0.5, Math.min(20, touchStartRef.current.zoom * scale));
      
      // Get center point between fingers
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const container = timelineRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const scrollX = container.scrollLeft;
      const centerPositionOnTimeline = (centerX - rect.left) + scrollX;
      
      // Calculate year at center
      const yearAtCenter = (centerPositionOnTimeline / zoomLevel) + minYear;
      
      // Update zoom
      setZoomLevelSync(newZoom);
      
      // Adjust scroll to keep same year at center
      setTimeout(() => {
        if (container) {
          const newPositionOnTimeline = (yearAtCenter - minYear) * newZoom;
          container.scrollLeft = newPositionOnTimeline - (centerX - rect.left);
        }
      }, 0);
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  // Calculate positioned items with stacking
  const positionedItems = useMemo((): PositionedMediaItem[] => {
    const items = filteredItems.map(item => ({
      ...item,
      position: yearToPixel((item.startYear + item.endYear) / 2),
      stackLevel: 0,
    }));

    items.sort((a, b) => a.position - b.position);

    const minDistance = 180;
    for (let i = 0; i < items.length; i++) {
      let maxStackBelow = -1;
      
      for (let j = i - 1; j >= 0; j--) {
        const distance = items[i].position - items[j].position;
        if (distance > minDistance) break;
        
        maxStackBelow = Math.max(maxStackBelow, items[j].stackLevel);
      }
      
      items[i].stackLevel = maxStackBelow + 1;
    }

    return items;
  }, [filteredItems, zoomLevel, minYear, maxYear]);

  const maxStackLevel = Math.max(...positionedItems.map(item => item.stackLevel), 0);

  // Scroll timeline
  const scroll = (direction: 'left' | 'right') => {
    if (timelineRef.current) {
      const scrollAmount = 500;
      timelineRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Auto-fit zoom + scroll when era or media type filter changes
  useEffect(() => {
    const container = timelineRef.current;
    if (!container) return;

    const clientWidth = container.clientWidth;

    if (eraFilter && eraRanges[eraFilter]) {
      // Fit the era's full year range (already padded ±50 years in minYear/maxYear) to screen
      const newZoom = Math.max(0.5, Math.min(20, clientWidth / yearRange));
      setZoomLevelSync(newZoom);
      setTimeout(() => {
        if (timelineRef.current) timelineRef.current.scrollLeft = 0;
      }, 0);
    } else if (mediaTypeFilter) {
      // Find the year span covered by all items of this type
      const typeItems = mediaItems.filter(
        item => item.mediaType.toLowerCase() === mediaTypeFilter
      );
      if (typeItems.length > 0) {
        const itemMinYear = Math.min(...typeItems.map(item => item.startYear));
        const itemMaxYear = Math.max(...typeItems.map(item => item.endYear));
        const padding = Math.max(30, (itemMaxYear - itemMinYear) * 0.1);
        const span = (itemMaxYear - itemMinYear) + padding * 2;
        const newZoom = Math.max(0.5, Math.min(20, clientWidth / span));
        setZoomLevelSync(newZoom);
        setTimeout(() => {
          if (timelineRef.current) {
            const scrollLeft = ((itemMinYear - padding) - minYear) * newZoom;
            timelineRef.current.scrollLeft = Math.max(0, scrollLeft);
          }
        }, 0);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eraFilter, mediaTypeFilter]);

  // Keep minYearRef in sync so the wheel handler always reads the latest value
  useEffect(() => {
    minYearRef.current = minYear;
  }, [minYear]);

  // Attach non-passive wheel listener so preventDefault() stops page/horizontal scroll while zooming
  useEffect(() => {
    const container = timelineRef.current;
    if (!container) return;
    container.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => container.removeEventListener('wheel', handleWheelNative);
  // handleWheelNative only uses refs, so this only needs to run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getMediaColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'game': return '#10b981';
      case 'movie': return '#a855f7';
      case 'tv': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getEraColor = (eraName: string) => {
    return eraColors[eraName] || '#1e293b';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl">Loading timeline...</div>
      </div>
    );
  }

  const displayEras: Era[] = uniqueEras
    .filter(eraName => !eraFilter || eraName === eraFilter)
    .map(eraName => ({
      name: eraName,
      startYear: eraRanges[eraName].min,
      endYear: eraRanges[eraName].max,
      color: getEraColor(eraName),
    }));

  const timelineWidth = yearToPixel(maxYear);

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Starfield Background - Only render after mount to fix hydration */}
      {mounted && (
        <div className="absolute inset-0 overflow-hidden">
          {stars.map((star) => (
            <div
              key={star.id}
              className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
              style={{
                left: `${star.left}%`,
                top: `${star.top}%`,
                opacity: star.opacity,
                animationDelay: `${star.delay}s`,
                animationDuration: `${star.duration}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Header */}
      <div className="relative z-50 flex items-center justify-between p-4 md:p-6 bg-black/50 backdrop-blur-sm border-b border-white/10">
        {/* Logo - Always Visible */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-white font-bold text-lg">Historical Timeline</h1>
            <p className="text-gray-400 text-xs">Explore history through immersive media</p>
          </div>
        </div>

        {/* Desktop Navigation - Hidden on Mobile */}
        <div className="hidden lg:flex items-center gap-4">
          {/* Buy Me a Coffee Button */}
          <a 
            href="https://www.buymeacoffee.com/joshrapp" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 text-sm hover:bg-gray-700 transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.9 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"/>
            </svg>
            Buy me a coffee
          </a>

          <select
            value={mediaTypeFilter}
            onChange={(e) => setMediaTypeFilter(e.target.value)}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 text-sm hover:bg-gray-700 transition"
          >
            <option value="">All Media Types</option>
            <option value="game">Games</option>
            <option value="movie">Movies</option>
            <option value="tv">TV Shows</option>
          </select>

          <select
            value={eraFilter}
            onChange={(e) => setEraFilter(e.target.value)}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 text-sm hover:bg-gray-700 transition"
          >
            <option value="">All Eras</option>
            {uniqueEras.map((era) => (
              <option key={era} value={era}>{era}</option>
            ))}
          </select>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg border border-gray-700">
            <button
              onClick={() => setZoomLevelSync(Math.max(0.5, zoomLevelRef.current * 0.8))}
              className="text-white hover:text-teal-400 transition"
              title="Zoom Out"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
            </button>
            <span className="text-xs text-gray-400 min-w-[60px] text-center">
              {Math.round(zoomLevel * 50)}%
            </span>
            <button
              onClick={() => setZoomLevelSync(Math.min(20, zoomLevelRef.current * 1.25))}
              className="text-white hover:text-teal-400 transition"
              title="Zoom In"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
              </svg>
            </button>
          </div>

          <button
            onClick={() => setShowContributeModal(true)}
            className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 text-sm hover:bg-gray-700 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Contribute
          </button>

          <Link
            href="/admin"
            className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 text-sm hover:bg-gray-700 transition"
          >
            Admin
          </Link>
        </div>

        {/* Mobile Hamburger Button - Visible on Mobile Only */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden w-10 h-10 flex items-center justify-center bg-gray-800 rounded-lg border border-gray-700 text-white hover:bg-gray-700 transition"
          aria-label="Menu"
        >
          {mobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-gray-900 border-l border-gray-700 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-white font-bold text-lg">Menu</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Mobile Menu Items */}
            <div className="p-6 space-y-6">
              {/* Buy Me a Coffee */}
              <a 
                href="https://www.buymeacoffee.com/joshrapp" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full p-4 bg-gray-800 text-white rounded-lg border border-gray-700 hover:bg-gray-700 transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.9 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"/>
                </svg>
                <span className="font-semibold">Buy me a coffee</span>
              </a>

              {/* Contribute */}
              <button
                onClick={() => {
                  setShowContributeModal(true);
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full p-4 bg-gray-800 text-white rounded-lg border border-gray-700 hover:bg-gray-700 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-semibold">Contribute</span>
              </button>

              {/* Divider */}
              <div className="border-t border-gray-700"></div>

              {/* Media Type Filter */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Media Type</label>
                <select
                  value={mediaTypeFilter}
                  onChange={(e) => setMediaTypeFilter(e.target.value)}
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 text-base"
                >
                  <option value="">All Media Types</option>
                  <option value="game">Games</option>
                  <option value="movie">Movies</option>
                  <option value="tv">TV Shows</option>
                </select>
              </div>

              {/* Era Filter */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Era</label>
                <select
                  value={eraFilter}
                  onChange={(e) => setEraFilter(e.target.value)}
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 text-base"
                >
                  <option value="">All Eras</option>
                  {uniqueEras.map((era) => (
                    <option key={era} value={era}>{era}</option>
                  ))}
                </select>
              </div>

              {/* Zoom Controls */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Zoom</label>
                <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
                  <button
                    onClick={() => setZoomLevelSync(Math.max(0.5, zoomLevelRef.current * 0.8))}
                    className="w-10 h-10 flex items-center justify-center text-white hover:text-teal-400 transition"
                    title="Zoom Out"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                    </svg>
                  </button>
                  <span className="flex-1 text-center text-base text-gray-300 font-semibold">
                    {Math.round(zoomLevel * 50)}%
                  </span>
                  <button
                    onClick={() => setZoomLevelSync(Math.min(20, zoomLevelRef.current * 1.25))}
                    className="w-10 h-10 flex items-center justify-center text-white hover:text-teal-400 transition"
                    title="Zoom In"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-700"></div>

              {/* Admin Link */}
              <Link
                href="/admin"
                className="flex items-center gap-3 w-full p-4 bg-gray-800 text-white rounded-lg border border-gray-700 hover:bg-gray-700 transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-semibold">Admin</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Container */}
      <div className="relative h-[calc(100vh-180px)]">
        <div
          ref={timelineRef}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="absolute top-0 left-0 right-0 bottom-0 overflow-x-auto overflow-y-hidden"
          style={{ scrollbarWidth: 'thin', touchAction: 'pan-x' }}
        >
          <div 
            className="relative h-full" 
            style={{ 
              width: `${timelineWidth}px`, 
              minWidth: '100%',
              paddingTop: `${maxStackLevel * 60 + 120}px`,
            }}
          >
            {/* Era Labels */}
            <div className="absolute top-4 left-0 right-0 h-12">
              {displayEras.map((era) => {
                const eraStartPos = yearToPixel(era.startYear);
                const eraEndPos = yearToPixel(era.endYear);
                const eraWidth = eraEndPos - eraStartPos;
                const eraCenterPos = eraStartPos + (eraWidth / 2);
                
                return (
                  <div
                    key={era.name}
                    className="absolute transform -translate-x-1/2"
                    style={{
                      left: `${eraCenterPos}px`,
                      top: 0,
                    }}
                  >
                    <div className="text-xs font-semibold text-teal-400 mb-1 whitespace-nowrap text-center">
                      {era.name}
                    </div>
                    <div className="text-xs text-gray-500 whitespace-nowrap text-center">
                      {era.startYear} - {era.endYear}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Era Background Bands */}
            {displayEras.map((era) => (
              <div
                key={era.name}
                className="absolute"
                style={{
                  left: `${yearToPixel(era.startYear)}px`,
                  width: `${yearToPixel(era.endYear) - yearToPixel(era.startYear)}px`,
                  top: 0,
                  bottom: 0,
                  background: `linear-gradient(to bottom, ${era.color}00, ${era.color}80, ${era.color}40)`,
                }}
              />
            ))}

            {/* Timeline Line */}
            <div 
              className="absolute left-0 right-0 h-0.5 bg-white/20" 
              style={{ 
                top: `calc(50% + ${maxStackLevel * 30}px)` 
              }}
            />

            {/* Year Markers */}
            {Array.from({ length: Math.ceil(yearRange / 100) + 1 }, (_, i) => {
              const year = Math.ceil(minYear / 100) * 100 + (i * 100);
              if (year > maxYear) return null;
              return (
                <div
                  key={year}
                  className="absolute transform -translate-y-1/2"
                  style={{ 
                    left: `${yearToPixel(year)}px`,
                    top: `calc(50% + ${maxStackLevel * 30}px)`,
                  }}
                >
                  <div className="w-0.5 h-4 bg-white/40" />
                  <div className="text-xs text-gray-400 mt-2 whitespace-nowrap">{year}</div>
                </div>
              );
            })}

            {/* Media Items */}
            {positionedItems.map((item) => {
              const color = getMediaColor(item.mediaType);
              const stackOffset = item.stackLevel * 60;
              const timelineY = `calc(50% + ${maxStackLevel * 30}px)`;
              
              return (
                <div
                  key={item.mediaId}
                  className="absolute"
                  style={{ 
                    left: `${item.position}px`,
                    top: timelineY,
                  }}
                >
                  {item.stackLevel > 0 && (
                    <div
                      className="absolute left-1/2 transform -translate-x-1/2 w-0.5 bg-white/30"
                      style={{
                        bottom: '8px',
                        height: `${stackOffset + 8}px`,
                      }}
                    />
                  )}

                  <div
                    className="absolute left-1/2 transform -translate-x-1/2 cursor-pointer group"
                    style={{
                      bottom: `${stackOffset + 16}px`,
                    }}
                    onClick={() => setSelectedItem(item)}
                  >
                    <div
                      className="px-4 py-2 rounded-full text-sm font-medium text-white border-2 whitespace-nowrap shadow-lg hover:scale-110 transition-transform"
                      style={{
                        backgroundColor: `${color}40`,
                        borderColor: color,
                        boxShadow: `0 0 20px ${color}80`,
                      }}
                    >
                      {item.title}
                    </div>
                  </div>
                  
                  <div
                    className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full cursor-pointer hover:scale-150 transition-transform z-10"
                    style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
                    onClick={() => setSelectedItem(item)}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation Arrows - Larger on Mobile */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 z-30 w-14 h-14 md:w-12 md:h-12 bg-gray-800/90 hover:bg-gray-700 text-white rounded-full flex items-center justify-center border border-gray-600 transition shadow-lg"
        >
          <svg className="w-7 h-7 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={() => scroll('right')}
          className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 z-30 w-14 h-14 md:w-12 md:h-12 bg-gray-800/90 hover:bg-gray-700 text-white rounded-full flex items-center justify-center border border-gray-600 transition shadow-lg"
        >
          <svg className="w-7 h-7 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Bottom Legend - Responsive */}
      <div className="relative z-50 flex flex-col md:flex-row items-center justify-between p-3 md:p-4 bg-black/50 backdrop-blur-sm border-t border-white/10 gap-3 md:gap-0">
        {/* Color Legend - Hide text on mobile */}
        <div className="flex items-center gap-3 md:gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#10b981]" />
            <span className="text-xs md:text-sm text-gray-300">Games</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#a855f7]" />
            <span className="text-xs md:text-sm text-gray-300">Movies</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#3b82f6]" />
            <span className="text-xs md:text-sm text-gray-300">TV Shows</span>
          </div>
        </div>

        {/* Info Text - Simplified on mobile */}
        <div className="text-xs md:text-sm text-gray-300 text-center md:text-left">
          <span className="opacity-75">✨ Journey through time</span>
          <span className="hidden md:inline mx-3">•</span>
          <span className="hidden md:inline">Click media to explore</span>
          {eraFilter && (
            <>
              <span className="mx-2 md:mx-3">•</span>
              <span className="text-teal-400">Viewing: {eraFilter}</span>
            </>
          )}
        </div>
      </div>

      {/* Media Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-8"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-700 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition z-10"
            >
              ✕
            </button>

            <div className="h-64 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center border-b border-gray-700">
              {selectedItem.imageUrl ? (
                <img
                  src={selectedItem.imageUrl}
                  alt={selectedItem.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-500 text-2xl">No Image</div>
              )}
            </div>

            <div className="p-8">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="px-3 py-1 rounded-full text-xs font-bold uppercase"
                  style={{
                    backgroundColor: `${getMediaColor(selectedItem.mediaType)}40`,
                    color: getMediaColor(selectedItem.mediaType),
                    border: `1px solid ${getMediaColor(selectedItem.mediaType)}`,
                  }}
                >
                  {selectedItem.mediaType}
                </div>
              </div>

              <h2 className="text-3xl font-bold text-white mb-3">
                {selectedItem.title}
              </h2>

              <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{selectedItem.startYear} - {selectedItem.endYear}</span>
              </div>

              <p className="text-gray-300 leading-relaxed mb-6">
                {selectedItem.description}
              </p>

              <a
                href={selectedItem.streamingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition"
              >
                View Source
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Contribute Modal */}
      {showContributeModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-8"
          onClick={() => setShowContributeModal(false)}
        >
          <div
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-700 overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowContributeModal(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition z-10"
            >
              ✕
            </button>

            {/* Header */}
            <div className="p-8 border-b border-gray-700">
              <h2 className="text-3xl font-bold text-white mb-2">Contribute to The Immersion Verse</h2>
              <p className="text-gray-400">Help us expand our historical timeline or share your feedback</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => setContributeTab('media')}
                className={`flex-1 px-6 py-4 font-semibold transition ${
                  contributeTab === 'media'
                    ? 'text-white bg-gray-800 border-b-2 border-purple-600'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                  </svg>
                  Suggest Media
                </div>
              </button>
              <button
                onClick={() => setContributeTab('feedback')}
                className={`flex-1 px-6 py-4 font-semibold transition ${
                  contributeTab === 'feedback'
                    ? 'text-white bg-gray-800 border-b-2 border-purple-600'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  Feedback
                </div>
              </button>
            </div>

            {/* Forms */}
            <div className="p-8">
              {contributeTab === 'media' ? (
                /* Media Suggestion Form */
                <form
                  action="https://formspree.io/f/YOUR_FORM_ID"
                  method="POST"
                  className="space-y-4"
                >
                  <input type="hidden" name="_subject" value="New Media Suggestion - The Immersion Verse" />
                  
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Your Name (Optional)
                    </label>
                    <input
                      type="text"
                      name="name"
                      className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-600 transition"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      name="email"
                      className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-600 transition"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Media Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-600 transition"
                      placeholder="Vikings"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">
                        Media Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="mediaType"
                        required
                        className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-600 transition"
                      >
                        <option value="">Select type...</option>
                        <option value="Game">Game</option>
                        <option value="Movie">Movie</option>
                        <option value="TV">TV Show</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">
                        Era (Optional)
                      </label>
                      <input
                        type="text"
                        name="era"
                        className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-600 transition"
                        placeholder="Viking Age"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">
                        Start Year (Optional)
                      </label>
                      <input
                        type="number"
                        name="startYear"
                        className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-600 transition"
                        placeholder="793"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">
                        End Year (Optional)
                      </label>
                      <input
                        type="number"
                        name="endYear"
                        className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-600 transition"
                        placeholder="1066"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      name="description"
                      rows={4}
                      className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-600 transition resize-none"
                      placeholder="Brief description of the media and its historical setting..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Source URL (Optional)
                    </label>
                    <input
                      type="url"
                      name="sourceUrl"
                      className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-600 transition"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition"
                    >
                      Submit Suggestion
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowContributeModal(false)}
                      className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                /* Feedback Form */
                <form
                  action="https://formspree.io/f/YOUR_FORM_ID"
                  method="POST"
                  className="space-y-4"
                >
                  <input type="hidden" name="_subject" value="Feedback - The Immersion Verse" />
                  
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Your Name (Optional)
                    </label>
                    <input
                      type="text"
                      name="name"
                      className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-600 transition"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      name="email"
                      className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-600 transition"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Feedback Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="feedbackType"
                      required
                      className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-600 transition"
                    >
                      <option value="">Select type...</option>
                      <option value="Feature Request">Feature Request</option>
                      <option value="Bug Report">Bug Report</option>
                      <option value="General Feedback">General Feedback</option>
                      <option value="Question">Question</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Your Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      required
                      rows={6}
                      className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-600 transition resize-none"
                      placeholder="Share your thoughts, suggestions, or report an issue..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition"
                    >
                      Send Feedback
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowContributeModal(false)}
                      className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        .animate-twinkle {
          animation: twinkle infinite;
        }
      `}</style>
    </div>
  );
}
