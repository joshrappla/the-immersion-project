'use client';

import { BuilderComponent, builder } from '@builder.io/react';
import { useEffect, useState } from 'react';
import Timeline from '@/components/Timeline';

// Initialize Builder.io
builder.init(process.env.NEXT_PUBLIC_BUILDER_API_KEY!);

export default function Home() {
  const [content, setContent] = useState<any>(null);
  const [mediaItems, setMediaItems] = useState<any[]>([]);

  useEffect(() => {
    // Fetch Builder.io content
    builder
      .get('page', {
        url: '/',
      })
      .promise()
      .then((content) => {
        setContent(content);
      });

    // Fetch media items from API
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/media`)
      .then((res) => res.json())
      .then((data) => {
        setMediaItems(data.items || []);
      })
      .catch((error) => {
        console.error('Error fetching media:', error);
      });
  }, []);

  return (
    <main className="min-h-screen">
      {/* Builder.io content - allows editing header, styling, etc. */}
      <BuilderComponent model="page" content={content} />
      
      {/* Your custom Timeline component */}
      <Timeline items={mediaItems} />
    </main>
  );
}
