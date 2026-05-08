'use client';
import { use, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore, useActiveProgram } from '@/lib/store';
import { Stepper } from '@/components/Stepper';
import { getExerciseImageUrl, getVideoWatchUrl } from '@/lib/videos';
import { apiUrl } from '@/lib/api';
import type { SetEntry } from '@/lib/types';

const ADD_EX_BLANK = { name: '', type: 'Compound' as 'Compound' | 'Isolation', sets: 3, reps: 10, weight: 0, unit: '', videoUrl: '' };

export default function ActivePage({ params }: { params: Promise<{ dayId: string }> }) {
  const { dayId } = use(params);
  const router = useRouter();
  const { state, dispatch } = useStore();
  const program = useActiveProgram();
  const session = state.activeSession;

  // UI state
  const [whyOpen, setWhyOpen] = useState(false);

  // MuscleWiki video
  const [mwVideos, setMwVideos] = useState<{ url: string; angle: string; og_image?: string }[]>([]);
  const [activeAngle, setActiveAngle] = useState<string>('SIDE');
  const [ytOpen, setYtOpen] = useState(false);

  // Regular set editing
  const [editingSet, setEditingSet] = useState<number | null>(null);
  const [tempWeight, setTempWeight] = useState(0);
  const [tempReps, setTempReps] = useState(0);

  // Add-exercise panel
  const [addExOpen, setAddExOpen] = useState(false);
  const [addExForm, setAddExForm] = useState(ADD_EX_BLANK);
  const [addExMwThumb, setAddExMwThumb] = useState('');
  const [addExMwSearching, setAddExMwSearching] = useState(false);

  // Rest timer
  const [restSecs, setRestSecs] = useState(0);
  const [restActive, setRestActive] = useState(false);
  const [restTarget, setRestTarget] = useState(0);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restEndCbRef = useRef<(() => void) | null>(null);

  // HIIT auto-timer
  const [autoStarted, setAutoStarted] = useState(false);
  const [autoPhase, setAutoPhase] = useState<'work' | 'rest'>('work');
  const [autoSecs, setAutoSecs] = useState(0);
  const [autoSetIdx, setAutoSetIdx] = useState(0);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Adjustable work duration (seconds) — persisted back to the exercise on change
  const [workDurAdj, setWorkDurAdj] = useState<number>(() => {
    if (!session) return 30;
    const d = program.days.find(p => p.id === session.dayId);
    const e = d?.exercises[session.exIdx];
    if (!e) return 30;
    return e.unit?.includes('min') ? Number(e.reps) * 60 : Number(e.reps);
  });
  const workDurAdjRef = useRef(workDurAdj);

  // Refs to avoid stale closures inside timer callbacks
  const setsRef = useRef<SetEntry[]>([]);
  const isLastRef = useRef(false);
  const exIdxRef = useRef(0);
  const autoSetIdxRef = useRef(0);
  const autoAfterRestRef = useRef<{ next: number; advance: boolean; restDur: number; workDur: number } | null>(null);
  const mountedRef = useRef(true);

  // Reset everything when exercise changes, and auto-open first set editor
  useEffect(() => {
    setWhyOpen(false);
    setMwVideos([]);
    setActiveAngle('SIDE');
    setYtOpen(false);
    setRestActive(false);
    setRestSecs(0);
    setRestTarget(0);
    setAutoStarted(false);
    setAutoPhase('work');
    setAutoSecs(0);
    setAutoSetIdx(0);
    autoSetIdxRef.current = 0;
    restEndCbRef.current = null;
    autoAfterRestRef.current = null;
    if (restRef.current) clearInterval(restRef.current);
    if (autoRef.current) clearInterval(autoRef.current);

    // Auto-open first pending set for non-HIIT exercises; reset work duration
    if (!session) { setEditingSet(null); return; }
    const currentDay = program.days.find(d => d.id === session.dayId);
    const currentEx = currentDay?.exercises[session.exIdx];
    if (!currentEx) { setEditingSet(null); return; }
    const timeBased = !!(currentEx.unit?.includes('sec') || currentEx.unit?.includes('min'));
    // Restore saved work duration for HIIT exercises
    const savedDur = currentEx.unit?.includes('min') ? Number(currentEx.reps) * 60 : Number(currentEx.reps);
    setWorkDurAdj(savedDur);
    workDurAdjRef.current = savedDur;
    if (timeBased) { setEditingSet(null); return; }
    const currentSets: SetEntry[] = session.sessionLog[session.exIdx] ?? [];
    const firstPending = currentSets.findIndex(s => s.status !== 'done' && s.status !== 'skipped');
    if (firstPending >= 0) {
      setEditingSet(firstPending);
      setTempWeight(currentSets[firstPending].weight);
      setTempReps(currentSets[firstPending].reps);
    } else {
      setEditingSet(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.exIdx]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (restRef.current) clearInterval(restRef.current);
      if (autoRef.current) clearInterval(autoRef.current);
    };
  }, []);

  // Fetch MuscleWiki video for the current exercise
  useEffect(() => {
    if (!session) return;
    const currentDay = program.days.find(d => d.id === session.dayId);
    const exName = currentDay?.exercises[session.exIdx]?.name;
    if (!exName) return;
    let cancelled = false;
    fetch(apiUrl(`/api/musclewiki?name=${encodeURIComponent(exName)}`))
      .then(r => r.json())
      .then(data => {
        if (!cancelled && Array.isArray(data.videos) && data.videos.length > 0) {
          setMwVideos(data.videos);
          // Prefer SIDE view; fall back to first available
          const hasSide = data.videos.some((v: { angle: string }) => v.angle === 'SIDE');
          setActiveAngle(hasSide ? 'SIDE' : data.videos[0].angle);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.exIdx]);

  // MuscleWiki search for the add-exercise panel (debounced)
  useEffect(() => {
    const trimmed = addExForm.name.trim();
    if (trimmed.length < 3) { setAddExMwThumb(''); return; }
    setAddExMwSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(apiUrl(`/api/musclewiki?name=${encodeURIComponent(trimmed)}`));
        const data = await res.json();
        const videos: { url: string; og_image: string }[] = data.videos ?? [];
        if (videos.length > 0 && videos[0].og_image) {
          setAddExMwThumb(videos[0].og_image);
          setAddExForm(f => ({ ...f, videoUrl: videos[0].url ?? '' }));
        } else {
          setAddExMwThumb('');
          setAddExForm(f => ({ ...f, videoUrl: '' }));
        }
      } catch {
        setAddExMwThumb('');
      } finally {
        setAddExMwSearching(false);
      }
    }, 700);
    return () => { clearTimeout(timer); setAddExMwSearching(false); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addExForm.name]);

  if (!session || session.dayId !== Number(dayId)) {
    router.replace(`/workout/${dayId}`);
    return null;
  }

  const day = program.days.find(d => d.id === session.dayId)!;
  const ex = day.exercises[session.exIdx];
  const sets: SetEntry[] = session.sessionLog[session.exIdx] ?? [];
  const isLast = session.exIdx === day.exercises.length - 1;
  const nextEx = !isLast ? day.exercises[session.exIdx + 1] : null;
  const allDone = sets.every(s => s.status === 'done' || s.status === 'skipped');
  const doneSets = sets.filter(s => s.status === 'done').length;

  // Keep refs fresh on every render
  setsRef.current = sets;
  isLastRef.current = isLast;
  exIdxRef.current = session.exIdx;

  const thumbUrl = getExerciseImageUrl(ex.name);
  const watchUrl = getVideoWatchUrl(ex.name);
  const isTimeBased = !!(ex.unit?.includes('sec') || ex.unit?.includes('min'));
  const isWeighted = ex.weight > 0;
  const repsLabel = isTimeBased ? (ex.unit?.includes('min') ? 'MINUTES' : 'SECONDS') : 'REPS';
  const workDurSecs = ex.unit?.includes('min') ? Number(ex.reps) * 60 : Number(ex.reps);

  const targetLine = (() => {
    if (isWeighted) return `${sets.length} × ${ex.reps} reps @ ${ex.weight} ${ex.unit ?? 'lb'}`;
    if (isTimeBased) return `${sets.length} × ${ex.reps} ${ex.unit?.includes('min') ? 'min' : 'sec'}`;
    return `${sets.length} × ${ex.reps} reps · bodyweight`;
  })();

  function fmtTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${String(sec).padStart(2, '0')}` : String(sec);
  }
  function fmtDone(w: number | undefined, r: number | undefined) {
    if (isTimeBased) return `${r ?? 0}${ex.unit?.includes('min') ? 'min' : 's'}`;
    if (!isWeighted) return `BW × ${r ?? 0}`;
    return `${w ?? 0}lb × ${r ?? 0}`;
  }
  function fmtTarget(w: number, r: number) {
    if (isTimeBased) return `${r} ${ex.unit?.includes('min') ? 'min' : 'sec'}`;
    if (!isWeighted) return `BW · ${r}`;
    return `${w}lb · ${r}`;
  }

  const exRestTarget = ex.type === 'Compound' ? state.prefs.compoundRest : state.prefs.isolationRest;
  const restPct = restTarget > 0 ? (restSecs / restTarget) * 100 : 0;

  // ── Navigation ────────────────────────────────────────────────────
  function goNextExercise() {
    dispatch({ type: 'ADVANCE_EXERCISE', exIdx: exIdxRef.current + 1 });
    router.push(`/workout/${dayId}/active`);
  }
  function goSummary() {
    dispatch({ type: 'START_REST', target: 0 });
    router.push(`/workout/${dayId}/summary`);
  }

  // ── Rest timer ────────────────────────────────────────────────────
  function startRest(onEnd?: () => void) {
    if (restRef.current) clearInterval(restRef.current);
    restEndCbRef.current = onEnd ?? null;
    setRestTarget(exRestTarget);
    setRestSecs(exRestTarget);
    setRestActive(true);
    restRef.current = setInterval(() => {
      setRestSecs(s => {
        if (s <= 1) {
          clearInterval(restRef.current!);
          setRestActive(false);
          const cb = restEndCbRef.current;
          restEndCbRef.current = null;
          if (cb) setTimeout(() => { if (mountedRef.current) cb(); }, 80);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  function skipRest() {
    if (restRef.current) clearInterval(restRef.current);
    setRestActive(false);
    setRestSecs(0);
    const cb = restEndCbRef.current;
    restEndCbRef.current = null;
    if (cb) setTimeout(() => { if (mountedRef.current) cb(); }, 50);
  }

  function adjustRest(delta: number) {
    setRestSecs(s => Math.max(5, s + delta));
    setRestTarget(t => Math.max(5, t + delta));
  }

  // ── Add a bonus exercise mid-workout ─────────────────────────────
  function addAndStartExercise() {
    if (!addExForm.name.trim() || !session) return;
    const newExIdx = day.exercises.length; // will be appended at this index
    const newEx = {
      name: addExForm.name.trim(),
      type: addExForm.type,
      sets: addExForm.sets,
      reps: addExForm.reps,
      weight: addExForm.weight,
      unit: addExForm.unit.trim() || undefined,
      videoUrl: addExForm.videoUrl || undefined,
      cue: 'Control the movement, focus on form and full range of motion.',
    };
    // 1. Save permanently to the program
    dispatch({ type: 'ADD_EXERCISE', programId: program.id, dayId: session.dayId, exercise: newEx });
    // 2. Seed session log entries for the new exercise
    const newSets: SetEntry[] = Array.from({ length: newEx.sets }, (_, j) => ({
      weight: newEx.weight,
      reps: newEx.reps,
      status: (j === 0 ? 'active' : 'upcoming') as SetEntry['status'],
    }));
    dispatch({ type: 'UPDATE_SETS', exIdx: newExIdx, sets: newSets });
    // 3. Advance session to the new exercise
    dispatch({ type: 'ADVANCE_EXERCISE', exIdx: newExIdx });
    // 4. Cancel any running rest timer
    if (restRef.current) clearInterval(restRef.current);
    setRestActive(false);
    setRestSecs(0);
    restEndCbRef.current = null;
    // 5. Reset form
    setAddExOpen(false);
    setAddExForm(ADD_EX_BLANK);
    setAddExMwThumb('');
  }

  // ── Set operations (regular mode) ─────────────────────────────────
  function tapSet(i: number) {
    const s = sets[i];
    if (s.status === 'done' || s.status === 'skipped') return;
    if (restActive) { clearInterval(restRef.current!); setRestActive(false); restEndCbRef.current = null; }
    setEditingSet(i);
    setTempWeight(s.weight);
    setTempReps(s.reps);
  }

  function resolveAfterLog(next: SetEntry[]) {
    const justFinishedAll = next.every(s => s.status === 'done' || s.status === 'skipped');
    if (justFinishedAll && isLastRef.current) {
      startRest(() => goSummary());
    } else if (justFinishedAll) {
      startRest(() => goNextExercise());
    } else {
      const nextIdx = next.findIndex(s => s.status !== 'done' && s.status !== 'skipped');
      const nextSet = next[nextIdx];
      startRest(() => {
        if (nextSet && mountedRef.current) {
          setEditingSet(nextIdx);
          setTempWeight(nextSet.weight);
          setTempReps(nextSet.reps);
        }
      });
    }
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
    resolveAfterLog(next);
  }

  function skipSet(i: number) {
    const next = sets.map((s, idx) => {
      if (idx === i) return { ...s, status: 'skipped' as const };
      if (idx === i + 1 && s.status === 'upcoming') return { ...s, status: 'active' as const };
      return s;
    });
    dispatch({ type: 'UPDATE_SETS', exIdx: session!.exIdx, sets: next });
    setEditingSet(null);
    resolveAfterLog(next);
  }

  // ── HIIT auto-timer ───────────────────────────────────────────────
  function adjustWorkDur(delta: number) {
    const next = Math.max(5, workDurAdjRef.current + delta);
    workDurAdjRef.current = next;
    setWorkDurAdj(next);
    // Persist to store so next session starts with this value
    dispatch({
      type: 'UPDATE_EXERCISE',
      programId: program.id,
      dayId: session!.dayId,
      exIdx: session!.exIdx,
      exercise: { ...ex, reps: next, unit: 'sec' },
    });
  }

  function startAutoTimer() {
    setAutoStarted(true);
    runAutoWork(0, exRestTarget, workDurAdjRef.current);
  }

  function runAutoWork(setIdx: number, restDur: number, workDur: number) {
    if (!mountedRef.current) return;
    if (autoRef.current) clearInterval(autoRef.current);
    setAutoPhase('work');
    setAutoSecs(workDur);
    setAutoSetIdx(setIdx);
    autoSetIdxRef.current = setIdx;

    autoRef.current = setInterval(() => {
      setAutoSecs(prev => {
        if (prev <= 1) {
          clearInterval(autoRef.current!);
          setTimeout(() => {
            if (!mountedRef.current) return;
            const idx = autoSetIdxRef.current;
            const cur = setsRef.current;
            const updated = cur.map((s, i) =>
              i === idx
                ? { ...s, status: 'done' as const, actualWeight: 0, actualReps: workDur }
                : (i === idx + 1 && s.status === 'upcoming' ? { ...s, status: 'active' as const } : s)
            );
            dispatch({ type: 'UPDATE_SETS', exIdx: exIdxRef.current, sets: updated });
            const nextSetIdx = idx + 1;
            const advance = nextSetIdx >= cur.length;
            runAutoRest(advance ? -1 : nextSetIdx, restDur, advance, workDur);
          }, 100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function runAutoRest(nextSetIdx: number, restDur: number, advance: boolean, workDur: number) {
    if (!mountedRef.current) return;
    if (autoRef.current) clearInterval(autoRef.current);
    autoAfterRestRef.current = { next: nextSetIdx, advance, restDur, workDur };
    setAutoPhase('rest');
    setAutoSecs(restDur);

    autoRef.current = setInterval(() => {
      setAutoSecs(prev => {
        if (prev <= 1) {
          clearInterval(autoRef.current!);
          setTimeout(() => { if (mountedRef.current) fireAfterAutoRest(); }, 100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function fireAfterAutoRest() {
    const info = autoAfterRestRef.current;
    autoAfterRestRef.current = null;
    if (!info) return;
    if (info.advance) {
      if (isLastRef.current) {
        dispatch({ type: 'START_REST', target: 0 });
        router.push(`/workout/${dayId}/summary`);
      } else {
        dispatch({ type: 'ADVANCE_EXERCISE', exIdx: exIdxRef.current + 1 });
        router.push(`/workout/${dayId}/active`);
      }
    } else {
      runAutoWork(info.next, info.restDur, info.workDur);
    }
  }

  function skipAutoRest() {
    if (autoRef.current) clearInterval(autoRef.current);
    setTimeout(() => { if (mountedRef.current) fireAfterAutoRest(); }, 50);
  }

  // ── Styles ────────────────────────────────────────────────────────
  const s = {
    screen: {
      paddingTop: 'var(--top)', paddingLeft: 16, paddingRight: 16,
      paddingBottom: 'calc(max(env(safe-area-inset-bottom), 20px) + 18px)',
      maxWidth: 480, margin: '0 auto', minHeight: '100svh',
      background: '#000', display: 'flex', flexDirection: 'column' as const,
    },
    topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    pill: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 999, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' },
    exLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.1em' },
    exHeader: { display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 4 },
    thumb: { width: 112, height: 63, borderRadius: 10, objectFit: 'cover' as const, flexShrink: 0, opacity: 0.85, border: '1px solid rgba(255,255,255,0.1)' },
    exName: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', flex: 1 },
    exTarget: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 12 },
    cue: { padding: '11px 13px', background: 'rgba(161,240,194,0.07)', borderRadius: 12, fontSize: 13, lineHeight: 1.5, color: '#d6f5e2', display: 'flex', gap: 9, alignItems: 'flex-start', marginBottom: 14, cursor: 'pointer', border: '1px solid rgba(161,240,194,0.12)' },
    setList: { display: 'flex', flexDirection: 'column' as const, gap: 8, flex: 1 },
    // HIIT
    hiitWrap: { flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 14, paddingBottom: 24 },
    hiitStartBtn: { width: '100%', height: 58, background: '#a1f0c2', color: '#062b18', border: 'none', borderRadius: 29, fontSize: 20, fontWeight: 800, cursor: 'pointer' },
    hiitSkipBtn: { padding: '10px 28px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' },
    // Rest timer
    restBox: { marginTop: 12, padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14 },
    restRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    adjBtn: { width: 44, height: 44, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
    adjBtnSm: { width: 32, height: 28, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  };

  const totalEx = day.exercises.length;
  const afterInfo = autoAfterRestRef.current;

  return (
    <div style={s.screen}>
      {/* Top bar */}
      <div style={s.topBar}>
        <button style={s.pill} onClick={() => router.push(`/workout/${dayId}`)}>← {day.name}</button>
        <div style={s.exLabel}>EX {session.exIdx + 1} / {totalEx}</div>
      </div>

      {/* Exercise progress bar (one segment per exercise) */}
      <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
        {day.exercises.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i < session.exIdx ? '#a1f0c2'
              : i === session.exIdx ? 'rgba(161,240,194,0.45)'
              : 'rgba(255,255,255,0.1)',
          }} />
        ))}
      </div>

      {/* Exercise name + target */}
      <div style={{ marginBottom: 4 }}>
        <div style={s.exName}>{ex.name}</div>
        <div style={s.exTarget}>{targetLine}</div>
      </div>

      {/* Video — MuscleWiki inline (preferred) or YouTube tap-out (fallback) */}
      {(() => {
        const videoForAngle = mwVideos.find(v => v.angle === activeAngle) ?? mwVideos[0];
        const angles = [...new Set(mwVideos.map(v => v.angle))].filter(a => a === 'FRONT' || a === 'SIDE');

        if (videoForAngle) {
          return (
            <div style={{ marginBottom: 12 }}>
              <video
                key={videoForAngle.url}
                src={apiUrl(`/api/musclewiki/video?url=${encodeURIComponent(videoForAngle.url)}`)}
                autoPlay
                muted
                loop
                playsInline
                poster={mwVideos[0]?.og_image}
                style={{ width: '100%', borderRadius: 14, background: '#111', display: 'block', aspectRatio: '16/9', objectFit: 'cover' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                {angles.length > 1 ? (
                  <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 3, gap: 3 }}>
                    {angles.map(angle => (
                      <button
                        key={angle}
                        onClick={() => setActiveAngle(angle)}
                        style={{
                          padding: '4px 12px', border: 'none', borderRadius: 6,
                          background: activeAngle === angle ? 'rgba(255,255,255,0.15)' : 'transparent',
                          color: activeAngle === angle ? '#fff' : 'rgba(255,255,255,0.4)',
                          fontSize: 11, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' as const,
                        }}
                      >
                        {angle.charAt(0) + angle.slice(1).toLowerCase()} view
                      </button>
                    ))}
                  </div>
                ) : <div />}
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontWeight: 500 }}>Powered by MuscleWiki</div>
              </div>
            </div>
          );
        }

        return null;
      })()}

      {/* Coach cue */}
      <div style={s.cue} onClick={() => setWhyOpen(o => !o)}>
        <span style={{ color: '#a1f0c2', fontSize: 14, flexShrink: 0 }}>◆</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div>{ex.cue}</div>
          {whyOpen && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(161,240,194,0.15)', fontSize: 12, lineHeight: 1.55, color: 'rgba(255,255,255,0.7)' }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', color: '#a1f0c2', textTransform: 'uppercase' as const, marginBottom: 4 }}>Why this exercise</div>
              {ex.type === 'Compound'
                ? "It's your big driver today — the most muscle, the most strength carryover. Top set is calibrated to leave 1–2 reps in the tank. Push hard but don't grind."
                : 'An accessory to round out the session. Slow eccentric, full stretch, controlled lockout. Form beats load here.'}
            </div>
          )}
          <div style={{ marginTop: 6, fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
            {whyOpen ? 'Tap to collapse' : 'Tap for coach context'}
          </div>
        </div>
      </div>

      {/* ── HIIT auto-timer mode ───────────────────────────────── */}
      {isTimeBased ? (
        <div style={s.hiitWrap}>
          {!autoStarted ? (
            <>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', textAlign: 'center' as const, lineHeight: 1.6 }}>
                {sets.length} sets · auto-advances between sets
              </div>

              {/* Work duration adjuster */}
              <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const }}>Work Duration</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <button style={s.adjBtn} onClick={() => adjustWorkDur(-5)}>−</button>
                  <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em', color: '#fff', minWidth: 80, textAlign: 'center' as const, fontVariantNumeric: 'tabular-nums' as const }}>
                    {fmtTime(workDurAdj)}
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginLeft: 4 }}>sec</span>
                  </div>
                  <button style={s.adjBtn} onClick={() => adjustWorkDur(+5)}>+</button>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>saved for next session</div>
              </div>

              <button style={s.hiitStartBtn} onClick={startAutoTimer}>▶ Start</button>
            </>
          ) : (
            <>
              {/* Phase label */}
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' as const,
                color: autoPhase === 'work' ? '#a1f0c2' : 'rgba(255,255,255,0.4)',
              }}>
                {autoPhase === 'work' ? '● WORK' : '○ REST'}
              </div>

              {/* Big countdown */}
              <div style={{
                fontSize: 88, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.04em',
                fontVariantNumeric: 'tabular-nums' as const,
                color: autoPhase === 'work' ? '#fff' : 'rgba(255,255,255,0.35)',
              }}>
                {fmtTime(autoSecs)}
              </div>

              {/* Set progress dots */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {sets.map((set, i) => (
                  <div key={i} style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: set.status === 'done' ? '#a1f0c2'
                      : i === autoSetIdx && autoPhase === 'work' ? 'rgba(161,240,194,0.5)'
                      : 'rgba(255,255,255,0.15)',
                    transition: 'background 0.3s',
                  }} />
                ))}
              </div>

              {/* Set label */}
              <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                Set {autoSetIdx + 1} of {sets.length}
                {doneSets > 0 && (
                  <span style={{ color: '#a1f0c2', marginLeft: 8 }}>· {doneSets} done ✓</span>
                )}
              </div>

              {/* Up next (rest phase only) */}
              {autoPhase === 'rest' && afterInfo && (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center' as const }}>
                  {afterInfo.advance
                    ? (nextEx ? `Up next: ${nextEx.name}` : 'Last exercise — great work!')
                    : `Up next: Set ${afterInfo.next + 1} of ${sets.length}`}
                </div>
              )}

              {/* Skip rest (rest phase only) */}
              {autoPhase === 'rest' && (
                <button style={s.hiitSkipBtn} onClick={skipAutoRest}>Skip Rest ⏭</button>
              )}
            </>
          )}
        </div>
      ) : (
        /* ── Regular set checklist ─────────────────────────────── */
        <div style={s.setList}>
          {sets.map((set, i) => {
            const isDone = set.status === 'done';
            const isSkipped = set.status === 'skipped';
            const isEditing = editingSet === i;
            const isNext = !isDone && !isSkipped && !isEditing
              && sets.slice(0, i).every(s => s.status === 'done' || s.status === 'skipped');

            return (
              <div key={i}>
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
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                    background: isDone ? '#a1f0c2' : 'rgba(255,255,255,0.08)',
                    border: isDone ? 'none' : '2px solid rgba(255,255,255,0.2)',
                    display: 'grid', placeItems: 'center',
                    fontSize: 16, color: '#062b18',
                  }}>
                    {isDone ? '✓' : ''}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: isDone ? '#a1f0c2' : 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, marginBottom: 2 }}>
                      SET {i + 1}{isSkipped ? ' · SKIPPED' : ''}
                    </div>
                    {isDone ? (
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#a1f0c2', fontVariantNumeric: 'tabular-nums' as const }}>
                        {fmtDone(set.actualWeight, set.actualReps)}
                      </div>
                    ) : (
                      <div style={{ display: 'inline-block', padding: '3px 10px', background: 'rgba(255,255,255,0.08)', borderRadius: 999, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                        {fmtTarget(set.weight, set.reps)}
                      </div>
                    )}
                  </div>
                  {isNext && !isEditing && (
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#a1f0c2', textTransform: 'uppercase' as const }}>NEXT</div>
                  )}
                </div>

                {/* Inline editor */}
                {isEditing && (
                  <div style={{ marginTop: 4, padding: 14, background: 'rgba(255,255,255,0.06)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.15)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: isWeighted ? 'space-around' : 'center', marginBottom: 14 }}>
                      {isWeighted && (
                        <>
                          <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 6 }}>
                            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' as const }}>LOAD (lb)</div>
                            <Stepper value={tempWeight} step={5} onChange={setTempWeight} />
                          </div>
                          <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.1)' }} />
                        </>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 6 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' as const }}>{repsLabel}</div>
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
      )}

      {/* Rest timer (regular mode) */}
      {!isTimeBased && restActive && (
        <div style={s.restBox}>
          <div style={s.restRow}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>
              Rest{' '}
              <span style={{ color: '#a1f0c2', fontVariantNumeric: 'tabular-nums' as const, fontSize: 18 }}>
                {fmtTime(restSecs)}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button style={s.adjBtnSm} onClick={() => adjustRest(-15)}>−</button>
              <button style={s.adjBtnSm} onClick={() => adjustRest(+15)}>+</button>
              <button
                onClick={skipRest}
                style={{ padding: '4px 10px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                Skip
              </button>
            </div>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${restPct}%`, background: 'linear-gradient(90deg, #a1f0c2, #6ec3e8)', borderRadius: 2, transition: 'width 1s linear' }} />
          </div>
          {allDone && (
            <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center' as const }}>
              {isLast ? 'Rest then wrapping up…' : `Rest then: ${nextEx?.name ?? 'next exercise'}`}
            </div>
          )}
        </div>
      )}

      {/* Hint */}
      {!isTimeBased && !allDone && editingSet === null && !restActive && (
        <div style={{ marginTop: 14, textAlign: 'center' as const, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
          Tap a set to log it · rest starts automatically
        </div>
      )}

      {/* ── Add exercise panel (last exercise, all sets done) ──── */}
      {!isTimeBased && isLast && allDone && (
        <div style={{ marginTop: 16, paddingBottom: 8 }}>
          {!addExOpen ? (
            <button
              onClick={() => setAddExOpen(true)}
              style={{
                width: '100%', padding: '11px 0',
                background: 'rgba(255,255,255,0.03)',
                border: '1px dashed rgba(255,255,255,0.18)',
                borderRadius: 14, fontSize: 13, fontWeight: 600,
                color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
              }}
            >
              + Add bonus exercise
            </button>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 16 }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Add exercise</div>
                <button
                  onClick={() => { setAddExOpen(false); setAddExForm(ADD_EX_BLANK); setAddExMwThumb(''); }}
                  style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8, fontSize: 14, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >✕</button>
              </div>

              {/* Exercise name */}
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' as const, marginBottom: 5 }}>Exercise name</div>
              <input
                style={{ width: '100%', height: 40, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 14, padding: '0 10px', outline: 'none', boxSizing: 'border-box' as const }}
                placeholder="e.g. Cable Curl"
                value={addExForm.name}
                onChange={e => setAddExForm(f => ({ ...f, name: e.target.value }))}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="words"
              />

              {/* MuscleWiki preview */}
              {addExMwSearching && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 7 }}>Searching MuscleWiki…</div>
              )}
              {!addExMwSearching && addExMwThumb && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, padding: '7px 10px', background: 'rgba(161,240,194,0.05)', border: '1px solid rgba(161,240,194,0.18)', borderRadius: 10 }}>
                  <img src={addExMwThumb} alt="" style={{ width: 44, height: 44, borderRadius: 7, objectFit: 'cover', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: '#a1f0c2', textTransform: 'uppercase' as const, marginBottom: 1 }}>✓ Video found</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Demo video will appear during the set</div>
                  </div>
                </div>
              )}

              {/* Type toggle */}
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' as const, marginBottom: 5, marginTop: 10 }}>Type</div>
              <div style={{ display: 'flex', gap: 5, background: 'rgba(255,255,255,0.05)', padding: 3, borderRadius: 8 }}>
                {(['Compound', 'Isolation'] as const).map(t => (
                  <button key={t} onClick={() => setAddExForm(f => ({ ...f, type: t }))}
                    style={{ flex: 1, height: 32, background: addExForm.type === t ? '#a1f0c2' : 'transparent', color: addExForm.type === t ? '#062b18' : 'rgba(255,255,255,0.6)', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    {t}
                  </button>
                ))}
              </div>

              {/* Sets / Reps / Weight */}
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' as const, marginBottom: 5, marginTop: 10 }}>Sets · Reps · Weight (lb)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                {(['sets', 'reps', 'weight'] as const).map(field => (
                  <input key={field} type="number" placeholder={field === 'weight' ? 'lb' : field.charAt(0).toUpperCase() + field.slice(1)}
                    style={{ width: '100%', height: 40, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 14, padding: '0 10px', outline: 'none', boxSizing: 'border-box' as const }}
                    value={addExForm[field] || ''}
                    onChange={e => setAddExForm(f => ({ ...f, [field]: Number(e.target.value) }))}
                  />
                ))}
              </div>

              {/* Save note */}
              <div style={{ fontSize: 11, color: 'rgba(161,240,194,0.6)', marginTop: 10 }}>
                ✓ Saves permanently to <strong style={{ color: 'rgba(161,240,194,0.9)' }}>{day.name}</strong> for future workouts
              </div>

              {/* Submit */}
              <button
                onClick={addAndStartExercise}
                disabled={!addExForm.name.trim()}
                style={{
                  width: '100%', padding: '12px 0', marginTop: 12,
                  background: addExForm.name.trim() ? '#a1f0c2' : 'rgba(255,255,255,0.1)',
                  border: 'none', borderRadius: 12,
                  fontSize: 14, fontWeight: 700,
                  color: addExForm.name.trim() ? '#062b18' : 'rgba(255,255,255,0.3)',
                  cursor: addExForm.name.trim() ? 'pointer' : 'default',
                }}
              >
                Add &amp; start now →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
