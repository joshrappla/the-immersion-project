'use client';

import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';

const GEO_URL = '/countries-110m.json';

export interface MediaItem {
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

interface CountryMapProps {
  mediaItems: MediaItem[];
  onSelectItem: (item: MediaItem) => void;
}

const getMediaColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'game': return '#10b981';
    case 'movie': return '#a855f7';
    case 'tv': return '#3b82f6';
    default: return '#6b7280';
  }
};

export default function CountryMap({ mediaItems, onSelectItem }: CountryMapProps) {
  const [tooltip, setTooltip] = useState<{ item: MediaItem; x: number; y: number } | null>(null);
  const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: [0, 20],
    zoom: 1,
  });

  const mappedItems = mediaItems.filter(
    (item) => item.latitude !== undefined && item.longitude !== undefined
  );
  const unmappedItems = mediaItems.filter(
    (item) => item.latitude === undefined || item.longitude === undefined
  );

  const handleMoveEnd = (pos: { coordinates: [number, number]; zoom: number }) => {
    setPosition(pos);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Map Area */}
      <div className="relative flex-1 min-h-0 bg-[#0a0a1a]">
        {/* Legend */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 bg-black/60 backdrop-blur-sm rounded-lg p-3 border border-white/10">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Legend</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#10b981]" />
            <span className="text-xs text-gray-300">Games</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#a855f7]" />
            <span className="text-xs text-gray-300">Movies</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#3b82f6]" />
            <span className="text-xs text-gray-300">TV Shows</span>
          </div>
        </div>

        {/* Zoom hint */}
        <div className="absolute top-3 right-3 z-20 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
          <p className="text-gray-400 text-xs">Scroll to zoom · Drag to pan</p>
        </div>

        {/* Mapped item count badge */}
        <div className="absolute bottom-3 left-3 z-20 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
          <p className="text-teal-400 text-xs font-semibold">
            {mappedItems.length} item{mappedItems.length !== 1 ? 's' : ''} on map
            {unmappedItems.length > 0 && (
              <span className="text-gray-500 font-normal"> · {unmappedItems.length} without location</span>
            )}
          </p>
        </div>

        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 120, center: [0, 20] }}
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomableGroup
            zoom={position.zoom}
            center={position.coordinates}
            onMoveEnd={handleMoveEnd}
            minZoom={0.8}
            maxZoom={8}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#1e293b"
                    stroke="#334155"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none' },
                      hover: { fill: '#273548', outline: 'none' },
                      pressed: { outline: 'none' },
                    }}
                  />
                ))
              }
            </Geographies>

            {/* Media dots */}
            {mappedItems.map((item) => {
              const color = getMediaColor(item.mediaType);
              return (
                <Marker
                  key={item.mediaId}
                  coordinates={[item.longitude!, item.latitude!]}
                  onClick={() => onSelectItem(item)}
                  onMouseEnter={(e: React.MouseEvent<SVGGElement>) => {
                    const rect = (e.target as SVGElement).closest('svg')?.getBoundingClientRect();
                    if (rect) {
                      setTooltip({
                        item,
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                      });
                    }
                  }}
                  onMouseLeave={() => setTooltip(null)}
                >
                  {/* Outer glow ring */}
                  <circle
                    r={7 / position.zoom}
                    fill={`${color}30`}
                    stroke={color}
                    strokeWidth={1.5 / position.zoom}
                    style={{ cursor: 'pointer' }}
                  />
                  {/* Inner dot */}
                  <circle
                    r={4 / position.zoom}
                    fill={color}
                    style={{ filter: `drop-shadow(0 0 4px ${color})`, cursor: 'pointer' }}
                  />
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute z-30 pointer-events-none bg-gray-900/95 border border-gray-600 rounded-lg px-3 py-2 shadow-xl max-w-[200px]"
            style={{
              left: Math.min(tooltip.x + 12, 9999),
              top: tooltip.y - 10,
              transform: 'translateY(-100%)',
            }}
          >
            <p className="text-white font-semibold text-sm leading-tight">{tooltip.item.title}</p>
            {tooltip.item.country && (
              <p className="text-teal-400 text-xs mt-0.5">{tooltip.item.country}</p>
            )}
            <p className="text-gray-400 text-xs">
              {tooltip.item.startYear === tooltip.item.endYear
                ? tooltip.item.startYear
                : `${tooltip.item.startYear}–${tooltip.item.endYear}`}
            </p>
            <div
              className="inline-block px-1.5 py-0.5 rounded text-xs font-medium mt-1"
              style={{
                backgroundColor: `${getMediaColor(tooltip.item.mediaType)}30`,
                color: getMediaColor(tooltip.item.mediaType),
              }}
            >
              {tooltip.item.mediaType}
            </div>
          </div>
        )}
      </div>

      {/* Unmapped Items List */}
      {unmappedItems.length > 0 && (
        <div className="border-t border-white/10 bg-black/50 backdrop-blur-sm">
          <div className="px-4 py-2 border-b border-white/5">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
              Items without a mapped location ({unmappedItems.length})
            </p>
          </div>
          <div className="flex gap-2 overflow-x-auto p-3 scrollbar-thin">
            {unmappedItems.map((item) => {
              const color = getMediaColor(item.mediaType);
              return (
                <button
                  key={item.mediaId}
                  onClick={() => onSelectItem(item)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium text-white border-2 whitespace-nowrap hover:scale-105 transition-transform"
                  style={{
                    backgroundColor: `${color}20`,
                    borderColor: color,
                    boxShadow: `0 0 10px ${color}40`,
                  }}
                >
                  {item.title}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
