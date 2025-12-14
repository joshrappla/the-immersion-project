'use client';

import { BuilderComponent, builder } from '@builder.io/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

// Initialize Builder
builder.init(process.env.NEXT_PUBLIC_BUILDER_API_KEY!);

export default function Home() {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Builder.io content for the homepage
    builder
      .get('page', {
        url: '/',
      })
      .promise()
      .then((content) => {
        setContent(content);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-purple-900">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  // If no Builder.io content, show default landing page
  if (!content) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 text-white">
        <div className="container mx-auto px-4 py-20">
          <h1 className="text-6xl font-bold mb-6 text-center">
            The Immersion Verse
          </h1>
          <p className="text-2xl mb-12 text-center max-w-2xl mx-auto">
            Step into history through the lens of movies, TV shows, and video games.
            Explore different time periods and immerse yourself in the past.
          </p>
          
          <div className="flex justify-center gap-6">
            <Link
              href="/timeline"
              className="px-8 py-4 bg-white text-purple-600 rounded-lg text-xl font-bold hover:shadow-2xl transition"
            >
              Explore Timeline
            </Link>
            
            <Link
              href="/admin"
              className="px-8 py-4 border-2 border-white text-white rounded-lg text-xl font-bold hover:bg-white hover:text-purple-600 transition"
            >
              Admin Panel
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render Builder.io content
  return (
    <div>
      <BuilderComponent model="page" content={content} />
      
      {/* Add navigation buttons */}
      <div className="fixed bottom-8 right-8 flex gap-4">
        <Link
          href="/timeline"
          className="px-6 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition shadow-lg"
        >
          View Timeline
        </Link>
      </div>
    </div>
  );
}
