'use client';
import { use, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore, useActiveProgram } from '@/lib/store';
import type { SessionLog } from '@/lib/types';

function calcStats(sessionLog: SessionLog, exercises: { sets: number; reps: number; weight: number }[]) {
  let totalSets = 0, totalVolume = 0;
  Object.entries(sessionLog).forEach(([idxStr, sets]) => {
    const exIdx = Number(idxStr);
    sets.forEach(set => {
      if (set.status === 'done') {
        totalSets++;
        totalVolume += (set.actualWeight ?? set.weight) * (set.actualReps ?? set.reps);
      }
    });
  });
  return { totalSets, totalVolume };
}

function fmtDuration(ms: number) {
  const m = Math.floor(ms / 60000);
  return `${m} min`;
}

function coachDebrief(dayName: string, sessionLog: SessionLog, exercises: { name: string; weight: number }[]) {
  const heaviestIdx = Object.entries(sessionLog).reduce((best, [idxStr, sets]) => {
    const maxW = Math.max(...sets.map(s => s.actualWeight ?? s.weight));
    const bestMax = Math.max(...(sessionLog[Number(best)] ?? []).map(s => s.actualWeight ?? s.weight));
    return maxW > bestMax ? idxStr : best;
  }, '0');
  const hEx = exercises[Number(heaviestIdx)];
  const hSets = sessionLog[Number(heaviestIdx)] ?? [];
  const hWeight = Math.max(...hSets.map(s => s.actualWeight ?? s.weight));
  const hReps = hSets[0]?.actualReps ?? hSets[0]?.reps ?? 0;

  return `Strong ${dayName} session. Your heaviest work was on ${hEx?.name ?? 'the main lift'} — ${hWeight === 0 ? 'bodyweight' : `${hWeight} lb × ${hReps} reps`}. If every set felt solid at that weight, bump it by 5 lb next session. Rest, recover, and come back stronger.`;
}
export default function SummaryPage({ params }: { params: Promise<{ dayId: string }> }) {
  const { dayId } = use(params);
  const router = useRouter();
  const { state, dispatch } = useStore();
  const program = useActiveProgram();
  const session = state.activeSession;
  const savedRef = useRef(false);

  useEffect(() => {
    if (!session || savedRef.current) return;
    savedRef.current = true;
    const day = program.days.find(d => d.id === session.dayId)!;
    const { totalSets, totalVolume } = calcStats(session.sessionLog, day.exercises);
    dispatch({
      type: 'COMPLETE_SESSION',
      completedAt: Date.now(),
      durationMs: Date.now() - session.startedAt,
      dayName: day.name,
      totalSets,
      totalVolume,
      prs: 0,
    });
  }, []);

  if (!session) {
    const last = state.history[0];
    if (!last) { router.replace('/home'); return null; }
    const day = program.days.find(d => d.id === last.dayId)!;
    return <SummaryView dayId={dayId} dayName={last.dayName} durationMs={last.durationMs} totalSets={last.totalSets} totalVolume={last.totalVolume} prs={last.prs} sessionLog={last.sessionLog} exercises={day?.exercises ?? []} router={router} />;
  }

  const day = program.days.find(d => d.id === session.dayId)!;
  const { totalSets, totalVolume } = calcStats(session.sessionLog, day.exercises);

  return <SummaryView dayId={dayId} dayName={day.name} durationMs={Date.now() - session.startedAt} totalSets={totalSets} totalVolume={totalVolume} prs={0} sessionLog={session.sessionLog} exercises={day.exercises} router={router} />;
}

