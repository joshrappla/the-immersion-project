'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import '../styles/timeline.css';

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
  items?: MediaItem[];
}

export default function Timeline({ items: propItems }: TimelineProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(propItems || []);
  const [filteredItems, setFilteredItems] = useState<MediaItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [mediaTypeFilter, setMediaTypeFilter] = useState('');
  const [timePeriodFilter, setTimePeriodFilter] = useState('');
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [loading, setLoading] = useState(!propItems);

  // Music mapping by period
  const musicByPeriod: Record<string, string> = {
    'Ancient Greece': 'https://cdn.pixabay.com/audio/2023/11/29/audio_5dcdc2c23b.mp3',
    'Ancient Rome': 'https://cdn.pixabay.com/audio/2023/12/06/audio_54f8c46be4.mp3',
    'Viking Age': 'https://cdn.pixabay.com/audio/2023/02/28/audio_2f2fc7eda9.mp3',
    'Third Crusade': 'https://cdn.pixabay.com/audio/2023/11/27/audio_9b9afc0e9e.mp3',
    'Renaissance': 'https://cdn.pixabay.com/audio/2023/06/08/audio_5e2bdaf0fb.mp3',
    'Meiji Restoration': 'https://cdn.pixabay.com/audio/2023/10/29/audio_3e79976610.mp3',
    'Wild West': 'https://cdn.pixabay.com/audio/2023/10/08/audio_8fc0ec2cd6.mp3',
    'Post-WWI': 'https://cdn.pixabay.com/audio/2023/04/12/audio_3e28c7e8bb.mp3',
  };

  const defaultMusic = 'https://cdn.pixabay.com/audio/2022/09/05/audio_d1718ab41b.mp3';

  // Fetch media items from API
  useEffect(() => {
    if (!propItems) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/media`)
        .then((res) => res.json())
        .then((data) => {
          setMediaItems(data.items || []);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching media:', error);
          setLoading(false);
        });
    }
  }, [propItems]);

  // Filter items
  useEffect(() => {
    let filtered = mediaItems;
    if (mediaTypeFilter) {
      filtered = filtered.filter(
        (item) => item.mediaType.toLowerCase() === mediaTypeFilter
      );
    }
    if (timePeriodFilter) {
      filtered = filtered.filter((item) => item.timePeriod === timePeriodFilter);
    }
    setFilteredItems(filtered);
  }, [mediaItems, mediaTypeFilter, timePeriodFilter]);

  // Get unique time periods
  const timePeriods = [...new Set(mediaItems.map((item) => item.timePeriod))];

  // Switch music based on period
  useEffect(() => {
    if (typeof window !== 'undefined' && timePeriodFilter) {
      const audio = document.getElementById('bgMusic') as HTMLAudioElement;
      if (audio) {
        const musicUrl = musicByPeriod[timePeriodFilter] || defaultMusic;
        const wasPlaying = !audio.paused;
        audio.src = musicUrl;
        if (wasPlaying) {
          audio.play().catch(console.log);
        }
      }
    }
  }, [timePeriodFilter]);

  const toggleMusic = () => {
    const audio = document.getElementById('bgMusic') as HTMLAudioElement;
    if (audio) {
      if (isMusicPlaying) {
        audio.pause();
      } else {
        audio.play().catch(console.log);
      }
      setIsMusicPlaying(!isMusicPlaying);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-purple-900">
        <div className="text-white text-2xl">Loading timeline...</div>
      </div>
    );
  }

  return (
    <div className="timeline-container">
      {/* Header */}
      <div className="timeline-header">
        <h1 className="timeline-title">The Immersion Verse</h1>
        
        <div className="timeline-filters">
          <select
            value={mediaTypeFilter}
            onChange={(e) => setMediaTypeFilter(e.target.value)}
            className="timeline-select"
          >
            <option value="">All Types</option>
            <option value="movie">Movies</option>
            <option value="tv">TV Shows</option>
            <option value="game">Games</option>
          </select>

          <select
            value={timePeriodFilter}
            onChange={(e) => setTimePeriodFilter(e.target.value)}
            className="timeline-select"
          >
            <option value="">All Periods</option>
            {timePeriods.map((period) => (
              <option key={period} value={period}>
                {period}
              </option>
            ))}
          </select>

          <a
            href="/admin"
            className="timeline-admin-btn"
          >
            Admin
          </a>
        </div>
      </div>

      {/* Timeline Items */}
      <div className="timeline-items">
        {filteredItems.map((item) => (
          <div
            key={item.mediaId}
            className="timeline-item"
            onClick={() => setSelectedItem(item)}
          >
            <div className="timeline-connector"></div>
            <div className={`timeline-dot ${item.mediaType.toLowerCase()}`}></div>
            <div className="timeline-content">
              <h3>{item.title}</h3>
              <div className="timeline-year">
                {item.startYear === item.endYear
                  ? item.startYear
                  : `${item.startYear} - ${item.endYear}`}
              </div>
              <div className="timeline-period">{item.timePeriod}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Media Detail Modal */}
      {selectedItem && (
        <div
          className="media-detail-overlay"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="media-detail"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-btn"
              onClick={() => setSelectedItem(null)}
            >
              ✕
            </button>
            <img
              src={selectedItem.imageUrl}
              alt={selectedItem.title}
              className="media-image"
            />
            <div className="media-info">
              <h2>{selectedItem.title}</h2>
              <div className="media-meta">
                <span className={`badge ${selectedItem.mediaType}`}>
                  {selectedItem.mediaType.toUpperCase()}
                </span>
                <span className="badge">{selectedItem.timePeriod}</span>
                <span className="badge">
                  {selectedItem.startYear} - {selectedItem.endYear}
                </span>
              </div>
              <p className="media-description">{selectedItem.description}</p>
              <a
                href={selectedItem.streamingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="immerse-btn"
              >
                Immerse
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Music Control */}
      <button className="music-btn" onClick={toggleMusic}>
        {isMusicPlaying ? '🔊' : '🔇'}
      </button>

      {/* Audio Element */}
      <audio id="bgMusic" loop src={defaultMusic}></audio>

      {/* Buy Me a Coffee Widget */}
      <script
        data-name="BMC-Widget"
        data-cfasync="false"
        src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js"
        data-id="joshrapp"
        data-description="Support me on Buy me a coffee!"
        data-message=""
        data-color="#5F7FFF"
        data-position="Left"
        data-x_margin="18"
        data-y_margin="18"
      ></script>
    </div>
  );
}
