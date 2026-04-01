// @ts-check
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// Derive Drupal host from env — falls back to localhost for local dev without .env
const drupalUrl = new URL(
  process.env.DRUPAL_BASE_URL ||
    process.env.NEXT_PUBLIC_DRUPAL_BASE_URL ||
    'http://localhost',
);
const drupalHostname = drupalUrl.hostname;
const drupalOrigin = drupalUrl.origin; // e.g. "http://192.168.86.201" or "https://www.sicis-stage.com"

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: blob: ${drupalOrigin} https://www.sicis-stage.com https://sicis-stage.com https://www.sicis.com`,
      "font-src 'self' data:",
      `connect-src 'self' ${drupalOrigin} https://www.sicis-stage.com https://sicis-stage.com`,
      "frame-src 'self' https://player.vimeo.com https://www.youtube.com",
      "frame-ancestors 'none'",
      `media-src 'self' ${drupalOrigin} https://www.sicis-stage.com https://www.sicis.com`,
    ].join('; '),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // NOTE: PPR (Partial Prerendering) via cacheComponents: true is deferred.
  // cacheComponents is incompatible with `export const revalidate` in route segments.
  // Migration path: replace revalidate exports with cacheLife() inside 'use cache' functions.
  // The Suspense boundary in [...slug]/page.tsx still enables streaming even without PPR.
  experimental: {
    // Cache dynamic pages for 30s in the client-side router cache.
    // Default in Next.js 15+ is 0s — this restores the pre-v15 behavior for
    // repeat in-browser navigations (e.g. back/forward on listing pages).
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      // Drupal instance hostname — resolved from DRUPAL_BASE_URL at build/start time
      {
        protocol: drupalUrl.protocol.replace(':', ''),
        hostname: drupalHostname,
      },
      { protocol: 'https', hostname: 'www.sicis-stage.com' },
      { protocol: 'https', hostname: 'sicis-stage.com' },
      { protocol: 'https', hostname: 'sicis.com' },
      { protocol: 'https', hostname: 'www.sicis.com' },
    ],
    // next/image blocks private IPs (192.168.x.x) from the optimization proxy.
    // Custom loader bypasses this by serving the original Drupal URL directly.
    // Applied in both dev and prod since Drupal runs on a private IP.
    loader: 'custom',
    loaderFile: './src/lib/image-loader.ts',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    return [
      {
        // Proxy Drupal images to same-origin for WebGL texture loading (avoids CORS)
        source: '/drupal-images/:path*',
        destination: `${drupalOrigin}/www.sicis.com_aiweb/httpdocs/sites/default/files/:path*`,
      },
    ];
  },
  transpilePackages: [
    'three',
    '@react-three/fiber',
    '@react-three/drei',
    'maath',
  ],
};

export default withNextIntl(nextConfig);
