import { NextRequest, NextResponse } from 'next/server';
import { CORS_HEADERS } from '@/lib/cors';

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  // Only proxy MuscleWiki URLs
  if (!url.startsWith('https://api.musclewiki.com/')) {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  const apiKey = process.env.MUSCLEWIKI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'no_key' }, { status: 500 });

  const upstream = await fetch(url, {
    headers: { 'X-API-Key': apiKey },
  });

  if (!upstream.ok) {
    return NextResponse.json({ error: 'upstream_error', status: upstream.status }, { status: 502 });
  }

  const contentType = upstream.headers.get('content-type') ?? 'video/mp4';
  const contentLength = upstream.headers.get('content-length');

  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=86400',
    ...CORS_HEADERS,
  };
  if (contentLength) headers['Content-Length'] = contentLength;

  return new Response(upstream.body, { status: 200, headers });
}
