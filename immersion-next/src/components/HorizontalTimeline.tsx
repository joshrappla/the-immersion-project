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

export default function HorizontalTimeline() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [mediaTypeFilter, setMediaTypeFilter] = useState('');
  const [eraFilter, setEraFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Stable starfield
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
  let isZoomed = false;

  if (eraFilter && eraRanges[eraFilter]) {
    // Zoom into selected era with some padding
    const padding = 50; // Add 50 years padding on each side
    minYear = eraRanges[eraFilter].min - padding;
    maxYear = eraRanges[eraFilter].max + padding;
    isZoomed = true;
  } else {
    // Show full timeline
    minYear = -500;
    maxYear = 2000;
  }

  const yearRange = maxYear - minYear;

  // Convert year to pixel position
  const yearToPixel = (year: number) => {
    const pixelsPerYear = isZoomed ? 8 : 2; // 8x zoom when era is selected
    return (year - minYear) * pixelsPerYear;
  };

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

  // Auto-scroll to show filtered content
  useEffect(() => {
    if (eraFilter && eraRanges[eraFilter] && timelineRef.current) {
      const eraRange = eraRanges[eraFilter];
      const centerYear = (eraRange.min + eraRange.max) / 2;
      const centerPosition = yearToPixel(centerYear);
      setTimeout(() => {
        if (timelineRef.current) {
          timelineRef.current.scrollLeft = centerPosition - (timelineRef.current.clientWidth / 2);
        }
      }, 100);
    }
  }, [eraFilter]);

  const getMediaColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'game': return '#10b981';
      case 'movie': return '#a855f7';
      case 'tv': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getEraColor = (eraName: string) => {
    return eraColors[eraName] || '#1e293b'; // Default dark color
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl">Loading timeline...</div>
      </div>
    );
  }

  // Build display eras from actual data
  const displayEras: Era[] = uniqueEras
    .filter(eraName => !eraFilter || eraName === eraFilter)
    .map(eraName => ({
      name: eraName,
      startYear: eraRanges[eraName].min,
      endYear: eraRanges[eraName].max,
      color: getEraColor(eraName),
    }));

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Starfield Background */}
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

      {/* Header */}
      <div className="relative z-50 flex items-center justify-between p-6 bg-black/50 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">Historical Timeline</h1>
            <p className="text-gray-400 text-xs">Explore history through immersive media</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
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

          <Link
            href="/admin"
            className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 text-sm hover:bg-gray-700 transition"
          >
            Admin
          </Link>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="relative h-[calc(100vh-180px)]">
        {/* Era Labels */}
        <div className="absolute top-4 left-0 right-0 z-20 flex px-20">
          {displayEras.map((era) => {
            const eraWidth = yearToPixel(era.endYear) - yearToPixel(era.startYear);
            return (
              <div
                key={era.name}
                className="flex flex-col items-center"
                style={{
                  width: `${eraWidth}px`,
                }}
              >
                <div className="text-xs font-semibold text-teal-400 mb-1 whitespace-nowrap">{era.name}</div>
                <div className="text-xs text-gray-500">{era.startYear} - {era.endYear}</div>
              </div>
            );
          })}
        </div>

        {/* Scrollable Timeline */}
        <div
          ref={timelineRef}
          className="absolute top-20 left-0 right-0 bottom-0 overflow-x-auto overflow-y-hidden"
          style={{ scrollbarWidth: 'thin' }}
        >
          <div className="relative h-full" style={{ width: `${yearToPixel(maxYear)}px`, minWidth: '100%' }}>
            {/* Era Background Bands */}
            {displayEras.map((era) => (
              <div
                key={era.name}
                className="absolute top-0 bottom-0"
                style={{
                  left: `${yearToPixel(era.startYear)}px`,
                  width: `${yearToPixel(era.endYear) - yearToPixel(era.startYear)}px`,
                  background: `linear-gradient(to bottom, ${era.color}00, ${era.color}80, ${era.color}40)`,
                }}
              />
            ))}

            {/* Timeline Line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/20" />

            {/* Year Markers */}
            {Array.from({ length: Math.ceil(yearRange / 100) + 1 }, (_, i) => {
              const year = Math.ceil(minYear / 100) * 100 + (i * 100); // Round to nearest 100
              if (year > maxYear) return null;
              return (
                <div
                  key={year}
                  className="absolute top-1/2 transform -translate-y-1/2"
                  style={{ left: `${yearToPixel(year)}px` }}
                >
                  <div className="w-0.5 h-4 bg-white/40" />
                  <div className="text-xs text-gray-400 mt-2 whitespace-nowrap">{year}</div>
                </div>
              );
            })}

            {/* Media Items */}
            {filteredItems.map((item) => {
              const position = yearToPixel((item.startYear + item.endYear) / 2);
              const color = getMediaColor(item.mediaType);

              return (
                <div
                  key={item.mediaId}
                  className="absolute top-1/2 transform -translate-x-1/2"
                  style={{ left: `${position}px` }}
                >
                  {/* Title above the timeline */}
                  <div
                    className="absolute bottom-8 left-1/2 transform -translate-x-1/2 cursor-pointer group"
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
                  
                  {/* Connector Dot on timeline */}
                  <div
                    className="w-4 h-4 rounded-full cursor-pointer hover:scale-150 transition-transform"
                    style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
                    onClick={() => setSelectedItem(item)}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 w-12 h-12 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full flex items-center justify-center border border-gray-600 transition"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={() => scroll('right')}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 w-12 h-12 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full flex items-center justify-center border border-gray-600 transition"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Bottom Legend & Info */}
      <div className="relative z-50 flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm border-t border-white/10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#10b981]" />
            <span className="text-sm text-gray-300">Games</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#a855f7]" />
            <span className="text-sm text-gray-300">Movies</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#3b82f6]" />
            <span className="text-sm text-gray-300">TV Shows</span>
          </div>
        </div>

        <div className="text-sm text-gray-300">
          <span className="opacity-75">✨ Journey through time</span>
          <span className="mx-3">•</span>
          <span>Use arrow buttons to scroll</span>
          <span className="mx-3">•</span>
          <span>Click media to explore</span>
          {eraFilter && (
            <>
              <span className="mx-3">•</span>
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
            {/* Close Button */}
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition z-10"
            >
              ✕
            </button>

            {/* Image */}
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

            {/* Content */}
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
