// Shared media item type — matches the AWS Lambda backend response shape.
export interface MediaItem {
  mediaId: string;
  title: string;
  mediaType: string;        // 'game' | 'movie' | 'tv' | 'book' | etc.
  timePeriod: string;       // Era label, e.g. 'Ancient World'
  startYear: number;
  endYear: number;
  description: string;
  imageUrl: string;
  streamingUrl: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  countryCodes?: string[];
}

// Colours for each media type
export const MEDIA_TYPE_COLORS: Record<string, string> = {
  game:    '#10b981',   // emerald
  movie:   '#f59e0b',   // amber
  tv:      '#8b5cf6',   // purple
  book:    '#3b82f6',   // blue
  music:   '#ec4899',   // pink
  podcast: '#f97316',   // orange
};

export function mediaTypeColor(type: string): string {
  return MEDIA_TYPE_COLORS[type.toLowerCase()] ?? '#94a3b8';
}

export const MEDIA_TYPE_ICONS: Record<string, string> = {
  game:    '🎮',
  movie:   '🎬',
  tv:      '📺',
  book:    '📖',
  music:   '🎵',
  podcast: '🎙️',
};

export function mediaTypeIcon(type: string): string {
  return MEDIA_TYPE_ICONS[type.toLowerCase()] ?? '✨';
}
