'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveProgram, useStore } from '@/lib/store';

const BLANK = { name: '', type: 'Compound' as 'Compound' | 'Isolation', sets: 3, reps: 10, weight: 0, unit: '' };

function LibraryPageInner() {
  const router = useRouter();
  const program = useActiveProgram();
  const { state, dispatch } = useStore();
  const [mounted, setMounted] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [editingDays, setEditingDays] = useState(false);
  const [activeForm, setActiveForm] = useState<{ dayId: number; exIdx: number | null } | null>(null);
  const [form, setForm] = useState(BLANK);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div style={{ minHeight: '100svh', background: '#000' }} />;

  const pct = Math.round((program.daysCompleted / program.totalDays) * 100);
  const otherPrograms = state.programs.filter(p => p.id !== state.activeProgramId);

  function openEditEx(dayId: number, exIdx: number) {
    if (activeForm?.dayId === dayId && activeForm.exIdx === exIdx) { setActiveForm(null); return; }
    const ex = program.days.find(d => d.id === dayId)!.exercises[exIdx];
    setForm({ name: ex.name, type: ex.type, sets: ex.sets, reps: ex.reps, weight: ex.weight, unit: ex.unit ?? '' });
    setActiveForm({ dayId, exIdx });
  }

  function openAddEx(dayId: number) {
    if (activeForm?.dayId === dayId && activeForm.exIdx === null) { setActiveForm(null); return; }
    setForm(BLANK);
    setActiveForm({ dayId, exIdx: null });
  }

  function saveEx() {
    if (!form.name.trim() || !activeForm) return;
    const exercise = {
      name: form.name.trim(), type: form.type, sets: form.sets, reps: form.reps,
      weight: form.weight, unit: form.unit.trim() || undefined,
      cue: activeForm.exIdx !== null
        ? program.days.find(d => d.id === activeForm.dayId)!.exercises[activeForm.exIdx].cue
        : 'Control the movement, focus on form and full range of motion.',
    };
    if (activeForm.exIdx !== null) {
      dispatch({ type: 'UPDATE_EXERCISE', programId: program.id, dayId: activeForm.dayId, exIdx: activeForm.exIdx, exercise });
    } else {
      dispatch({ type: 'ADD_EXERCISE', programId: program.id, dayId: activeForm.dayId, exercise });
    }
    setActiveForm(null);
  }

  function removeEx(dayId: number, exIdx: number) {
    if (activeForm?.dayId === dayId && activeForm.exIdx === exIdx) setActiveForm(null);
    dispatch({ type: 'REMOVE_EXERCISE', programId: program.id, dayId, exIdx });
  }

  function reorderEx(dayId: number, from: number, to: number) {
    if (activeForm?.dayId === dayId && activeForm.exIdx === from) setActiveForm({ dayId, exIdx: to });
    else if (activeForm?.dayId === dayId && activeForm.exIdx === to) setActiveForm({ dayId, exIdx: from });
    dispatch({ type: 'REORDER_EXERCISE', programId: program.id, dayId, fromIdx: from, toIdx: to });
  }

  const s = {
    screen: { paddingTop: 'var(--top)', paddingLeft: 16, paddingRight: 16 },
    titleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    title: { fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em' },
    newBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#a1f0c2', border: 'none', borderRadius: 999, fontSize: 13, fontWeight: 700, color: '#062b18', cursor: 'pointer' },
    sectionLabel: { fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, marginBottom: 10 },
    activeCard: { background: 'linear-gradient(135deg, rgba(161,240,194,0.1), rgba(52,211,153,0.04))', border: '1px solid rgba(161,240,194,0.3)', borderRadius: 18, padding: 18, marginBottom: 12 },
    kicker: { fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: '#a1f0c2', marginBottom: 6 },
    name: { fontSize: 20, fontWeight: 700 },
    meta: { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 4 },
    bar: { height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, marginTop: 14, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #a1f0c2, #34d399)', width: `${pct}%`, transition: 'width 0.6s ease' },
    barLabel: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 6 },
    reasonCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 16px', marginTop: 12, marginBottom: 4 },
    reasonKicker: { fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: '#a1f0c2', marginBottom: 6, textTransform: 'uppercase' as const },
    reason: { fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.7)' },
    // days section
    daysHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 10 },
    daysLabel: { fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const },
    daysEditBtn: { padding: '6px 12px', background: editingDays ? '#a1f0c2' : 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 999, fontSize: 12, fontWeight: 600, color: editingDays ? '#062b18' : '#fff', cursor: 'pointer' },
    dayCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '12px 14px', marginBottom: 8 },
    dayHead: { fontSize: 13, fontWeight: 700, marginBottom: 2 },
    dayFocus: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 10 },
    exRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.06)' },
    exNum: { fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', width: 16, flexShrink: 0 },
    exName: { fontSize: 13, fontWeight: 600 },
    exSub: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 },
    exWeight: { fontSize: 12, fontWeight: 700, color: '#a1f0c2', whiteSpace: 'nowrap' as const, marginLeft: 'auto' },
    reorderCol: { display: 'flex', flexDirection: 'column' as const, gap: 2, flexShrink: 0 },
    reorderBtn: (disabled: boolean) => ({ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 4, fontSize: 9, color: disabled ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)', cursor: disabled ? 'default' : 'pointer' }),
    removeBtn: { width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,80,80,0.15)', border: '1px solid rgba(255,80,80,0.25)', color: '#ff6b6b', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    addExBtn: { width: '100%', padding: '9px 0', background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 10, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', marginTop: 8 },
    formCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 14, marginTop: 4, marginBottom: 4 },
    formLabel: { fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' as const, marginBottom: 5, display: 'block', marginTop: 10 },
    formInput: { width: '100%', height: 40, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 14, padding: '0 10px', outline: 'none' } as const,
    formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 },
    typeRow: { display: 'flex', gap: 5, background: 'rgba(255,255,255,0.05)', padding: 3, borderRadius: 8 },
    typeBtn: (active: boolean) => ({ flex: 1, height: 32, background: active ? '#a1f0c2' : 'transparent', color: active ? '#062b18' : 'rgba(255,255,255,0.6)', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }),
    saveExBtn: { width: '100%', padding: '10px 0', background: '#a1f0c2', border: 'none', borderRadius: 999, fontSize: 14, fontWeight: 700, color: '#062b18', cursor: 'pointer', marginTop: 12 },
    // other programs
    otherLabel: { fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, marginTop: 24, marginBottom: 10 },
    otherCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16, marginBottom: 8 },
    otherName: { fontSize: 16, fontWeight: 700 },
    otherMeta: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 3 },
    otherBtns: { display: 'flex', gap: 8, marginTop: 12 },
    setActiveBtn: { flex: 1, padding: '10px 0', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' },
    deleteBtn: { padding: '10px 14px', background: 'rgba(255,100,100,0.08)', border: '1px solid rgba(255,100,100,0.15)', borderRadius: 999, fontSize: 13, fontWeight: 600, color: '#ff6b6b', cursor: 'pointer' },
    confirmMsg: { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 10, marginBottom: 8 },
    confirmRow: { display: 'flex', gap: 8 },
    cancelBtn: { flex: 1, padding: '10px 0', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 999, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', cursor: 'pointer' },
    confirmDeleteBtn: { flex: 1, padding: '10px 0', background: 'rgba(255,80,80,0.15)', border: '1px solid rgba(255,80,80,0.25)', borderRadius: 999, fontSize: 13, fontWeight: 600, color: '#ff6b6b', cursor: 'pointer' },
    nameRow: { display: 'flex', alignItems: 'center', gap: 8 },
    pencilBtn: { padding: '4px 8px', background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 6, fontSize: 13, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' },
    nameInput: { flex: 1, height: 36, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(161,240,194,0.4)', borderRadius: 8, color: '#fff', fontSize: 18, fontWeight: 700, padding: '0 10px', outline: 'none' } as const,
    saveNameBtn: { padding: '8px 14px', background: '#a1f0c2', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#062b18', cursor: 'pointer' },
    cancelNameBtn: { padding: '8px 10px', background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8, fontSize: 13, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' },
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
        <button style={s.saveExBtn} onClick={saveEx}>{activeForm?.exIdx !== null ? 'Save changes' : 'Add exercise'}</button>
      </div>
    );
  }

  return (
    <div style={s.screen}>
      <div style={s.titleRow}>
        <div style={s.title}>Programs</div>
        <button style={s.newBtn} onClick={() => router.push('/onboarding/intake?new=1')}>+ New</button>
      </div>

      <div style={s.sectionLabel}>Active program</div>
      <div style={s.activeCard}>
        <div style={s.kicker}>✦ ACTIVE PROGRAM</div>
        {editingName ? (
          <div style={{ ...s.nameRow, marginBottom: 4 }}>
            <input style={s.nameInput} value={nameValue} autoFocus
              onChange={e => setNameValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { dispatch({ type: 'RENAME_PROGRAM', programId: program.id, name: nameValue.trim() || program.name }); setEditingName(false); } }}
            />
            <button style={s.saveNameBtn} onClick={() => { dispatch({ type: 'RENAME_PROGRAM', programId: program.id, name: nameValue.trim() || program.name }); setEditingName(false); }}>Save</button>
            <button style={s.cancelNameBtn} onClick={() => setEditingName(false)}>✕</button>
          </div>
        ) : (
          <div style={s.nameRow}>
            <div style={s.name}>{program.name}</div>
            <button style={s.pencilBtn} onClick={() => { setNameValue(program.name); setEditingName(true); }}>✎</button>
          </div>
        )}
        <div style={s.meta}>{program.daysPerWeek} days/week · {program.weeks} weeks · {program.goal}</div>
        <div style={s.bar}><div style={s.fill} /></div>
        <div style={s.barLabel}>{program.daysCompleted} of {program.totalDays} sessions complete · {pct}%</div>
      </div>

      <div style={s.reasonCard}>
        <div style={s.reasonKicker}>✦ Why this program</div>
        <div style={s.reason}>{program.reasoning}</div>
      </div>

      {/* Program days editor */}
      <div style={s.daysHeader}>
        <div style={s.daysLabel}>Program days</div>
        <button style={s.daysEditBtn} onClick={() => { setEditingDays(e => !e); setActiveForm(null); }}>
          {editingDays ? 'Done' : 'Edit'}
        </button>
      </div>

      {program.days.map(day => (
        <div key={day.id} style={s.dayCard}>
          <div style={s.dayHead}>Day {day.id} — {day.name}</div>
          <div style={s.dayFocus}>{day.focus}</div>

          {day.exercises.map((ex, i) => (
            <div key={`${i}-${ex.name}`}>
              <div style={s.exRow}>
                {editingDays && (
                  <div style={s.reorderCol}>
                    <button style={s.reorderBtn(i === 0)} disabled={i === 0} onClick={() => reorderEx(day.id, i, i - 1)}>↑</button>
                    <button style={s.reorderBtn(i === day.exercises.length - 1)} disabled={i === day.exercises.length - 1} onClick={() => reorderEx(day.id, i, i + 1)}>↓</button>
                  </div>
                )}
                <div style={s.exNum}>{i + 1}</div>
                <div
                  style={{ flex: 1, minWidth: 0, cursor: editingDays ? 'pointer' : 'default' }}
                  onClick={() => editingDays && openEditEx(day.id, i)}
                >
                  <div style={{ ...s.exName, color: editingDays && activeForm?.dayId === day.id && activeForm.exIdx === i ? '#a1f0c2' : '#fff' }}>{ex.name}</div>
                  <div style={s.exSub}>{ex.sets} sets × {ex.reps} reps · {ex.type}</div>
                </div>
                {editingDays
                  ? <button style={s.removeBtn} onClick={() => removeEx(day.id, i)}>×</button>
                  : <div style={s.exWeight}>{ex.weight === 0 ? 'BW' : `${ex.weight} ${ex.unit ?? 'lb'}`}</div>
                }
              </div>
              {editingDays && activeForm?.dayId === day.id && activeForm.exIdx === i && <ExForm />}
            </div>
          ))}

          {editingDays && (
            <>
              <button style={s.addExBtn} onClick={() => openAddEx(day.id)}>
                {activeForm?.dayId === day.id && activeForm.exIdx === null ? '− Cancel' : '+ Add exercise'}
              </button>
              {activeForm?.dayId === day.id && activeForm.exIdx === null && <ExForm />}
            </>
          )}
        </div>
      ))}

      {otherPrograms.length > 0 && (
        <>
          <div style={s.otherLabel}>Other programs</div>
          {otherPrograms.map(p => (
            <div key={p.id} style={s.otherCard}>
              <div style={s.otherName}>{p.name}</div>
              <div style={s.otherMeta}>{p.daysPerWeek} days/wk · {p.weeks} weeks · {p.goal}</div>
              {confirmDelete === p.id ? (
                <>
                  <div style={s.confirmMsg}>Delete &ldquo;{p.name}&rdquo;? This can&apos;t be undone.</div>
                  <div style={s.confirmRow}>
                    <button style={s.cancelBtn} onClick={() => setConfirmDelete(null)}>Cancel</button>
                    <button style={s.confirmDeleteBtn} onClick={() => { dispatch({ type: 'DELETE_PROGRAM', programId: p.id }); setConfirmDelete(null); }}>Delete</button>
                  </div>
                </>
              ) : (
                <div style={s.otherBtns}>
                  <button style={s.setActiveBtn} onClick={() => dispatch({ type: 'SET_ACTIVE_PROGRAM', programId: p.id })}>Set active</button>
                  <button style={s.deleteBtn} onClick={() => setConfirmDelete(p.id)}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<div style={{ background: '#000', minHeight: '100svh' }} />}>
      <LibraryPageInner />
    </Suspense>
  );
}
