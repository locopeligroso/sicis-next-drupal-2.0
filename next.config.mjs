// @ts-check
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

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
      "img-src 'self' data: blob: http://192.168.86.201 https://www.sicis-stage.com https://sicis-stage.com https://www.sicis.com",
      "font-src 'self' data:",
      "connect-src 'self' http://192.168.86.201 https://www.sicis-stage.com https://sicis-stage.com",
      "frame-src 'self' https://player.vimeo.com https://www.youtube.com",
      "frame-ancestors 'none'",
      "media-src 'self' http://192.168.86.201 https://www.sicis-stage.com https://www.sicis.com",
    ].join('; '),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '192.168.86.201' },
      { protocol: 'https', hostname: 'www.sicis-stage.com' },
      { protocol: 'https', hostname: 'sicis-stage.com' },
      { protocol: 'https', hostname: 'sicis.com' },
      { protocol: 'https', hostname: 'www.sicis.com' },
    ],
    // In dev, next/image blocks private IPs (192.168.x.x) from the optimization proxy.
    // loaderFile bypasses this by serving the original URL directly in development.
    ...(process.env.NODE_ENV === 'development'
      ? { loader: 'custom', loaderFile: './src/lib/image-loader.ts' }
      : {}),
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
    const drupalBase =
      process.env.DRUPAL_BASE_URL ||
      process.env.NEXT_PUBLIC_DRUPAL_BASE_URL ||
      'http://localhost';
    return [
      {
        // Proxy Drupal images to same-origin for WebGL texture loading (avoids CORS)
        source: '/drupal-images/:path*',
        destination: `${drupalBase}/www.sicis.com_aiweb/httpdocs/sites/default/files/:path*`,
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
