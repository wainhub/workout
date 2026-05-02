'use client';
import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore, useActiveProgram } from '@/lib/store';
import type { SessionLog } from '@/lib/types';

function fmtWeight(w: number, unit?: string) {
  if (w === 0) return 'BW';
  return `${w} ${unit ?? 'lb'}`;
}

function estTime(exercises: { sets: number; type: string }[]) {
  const sets = exercises.reduce((n, e) => n + e.sets, 0);
  const rest = exercises.reduce((n, e) => n + e.sets * (e.type === 'Compound' ? 90 : 75), 0);
  return Math.round((sets * 45 + rest) / 60);
}

const BLANK_FORM = { name: '', type: 'Compound' as 'Compound' | 'Isolation', sets: 3, reps: 10, weight: 0, unit: '' };

// Pre-generate pages for up to 7 days (covers all seed + AI programs)

export default function DayPage({ params }: { params: Promise<{ dayId: string }> }) {
  const { dayId } = use(params);
  const router = useRouter();
  const { state, dispatch } = useStore();
  const program = useActiveProgram();
  const day = program.days.find(d => d.id === Number(dayId));

  const [editing, setEditing] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit' | null>(null);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [form, setForm] = useState(BLANK_FORM);

  if (!day) return <div style={{ padding: 52, color: 'rgba(255,255,255,0.5)' }}>Day not found.</div>;

  const week = state.weekByDay[day.id] ?? 1;
  const totalSets = day.exercises.reduce((n, e) => n + e.sets, 0);
  const time = estTime(day.exercises);

  function openAdd() {
    setForm(BLANK_FORM);
    setEditIdx(null);
    setFormMode(formMode === 'add' ? null : 'add');
  }

  function openEdit(i: number) {
    if (editIdx === i && formMode === 'edit') { setFormMode(null); setEditIdx(null); return; }
    const ex = day!.exercises[i];
    setForm({ name: ex.name, type: ex.type, sets: ex.sets, reps: ex.reps, weight: ex.weight, unit: ex.unit ?? '' });
    setEditIdx(i);
    setFormMode('edit');
  }

  function closeForm() { setFormMode(null); setEditIdx(null); }

  function saveExercise() {
    if (!form.name.trim()) return;
    const exercise = {
      name: form.name.trim(),
      type: form.type,
      sets: form.sets,
      reps: form.reps,
      weight: form.weight,
      unit: form.unit.trim() || undefined,
      cue: formMode === 'edit' && editIdx !== null
        ? day!.exercises[editIdx].cue
        : 'Control the movement, focus on form and full range of motion.',
    };
    if (formMode === 'edit' && editIdx !== null) {
      dispatch({ type: 'UPDATE_EXERCISE', programId: state.activeProgramId, dayId: day!.id, exIdx: editIdx, exercise });
    } else {
      dispatch({ type: 'ADD_EXERCISE', programId: state.activeProgramId, dayId: day!.id, exercise });
    }
    closeForm();
  }

  function removeExercise(idx: number) {
    if (editIdx === idx) closeForm();
    dispatch({ type: 'REMOVE_EXERCISE', programId: state.activeProgramId, dayId: day!.id, exIdx: idx });
  }

  function reorder(from: number, to: number) {
    if (editIdx === from) setEditIdx(to);
    else if (editIdx === to) setEditIdx(from);
    dispatch({ type: 'REORDER_EXERCISE', programId: state.activeProgramId, dayId: day!.id, fromIdx: from, toIdx: to });
  }

  function startWorkout() {
    const sessionLog: SessionLog = {};
    day!.exercises.forEach((ex, i) => {
      sessionLog[i] = Array.from({ length: ex.sets }, (_, j) => ({
        weight: ex.lastSetWeights?.[j] ?? ex.weight,
        reps: ex.lastSetReps?.[j] ?? ex.reps,
        status: j === 0 ? 'active' : 'upcoming',
      }));
    });
    dispatch({ type: 'START_SESSION', dayId: day!.id, week, sessionLog });
    router.push(`/workout/${dayId}/active`);
  }

  const s = {
    screen: { paddingTop: 'var(--top)', paddingLeft: 16, paddingRight: 16, maxWidth: 480, margin: '0 auto', minHeight: '100svh', background: '#000' },
    backBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 999, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' },
    kicker: { fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.5)' },
    title: { fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', marginTop: 6 },
    focus: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
    statRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 18 },
    stat: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 10px', textAlign: 'center' as const },
    statLabel: { fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.45)', marginBottom: 4 },
    statVal: { fontSize: 22, fontWeight: 800, fontVariantNumeric: 'tabular-nums' as const },
    statUnit: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
    sectionHead: { fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.45)', marginTop: 24, marginBottom: 10 },
    exRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' },
    exNum: { fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.35)', width: 18, flexShrink: 0 },
    exName: { fontSize: 14, fontWeight: 600 },
    exSub: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
    exWeight: { fontSize: 13, fontWeight: 700, color: '#a1f0c2', whiteSpace: 'nowrap' as const, marginLeft: 'auto' },
    startBtn: {
      position: 'sticky' as const, bottom: 'calc(max(env(safe-area-inset-bottom), 20px) + 60px)',
      width: '100%', padding: '18px 0', marginTop: 24,
      background: '#a1f0c2', color: '#062b18', border: 'none',
      borderRadius: 999, fontSize: 17, fontWeight: 700, cursor: 'pointer',
    },
    editBtn: { padding: '8px 14px', background: editing ? '#a1f0c2' : 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 999, fontSize: 13, fontWeight: 600, color: editing ? '#062b18' : '#fff', cursor: 'pointer' },
    reorderCol: { display: 'flex', flexDirection: 'column' as const, gap: 2, flexShrink: 0 },
    reorderBtn: (disabled: boolean) => ({ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 5, fontSize: 10, color: disabled ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)', cursor: disabled ? 'default' : 'pointer' }),
    removeBtn: { width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,80,80,0.15)', border: '1px solid rgba(255,80,80,0.25)', color: '#ff6b6b', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    addExBtn: { width: '100%', padding: '12px 0', background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 12, fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', marginTop: 8 },
    formCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 16, marginTop: 4, marginBottom: 4 },
    formLabel: { fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' as const, marginBottom: 6, display: 'block', marginTop: 12 },
    formInput: { width: '100%', height: 44, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 15, padding: '0 12px', outline: 'none' } as const,
    formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 },
    typeRow: { display: 'flex', gap: 6, background: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 10 },
    typeBtn: (active: boolean) => ({ flex: 1, height: 36, background: active ? '#a1f0c2' : 'transparent', color: active ? '#062b18' : 'rgba(255,255,255,0.6)', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' }),
    saveExBtn: { width: '100%', padding: '12px 0', background: '#a1f0c2', border: 'none', borderRadius: 999, fontSize: 15, fontWeight: 700, color: '#062b18', cursor: 'pointer', marginTop: 14 },
  };

  function ExForm() {
    return (
      <div style={s.formCard}>
        <label style={{ ...s.formLabel, marginTop: 0 }}>Exercise name</label>
        <input style={s.formInput} placeholder="e.g. Incline DB Press" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <label style={s.formLabel}>Type</label>
        <div style={s.typeRow}>
          <button style={s.typeBtn(form.type === 'Compound')} onClick={() => setForm(f => ({ ...f, type: 'Compound' }))}>Compound</button>
          <button style={s.typeBtn(form.type === 'Isolation')} onClick={() => setForm(f => ({ ...f, type: 'Isolation' }))}>Isolation</button>
        </div>
        <label style={s.formLabel}>Sets · Reps · Weight (lb)</label>
        <div style={s.formRow}>
          <input style={s.formInput} type="number" placeholder="Sets" value={form.sets || ''} onChange={e => setForm(f => ({ ...f, sets: Number(e.target.value) }))} />
          <input style={s.formInput} type="number" placeholder="Reps" value={form.reps || ''} onChange={e => setForm(f => ({ ...f, reps: Number(e.target.value) }))} />
          <input style={s.formInput} type="number" placeholder="lb" value={form.weight || ''} onChange={e => setForm(f => ({ ...f, weight: Number(e.target.value) }))} />
        </div>
        <label style={s.formLabel}>Unit label (optional)</label>
        <input style={s.formInput} placeholder="e.g. lb ea." value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
        <button style={s.saveExBtn} onClick={saveExercise}>{formMode === 'edit' ? 'Save changes' : 'Add exercise'}</button>
      </div>
    );
  }

  return (
    <div style={s.screen}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button style={s.backBtn} onClick={() => router.push('/home')}>← Home</button>
        <button style={s.editBtn} onClick={() => { setEditing(e => !e); closeForm(); }}>{editing ? 'Done' : 'Edit'}</button>
      </div>
      <div style={s.kicker}>PROGRAM · DAY {day.id} · WEEK {week}</div>
      <div style={s.title}>{day.name}</div>
      <div style={s.focus}>{day.focus}</div>

      <div style={s.statRow}>
        <div style={s.stat}>
          <div style={s.statLabel}>Exercises</div>
          <div style={s.statVal}>{day.exercises.length}</div>
        </div>
        <div style={s.stat}>
          <div style={s.statLabel}>Sets</div>
          <div style={s.statVal}>{totalSets}</div>
        </div>
        <div style={s.stat}>
          <div style={s.statLabel}>Est. time</div>
          <div style={s.statVal}>{time}</div>
          <div style={s.statUnit}>min</div>
        </div>
      </div>

      <div style={s.sectionHead}>Exercises</div>
      {day.exercises.map((ex, i) => (
        <div key={`${i}-${ex.name}`}>
          <div style={s.exRow}>
            {editing && (
              <div style={s.reorderCol}>
                <button style={s.reorderBtn(i === 0)} disabled={i === 0} onClick={() => reorder(i, i - 1)}>↑</button>
                <button style={s.reorderBtn(i === day.exercises.length - 1)} disabled={i === day.exercises.length - 1} onClick={() => reorder(i, i + 1)}>↓</button>
              </div>
            )}
            <div style={s.exNum}>{i + 1}</div>
            <div
              style={{ flex: 1, minWidth: 0, cursor: editing ? 'pointer' : 'default' }}
              onClick={() => editing && openEdit(i)}
            >
              <div style={{ ...s.exName, color: editing && editIdx === i ? '#a1f0c2' : '#fff' }}>{ex.name}</div>
              <div style={s.exSub}>{ex.sets} sets × {ex.reps} reps · {ex.type}</div>
            </div>
            {editing
              ? <button style={s.removeBtn} onClick={() => removeExercise(i)}>×</button>
              : <div style={s.exWeight}>{fmtWeight(ex.weight, ex.unit)}</div>
            }
          </div>
          {editing && formMode === 'edit' && editIdx === i && <ExForm />}
        </div>
      ))}

      {editing && (
        <>
          <button style={s.addExBtn} onClick={openAdd}>
            {formMode === 'add' ? '− Cancel' : '+ Add exercise'}
          </button>
          {formMode === 'add' && <ExForm />}
        </>
      )}

      <button style={s.startBtn} onClick={startWorkout}>Start workout</button>
    </div>
  );
}
