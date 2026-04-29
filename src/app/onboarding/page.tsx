'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const SLIDES = [
  {
    icon: '✦',
    kicker: 'AI COACH',
    title: 'Programs built for you.',
    body: 'Answer a few questions and your AI coach designs a plan shaped to your goals, schedule, and equipment.',
  },
  {
    icon: '◆',
    kicker: 'EVERY SET',
    title: 'Coached through every rep.',
    body: 'Form cues, rest timers, and progressive overload — done automatically. You just lift.',
  },
  {
    icon: '↗',
    kicker: 'PROGRESS',
    title: 'Watch yourself get stronger.',
    body: 'Every set logged. Every PR detected. Every week clearer than the last.',
  },
];

const AI_GRADIENT = 'linear-gradient(135deg, #ff7a59 0%, #e85d75 50%, #6ec3e8 100%)';

export default function WelcomePage() {
  const [slide, setSlide] = useState(0);
  const router = useRouter();
  const isLast = slide === SLIDES.length - 1;
  const current = SLIDES[slide];

  const s = {
    screen: {
      display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
      textAlign: 'center' as const,
      paddingTop: 'var(--top)', paddingLeft: 22, paddingRight: 22,
      paddingBottom: 'var(--bottom)',
      minHeight: '100svh',
      background: 'radial-gradient(ellipse at top, rgba(255,122,89,0.15), transparent 60%), #000',
      maxWidth: 480, margin: '0 auto',
    },
    orb: {
      width: 110, height: 110, borderRadius: '50%', background: AI_GRADIENT,
      marginTop: 24, display: 'grid', placeItems: 'center' as const,
      fontSize: 40, color: '#fff',
      boxShadow: '0 20px 60px rgba(255,122,89,0.35)',
    },
    kicker: { fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: '#ffb89e', marginTop: 24 },
    title: { fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', marginTop: 8, lineHeight: 1.15 },
    body: { fontSize: 15, color: 'rgba(255,255,255,0.7)', marginTop: 12, lineHeight: 1.55, maxWidth: 300 },
    dots: { display: 'flex', gap: 6, marginTop: 28 },
    dot: (active: boolean) => ({
      height: 6, borderRadius: 3, background: active ? '#fff' : 'rgba(255,255,255,0.2)',
      width: active ? 22 : 6, transition: 'width 0.2s, background 0.2s',
    }),
    spacer: { flex: 1 },
    primaryBtn: {
      width: '100%', height: 54, background: '#a1f0c2', color: '#062b18',
      border: 'none', borderRadius: 27, fontSize: 16, fontWeight: 700, cursor: 'pointer',
      marginBottom: 8,
    },
    skipBtn: {
      background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)',
      fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '10px 20px',
    },
  };

  return (
    <div style={s.screen}>
      <div style={s.orb}>{current.icon}</div>
      <div style={s.kicker}>{current.kicker}</div>
      <div style={s.title}>{current.title}</div>
      <div style={s.body}>{current.body}</div>
      <div style={s.dots}>
        {SLIDES.map((_, i) => <div key={i} style={s.dot(i === slide)} />)}
      </div>
      <div style={s.spacer} />
      <button style={s.primaryBtn} onClick={() => isLast ? router.push('/onboarding/signin') : setSlide(slide + 1)}>
        {isLast ? 'Get started' : 'Next'}
      </button>
      {!isLast && (
        <button style={s.skipBtn} onClick={() => router.push('/onboarding/signin')}>Skip</button>
      )}
    </div>
  );
}
