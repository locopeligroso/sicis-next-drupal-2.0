import { NextRequest, NextResponse } from 'next/server';

/**
 * Texture proxy route — fetches Drupal images server-side and serves them
 * with same-origin to avoid CORS issues with WebGL TextureLoader.
 *
 * Usage: /api/texture?url=<encoded-drupal-image-url>
 *
 * Only URLs from allowed origins are proxied (DRUPAL_BASE_URL, sicis.com,
 * sicis-stage.com). All other origins receive 403.
 */

const ALLOWED_HOSTNAMES = new Set([
  'sicis.com',
  'www.sicis.com',
  'sicis-stage.com',
  'www.sicis-stage.com',
]);

function isAllowedUrl(rawUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }

  // Must be http or https
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return false;
  }

  const hostname = parsed.hostname.toLowerCase();

  // Check static allowlist
  if (ALLOWED_HOSTNAMES.has(hostname)) return true;

  // Check DRUPAL_BASE_URL origin at runtime (supports both public and
  // server-side env var names)
  const drupalBase =
    process.env.DRUPAL_BASE_URL ?? process.env.NEXT_PUBLIC_DRUPAL_BASE_URL;
  if (drupalBase) {
    try {
      const drupalHostname = new URL(drupalBase).hostname.toLowerCase();
      if (hostname === drupalHostname) return true;
    } catch {
      // malformed env var — ignore
    }
  }

  return false;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 },
    );
  }

  if (!isAllowedUrl(url)) {
    return NextResponse.json(
      { error: 'URL origin not allowed' },
      { status: 403 },
    );
  }

  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream ${response.status}` },
        { status: response.status },
      );
    }

    const contentType = response.headers.get('content-type') ?? 'image/png';
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch texture' },
      { status: 502 },
    );
  }
}
