'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import RegionMappingsPanel from '@/components/RegionMappingsPanel';
import { inferRegions, type InferenceResult } from '@/lib/regionInference';
import InferencePreview, { InferencePreviewSkeleton } from '@/components/admin/InferencePreview';

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
  /** ISO alpha-2 codes inferred or manually set for map highlighting. */
  countryCodes?: string[];
  inferenceSource?: 'temporal' | 'hardcoded' | 'custom' | 'ai' | 'title-analysis' | 'manual' | 'fallback';
  inferenceConfidence?: 'high' | 'medium' | 'low';
  inferredAt?: number;
  overriddenAt?: number;
}

// Generate starfield once - won't change on re-renders
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

export default function AdminPanel() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  // Active admin tab
  const [activeTab, setActiveTab] = useState<'media' | 'regions'>('media');

  // New filter/search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMediaType, setFilterMediaType] = useState('');
  const [filterEra, setFilterEra] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // ── Inference state (media add/edit form) ─────────────────────────────────
  /** Controlled era field value */
  const [formEra, setFormEra] = useState('');
  const [formStartYear, setFormStartYear] = useState<number>(1000);
  const [formEndYear, setFormEndYear] = useState<number>(1100);
  const [inferenceResult, setInferenceResult] = useState<InferenceResult | null>(null);
  const [inferenceLoading, setInferenceLoading] = useState(false);
  /** True when the user has clicked "Edit manually" and overridden the inference. */
  const [inferenceOverridden, setInferenceOverridden] = useState(false);
  /** Comma-separated country codes entered manually when overridden. */
  const [manualCountriesStr, setManualCountriesStr] = useState('');
  const inferenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Batch re-analyze state ────────────────────────────────────────────────
  const [showBatchAnalyze, setShowBatchAnalyze] = useState(false);
  interface BatchItem {
    item: MediaItem;
    inferred: InferenceResult | null;
    loading: boolean;
    selected: boolean;
  }
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchApplying, setBatchApplying] = useState(false);
  const batchAbortRef = useRef(false);

  // Generate starfield once using useMemo - won't regenerate on state changes
  const loginStars = useMemo(() => generateStarfield(200), []);
  const adminStars = useMemo(() => generateStarfield(150), []);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Fetch media items
  const fetchMediaItems = async () => {
    try {
      const response = await fetch(`${API_URL}/media`);
      const data = await response.json();
      setMediaItems(data.items || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching media:', error);
      setLoading(false);
    }
  };

  // Check existing session on mount (httpOnly cookie sent automatically)
  useEffect(() => {
    fetch('/api/admin/session')
      .then(r => r.json())
      .then(data => { if (data.authenticated) setIsAuthenticated(true); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchMediaItems();
  }, [isAuthenticated]);

  // ── Reset form inference state when form opens / editing item changes ──────
  useEffect(() => {
    if (showForm) {
      const era = editingItem?.timePeriod ?? '';
      const sy  = editingItem?.startYear  ?? new Date().getFullYear();
      const ey  = editingItem?.endYear    ?? new Date().getFullYear();
      setFormEra(era);
      setFormStartYear(sy);
      setFormEndYear(ey);
      setInferenceResult(null);
      setInferenceLoading(false);
      setInferenceOverridden(false);
      setManualCountriesStr(editingItem?.countryCodes?.join(', ') ?? '');
    }
  }, [showForm, editingItem]);

  // ── Debounced auto-inference (fires 500ms after era / years change) ────────
  useEffect(() => {
    if (!showForm || !formEra.trim()) {
      setInferenceResult(null);
      setInferenceLoading(false);
      return;
    }
    if (inferenceOverridden) return; // user is editing manually — don't re-infer

    if (inferenceTimerRef.current) clearTimeout(inferenceTimerRef.current);
    setInferenceLoading(true);
    setInferenceResult(null);

    inferenceTimerRef.current = setTimeout(async () => {
      try {
        const result = await inferRegions({
          era: formEra.trim(),
          startYear: formStartYear,
          endYear: formEndYear,
        });
        setInferenceResult(result);
      } catch {
        // ignore — fallback already handled inside inferRegions
      } finally {
        setInferenceLoading(false);
      }
    }, 500);

    return () => {
      if (inferenceTimerRef.current) clearTimeout(inferenceTimerRef.current);
    };
  }, [formEra, formStartYear, formEndYear, showForm, inferenceOverridden]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.authenticated) {
        setIsAuthenticated(true);
      } else {
        setLoginError('Incorrect password');
      }
    } catch {
      setLoginError('Login failed — please try again');
    } finally {
      setPassword(''); // clear from memory immediately
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setIsAuthenticated(false);
  };

  const handleDelete = async (mediaId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`${API_URL}/media/${mediaId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchMediaItems();
        alert('Item deleted successfully!');
      } else {
        const data = await response.json().catch(() => ({}));
        const message = (data as { error?: string }).error ?? `Delete failed (HTTP ${response.status})`;
        console.error('Error deleting item:', response.status, data);
        alert(`Failed to delete item: ${message}`);
      }
    } catch (error) {
      console.error('Error deleting item (network):', error);
      alert('Failed to delete item: network error — check console for details');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedItems.size} items?`)) return;

    try {
      await Promise.all(
        Array.from(selectedItems).map(mediaId =>
          fetch(`${API_URL}/media/${mediaId}`, { method: 'DELETE' })
        )
      );
      fetchMediaItems();
      setSelectedItems(new Set());
      alert(`${selectedItems.size} items deleted successfully!`);
    } catch (error) {
      console.error('Error bulk deleting:', error);
      alert('Failed to delete items');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const countryVal = (formData.get('country') as string)?.trim();
    const latVal = formData.get('latitude') as string;
    const lngVal = formData.get('longitude') as string;

    // Resolve country codes from inference or manual override
    const resolvedCodes: string[] = inferenceOverridden
      ? manualCountriesStr
          .split(',')
          .map((s) => s.trim().toUpperCase())
          .filter((s) => /^[A-Z]{2}$/.test(s))
      : inferenceResult?.countries ?? [];

    const item = {
      mediaId: editingItem?.mediaId || `media_${Date.now()}`,
      title: formData.get('title') as string,
      mediaType: formData.get('mediaType') as string,
      timePeriod: formEra || (formData.get('timePeriod') as string),
      startYear: formStartYear || parseInt(formData.get('startYear') as string),
      endYear: formEndYear || parseInt(formData.get('endYear') as string),
      description: formData.get('description') as string,
      imageUrl: formData.get('imageUrl') as string,
      streamingUrl: formData.get('streamingUrl') as string,
      ...(countryVal ? { country: countryVal } : {}),
      ...(latVal ? { latitude: parseFloat(latVal) } : {}),
      ...(lngVal ? { longitude: parseFloat(lngVal) } : {}),
      ...(resolvedCodes.length > 0 ? { countryCodes: resolvedCodes } : {}),
      ...(inferenceResult && !inferenceOverridden
        ? {
            inferenceSource:     inferenceResult.source,
            inferenceConfidence: inferenceResult.confidence,
            inferredAt:          inferenceResult.inferredAt,
          }
        : {}),
      ...(inferenceOverridden ? { overriddenAt: Date.now(), inferenceSource: 'manual' as const } : {}),
    };

    try {
      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem
        ? `${API_URL}/media/${editingItem.mediaId}`
        : `${API_URL}/media`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });

      if (response.ok) {
        fetchMediaItems();
        setShowForm(false);
        setEditingItem(null);
        alert('Item saved successfully!');
      } else {
        const data = await response.json().catch(() => ({}));
        const message = (data as { error?: string }).error ?? `Save failed (HTTP ${response.status})`;
        console.error('Error saving item:', response.status, data);
        alert(`Failed to save item: ${message}`);
      }
    } catch (error) {
      console.error('Error saving item (network):', error);
      alert('Failed to save item: network error — check console for details');
    }
  };

  // Toggle item selection
  const toggleSelection = (mediaId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(mediaId)) {
      newSelection.delete(mediaId);
    } else {
      newSelection.add(mediaId);
    }
    setSelectedItems(newSelection);
  };

  // Select all filtered items
  const selectAll = () => {
    const allIds = new Set(filteredItems.map(item => item.mediaId));
    setSelectedItems(allIds);
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  // Filter and search logic
  const filteredItems = mediaItems.filter((item) => {
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = !filterMediaType || item.mediaType.toLowerCase() === filterMediaType.toLowerCase();
    const matchesEra = !filterEra || item.timePeriod === filterEra;
    
    return matchesSearch && matchesType && matchesEra;
  });

  // Get unique eras
  const uniqueEras = [...new Set(mediaItems.map(item => item.timePeriod))];

  // Starfield component to reuse
  const Starfield = ({ stars }: { stars: typeof loginStars }) => (
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
  );

  // Login screen with stable starfield
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black overflow-hidden flex items-center justify-center relative">
        {/* Stable Starfield Background */}
        <Starfield stars={loginStars} />

        {/* Login Card */}
        <div className="relative z-10 bg-gray-900/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-2 text-center text-white">
            Admin Login
          </h1>
          <p className="text-gray-400 text-center mb-6">Enter password to access admin panel</p>
          
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent placeholder-gray-500"
            />
            {loginError && (
              <p className="text-red-400 text-sm mb-3 text-center">{loginError}</p>
            )}
            <button
              type="submit"
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition"
            >
              Login
            </button>
          </form>
          
          <Link
            href="/"
            className="block text-center mt-4 text-gray-400 hover:text-white transition"
          >
            ← Back to Home
          </Link>
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

  // Admin panel with stable starfield
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Stable Starfield Background */}
      <Starfield stars={adminStars} />

      {/* Header */}
      <div className="relative z-10 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 p-6 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
              <p className="text-sm text-gray-400">Manage timeline media items</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <Link
              href="/timeline"
              className="px-4 py-2 bg-gray-800 text-gray-200 rounded-lg font-semibold hover:bg-gray-700 border border-gray-700 transition"
            >
              View Timeline
            </Link>
            {activeTab === 'media' && (
              <>
                <button
                  onClick={() => {
                    setBatchItems(mediaItems.map((item) => ({ item, inferred: null, loading: false, selected: true })));
                    setShowBatchAnalyze(true);
                  }}
                  className="px-4 py-2 bg-indigo-700 text-white rounded-lg font-semibold hover:bg-indigo-600 transition text-sm"
                >
                  ⚙ Re-analyze All
                </button>
                <button
                  onClick={() => {
                    setShowForm(true);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  + Add New
                </button>
              </>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg font-semibold hover:bg-gray-600 border border-gray-600 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 mt-5 border-t border-gray-700 pt-4">
          {(
            [
              { id: 'media', label: 'Media Items' },
              { id: 'regions', label: 'Region Mappings' },
            ] as { id: 'media' | 'regions'; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-gray-200'
              }`}
            >
              {tab.label}
              {tab.id === 'media' && mediaItems.length > 0 && (
                <span className="ml-2 text-xs opacity-70">({mediaItems.length})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Search and Filter Bar — media tab only */}
      {activeTab === 'media' && <div className="relative z-10 bg-gray-900/60 backdrop-blur-sm border-b border-gray-700 p-4">
        <div className="container mx-auto">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search media items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            {/* Filter by Media Type */}
            <select
              value={filterMediaType}
              onChange={(e) => setFilterMediaType(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              <option value="">All Media Types</option>
              <option value="game">Games</option>
              <option value="movie">Movies</option>
              <option value="tv">TV Shows</option>
            </select>

            {/* Filter by Era */}
            <select
              value={filterEra}
              onChange={(e) => setFilterEra(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              <option value="">All Eras</option>
              {uniqueEras.map((era) => (
                <option key={era} value={era}>{era}</option>
              ))}
            </select>

            {/* Bulk Actions Toggle */}
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                showBulkActions 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-800 text-gray-200 border border-gray-700'
              }`}
            >
              Bulk Actions {selectedItems.size > 0 && `(${selectedItems.size})`}
            </button>
          </div>

          {/* Bulk Actions Bar */}
          {showBulkActions && (
            <div className="mt-4 p-4 bg-gray-800/80 rounded-lg border border-gray-700 flex gap-4 items-center">
              <button
                onClick={selectAll}
                className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition text-sm"
              >
                Select All ({filteredItems.length})
              </button>
              <button
                onClick={deselectAll}
                className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition text-sm"
              >
                Deselect All
              </button>
              {selectedItems.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-semibold"
                >
                  Delete Selected ({selectedItems.size})
                </button>
              )}
              <span className="text-gray-400 text-sm ml-auto">
                {selectedItems.size} of {filteredItems.length} selected
              </span>
            </div>
          )}
        </div>
      </div>}

      {/* Region Mappings tab content */}
      {activeTab === 'regions' && (
        <div className="relative z-10 container mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-400 text-sm">Manage historical period → country mappings and AI cache.</p>
            <Link
              href="/admin/regions"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition flex items-center gap-1.5"
            >
              Open dedicated page
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          </div>
          <RegionMappingsPanel />
        </div>
      )}

      {/* Media Items tab content */}
      {activeTab === 'media' && <div className="relative z-10 container mx-auto p-6">
        {loading ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p className="text-xl">No media items found</p>
            <p className="text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.mediaId}
                className="bg-gray-900/80 backdrop-blur-sm p-6 rounded-lg border border-gray-700 hover:border-gray-600 transition"
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox for bulk selection */}
                  {showBulkActions && (
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.mediaId)}
                      onChange={() => toggleSelection(item.mediaId)}
                      className="mt-1 w-5 h-5 rounded border-gray-600 bg-gray-800 text-purple-600 focus:ring-purple-600 focus:ring-offset-gray-900"
                    />
                  )}

                  {/* Item Content */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {item.title}
                    </h3>
                    <div className="flex gap-2 mb-2 flex-wrap">
                      <span className="px-3 py-1 bg-purple-900/50 text-purple-300 rounded-full text-sm font-semibold border border-purple-700">
                        {item.mediaType}
                      </span>
                      <span className="px-3 py-1 bg-blue-900/50 text-blue-300 rounded-full text-sm border border-blue-700">
                        {item.timePeriod}
                      </span>
                      <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm border border-gray-700">
                        {item.startYear} - {item.endYear}
                      </span>
                      {item.country && (
                        <span className="px-3 py-1 bg-teal-900/50 text-teal-300 rounded-full text-sm border border-teal-700 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 004 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {item.country}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setShowForm(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.mediaId)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4 text-white">
                {editingItem ? 'Edit' : 'Add New'} Media Item
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Title</label>
                  <input
                    name="title"
                    defaultValue={editingItem?.title}
                    required
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">Media Type</label>
                    <select
                      name="mediaType"
                      defaultValue={editingItem?.mediaType}
                      required
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    >
                      <option value="movie">Movie</option>
                      <option value="tv">TV Show</option>
                      <option value="game">Game</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="form-era" className="block text-sm font-medium mb-1 text-gray-300">Era</label>
                    <input
                      id="form-era"
                      name="timePeriod"
                      value={formEra}
                      onChange={(e) => {
                        setFormEra(e.target.value);
                        setInferenceOverridden(false);
                      }}
                      required
                      placeholder="e.g. Viking Age"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="form-start-year" className="block text-sm font-medium mb-1 text-gray-300">Start Year</label>
                    <input
                      id="form-start-year"
                      name="startYear"
                      type="number"
                      value={formStartYear}
                      onChange={(e) => {
                        setFormStartYear(parseInt(e.target.value) || 0);
                        setInferenceOverridden(false);
                      }}
                      required
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="form-end-year" className="block text-sm font-medium mb-1 text-gray-300">End Year</label>
                    <input
                      id="form-end-year"
                      name="endYear"
                      type="number"
                      value={formEndYear}
                      onChange={(e) => {
                        setFormEndYear(parseInt(e.target.value) || 0);
                        setInferenceOverridden(false);
                      }}
                      required
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* ── Auto-inference region panel ──────────────────────────────── */}
                {formEra.trim() && (
                  <div className="pt-1">
                    {inferenceLoading ? (
                      <InferencePreviewSkeleton label="Analyzing historical context…" />
                    ) : inferenceOverridden ? (
                      <div className="rounded-lg border border-teal-700/50 bg-teal-900/20 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-teal-300">Manual region override</span>
                          <button
                            type="button"
                            onClick={() => {
                              setInferenceOverridden(false);
                              setManualCountriesStr('');
                            }}
                            className="text-xs text-gray-400 hover:text-gray-200 transition"
                          >
                            ← Use AI suggestion
                          </button>
                        </div>
                        <label htmlFor="manual-codes" className="block text-xs text-gray-400">
                          ISO codes (comma-separated):
                        </label>
                        <input
                          id="manual-codes"
                          type="text"
                          value={manualCountriesStr}
                          onChange={(e) => setManualCountriesStr(e.target.value)}
                          placeholder="e.g. IT, FR, DE"
                          className="w-full px-2 py-1.5 bg-gray-800 border border-gray-600 text-white rounded text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
                        />
                        <p className="text-xs text-gray-500">
                          Enter 2-letter ISO 3166-1 alpha-2 codes, comma-separated.
                        </p>
                      </div>
                    ) : inferenceResult ? (
                      <InferencePreview
                        result={inferenceResult}
                        onEditManually={() => {
                          setInferenceOverridden(true);
                          setManualCountriesStr(inferenceResult.countries.join(', '));
                        }}
                        onUseSuggestion={(codes) => {
                          setInferenceOverridden(true);
                          setManualCountriesStr(codes.join(', '));
                        }}
                      />
                    ) : null}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingItem?.description}
                    required
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Image URL</label>
                  <input
                    name="imageUrl"
                    type="url"
                    defaultValue={editingItem?.imageUrl}
                    required
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Streaming URL</label>
                  <input
                    name="streamingUrl"
                    type="url"
                    defaultValue={editingItem?.streamingUrl}
                    required
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>

                {/* Country Map Fields */}
                <div className="pt-2 border-t border-gray-700">
                  <p className="text-sm font-semibold text-teal-400 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 004 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Country Map (Optional)
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-300">Country / Region / Civilization</label>
                      <input
                        name="country"
                        defaultValue={editingItem?.country}
                        placeholder="e.g. Roman Empire, Feudal Japan, Ancient Egypt"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                      <p className="text-gray-500 text-xs mt-1">The country, civilization, or empire where this story is set.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-300">Latitude</label>
                        <input
                          name="latitude"
                          type="number"
                          step="any"
                          defaultValue={editingItem?.latitude}
                          placeholder="e.g. 41.9"
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-300">Longitude</label>
                        <input
                          name="longitude"
                          type="number"
                          step="any"
                          defaultValue={editingItem?.longitude}
                          placeholder="e.g. 12.5"
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <p className="text-gray-500 text-xs">Latitude &amp; Longitude determine the dot position on the world map. Leave blank if unknown.</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-bold hover:bg-purple-700 transition"
                  >
                    {editingItem ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingItem(null);
                    }}
                    className="flex-1 bg-gray-700 text-gray-200 py-2 rounded-lg font-bold hover:bg-gray-600 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Batch Re-analyze Modal ──────────────────────────────────────────── */}
      {showBatchAnalyze && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-gray-700">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-700 flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-white">Re-analyze All Media Regions</h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  Automatically infer country codes for each media item based on era and year range.
                </p>
              </div>
              <button
                onClick={() => {
                  batchAbortRef.current = true;
                  setShowBatchAnalyze(false);
                  setBatchRunning(false);
                  setBatchItems([]);
                }}
                className="text-gray-400 hover:text-white transition p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Item list */}
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {batchItems.map((bi, idx) => (
                <div
                  key={bi.item.mediaId}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/60 border border-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={bi.selected}
                    onChange={() => {
                      setBatchItems((prev) =>
                        prev.map((b, i) => i === idx ? { ...b, selected: !b.selected } : b)
                      );
                    }}
                    className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white text-sm truncate">{bi.item.title}</span>
                      <span className="text-xs text-blue-400 bg-blue-900/30 px-1.5 py-0.5 rounded border border-blue-800/40">
                        {bi.item.timePeriod}
                      </span>
                      <span className="text-xs text-gray-500">
                        {bi.item.startYear} – {bi.item.endYear}
                      </span>
                    </div>
                    {bi.loading && (
                      <p className="text-xs text-purple-400 mt-1 animate-pulse">Analyzing…</p>
                    )}
                    {bi.inferred && !bi.loading && (
                      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${
                          bi.inferred.confidence === 'high'
                            ? 'text-green-300 bg-green-900/30 border-green-700/50'
                            : bi.inferred.confidence === 'medium'
                            ? 'text-yellow-300 bg-yellow-900/30 border-yellow-700/50'
                            : 'text-red-300 bg-red-900/30 border-red-700/50'
                        }`}>
                          {bi.inferred.confidence}
                        </span>
                        <span className="text-xs text-gray-400">{bi.inferred.source}</span>
                        <span className="text-xs text-purple-300 font-mono">
                          {bi.inferred.countries.join(', ') || '(none)'}
                        </span>
                      </div>
                    )}
                    {bi.inferred && !bi.loading && bi.inferred.reasoning && (
                      <p className="text-xs text-gray-500 mt-0.5 italic">{bi.inferred.reasoning}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            {batchRunning && (
              <div className="px-4 pb-2 flex-shrink-0">
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-purple-500 h-1.5 rounded-full transition-all"
                    style={{
                      width: `${
                        batchItems.length
                          ? (batchItems.filter((b) => !b.loading && b.inferred !== null).length /
                              batchItems.length) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  {batchItems.filter((b) => !b.loading && b.inferred !== null).length} /{' '}
                  {batchItems.length} analyzed
                </p>
              </div>
            )}

            {/* Action bar */}
            <div className="flex items-center gap-3 p-4 border-t border-gray-700 flex-shrink-0">
              {!batchRunning && batchItems.every((b) => !b.loading && b.inferred === null) && (
                <button
                  onClick={async () => {
                    batchAbortRef.current = false;
                    setBatchRunning(true);

                    for (let i = 0; i < batchItems.length; i++) {
                      if (batchAbortRef.current) break;

                      setBatchItems((prev) =>
                        prev.map((b, idx) => idx === i ? { ...b, loading: true } : b)
                      );

                      try {
                        const result = await inferRegions({
                          era:       batchItems[i].item.timePeriod,
                          startYear: batchItems[i].item.startYear,
                          endYear:   batchItems[i].item.endYear,
                          title:     batchItems[i].item.title,
                        });
                        setBatchItems((prev) =>
                          prev.map((b, idx) =>
                            idx === i ? { ...b, inferred: result, loading: false } : b
                          )
                        );
                      } catch {
                        setBatchItems((prev) =>
                          prev.map((b, idx) => idx === i ? { ...b, loading: false } : b)
                        );
                      }

                      // 200ms gap between requests to avoid rate-limiting
                      await new Promise((r) => setTimeout(r, 200));
                    }

                    setBatchRunning(false);
                  }}
                  className="px-5 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
                >
                  Start Analysis
                </button>
              )}

              {batchRunning && (
                <button
                  onClick={() => {
                    batchAbortRef.current = true;
                    setBatchRunning(false);
                  }}
                  className="px-5 py-2 bg-red-700 text-white rounded-lg font-semibold hover:bg-red-800 transition"
                >
                  Cancel
                </button>
              )}

              {!batchRunning && batchItems.some((b) => b.inferred !== null) && (
                <button
                  disabled={batchApplying}
                  onClick={async () => {
                    setBatchApplying(true);
                    const toUpdate = batchItems.filter(
                      (b) => b.selected && b.inferred && b.inferred.countries.length > 0
                    );

                    try {
                      await Promise.all(
                        toUpdate.map(({ item, inferred }) =>
                          fetch(`${API_URL}/media/${item.mediaId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              ...item,
                              countryCodes:        inferred!.countries,
                              inferenceSource:     inferred!.source,
                              inferenceConfidence: inferred!.confidence,
                              inferredAt:          inferred!.inferredAt,
                            }),
                          })
                        )
                      );
                      await fetchMediaItems();
                      setShowBatchAnalyze(false);
                      setBatchItems([]);
                      alert(`Applied region data to ${toUpdate.length} item(s).`);
                    } catch {
                      alert('Failed to apply some changes.');
                    } finally {
                      setBatchApplying(false);
                    }
                  }}
                  className="px-5 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
                >
                  {batchApplying
                    ? 'Applying…'
                    : `Apply to ${batchItems.filter((b) => b.selected && b.inferred && b.inferred.countries.length > 0).length} item(s)`}
                </button>
              )}

              <span className="ml-auto text-xs text-gray-500">
                {batchItems.filter((b) => b.selected).length} of {batchItems.length} selected
              </span>
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
