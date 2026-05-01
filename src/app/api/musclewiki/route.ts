import { NextRequest, NextResponse } from 'next/server';

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
  if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 });

  const cacheKey = name.toLowerCase();
  if (cache.has(cacheKey)) {
    return NextResponse.json({ videos: cache.get(cacheKey) });
  }

  const apiKey = process.env.MUSCLEWIKI_API_KEY;
  if (!apiKey) {
    // No key configured — return empty so UI falls back to YouTube
    return NextResponse.json({ videos: [] });
  }

  try {
    const query = toSearchQuery(name);

    const searchRes = await fetch(
      `https://api.musclewiki.com/search?query=${encodeURIComponent(query)}&limit=3`,
      {
        headers: { 'X-API-Key': apiKey },
        // Cache at the Next.js fetch layer for 24h to minimise API call count
        next: { revalidate: 86400 },
      }
    );

    if (!searchRes.ok) {
      cache.set(cacheKey, []);
      return NextResponse.json({ videos: [] });
    }

    const searchData = await searchRes.json();
    const exercises: MWExercise[] = Array.isArray(searchData)
      ? searchData
      : (searchData.exercises ?? []);

    if (exercises.length === 0) {
      cache.set(cacheKey, []);
      return NextResponse.json({ videos: [] });
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
    return NextResponse.json({ videos });
  } catch (err) {
    console.error('[musclewiki]', err);
    cache.set(cacheKey, []);
    return NextResponse.json({ videos: [] });
  }
}
