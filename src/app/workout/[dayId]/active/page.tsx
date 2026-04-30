'use client';
import { use, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore, useActiveProgram } from '@/lib/store';
import { Stepper } from '@/components/Stepper';
import type { SetEntry } from '@/lib/types';

export default function ActivePage({ params }: { params: Promise<{ dayId: string }> }) {
  const { dayId } = use(params);
  const router = useRouter();
  const { state, dispatch } = useStore();
  const program = useActiveProgram();
  const session = state.activeSession;

  const [whyOpen, setWhyOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<number | null>(null);
  const [tempWeight, setTempWeight] = useState(0);
  const [tempReps, setTempReps] = useState(0);
  const [restSecs, setRestSecs] = useState(0);
  const [restActive, setRestActive] = useState(false);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setWhyOpen(false);
    setVideoOpen(false);
    setEditingSet(null);
    setRestActive(false);
    setRestSecs(0);
    if (restRef.current) clearInterval(restRef.current);
  }, [session?.exIdx]);

  useEffect(() => () => { if (restRef.current) clearInterval(restRef.current); }, []);

  if (!session || session.dayId !== Number(dayId)) {
    router.replace(`/workout/${dayId}`);
    return null;
  }

  const day = program.days.find(d => d.id === session.dayId)!;
  const ex = day.exercises[session.exIdx];
  const sets: SetEntry[] = session.sessionLog[session.exIdx] ?? [];
  const isLast = session.exIdx === day.exercises.length - 1;
  const allDone = sets.every(s => s.status === 'done' || s.status === 'skipped');
  const doneSets = sets.filter(s => s.status === 'done').length;

  function startRest() {
    if (restRef.current) clearInterval(restRef.current);
    const target = ex.type === 'Compound' ? state.prefs.compoundRest : state.prefs.isolationRest;
    setRestSecs(target);
    setRestActive(true);
    restRef.current = setInterval(() => {
      setRestSecs(s => {
        if (s <= 1) { clearInterval(restRef.current!); setRestActive(false); return 0; }
        return s - 1;
      });
    }, 1000);
  }

  function tapSet(i: number) {
    const s = sets[i];
    if (s.status === 'done') return;
    if (restActive) { clearInterval(restRef.current!); setRestActive(false); }
    setEditingSet(i);
    setTempWeight(s.weight);
    setTempReps(s.reps);
  }

  function logSet() {
    if (editingSet === null) return;
    const next = sets.map((s, i) => {
      if (i === editingSet) return { ...s, status: 'done' as const, actualWeight: tempWeight, actualReps: tempReps };
      if (i === editingSet + 1 && s.status === 'upcoming') return { ...s, status: 'active' as const };
      return s;
    });
    dispatch({ type: 'UPDATE_SETS', exIdx: session!.exIdx, sets: next });
    setEditingSet(null);
    const justFinishedAll = next.every(s => s.status === 'done' || s.status === 'skipped');
    if (justFinishedAll && isLast) {
      dispatch({ type: 'START_REST', target: 0 });
      router.push(`/workout/${dayId}/summary`);
    } else if (!justFinishedAll) {
      startRest();
    }
  }

  function skipSet(i: number) {
    const next = sets.map((s, idx) => {
      if (idx === i) return { ...s, status: 'skipped' as const };
      if (idx === i + 1 && s.status === 'upcoming') return { ...s, status: 'active' as const };
      return s;
    });
    dispatch({ type: 'UPDATE_SETS', exIdx: session!.exIdx, sets: next });
    setEditingSet(null);
    const justFinishedAll = next.every(s => s.status === 'done' || s.status === 'skipped');
    if (justFinishedAll && isLast) {
      dispatch({ type: 'START_REST', target: 0 });
      router.push(`/workout/${dayId}/summary`);
    } else if (!justFinishedAll) {
      startRest();
    }
  }

  function goNextExercise() {
    dispatch({ type: 'ADVANCE_EXERCISE', exIdx: session!.exIdx + 1 });
    router.push(`/workout/${dayId}/active`);
  }

  function fmtRest(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  const restTarget = ex.type === 'Compound' ? state.prefs.compoundRest : state.prefs.isolationRest;
  const restPct = restTarget > 0 ? (restSecs / restTarget) * 100 : 0;

  const s = {
    screen: { paddingTop: 'var(--top)', paddingLeft: 16, paddingRight: 16, paddingBottom: 'calc(max(env(safe-area-inset-bottom), 20px) + 18px)', maxWidth: 480, margin: '0 auto', minHeight: '100svh', background: '#000', display: 'flex', flexDirection: 'column' as const },
    topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    pill: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 999, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' },
    exLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.1em' },
    exName: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 },
    exTarget: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 12 },
    cue: { padding: '11px 13px', background: 'rgba(161,240,194,0.07)', borderRadius: 12, fontSize: 13, lineHeight: 1.5, color: '#d6f5e2', display: 'flex', gap: 9, alignItems: 'flex-start', marginBottom: 16, cursor: 'pointer', border: '1px solid rgba(161,240,194,0.12)' },
    setList: { display: 'flex', flexDirection: 'column' as const, gap: 8, flex: 1 },
    nextBtn: { width: '100%', height: 54, background: '#a1f0c2', color: '#062b18', border: 'none', borderRadius: 27, fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 12 },
    caption: { textAlign: 'center' as const, fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8 },
  };

  return (
    <div style={s.screen}>
      <div style={s.topBar}>
        <button style={s.pill} onClick={() => router.push(`/workout/${dayId}`)}>← Day {dayId} · {day.name}</button>
        <div style={s.exLabel}>EX {session.exIdx + 1}/{day.exercises.length}</div>
      </div>

      <div style={s.exName}>{ex.name}</div>
      <div style={s.exTarget}>{sets.length} sets · {ex.reps} reps · {ex.weight === 0 ? 'bodyweight' : `${ex.weight} ${ex.unit ?? 'lb'} target`}</div>

      {/* Coach cue */}
      <div style={s.cue} onClick={() => setWhyOpen(o => !o)}>
        <span style={{ color: '#a1f0c2', fontSize: 14, flexShrink: 0 }}>◆</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div>{ex.cue}</div>
          {whyOpen && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(161,240,194,0.15)', fontSize: 12, lineHeight: 1.55, color: 'rgba(255,255,255,0.7)' }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', color: '#a1f0c2', textTransform: 'uppercase', marginBottom: 4 }}>Why this exercise</div>
              {ex.type === 'Compound'
                ? "It's your big driver today — the most muscle, the most strength carryover. Top set is calibrated to leave 1–2 reps in the tank. Push hard but don't grind."
                : 'An accessory to round out the session. Slow eccentric, full stretch, controlled lockout. Form beats load here.'}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
              {whyOpen ? 'Tap to collapse' : 'Tap for coach context'}
            </div>
            {ex.videoUrl && (
              <button
                onClick={e => { e.stopPropagation(); setVideoOpen(o => !o); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 9px', background: videoOpen ? 'rgba(255,0,0,0.25)' : 'rgba(255,0,0,0.15)', border: '1px solid rgba(255,0,0,0.25)', borderRadius: 999, fontSize: 11, fontWeight: 700, color: '#ff6b6b', cursor: 'pointer' }}
              >
                {videoOpen ? '✕ Hide Video' : '▶ Sample Video'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Inline video player */}
      {videoOpen && ex.videoUrl && (
        <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 16, background: '#111', aspectRatio: '16/9', position: 'relative' as const }}>
          <iframe
            src={ex.videoUrl}
            title={ex.name}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      )}

      {/* Set checklist */}
      <div style={s.setList}>
        {sets.map((set, i) => {
          const isDone = set.status === 'done';
          const isSkipped = set.status === 'skipped';
          const isEditing = editingSet === i;
          const isNext = !isDone && !isSkipped && !isEditing && sets.slice(0, i).every(s => s.status === 'done' || s.status === 'skipped');

          return (
            <div key={i}>
              {/* Set row */}
              <div
                onClick={() => !isDone && !isSkipped && tapSet(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                  background: isDone ? 'rgba(161,240,194,0.08)' : isEditing ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                  border: isDone ? '1px solid rgba(161,240,194,0.25)' : isEditing ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 14, cursor: isDone || isSkipped ? 'default' : 'pointer',
                  opacity: isSkipped ? 0.4 : 1,
                }}
              >
                {/* Checkbox */}
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: isDone ? '#a1f0c2' : 'rgba(255,255,255,0.08)',
                  border: isDone ? 'none' : '2px solid rgba(255,255,255,0.2)',
                  display: 'grid', placeItems: 'center',
                  fontSize: 16, color: '#062b18',
                }}>
                  {isDone ? '✓' : ''}
                </div>

                {/* Set info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: isDone ? '#a1f0c2' : 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, marginBottom: 2 }}>
                    SET {i + 1}{isSkipped ? ' · SKIPPED' : ''}
                  </div>
                  {isDone ? (
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#a1f0c2', fontVariantNumeric: 'tabular-nums' as const }}>
                      {set.actualWeight === 0 ? 'BW' : `${set.actualWeight} lb`} × {set.actualReps} reps
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <div style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.08)', borderRadius: 999, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                        {set.weight === 0 ? 'BW' : `${set.weight} lb`}
                      </div>
                      <div style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.08)', borderRadius: 999, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                        {set.reps} reps
                      </div>
                    </div>
                  )}
                </div>

                {isNext && !isEditing && (
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#a1f0c2', textTransform: 'uppercase' as const }}>NEXT</div>
                )}
              </div>

              {/* Inline editor */}
              {isEditing && (
                <div style={{ marginTop: 4, padding: '14px', background: 'rgba(255,255,255,0.06)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.15)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', marginBottom: 14 }}>
                    <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 6 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' as const }}>WEIGHT</div>
                      <Stepper value={tempWeight} step={5} onChange={setTempWeight} />
                    </div>
                    <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.1)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 6 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' as const }}>REPS</div>
                      <Stepper value={tempReps} step={1} min={1} onChange={setTempReps} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => skipSet(i)}
                      style={{ flex: 1, height: 42, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
                    >
                      Skip
                    </button>
                    <button
                      onClick={logSet}
                      style={{ flex: 2, height: 42, background: '#a1f0c2', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#062b18', cursor: 'pointer' }}
                    >
                      Log set ✓
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Inline rest timer */}
      {restActive && (
        <div style={{ marginTop: 12, padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
              Rest · <span style={{ color: '#a1f0c2', fontVariantNumeric: 'tabular-nums' as const }}>{fmtRest(restSecs)}</span>
            </div>
            <button
              onClick={() => { clearInterval(restRef.current!); setRestActive(false); }}
              style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 8px' }}
            >
              Skip rest
            </button>
          </div>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${restPct}%`, background: 'linear-gradient(90deg, #a1f0c2, #6ec3e8)', borderRadius: 2, transition: 'width 1s linear' }} />
          </div>
        </div>
      )}

      {/* Footer CTA */}
      {allDone && !isLast && (
        <>
          <button style={s.nextBtn} onClick={goNextExercise}>
            Next exercise →
          </button>
          <div style={s.caption}>{doneSets} of {sets.length} sets logged</div>
        </>
      )}

      {!allDone && !editingSet && !restActive && (
        <div style={s.caption}>Tap a set to log it · rest timer starts automatically</div>
      )}

    </div>
  );
}