function SummaryView({ dayId, dayName, durationMs, totalSets, totalVolume, prs, sessionLog, exercises, router }: {
  dayId: string; dayName: string; durationMs: number; totalSets: number; totalVolume: number; prs: number;
  sessionLog: SessionLog; exercises: { name: string; weight: number; unit?: string }[]; router: ReturnType<typeof useRouter>;
}) {
  const debrief = coachDebrief(dayName, sessionLog, exercises);

  const s = {
    screen: { paddingTop: 'var(--top)', paddingLeft: 16, paddingRight: 16, paddingBottom: 'calc(max(env(safe-area-inset-bottom), 20px) + 32px)', maxWidth: 480, margin: '0 auto', minHeight: '100svh', background: '#000' },
    hero: { background: 'linear-gradient(135deg, rgba(161,240,194,0.14), rgba(52,211,153,0.06))', border: '1px solid rgba(161,240,194,0.3)', borderRadius: 18, padding: '20px 20px 22px', textAlign: 'center' as const, marginBottom: 14 },
    heroIcon: { fontSize: 36, marginBottom: 8 },
    heroBig: { fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' },
    heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 4 },
    statRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 },
    stat: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 10px', textAlign: 'center' as const },
    statLabel: { fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.45)', marginBottom: 4 },
    statVal: { fontSize: 22, fontWeight: 800, fontVariantNumeric: 'tabular-nums' as const },
    coachCard: { background: 'linear-gradient(135deg, rgba(161,240,194,0.1), rgba(52,211,153,0.04))', border: '1px solid rgba(161,240,194,0.2)', borderRadius: 14, padding: '14px 16px', marginBottom: 14 },
    coachHead: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
    coachOrb: { width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #a1f0c2, #34d399)', display: 'grid', placeItems: 'center' as const, fontSize: 12, color: '#062b18', fontWeight: 700, flexShrink: 0 },
    coachKicker: { fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: '#a1f0c2' },
    coachBody: { fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.8)' },
    logHead: { fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.45)', marginBottom: 10 },
    exBlock: { paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.07)' },
    exName: { fontSize: 14, fontWeight: 700, marginBottom: 6 },
    setRow: { display: 'flex', gap: 6, flexWrap: 'wrap' as const },
    setPill: { padding: '4px 10px', background: 'rgba(161,240,194,0.1)', border: '1px solid rgba(161,240,194,0.2)', borderRadius: 999, fontSize: 12, fontWeight: 600, color: '#a1f0c2', fontVariantNumeric: 'tabular-nums' as const },
    doneBtn: { width: '100%', padding: '18px 0', marginTop: 20, background: '#a1f0c2', border: 'none', borderRadius: 999, fontSize: 17, fontWeight: 700, color: '#062b18', cursor: 'pointer' },
  };

  return (
    <div style={s.screen}>
      <div style={s.hero}>
        <div style={s.heroIcon}>💪</div>
        <div style={s.heroBig}>Session done</div>
        <div style={s.heroSub}>{dayName} · {fmtDuration(durationMs)} · Week complete</div>
      </div>

      <div style={s.statRow}>
        <div style={s.stat}>
          <div style={s.statLabel}>Sets</div>
          <div style={s.statVal}>{totalSets}</div>
        </div>
        <div style={s.stat}>
          <div style={s.statLabel}>Volume</div>
          <div style={s.statVal}>{Math.round(totalVolume / 1000)}k</div>
        </div>
        <div style={s.stat}>
          <div style={s.statLabel}>PRs</div>
          <div style={s.statVal}>{prs}</div>
        </div>
      </div>

      <div style={s.coachCard}>
        <div style={s.coachHead}>
          <div style={s.coachOrb}>✦</div>
          <div style={s.coachKicker}>COACH DEBRIEF</div>
        </div>
        <div style={s.coachBody}>{debrief}</div>
      </div>

      <div style={s.logHead}>Workout log</div>
      {exercises.map((ex, i) => {
        const sets = sessionLog[i] ?? [];
        const doneSets = sets.filter(s => s.status === 'done');
        return (
          <div key={i} style={s.exBlock}>
            <div style={s.exName}>{ex.name}</div>
            <div style={s.setRow}>
              {doneSets.map((set, j) => (
                <span key={j} style={s.setPill}>
                  {set.actualWeight === 0 ? 'BW' : set.actualWeight} × {set.actualReps}
                </span>
              ))}
              {doneSets.length === 0 && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Skipped</span>}
            </div>
          </div>
        );
      })}

      <button style={s.doneBtn} onClick={() => router.push('/home')}>Done · Home</button>
    </div>
  );
}
