import { NextRequest, NextResponse } from 'next/server';

/**
 * Texture proxy route — fetches Drupal images server-side and serves them
 * with same-origin to avoid CORS issues with WebGL TextureLoader.
 *
 * Usage: /api/texture?url=<encoded-drupal-image-url>
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 },
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
