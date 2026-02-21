'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const CountryMap = dynamic(() => import('./CountryMap'), { ssr: false });

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
  country?: string;
  latitude?: number;
  longitude?: number;
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
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [contributeTab, setContributeTab] = useState<'media' | 'feedback'>('media');
  const [timelineScale, setTimelineScale] = useState(1);
  const [currentView, setCurrentView] = useState<'timeline' | 'country'>('timeline');
  const [musicOn, setMusicOn] = useState(false);
  const pinchStartRef = useRef<{ distance: number; scale: number } | null>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  // Background music — place your audio file at /public/music/background.mp3
  useEffect(() => {
    const audio = new Audio('/music/background.mp3');
    audio.loop = true;
    audio.volume = 0.4;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (musicOn) {
      audio.pause();
    } else {
      audio.play().catch(() => {}); // silently ignore if browser blocks autoplay
    }
    setMusicOn(prev => !prev);
  };

  const fetchMediaItems = async () => {
    try {
      console.log('Fetching from:', API_URL);
      const response = await fetch(`${API_URL}/media`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Raw API response:', data);
      
      // Handle different response formats
      let items: MediaItem[] = [];
      
      if (Array.isArray(data)) {
        items = data;
      } else if (data.items && Array.isArray(data.items)) {
        items = data.items;
      } else if (data.media && Array.isArray(data.media)) {
        items = data.media;
      } else if (typeof data === 'object') {
        // Try to extract array from object
        const values = Object.values(data);
        if (values.length > 0 && Array.isArray(values[0])) {
          items = values[0] as MediaItem[];
        }
      }
      
      console.log('Processed items:', items.length);
      
      if (!Array.isArray(items)) {
        throw new Error('API response is not in expected format');
      }
      
      setMediaItems(items.sort((a: MediaItem, b: MediaItem) => a.startYear - b.startYear));
      setError(null);
    } catch (err) {
      console.error('Error fetching media:', err);
      setError(err instanceof Error ? err.message : 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  };

  // Pinch-to-zoom handlers for vertical timeline
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      pinchStartRef.current = { distance, scale: timelineScale };
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2 && pinchStartRef.current) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      const scaleChange = currentDistance / pinchStartRef.current.distance;
      const newScale = Math.max(0.5, Math.min(3, pinchStartRef.current.scale * scaleChange));
      setTimelineScale(newScale);
    }
  };

  const handleTouchEnd = () => {
    pinchStartRef.current = null;
  };

  // Attach non-passive touchmove so preventDefault() blocks scroll during pinch
  useEffect(() => {
    const el = timelineContainerRef.current;
    if (!el) return;
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', handleTouchMove);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <div className="text-white text-center">
          <div className="text-2xl mb-4">Loading timeline...</div>
          <div className="text-gray-400 text-sm">Fetching media items</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-xl mb-4">⚠️ Error Loading Timeline</div>
          <div className="text-gray-400 mb-4">{error}</div>
          <button
            onClick={fetchMediaItems}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
          >
            Retry
          </button>
        </div>
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

          <div className="flex items-center gap-2">
            {/* Music Toggle */}
            <button
              onClick={toggleMusic}
              className={`w-12 h-12 flex items-center justify-center rounded-lg transition ${
                musicOn
                  ? 'bg-purple-900/60 text-purple-300 hover:bg-purple-900'
                  : 'text-white hover:bg-gray-800'
              }`}
              title={musicOn ? 'Mute music' : 'Play music'}
            >
              {musicOn ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                </svg>
              )}
            </button>

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
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-50 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-gray-900 shadow-2xl overflow-y-auto"
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
                href="https://www.buymeacoffee.com/joshrapp"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full p-4 bg-gray-800 text-white rounded-lg border border-gray-700 hover:bg-gray-700 transition"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.9 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"/>
                </svg>
                <span className="font-semibold">Buy me a coffee</span>
              </a>

              {/* Music Toggle */}
              <button
                onClick={toggleMusic}
                className={`flex items-center gap-3 w-full p-4 rounded-lg border transition ${
                  musicOn
                    ? 'bg-purple-900/60 text-purple-300 border-purple-700 hover:bg-purple-900'
                    : 'bg-gray-800 text-white border-gray-700 hover:bg-gray-700'
                }`}
              >
                {musicOn ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                  </svg>
                )}
                <span className="font-semibold">{musicOn ? 'Music On' : 'Music Off'}</span>
              </button>

              {/* Filters */}
              <div className="space-y-3">
                <label className="block">
                  <span className="text-gray-400 text-sm mb-1 block">Media Type</span>
                  <select
                    value={mediaTypeFilter}
                    onChange={(e) => {
                      setMediaTypeFilter(e.target.value);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg text-base border border-gray-700"
                  >
                    <option value="">All Types</option>
                    {uniqueMediaTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-gray-400 text-sm mb-1 block">Era</span>
                  <select
                    value={eraFilter}
                    onChange={(e) => {
                      setEraFilter(e.target.value);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg text-base border border-gray-700"
                  >
                    <option value="">All Eras</option>
                    {uniqueEras.map((era) => (
                      <option key={era} value={era}>{era}</option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Country View Toggle */}
              <button
                onClick={() => {
                  setCurrentView(v => v === 'country' ? 'timeline' : 'country');
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 w-full p-4 rounded-lg border transition ${
                  currentView === 'country'
                    ? 'bg-teal-900/60 text-teal-300 border-teal-700 hover:bg-teal-900'
                    : 'bg-gray-800 text-white border-gray-700 hover:bg-gray-700'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 004 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold">{currentView === 'country' ? 'Timeline View' : 'Country View'}</span>
              </button>

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

              {/* Item Count */}
              <div className="text-center text-gray-400 text-sm py-2 border-t border-gray-800">
                Showing {filteredItems.length} of {mediaItems.length} items
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

      {/* Country Map View */}
      {currentView === 'country' && (
        <div className="relative z-10" style={{ height: 'calc(100vh - 73px)' }}>
          <CountryMap mediaItems={filteredItems} onSelectItem={setSelectedItem} />
        </div>
      )}

      {/* Vertical Timeline */}
      {currentView === 'timeline' && (
      <div
        ref={timelineContainerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative z-10 py-8 px-4 max-w-4xl mx-auto"
        style={{ zoom: timelineScale }}
      >
        {filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-gray-400 text-xl mb-4">
              {mediaItems.length === 0 ? '📭 No media items yet' : '🔍 No items match your filters'}
            </div>
            <div className="text-gray-500 text-sm">
              {mediaItems.length === 0 
                ? 'Add some media items through the admin panel'
                : 'Try adjusting your filters'}
            </div>
          </div>
        ) : (
          <>
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
                      className={`w-5/12 ${isLeft ? 'pr-4 text-right' : 'pl-4 text-left'}`}
                      onClick={() => setSelectedItem(item)}
                    >
                      <div
                        className="bg-gray-900 border-2 rounded-xl p-4 cursor-pointer hover:scale-105 transition-transform shadow-lg"
                        style={{
                          borderColor: color,
                          boxShadow: `0 0 20px ${color}40`,
                        }}
                      >
                        <h3 className="text-white font-bold text-base mb-2">{item.title}</h3>
                        <p className="text-gray-400 text-xs mb-2">
                          {item.startYear === item.endYear 
                            ? item.startYear 
                            : `${item.startYear} - ${item.endYear}`}
                        </p>
                        <div className={`flex gap-2 flex-wrap mt-2 ${isLeft ? 'justify-end' : 'justify-start'}`}>
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${eraColor}30`,
                              color: eraColor,
                            }}
                          >
                            {item.timePeriod}
                          </span>
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium"
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
          </>
        )}
      </div>
      )}

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

      {/* Contribute Modal */}
      {showContributeModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowContributeModal(false)}
        >
          <div
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-700 overflow-hidden max-h-[90vh] overflow-y-auto relative"
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
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-2">Contribute to The Immersion Verse</h2>
              <p className="text-gray-400 text-sm">Help us expand our historical timeline or share your feedback</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => setContributeTab('media')}
                className={`flex-1 px-4 py-4 font-semibold transition ${
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
                className={`flex-1 px-4 py-4 font-semibold transition ${
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
            <div className="p-6">
              {contributeTab === 'media' ? (
                <form action="https://formspree.io/f/YOUR_FORM_ID" method="POST" className="space-y-4">
                  <input type="hidden" name="_subject" value="New Media Suggestion - The Immersion Verse" />
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Your Name (Optional)</label>
                    <input type="text" name="name" className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-600 transition" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Email (Optional)</label>
                    <input type="email" name="email" className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-600 transition" placeholder="john@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Media Title <span className="text-red-500">*</span></label>
                    <input type="text" name="title" required className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-600 transition" placeholder="Vikings" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">Media Type <span className="text-red-500">*</span></label>
                      <select name="mediaType" required className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-600 transition">
                        <option value="">Select type...</option>
                        <option value="Game">Game</option>
                        <option value="Movie">Movie</option>
                        <option value="TV">TV Show</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">Era (Optional)</label>
                      <input type="text" name="era" className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-600 transition" placeholder="Viking Age" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Country / Region / Civilization (Optional)</label>
                    <input type="text" name="country" className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-600 transition" placeholder="e.g. Roman Empire, Feudal Japan, Ancient Egypt" />
                    <p className="text-gray-500 text-xs mt-1">The country, civilization, or empire where this story is set — used to place it on the Country Map.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">Start Year (Optional)</label>
                      <input type="number" name="startYear" className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-600 transition" placeholder="793" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">End Year (Optional)</label>
                      <input type="number" name="endYear" className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-600 transition" placeholder="1066" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Description (Optional)</label>
                    <textarea name="description" rows={4} className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-600 transition resize-none" placeholder="Brief description of the media and its historical setting..." />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Source URL (Optional)</label>
                    <input type="url" name="sourceUrl" className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-600 transition" placeholder="https://..." />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="submit" className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition">Submit Suggestion</button>
                    <button type="button" onClick={() => setShowContributeModal(false)} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition">Cancel</button>
                  </div>
                </form>
              ) : (
                <form action="https://formspree.io/f/YOUR_FORM_ID" method="POST" className="space-y-4">
                  <input type="hidden" name="_subject" value="Feedback - The Immersion Verse" />
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Your Name (Optional)</label>
                    <input type="text" name="name" className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-600 transition" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Email (Optional)</label>
                    <input type="email" name="email" className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-600 transition" placeholder="john@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Feedback Type <span className="text-red-500">*</span></label>
                    <select name="feedbackType" required className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-600 transition">
                      <option value="">Select type...</option>
                      <option value="Feature Request">Feature Request</option>
                      <option value="Bug Report">Bug Report</option>
                      <option value="General Feedback">General Feedback</option>
                      <option value="Question">Question</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Your Message <span className="text-red-500">*</span></label>
                    <textarea name="message" required rows={6} className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-purple-600 transition resize-none" placeholder="Share your thoughts, suggestions, or report an issue..." />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="submit" className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition">Send Feedback</button>
                    <button type="button" onClick={() => setShowContributeModal(false)} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition">Cancel</button>
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
