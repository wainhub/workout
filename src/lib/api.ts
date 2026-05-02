/**
 * Base URL for server-side API calls.
 *
 * Web build (Vercel):      NEXT_PUBLIC_API_BASE is unset → empty string → relative URLs
 * Capacitor build:         NEXT_PUBLIC_API_BASE=https://workout-flax-two.vercel.app
 *
 * Build the Capacitor bundle with:
 *   NEXT_PUBLIC_API_BASE=https://workout-flax-two.vercel.app npm run build
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
