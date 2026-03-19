import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

const VALID_LOCALE_PREFIXES = [
  '/it/',
  '/en/',
  '/fr/',
  '/de/',
  '/es/',
  '/ru/',
];

export async function POST(request: NextRequest) {
  // Read secret from Authorization header (not query string — prevents logging exposure)
  const authHeader = request.headers.get('Authorization');
  const secret = authHeader?.replace('Bearer ', '').trim();

  if (!process.env.REVALIDATE_SECRET) {
    console.error('[revalidate] REVALIDATE_SECRET not configured');
    return NextResponse.json(
      { message: 'Server misconfiguration' },
      { status: 500 },
    );
  }

  if (!secret || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const path = request.nextUrl.searchParams.get('path');

  if (!path) {
    return NextResponse.json(
      { message: 'Missing path parameter' },
      { status: 400 },
    );
  }

  // Validate path — only known locale prefixes accepted
  if (!VALID_LOCALE_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return NextResponse.json(
      {
        message:
          'Invalid path: must start with a valid locale prefix',
      },
      { status: 400 },
    );
  }

  // Prevent path traversal
  if (path.includes('..') || path.includes('\0') || path.length > 500) {
    return NextResponse.json(
      { message: 'Invalid path format' },
      { status: 400 },
    );
  }

  try {
    revalidatePath(path);
    console.log(`[revalidate] ✓ Revalidated: ${path}`);
    return NextResponse.json({
      revalidated: true,
      path,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error(`[revalidate] ✗ Failed for ${path}:`, error);
    return NextResponse.json(
      { message: 'Revalidation failed' },
      { status: 500 },
    );
  }
}
