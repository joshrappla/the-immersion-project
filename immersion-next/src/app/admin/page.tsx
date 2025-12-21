'use client';

import { useState, useEffect } from 'react';
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

export default function AdminPanel() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-purple-900">
        <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full">
          <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
            Admin Login
          </h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-600"
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
            className="block text-center mt-4 text-purple-600 hover:underline"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Admin panel
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <div className="flex gap-4">
            <Link
              href="/timeline"
              className="px-4 py-2 bg-white text-purple-600 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              View Timeline
            </Link>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingItem(null);
              }}
              className="px-4 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition"
            >
              + Add New
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {loading ? (
          <div className="text-center text-gray-600">Loading...</div>
        ) : (
          <div className="grid gap-4">
            {mediaItems.map((item) => (
              <div
                key={item.mediaId}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {item.title}
                    </h3>
                    <div className="flex gap-2 mb-2 flex-wrap">
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                        {item.mediaType}
                      </span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {item.timePeriod}
                      </span>
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                        {item.startYear} - {item.endYear}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setShowForm(true);
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.mediaId)}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingItem ? 'Edit' : 'Add New'} Media Item
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    name="title"
                    defaultValue={editingItem?.title}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Media Type</label>
                    <select
                      name="mediaType"
                      defaultValue={editingItem?.mediaType}
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    >
                      <option value="movie">Movie</option>
                      <option value="tv">TV Show</option>
                      <option value="game">Game</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Time Period</label>
                    <input
                      name="timePeriod"
                      defaultValue={editingItem?.timePeriod}
                      required
                      placeholder="e.g. Viking Age"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Year</label>
                    <input
                      name="startYear"
                      type="number"
                      defaultValue={editingItem?.startYear}
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">End Year</label>
                    <input
                      name="endYear"
                      type="number"
                      defaultValue={editingItem?.endYear}
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingItem?.description}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Image URL</label>
                  <input
                    name="imageUrl"
                    type="url"
                    defaultValue={editingItem?.imageUrl}
                    required
                    placeholder="https://..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Streaming URL</label>
                  <input
                    name="streamingUrl"
                    type="url"
                    defaultValue={editingItem?.streamingUrl}
                    required
                    placeholder="https://..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
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
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
