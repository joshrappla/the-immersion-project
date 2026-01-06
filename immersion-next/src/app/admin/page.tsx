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
  
  // New filter/search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMediaType, setFilterMediaType] = useState('');
  const [filterEra, setFilterEra] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Generate starfield once using useMemo - won't regenerate on state changes
  const loginStars = useMemo(() => generateStarfield(200), []);
  const adminStars = useMemo(() => generateStarfield(150), []);

  const ADMIN_PASSWORD = 'immersion2024';
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

  useEffect(() => {
    if (isAuthenticated) {
      fetchMediaItems();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert('Incorrect password');
    }
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
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
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
    
    const item = {
      mediaId: editingItem?.mediaId || `media_${Date.now()}`,
      title: formData.get('title') as string,
      mediaType: formData.get('mediaType') as string,
      timePeriod: formData.get('timePeriod') as string,
      startYear: parseInt(formData.get('startYear') as string),
      endYear: parseInt(formData.get('endYear') as string),
      description: formData.get('description') as string,
      imageUrl: formData.get('imageUrl') as string,
      streamingUrl: formData.get('streamingUrl') as string,
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
      }
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item');
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
            <button
              onClick={() => {
                setShowForm(true);
                setEditingItem(null);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
            >
              + Add New
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="relative z-10 bg-gray-900/60 backdrop-blur-sm border-b border-gray-700 p-4">
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
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto p-6">
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
      </div>

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
                    <label className="block text-sm font-medium mb-1 text-gray-300">Era</label>
                    <input
                      name="timePeriod"
                      defaultValue={editingItem?.timePeriod}
                      required
                      placeholder="e.g. Viking Age"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">Start Year</label>
                    <input
                      name="startYear"
                      type="number"
                      defaultValue={editingItem?.startYear}
                      required
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">End Year</label>
                    <input
                      name="endYear"
                      type="number"
                      defaultValue={editingItem?.endYear}
                      required
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                  </div>
                </div>

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
