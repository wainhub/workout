'use client';
import { use, useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore, useActiveProgram } from '@/lib/store';

function fmt(s: number) {
  const m = Math.floor(Math.max(0, s) / 60);
  const sec = Math.max(0, s) % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function RestPageInner({ params }: { params: Promise<{ dayId: string }> }) {
  const { dayId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, dispatch } = useStore();
  const program = useActiveProgram();
  const session = state.activeSession;

  const target = session?.restTarget ?? 90;
  const elapsed = session?.restStarted ? Math.floor((Date.now() - session.restStarted) / 1000) : 0;
  const [remaining, setRemaining] = useState(Math.max(0, target - elapsed));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (remaining <= 0) return;
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) { clearInterval(intervalRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  if (!session || session.dayId !== Number(dayId)) {
    router.replace(`/workout/${dayId}`);
    return null;
  }

  const day = program.days.find(d => d.id === session.dayId)!;
  const isDone = remaining <= 0;
  const isWarn = remaining <= 10 && remaining > 0;

  const r = 108, ctr = 128, c = 2 * Math.PI * r;
  const pct = target > 0 ? remaining / target : 0;
  const dash = c * pct;

  function adjust(delta: number) {
    setRemaining(prev => Math.max(0, prev + delta));
    dispatch({ type: 'START_REST', target: Math.max(0, remaining + delta) });
  }

  const currentExIdx = session.exIdx;
  const currentSets = session.sessionLog[currentExIdx] ?? [];
  // Use URL param set by active page — avoids React 18 batching race where
  // state hasn't committed by the time this page mounts.
  const finParam = searchParams.get('fin');
  const allSetsDone = finParam !== null ? finParam === '1' : currentSets.every(s => s.status === 'done');
  const doneSetsCount = currentSets.filter(s => s.status === 'done').length;
  const currentEx = day.exercises[currentExIdx];
  const nextEx = allSetsDone ? day.exercises[currentExIdx + 1] : null;
  const isLastEx = currentExIdx + 1 >= day.exercises.length;

  function goNext() {
    if (!allSetsDone) {
      router.push(`/workout/${dayId}/active`);
    } else if (isLastEx) {
      router.push(`/workout/${dayId}/summary`);
    } else {
      dispatch({ type: 'ADVANCE_EXERCISE', exIdx: currentExIdx + 1 });
      router.push(`/workout/${dayId}/active`);
    }
  }

  const s = {
    screen: { paddingTop: 'var(--top)', paddingLeft: 16, paddingRight: 16, paddingBottom: 'calc(max(env(safe-area-inset-bottom), 20px) + 18px)', maxWidth: 480, margin: '0 auto', minHeight: '100svh', background: '#000', display: 'flex', flexDirection: 'column' as const },
    pill: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 999, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', marginBottom: 24 },
    restLabel: { textAlign: 'center' as const, fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: '#a1f0c2', marginBottom: 4 },
    restSub: { textAlign: 'center' as const, fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 20 },
    ringWrap: { display: 'flex', justifyContent: 'center' },
    countdown: (warn: boolean, done: boolean) => ({
      fontSize: 72, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.04em',
      fontVariantNumeric: 'tabular-nums' as const,
      color: done ? '#a1f0c2' : warn ? '#fbbf24' : '#fff',
      transition: 'color 0.3s',
    }),
    countSub: { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4, textAlign: 'center' as const },
    adjRow: { display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 },
    adjBtn: { padding: '10px 20px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
    upNextCard: { marginTop: 24, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 16px' },
    upNextKicker: { fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.45)', marginBottom: 6 },
    upNextName: { fontSize: 16, fontWeight: 700 },
    upNextSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 3 },
    skipBtn: { width: '100%', padding: '16px 0', marginTop: 'auto', paddingTop: 20, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, fontSize: 15, fontWeight: 600, color: '#fff', cursor: 'pointer' },
    startBtn: { width: '100%', padding: '16px 0', marginTop: 'auto', paddingTop: 20, background: '#a1f0c2', border: 'none', borderRadius: 999, fontSize: 16, fontWeight: 700, color: '#062b18', cursor: 'pointer' },
  };

  return (
    <div style={s.screen}>
      <button style={s.pill} onClick={() => router.push(`/workout/${dayId}/active`)}>← Back</button>

      <div style={s.restLabel}>RESTING</div>
      <div style={s.restSub}>Breathe. Shake it out.</div>

      <div style={s.ringWrap}>
        <div style={{ width: 256, height: 256, position: 'relative' }}>
          <svg viewBox="0 0 256 256" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            <defs>
              <linearGradient id="restGrad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#a1f0c2" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>
            <circle cx={ctr} cy={ctr} r={r} stroke="rgba(255,255,255,0.07)" strokeWidth={14} fill="none" />
            <circle
              cx={ctr} cy={ctr} r={r}
              stroke={isDone ? '#a1f0c2' : isWarn ? '#fbbf24' : 'url(#restGrad)'}
              strokeWidth={14} fill="none" strokeLinecap="round"
              strokeDasharray={`${dash} ${c}`}
              style={{ transition: 'stroke-dasharray 1s linear, stroke 0.3s' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={s.countdown(isWarn, isDone)}>
              {isDone ? 'GO' : fmt(remaining)}
            </div>
            <div style={s.countSub}>{isDone ? 'Rest complete' : 'remaining'}</div>
          </div>
        </div>
      </div>

      <div style={s.adjRow}>
        <button style={s.adjBtn} onClick={() => adjust(-30)}>−30s</button>
        <button style={s.adjBtn} onClick={() => adjust(30)}>+30s</button>
      </div>

      <div style={s.upNextCard}>
        <div style={s.upNextKicker}>UP NEXT</div>
        {allSetsDone ? (
          nextEx ? (
            <>
              <div style={s.upNextName}>{nextEx.name}</div>
              <div style={s.upNextSub}>{nextEx.sets} sets × {nextEx.reps} reps · {nextEx.type}</div>
            </>
          ) : (
            <div style={s.upNextName}>Finish workout</div>
          )
        ) : (
          <>
            <div style={s.upNextName}>{currentEx.name}</div>
            <div style={s.upNextSub}>Set {doneSetsCount + 1} of {currentSets.length}</div>
          </>
        )}
      </div>

      {isDone ? (
        <button style={{ ...s.startBtn, marginTop: 12 }} onClick={goNext}>
          {!allSetsDone ? `Set ${doneSetsCount + 1} →` : nextEx ? 'Start next exercise' : 'Finish workout ✓'}
        </button>
      ) : (
        <button style={{ ...s.skipBtn, marginTop: 12 }} onClick={goNext}>
          Skip rest →
        </button>
      )}
    </div>
  );
}
export default function RestPage({ params }: { params: Promise<{ dayId: string }> }) {
  return (
    <Suspense fallback={<div style={{ minHeight: '100svh', background: '#000' }} />}>
      <RestPageInner params={params} />
    </Suspense>
  );
}
