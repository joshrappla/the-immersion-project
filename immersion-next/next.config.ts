import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['cdn.builder.io'],
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
              "script-src 'self' 'unsafe-inline'",   // tighten once inline styles removed
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' https: data: blob:",
              "font-src 'self'",
              "connect-src 'self' https://p3cf32ynjf.execute-api.us-east-2.amazonaws.com https://formspree.io",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self' https://formspree.io",
            ].join('; '),
          },
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Prevent MIME-type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Limit referrer info sent to third parties
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Disable browser features not needed by the app
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
