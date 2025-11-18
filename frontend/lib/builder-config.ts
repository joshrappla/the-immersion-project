import { builder } from '@builder.io/react';
import Timeline from '@/components/Timeline';

// Register custom components with Builder.io
builder.init(process.env.NEXT_PUBLIC_BUILDER_API_KEY!);

// Register Timeline as a draggable component in Builder.io
Builder.registerComponent(Timeline, {
  name: 'Timeline',
  inputs: [
    {
      name: 'items',
      type: 'list',
      subFields: [
        { name: 'mediaId', type: 'string', required: true },
        { name: 'title', type: 'string', required: true },
        { name: 'mediaType', type: 'string', enum: ['movie', 'tv', 'game'], required: true },
        { name: 'timePeriod', type: 'string', required: true },
        { name: 'startYear', type: 'number', required: true },
        { name: 'endYear', type: 'number', required: true },
        { name: 'description', type: 'longText', required: true },
        { name: 'imageUrl', type: 'file', required: true },
        { name: 'streamingUrl', type: 'url', required: true },
      ],
    },
  ],
});
