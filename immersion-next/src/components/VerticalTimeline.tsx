'use client';

import { useState, useEffect, useMemo } from 'react';
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

export default function VerticalTimeline() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [mediaTypeFilter, setMediaTypeFilter] = useState('');
  const [eraFilter, setEraFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const stars = useMemo(() => generateStarfield(200), []);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const eraColors: { [key: string]: string } = {
    'Ancient Period': '#8b5cf6',
    'Ancient Rome': '#8b5cf6',
    'Ancient Greece': '#8b5cf6',
    'Medieval Period': '#a855f7',
    'Viking Age': '#c084fc',
    'Renaissance': '#d8b4fe',
    'Colonial Era': '#e9d5ff',
    'Industrial Revolution': '#f3e8ff',
    'Modern Era': '#faf5ff',
    'Contemporary': '#ffffff',
  };

  const mediaTypeColors: { [key: string]: string } = {
    'Game': '#10b981',
    'Movie': '#8b5cf6',
    'TV Show': '#3b82f6',
  };

  useEffect(() => {
    setMounted(true);
    fetchMediaItems();
  }, []);

  const fetchMediaItems = async () => {
    try {
      const response = await fetch(`${API_URL}/media`);
      const data = await response.json();
      setMediaItems(data.sort((a: MediaItem, b: MediaItem) => a.startYear - b.startYear));
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = mediaItems.filter(item => {
    const matchesType = !mediaTypeFilter || item.mediaType === mediaTypeFilter;
    const matchesEra = !eraFilter || item.timePeriod === eraFilter;
    return matchesType && matchesEra;
  });

  const uniqueMediaTypes = Array.from(new Set(mediaItems.map(item => item.mediaType)));
  const uniqueEras = Array.from(new Set(mediaItems.map(item => item.timePeriod)));

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl">Loading timeline...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black overflow-x-hidden">
      {/* Starfield Background */}
      <div className="fixed inset-0 z-0">
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
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-sm border-b border-purple-900/30">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center">
              <span className="text-xl">🕐</span>
            </div>
            <span className="text-white font-bold text-lg hidden sm:inline">
              The Immersion Verse
            </span>
          </Link>

          {/* Hamburger Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="w-12 h-12 flex items-center justify-center text-white hover:bg-gray-800 rounded-lg transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-50 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-gray-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="text-white font-bold text-lg">Menu</h3>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-10 h-10 flex items-center justify-center text-white hover:bg-gray-800 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Menu Content */}
            <div className="p-4 space-y-4">
              {/* Buy Me a Coffee */}
              <a
                href="https://buymeacoffee.com/yourusername"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 py-3 rounded-lg text-center transition"
              >
                ☕ Buy me a coffee
              </a>

              {/* Filters */}
              <div className="space-y-3">
                <label className="block">
                  <span className="text-gray-400 text-sm mb-1 block">Media Type</span>
                  <select
                    value={mediaTypeFilter}
                    onChange={(e) => setMediaTypeFilter(e.target.value)}
                    className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg text-base border border-gray-700"
                  >
                    <option value="">All Types</option>
                    {uniqueMediaTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-gray-400 text-sm mb-1 block">Era</span>
                  <select
                    value={eraFilter}
                    onChange={(e) => setEraFilter(e.target.value)}
                    className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg text-base border border-gray-700"
                  >
                    <option value="">All Eras</option>
                    {uniqueEras.map((era) => (
                      <option key={era} value={era}>{era}</option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Admin Link */}
              <Link
                href="/admin"
                className="block w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold px-6 py-3 rounded-lg text-center border border-gray-700 transition"
              >
                ⚙️ Admin
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Vertical Timeline */}
      <div className="relative z-10 py-8 px-4 max-w-4xl mx-auto">
        {/* Timeline Line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-600 via-purple-500 to-purple-600 transform -translate-x-1/2" />

        {/* Timeline Items */}
        <div className="space-y-12">
          {filteredItems.map((item, index) => {
            const isLeft = index % 2 === 0;
            const color = mediaTypeColors[item.mediaType] || '#8b5cf6';
            const eraColor = eraColors[item.timePeriod] || '#8b5cf6';

            return (
              <div
                key={item.mediaId}
                className={`relative flex items-center ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
              >
                {/* Card */}
                <div
                  className={`w-5/12 ${isLeft ? 'pr-8 text-right' : 'pl-8 text-left'}`}
                  onClick={() => setSelectedItem(item)}
                >
                  <div
                    className="bg-gray-900 border-2 rounded-xl p-4 cursor-pointer hover:scale-105 transition-transform shadow-lg"
                    style={{
                      borderColor: color,
                      boxShadow: `0 0 20px ${color}40`,
                    }}
                  >
                    <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                    <p className="text-gray-400 text-sm mb-1">
                      {item.startYear === item.endYear 
                        ? item.startYear 
                        : `${item.startYear} - ${item.endYear}`}
                    </p>
                    <div className="flex gap-2 justify-end mt-2">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${eraColor}30`,
                          color: eraColor,
                        }}
                      >
                        {item.timePeriod}
                      </span>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${color}30`,
                          color: color,
                        }}
                      >
                        {item.mediaType}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Center Dot */}
                <div className="absolute left-1/2 transform -translate-x-1/2 z-20">
                  <div
                    className="w-4 h-4 rounded-full cursor-pointer hover:scale-150 transition-transform"
                    style={{
                      backgroundColor: color,
                      boxShadow: `0 0 10px ${color}`,
                    }}
                    onClick={() => setSelectedItem(item)}
                  />
                </div>

                {/* Empty space on other side */}
                <div className="w-5/12" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Media Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 flex justify-between items-start">
              <div className="flex-1">
                <h2 className="text-white text-2xl font-bold mb-2">{selectedItem.title}</h2>
                <div className="flex gap-2 flex-wrap">
                  <span
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: `${mediaTypeColors[selectedItem.mediaType]}30`,
                      color: mediaTypeColors[selectedItem.mediaType],
                    }}
                  >
                    {selectedItem.mediaType}
                  </span>
                  <span
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: `${eraColors[selectedItem.timePeriod]}30`,
                      color: eraColors[selectedItem.timePeriod],
                    }}
                  >
                    {selectedItem.timePeriod}
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-800 text-gray-300">
                    {selectedItem.startYear === selectedItem.endYear 
                      ? selectedItem.startYear 
                      : `${selectedItem.startYear} - ${selectedItem.endYear}`}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="ml-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <p className="text-gray-300 leading-relaxed mb-6">{selectedItem.description}</p>

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

      {/* Bottom Legend */}
      <div className="relative z-50 flex flex-col items-center justify-center gap-4 p-4 bg-black/50 backdrop-blur-sm border-t border-purple-900/30">
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-300">Games</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-gray-300">Movies</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-gray-300">TV Shows</span>
          </div>
        </div>
        <p className="text-gray-500 text-xs text-center">
          ✨ Scroll through time • Tap to explore
        </p>
      </div>

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
