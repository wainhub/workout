'use client';
import { useRouter } from 'next/navigation';

const AI_GRADIENT = 'linear-gradient(135deg, #ff7a59 0%, #e85d75 50%, #6ec3e8 100%)';

export default function WelcomePage() {
  const router = useRouter();

  const s = {
    screen: {
      display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
      textAlign: 'center' as const,
      paddingTop: 90, paddingLeft: 28, paddingRight: 28,
      paddingBottom: 'var(--bottom)',
      minHeight: '100svh',
      background: 'radial-gradient(ellipse at top, rgba(255,122,89,0.15), transparent 60%), #000',
      maxWidth: 480, margin: '0 auto',
    },
    orb: {
      width: 84, height: 84, borderRadius: '50%', background: AI_GRADIENT,
      display: 'grid', placeItems: 'center' as const,
      fontSize: 34, color: '#fff',
      boxShadow: '0 20px 60px rgba(255,122,89,0.35)',
    },
    kicker: {
      fontSize: 10, fontWeight: 700, letterSpacing: '0.2em',
      textTransform: 'uppercase' as const, color: '#ffb89e', marginTop: 28,
    },
    title: {
      fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em',
      lineHeight: 1.1, marginTop: 10, maxWidth: 340,
    },
    sub: {
      fontSize: 14, color: 'rgba(255,255,255,0.55)', marginTop: 14,
      lineHeight: 1.6, maxWidth: 280,
    },
    spacer: { flex: 1 },
    primaryBtn: {
      width: '100%', height: 56, background: '#a1f0c2', color: '#062b18',
      border: 'none', borderRadius: 28, fontSize: 17, fontWeight: 700,
      cursor: 'pointer', marginBottom: 12,
      letterSpacing: '0.01em',
    },
    secondaryBtn: {
      background: 'transparent', border: 'none',
      color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 500,
      cursor: 'pointer', padding: '10px 20px', marginBottom: 8,
    },
  };

  return (
    <div style={s.screen}>
      <div style={s.orb}>✦</div>
      <div style={s.kicker}>WAIN · AI STRENGTH COACH</div>
      <div style={s.title}>An AI coach who knows what you're lifting today.</div>
      <div style={s.sub}>Answer 7 quick questions. Get a personalized program. Start training today.</div>

      <div style={s.spacer} />

      <button style={s.primaryBtn} onClick={() => router.push('/onboarding/signin')}>
        Get started
      </button>
      <button style={s.secondaryBtn} onClick={() => router.push('/onboarding/signin')}>
        I already have an account
      </button>
    </div>
  );
}
