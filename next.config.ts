import type { NextConfig } from 'next';

// Access-Control-Allow-Origin only accepts a single origin or '*'.
// Dynamic origin handling must be done in middleware.
// For static Next.js headers, use '*' or a single origin.
const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL || 'https://www.easygst.bt';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.0.105'],
  experimental: {},
  async headers() {
    return [
      {
        // CORS for API routes (POS app + external consumers)
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: allowedOrigin,
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
