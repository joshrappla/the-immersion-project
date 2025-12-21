'use client';

import { useState, useEffect, useRef } from 'react';
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

export default function HorizontalTimeline() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [mediaTypeFilter, setMediaTypeFilter] = useState('');
  const [eraFilter, setEraFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Define eras with colors
  const eras: Era[] = [
    { name: 'Ancient Period', startYear: -500, endYear: 500, color: '#1e1b4b' }, // deep purple
    { name: 'Medieval Period', startYear: 500, endYear: 1500, color: '#1e293b' }, // dark blue-gray
    { name: 'Viking Age', startYear: 793, endYear: 1066, color: '#064e3b' }, // dark teal
    { name: 'The Crusades', startYear: 1095, endYear: 1291, color: '#134e4a' }, // teal
    { name: 'Renaissance', startYear: 1400, endYear: 1650, color: '#422006' }, // brown
    { name: 'Industrial Age', startYear: 1760, endYear: 1900, color: '#0f766e' }, // teal
    { name: 'Modern Era', startYear: 1900, endYear: 2000, color: '#7f1d1d' }, // dark red
  ];

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
  const uniqueEras = [...new Set(mediaItems.map(item => item.timePeriod))];

  // Convert year to pixel position (scale: 1 year = 1 pixel, offset for negative years)
  const yearToPixel = (year: number) => {
    const minYear = -500;
    const pixelsPerYear = 2; // 2 pixels per year for better spacing
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

  const getMediaColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'game': return '#10b981'; // green
      case 'movie': return '#a855f7'; // purple
      case 'tv': return '#3b82f6'; // blue
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl">Loading timeline...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Starfield Background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(200)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.7 + 0.3,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 2 + 2}s`,
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
          {eras.map((era) => (
            <div
              key={era.name}
              className="flex flex-col items-center"
              style={{
                width: `${yearToPixel(era.endYear) - yearToPixel(era.startYear)}px`,
              }}
            >
              <div className="text-xs font-semibold text-teal-400 mb-1">{era.name}</div>
              <div className="text-xs text-gray-500">{era.startYear} - {era.endYear}</div>
            </div>
          ))}
        </div>

        {/* Scrollable Timeline */}
        <div
          ref={timelineRef}
          className="absolute top-20 left-0 right-0 bottom-0 overflow-x-auto overflow-y-hidden"
          style={{ scrollbarWidth: 'thin' }}
        >
          <div className="relative h-full" style={{ width: `${yearToPixel(2000)}px` }}>
            {/* Era Background Bands */}
            {eras.map((era) => (
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
            {Array.from({ length: 26 }, (_, i) => {
              const year = (i - 5) * 100; // -500 to 2000 in 100-year increments
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
                  className="absolute top-1/2 transform -translate-y-1/2 cursor-pointer group"
                  style={{ left: `${position}px` }}
                  onClick={() => setSelectedItem(item)}
                >
                  <div
                    className="relative px-4 py-2 rounded-full text-sm font-medium text-white border-2 whitespace-nowrap shadow-lg hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: `${color}40`,
                      borderColor: color,
                      boxShadow: `0 0 20px ${color}80`,
                    }}
                  >
                    {item.title}
                  </div>
                  
                  {/* Connector Dot */}
                  <div
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
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
            <span className="text-sm text-gray-400">Games</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#a855f7]" />
            <span className="text-sm text-gray-400">Movies</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#3b82f6]" />
            <span className="text-sm text-gray-400">TV Shows</span>
          </div>
        </div>

        <div className="text-sm text-gray-400">
          <span className="opacity-75">✨ Journey through time</span>
          <span className="mx-3">•</span>
          <span>Use arrow buttons to scroll</span>
          <span className="mx-3">•</span>
          <span>Click media to explore</span>
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
              className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition"
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
