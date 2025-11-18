'use client';

import { useEffect, useRef, useState } from 'react';

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

interface TimelineProps {
  items: MediaItem[];
}

export default function Timeline({ items }: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [filteredType, setFilteredType] = useState<string>('');
  const [filteredPeriod, setFilteredPeriod] = useState<string>('');

  useEffect(() => {
    // Import vis-timeline dynamically (client-side only)
    if (typeof window !== 'undefined') {
      import('vis-timeline/standalone').then((vis) => {
        if (!timelineRef.current) return;

        const filteredItems = items.filter((item) => {
          const matchesType = !filteredType || item.mediaType.toLowerCase() === filteredType;
          const matchesPeriod = !filteredPeriod || item.timePeriod === filteredPeriod;
          return matchesType && matchesPeriod;
        });

        const timelineItems = filteredItems.map((item) => ({
          id: item.mediaId,
          content: item.title,
          start: new Date(item.startYear, 0, 1),
          end: new Date(item.endYear, 11, 31),
          className: item.mediaType.toLowerCase(),
        }));

        const options = {
          width: '100%',
          height: '300px',
          stack: true,
          showCurrentTime: false,
          zoomMin: 1000 * 60 * 60 * 24 * 365 * 50,
          zoomMax: 1000 * 60 * 60 * 24 * 365 * 5000,
        };

        const timeline = new vis.Timeline(timelineRef.current, timelineItems, options);

        timeline.on('select', (properties) => {
          if (properties.items.length > 0) {
            const itemId = properties.items[0];
            const item = items.find((i) => i.mediaId === itemId);
            if (item) setSelectedItem(item);
          }
        });

        timeline.fit();
      });
    }
  }, [items, filteredType, filteredPeriod]);

  const uniquePeriods = [...new Set(items.map((item) => item.timePeriod))];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-4xl font-bold text-purple-600 mb-4">
          The Immersion Project
        </h1>
        
        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-semibold mb-2">Media Type</label>
            <select
              value={filteredType}
              onChange={(e) => setFilteredType(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">All Types</option>
              <option value="movie">Movies</option>
              <option value="tv">TV Shows</option>
              <option value="game">Video Games</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Time Period</label>
            <select
              value={filteredPeriod}
              onChange={(e) => setFilteredPeriod(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">All Periods</option>
              {uniquePeriods.map((period) => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
        <div ref={timelineRef} className="w-full h-[300px]" />
      </div>

      {/* Media Detail Card */}
      {selectedItem && (
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
          <button
            onClick={() => setSelectedItem(null)}
            className="float-right text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
          
          <img
            src={selectedItem.imageUrl}
            alt={selectedItem.title}
            className="w-full h-64 object-cover rounded-lg mb-4"
          />
          
          <h2 className="text-3xl font-bold mb-2">{selectedItem.title}</h2>
          
          <div className="flex gap-2 mb-4">
            <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm">
              {selectedItem.mediaType.toUpperCase()}
            </span>
            <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm">
              {selectedItem.timePeriod}
            </span>
            <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm">
              {selectedItem.startYear} - {selectedItem.endYear}
            </span>
          </div>
          
          <p className="text-gray-700 mb-4">{selectedItem.description}</p>
          
          <a
            href={selectedItem.streamingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 bg-gradient-to-r from-purple-600 to-purple-800 text-white text-center rounded-lg font-bold hover:shadow-lg transition"
          >
            Immerse
          </a>
        </div>
      )}

      <style jsx>{`
        .movie {
          background-color: #ff6b6b;
          border-color: #ee5a52;
        }
        .tv {
          background-color: #4ecdc4;
          border-color: #45b7af;
        }
        .game {
          background-color: #ffe66d;
          border-color: #f7d648;
          color: #333;
        }
      `}</style>
    </div>
  );
}
