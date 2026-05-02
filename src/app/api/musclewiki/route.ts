import { NextRequest, NextResponse } from 'next/server';
import { CORS_HEADERS } from '@/lib/cors';

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export interface MWVideo {
  url: string;
  og_image: string;
  angle: string; // "FRONT" | "SIDE" | "45" | etc.
}

interface MWExercise {
  id: number;
  name: string;
  videos?: MWVideo[];
}

// Server-side in-memory cache — survives the request, lost on cold start
const cache = new Map<string, MWVideo[]>();

/** Maps our exercise names to cleaner MuscleWiki search queries */
function toSearchQuery(name: string): string {
  return name
    .replace(/^DB\s+/i, 'Dumbbell ')
    .replace(/^DBs\s+/i, 'Dumbbell ')
    .replace(/Smith Machine\s+/i, '')
    .replace(/\s*\(seated\)\s*/i, ' seated')
    .replace(/\s*\(standing\)\s*/i, '')
    .replace(/\s*\(incline\)\s*/i, ' incline')
    .replace(/\s*\(ea\.\)\s*/i, '')
    .trim();
}

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name');
  const debug = req.nextUrl.searchParams.get('debug') === '1';
  if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400, headers: CORS_HEADERS });

  const cacheKey = name.toLowerCase();
  if (cache.has(cacheKey) && !debug) {
    return NextResponse.json({ videos: cache.get(cacheKey) }, { headers: CORS_HEADERS });
  }

  const apiKey = process.env.MUSCLEWIKI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'no_key', videos: [] }, { headers: CORS_HEADERS });
  }

  try {
    const query = toSearchQuery(name);

    const searchRes = await fetch(
      `https://api.musclewiki.com/search?query=${encodeURIComponent(query)}&limit=3`,
      {
        headers: { 'X-API-Key': apiKey },
        next: { revalidate: 86400 },
      }
    );

    if (!searchRes.ok) {
      const errBody = await searchRes.text();
      if (debug) return NextResponse.json({ debug: { status: searchRes.status, body: errBody, query } }, { headers: CORS_HEADERS });
      cache.set(cacheKey, []);
      return NextResponse.json({ videos: [] }, { headers: CORS_HEADERS });
    }

    const searchData = await searchRes.json();
    const exercises: MWExercise[] = Array.isArray(searchData)
      ? searchData
      : (searchData.exercises ?? []);

    if (debug) {
      return NextResponse.json({ debug: { query, exercises: exercises.slice(0, 3), raw: searchData } }, { headers: CORS_HEADERS });
    }

    if (exercises.length === 0) {
      cache.set(cacheKey, []);
      return NextResponse.json({ videos: [] }, { headers: CORS_HEADERS });
    }

    let videos: MWVideo[] = exercises[0].videos ?? [];

    // If search result has no videos attached, fetch the full exercise record
    if (videos.length === 0 && exercises[0].id) {
      const detailRes = await fetch(
        `https://api.musclewiki.com/exercises/${exercises[0].id}`,
        { headers: { 'X-API-Key': apiKey }, next: { revalidate: 86400 } }
      );
      if (detailRes.ok) {
        const detail: MWExercise = await detailRes.json();
        videos = detail.videos ?? [];
      }
    }

    cache.set(cacheKey, videos);
    return NextResponse.json({ videos }, { headers: CORS_HEADERS });
  } catch (err) {
    console.error('[musclewiki]', err);
    cache.set(cacheKey, []);
    return NextResponse.json({ videos: [] }, { headers: CORS_HEADERS });
  }
}
