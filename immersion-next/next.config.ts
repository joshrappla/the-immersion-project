import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.builder.io',
      },
    ],
  },

  // Prevent Three.js and related packages from being bundled server-side.
  // Even with dynamic() + ssr:false, the static bundler analysis can trip on
  // packages that reference WebGL / window at module evaluation time.
  serverExternalPackages: [
    'three',
    'gsap',
    'postprocessing',
    '@react-three/fiber',
    '@react-three/drei',
    '@react-three/postprocessing',
  ],

  // Allow Google Fonts to be fetched with system TLS certs (local dev / CI)
  experimental: {
    turbopackUseSystemTlsCerts: true,
  },

  // Webpack: treat Three.js deps as external on the server so they're never
  // evaluated during SSR, even if the module graph reaches them via static imports.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webpack(config: any, { isServer }: { isServer: boolean }) {
    if (isServer) {
      const threeExternals = [
        'three',
        'gsap',
        'postprocessing',
        '@react-three/fiber',
        '@react-three/drei',
        '@react-three/postprocessing',
      ];

      const existing = config.externals;
      if (Array.isArray(existing)) {
        config.externals = [...existing, ...threeExternals];
      } else if (typeof existing === 'function') {
        config.externals = [
          existing,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ({ request }: { request?: string }, callback: (...args: any[]) => void) => {
            if (request && threeExternals.some(pkg => request === pkg || request.startsWith(pkg + '/'))) {
              callback(null, `commonjs ${request}`);
            } else {
              callback();
            }
          },
        ];
      } else {
        config.externals = threeExternals;
      }
    }
    return config;
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // 'unsafe-eval' is required for Three.js GLSL shader compilation via WebGL
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              // data: and blob: needed for Three.js textures / canvas readback
              "img-src 'self' https: data: blob:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://p3cf32ynjf.execute-api.us-east-2.amazonaws.com https://formspree.io https://fonts.googleapis.com https://cdn.jsdelivr.net",
              "media-src 'self'",
              // blob: needed for Three.js worker-based features
              "worker-src 'self' blob:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self' https://formspree.io",
            ].join('; '),
          },
          { key: 'X-Frame-Options',           value: 'DENY'                        },
          { key: 'X-Content-Type-Options',     value: 'nosniff'                     },
          { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',         value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
