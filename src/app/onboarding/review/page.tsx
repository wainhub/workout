'use client';
import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useStore, useActiveProgram } from '@/lib/store';

function ReviewPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNew = searchParams.get('new') === '1';
  const { state } = useStore();
  const program = useActiveProgram();

  if (!program) {
    router.replace('/onboarding');
    return null;
  }

  const totalSets = program.days.reduce((n, d) => n + d.exercises.reduce((m, e) => m + e.sets, 0), 0);
  const isOnboarded = state.isOnboarded;

  function saveAndStart() {
    router.replace(isNew ? '/library' : '/home');
  }

  function fmtWeight(w: number, unit?: string) {
    if (w === 0) return 'BW';
    return `${w} ${unit ?? 'lb'}`;
  }

  const s = {
    screen: { paddingTop: 'var(--top)', paddingLeft: 16, paddingRight: 16, paddingBottom: 'var(--bottom)', minHeight: '100svh', background: '#000', maxWidth: 480, margin: '0 auto' },
    backBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 999, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', marginBottom: 20 },
    kicker: { fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: '#a1f0c2' },
    title: { fontSize: 26, fontWeight: 700, letterSpacing: '-0.025em', marginTop: 4 },
    statRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 16, marginBottom: 20 },
    stat: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px', textAlign: 'center' as const },
    statLabel: { fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.45)', marginBottom: 4 },
    statVal: { fontSize: 20, fontWeight: 800 },
    dayCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 16px', marginBottom: 8 },
    dayHead: { fontSize: 15, fontWeight: 700, marginBottom: 2 },
    dayFocus: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 10 },
    exRow: { display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, padding: '7px 0', borderTop: '1px solid rgba(255,255,255,0.06)', alignItems: 'center' },
    exName: { fontSize: 13, fontWeight: 600 },
    exSub: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 1 },
    exWeight: { fontSize: 12, fontWeight: 700, color: '#a1f0c2', whiteSpace: 'nowrap' as const, textAlign: 'right' as const },
    reasonCard: { background: 'rgba(161,240,194,0.06)', border: '1px solid rgba(161,240,194,0.15)', borderRadius: 14, padding: '14px 16px', marginTop: 14, marginBottom: 20 },
    reasonKicker: { fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: '#a1f0c2', marginBottom: 6 },
    reasonText: { fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.7)' },
    saveBtn: { width: '100%', padding: '18px 0', background: '#a1f0c2', color: '#062b18', border: 'none', borderRadius: 999, fontSize: 17, fontWeight: 700, cursor: 'pointer' },
  };

  return (
    <div style={s.screen}>
      <button style={s.backBtn} onClick={() => router.push(`/onboarding/intake${isNew ? '?new=1' : ''}`)}>← Edit answers</button>
      <div style={s.kicker}>✦ YOUR PROGRAM</div>
      <div style={s.title}>{program.name}</div>

      <div style={s.statRow}>
        <div style={s.stat}>
          <div style={s.statLabel}>Days/wk</div>
          <div style={s.statVal}>{program.daysPerWeek}</div>
        </div>
        <div style={s.stat}>
          <div style={s.statLabel}>Weeks</div>
          <div style={s.statVal}>{program.weeks}</div>
        </div>
        <div style={s.stat}>
          <div style={s.statLabel}>Total sets</div>
          <div style={s.statVal}>{totalSets}</div>
        </div>
      </div>

      {program.days.map(day => (
        <div key={day.id} style={s.dayCard}>
          <div style={s.dayHead}>Day {day.id} — {day.name}</div>
          <div style={s.dayFocus}>{day.focus}</div>
          {day.exercises.map((ex, i) => (
            <div key={i} style={s.exRow}>
              <div>
                <div style={s.exName}>{ex.name}</div>
                <div style={s.exSub}>{ex.sets} × {ex.reps} · {ex.type}</div>
              </div>
              <div style={s.exWeight}>{fmtWeight(ex.weight, ex.unit)}</div>
            </div>
          ))}
        </div>
      ))}

      <div style={s.reasonCard}>
        <div style={s.reasonKicker}>✦ Why this program</div>
        <div style={s.reasonText}>{program.reasoning}</div>
      </div>

      <button style={s.saveBtn} onClick={saveAndStart}>
        {isNew ? 'Add to library →' : 'Save program · Let\'s go →'}
      </button>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div style={{ background: '#000', minHeight: '100svh' }} />}>
      <ReviewPageInner />
    </Suspense>
  );
}
