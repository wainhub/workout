'use client';
import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore, useActiveProgram } from '@/lib/store';
import { ProgressRing } from '@/components/ProgressRing';
import { Stepper } from '@/components/Stepper';
import type { SetEntry } from '@/lib/types';

export default function ActivePage({ params }: { params: Promise<{ dayId: string }> }) {
  const { dayId } = use(params);
  const router = useRouter();
  const { state, dispatch } = useStore();
  const program = useActiveProgram();
  const session = state.activeSession;

  const [whyOpen, setWhyOpen] = useState(false);

  useEffect(() => { setWhyOpen(false); }, [session?.exIdx]);

  if (!session || session.dayId !== Number(dayId)) {
    router.replace(`/workout/${dayId}`);
    return null;
  }

  const day = program.days.find(d => d.id === session.dayId)!;
  const ex = day.exercises[session.exIdx];
  const sets: SetEntry[] = session.sessionLog[session.exIdx] ?? [];
  const activeIdx = sets.findIndex(s => s.status === 'active');
  const active = sets[activeIdx] ?? sets[sets.length - 1];
  const allDone = sets.every(s => s.status === 'done');
  const isLast = session.exIdx === day.exercises.length - 1;

  function updateSet(i: number, patch: Partial<SetEntry>) {
    const next = sets.map((s, idx) => idx === i ? { ...s, ...patch } : s);
    dispatch({ type: 'UPDATE_SETS', exIdx: session!.exIdx, sets: next });
  }

  function advanceAfterSet(next: SetEntry[]) {
    dispatch({ type: 'UPDATE_SETS', exIdx: session!.exIdx, sets: next });
    const restTarget = ex.type === 'Compound' ? state.prefs.compoundRest : state.prefs.isolationRest;
    const justFinishedAll = next.every(s => s.status === 'done' || s.status === 'skipped');
    if (justFinishedAll) {
      if (isLast) {
        dispatch({ type: 'START_REST', target: 0 });
        router.push(`/workout/${dayId}/summary`);
      } else {
        dispatch({ type: 'START_REST', target: restTarget });
        router.push(`/workout/${dayId}/rest?fin=1`);
      }
    } else {
      dispatch({ type: 'START_REST', target: restTarget });
      router.push(`/workout/${dayId}/rest?fin=0`);
    }
  }

  function completeSet() {
    const next = sets.map((s, i) => {
      if (i === activeIdx) return { ...s, status: 'done' as const, actualWeight: s.weight, actualReps: s.reps };
      if (i === activeIdx + 1) return { ...s, status: 'active' as const };
      return s;
    });
    advanceAfterSet(next);
  }

  function skipSet() {
    const next = sets.map((s, i) => {
      if (i === activeIdx) return { ...s, status: 'skipped' as const };
      if (i === activeIdx + 1 && s.status === 'upcoming') return { ...s, status: 'active' as const };
      return s;
    });
    advanceAfterSet(next);
  }

  function nextExercise() {
    dispatch({ type: 'ADVANCE_EXERCISE', exIdx: session!.exIdx + 1 });
  }

  const s = {
    screen: { paddingTop: 'var(--top)', paddingLeft: 16, paddingRight: 16, paddingBottom: 'calc(max(env(safe-area-inset-bottom), 20px) + 18px)', maxWidth: 480, margin: '0 auto', minHeight: '100svh', background: '#000', display: 'flex', flexDirection: 'column' as const },
    topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    pill: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 999, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' },
    exLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.1em' },
    ringWrap: { display: 'flex', justifyContent: 'center', marginTop: 6 },
    setKicker: { fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', color: '#a1f0c2', textTransform: 'uppercase' as const },
    bigNum: { fontSize: 56, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.045em', marginTop: 2, fontVariantNumeric: 'tabular-nums' as const },
    repsLine: { fontSize: 13, fontWeight: 600, color: '#a1f0c2', marginTop: 2 },
    exName: { textAlign: 'center' as const, fontSize: 18, fontWeight: 600, marginTop: 10, letterSpacing: '-0.02em' },
    exMeta: { textAlign: 'center' as const, fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
    adjBar: { marginTop: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-around' },
    adjBlk: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 4 },
    adjLbl: { fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' as const },
    adjDiv: { width: 1, height: 40, background: 'rgba(255,255,255,0.1)' },
    cue: { padding: '11px 13px', background: 'rgba(161,240,194,0.07)', borderRadius: 12, fontSize: 13, lineHeight: 1.5, color: '#d6f5e2', display: 'flex', gap: 9, alignItems: 'flex-start', marginTop: 10, cursor: 'pointer', border: '1px solid rgba(161,240,194,0.12)' },
    stripHd: { fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' as const, marginBottom: 6, marginTop: 14 },
    doneBtn: { width: '100%', height: 54, background: '#a1f0c2', color: '#062b18', border: 'none', borderRadius: 27, fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 10 },
  };

  function setRowStyle(status: string) {
    return {
      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
      background: status === 'done' ? 'rgba(161,240,194,0.07)' : status === 'skipped' ? 'rgba(255,255,255,0.02)' : status === 'active' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
      borderRadius: 11, marginBottom: 4,
      border: status === 'active' ? '1px solid rgba(161,240,194,0.35)' : '1px solid transparent',
    };
  }

  function setBubble(status: string) {
    return {
      width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center' as const,
      fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums' as const,
      background: status === 'done' ? '#a1f0c2' : status === 'active' ? '#fff' : 'rgba(255,255,255,0.12)',
      color: status === 'done' || status === 'active' ? '#062b18' : 'rgba(255,255,255,0.5)',
      flexShrink: 0,
    };
  }

  const doneSets = sets.filter(s => s.status === 'done').length;

  return (
    <div style={s.screen}>
      <div style={s.topBar}>
        <button style={s.pill} onClick={() => router.push(`/workout/${dayId}`)}>← Day {dayId} · {day.name}</button>
        <div style={s.exLabel}>EX {session.exIdx + 1}/{day.exercises.length}</div>
      </div>

      <div style={s.ringWrap}>
        <ProgressRing completed={doneSets} total={sets.length}>
          <div style={s.setKicker}>{allDone ? 'DONE' : `SET ${Math.min(activeIdx + 1, sets.length)} / ${sets.length}`}</div>
          <div style={s.bigNum}>{active.weight === 0 ? 'BW' : active.weight}</div>
          <div style={s.repsLine}>{ex.unit ?? 'lb'} × {active.reps} reps</div>
        </ProgressRing>
      </div>

      <div style={s.exName}>{ex.name}</div>
      <div style={s.exMeta}>Exercise {session.exIdx + 1} of {day.exercises.length} · {ex.type}</div>

      {!allDone && (
        <div style={s.adjBar}>
          <div style={s.adjBlk}>
            <div style={s.adjLbl}>WEIGHT</div>
            <Stepper value={active.weight} step={5} onChange={v => updateSet(activeIdx, { weight: v })} />
          </div>
          <div style={s.adjDiv} />
          <div style={s.adjBlk}>
            <div style={s.adjLbl}>REPS</div>
            <Stepper value={active.reps} step={1} min={1} onChange={v => updateSet(activeIdx, { reps: v })} />
          </div>
        </div>
      )}

      <div style={s.cue} onClick={() => setWhyOpen(o => !o)}>
        <span style={{ color: '#a1f0c2', fontSize: 14, flexShrink: 0 }}>◆</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div>{ex.cue}</div>
          {whyOpen && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(161,240,194,0.15)', fontSize: 12, lineHeight: 1.55, color: 'rgba(255,255,255,0.7)' }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', color: '#a1f0c2', textTransform: 'uppercase', marginBottom: 4 }}>Why this exercise</div>
              {ex.type === 'Compound'
                ? "It's your big driver today — the most muscle, the most strength carryover. Top set is calibrated to leave 1–2 reps in the tank. Push hard but don't grind."
                : `An accessory to round out the session. Slow eccentric, full stretch, controlled lockout. Form beats load here.`}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
              {whyOpen ? 'Tap to collapse' : 'Tap for coach context'}
            </div>
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name + ' proper form tutorial')}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 9px', background: 'rgba(255,0,0,0.15)', border: '1px solid rgba(255,0,0,0.25)', borderRadius: 999, fontSize: 11, fontWeight: 700, color: '#ff6b6b', textDecoration: 'none' }}
            >
              ▶ Form
            </a>
          </div>
        </div>
      </div>

      <div style={s.stripHd}>All sets</div>
      {sets.map((set, i) => (
        <div key={i} style={setRowStyle(set.status)}>
          <div style={setBubble(set.status)}>{set.status === 'done' ? '✓' : i + 1}</div>
          <div style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', flex: 1 }}>
            {set.status === 'done'
              ? <span style={{ color: '#a1f0c2' }}>{set.actualWeight === 0 ? 'BW' : set.actualWeight} × {set.actualReps} reps</span>
              : set.status === 'skipped'
              ? <span style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>Skipped · {set.weight === 0 ? 'BW' : `${set.weight} lb`} × {set.reps}</span>
              : set.status === 'active'
              ? <span>● working — {set.weight === 0 ? 'BW' : `${set.weight} lb`} × {set.reps} reps</span>
              : <span style={{ color: 'rgba(255,255,255,0.45)' }}>Upcoming · {set.weight === 0 ? 'BW' : `${set.weight} lb`} × {set.reps}</span>
            }
          </div>
        </div>
      ))}

      {allDone ? (
        isLast ? (
          <button style={s.doneBtn} onClick={() => router.push(`/workout/${dayId}/summary`)}>
            Finish workout ✓
          </button>
        ) : (
          <button style={s.doneBtn} onClick={() => { nextExercise(); router.push(`/workout/${dayId}/active`); }}>
            Next exercise →
          </button>
        )
      ) : (
        <>
          <button style={s.doneBtn} onClick={completeSet}>Set complete ✓</button>
          <button
            style={{ width: '100%', height: 48, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 27, fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', marginTop: 8 }}
            onClick={skipSet}
          >
            Skip set
          </button>
        </>
      )}
    </div>
  );
}
