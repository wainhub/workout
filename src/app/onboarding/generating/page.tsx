'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { SEED_PROGRAMS } from '@/lib/data';
import type { Program, IntakeAnswers } from '@/lib/types';

const AI_GRADIENT = 'linear-gradient(135deg, #ff7a59 0%, #e85d75 50%, #6ec3e8 100%)';

const PHASES = [
  'Analyzing your goals…',
  'Selecting your split…',
  'Picking exercises…',
  'Calibrating volume & intensity…',
  'Finalizing your program…',
];

function buildProgram(answers: IntakeAnswers): Program {
  const goalLabel: Record<string, string> = {
    hypertrophy: 'Hypertrophy', strength: 'Strength',
    fat_loss: 'Fat Loss', general: 'General Fitness',
  };
  const name = goalLabel[answers.goal ?? 'hypertrophy'] ?? 'Hypertrophy';
  const days = Number(answers.days ?? 4);
  const base = SEED_PROGRAMS[0];
  const programDays = base.days.slice(0, Math.min(days, 4));
  const totalDays = programDays.length * 12;

  return {
    ...base,
    id: `p-${Date.now()}`,
    name,
    goal: name,
    daysPerWeek: programDays.length,
    days: programDays,
    daysCompleted: 0,
    totalDays,
    weeksCompleted: 0,
    createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  };
}

function GeneratingPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNew = searchParams.get('new') === '1';
  const { state, dispatch } = useStore();
  const [phase, setPhase] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i >= PHASES.length) {
        clearInterval(interval);
        setTimeout(() => setDone(true), 400);
      } else {
        setPhase(i);
      }
    }, 700);

    const timeout = setTimeout(() => {
      const program = buildProgram(state.intakeAnswers ?? {});
      if (isNew) {
        dispatch({ type: 'ADD_PROGRAM', program });
        router.push('/onboarding/review?new=1');
      } else {
        dispatch({ type: 'COMPLETE_ONBOARDING', program });
        router.push('/onboarding/review');
      }
    }, PHASES.length * 700 + 800);

    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, []);

  const s = {
    screen: {
      display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
      justifyContent: 'center', textAlign: 'center' as const,
      paddingTop: 'var(--top)', paddingLeft: 22, paddingRight: 22, paddingBottom: 'var(--bottom)', minHeight: '100svh', background: '#000',
      maxWidth: 480, margin: '0 auto',
    },
    orbWrap: { position: 'relative' as const, width: 140, height: 140, marginBottom: 32 },
    orb: { width: 140, height: 140, borderRadius: '50%', background: AI_GRADIENT, filter: 'blur(2px)', animation: 'pulse 2s ease-in-out infinite' },
    orbInner: { position: 'absolute' as const, inset: 0, display: 'grid', placeItems: 'center' as const, fontSize: 44, color: '#fff' },
    kicker: { fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: '#a1f0c2' },
    title: { fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 10 },
    list: { marginTop: 24, display: 'flex', flexDirection: 'column' as const, gap: 6, width: '100%', maxWidth: 280 },
  };

  return (
    <div style={s.screen}>
      <style>{`@keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.85; } 50% { transform: scale(1.07); opacity: 1; } }`}</style>
      <div style={s.orbWrap}>
        <div style={s.orb} />
        <div style={s.orbInner}>✦</div>
      </div>
      <div style={s.kicker}>BUILDING YOUR PROGRAM</div>
      <div style={s.title}>{PHASES[phase]}</div>
      <div style={s.list}>
        {PHASES.map((p, i) => (
          <div key={i} style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, color: i < phase ? '#a1f0c2' : i === phase ? '#fff' : 'rgba(255,255,255,0.3)' }}>
            <span style={{ width: 14, textAlign: 'left' as const }}>{i < phase ? '✓' : i === phase ? '◆' : '○'}</span>
            {p}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GeneratingPage() {
  return (
    <Suspense fallback={<div style={{ background: '#000', minHeight: '100svh' }} />}>
      <GeneratingPageInner />
    </Suspense>
  );
}
