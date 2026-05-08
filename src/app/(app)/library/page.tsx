'use client';
import { useState, useEffect, useContext, createContext, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import type { AppAction, Program } from '@/lib/types';

// ─── Shared state via context ────────────────────────────────────────────────
// ProgramCard and ExForm are defined at MODULE LEVEL so React never sees a new
// function reference. They read shared state through LibCtx instead of props,
// which avoids the prop-drilling while keeping components stable.

type ActiveFormRef = { programId: string; dayId: number; exIdx: number | null } | null;
type FormState = { name: string; type: 'Compound' | 'Isolation'; sets: number; reps: number; weight: number; unit: string; videoUrl: string };

interface LibCtx {
  state: ReturnType<typeof useStore>['state'];
  dispatch: (a: AppAction) => void;
  router: ReturnType<typeof useRouter>;
  expandedId: string | null;
  confirmDelete: string | null;
  editingName: string | null;
  nameValue: string;
  editingDays: boolean;
  activeForm: ActiveFormRef;
  form: FormState;
  setExpandedId: (id: string | null) => void;
  setConfirmDelete: (id: string | null) => void;
  setEditingName: (id: string | null) => void;
  setNameValue: (v: string) => void;
  setEditingDays: (v: boolean | ((p: boolean) => boolean)) => void;
  setActiveForm: (af: ActiveFormRef) => void;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  toggleExpand: (id: string) => void;
  pct: (p: Program) => number;
  openEditEx: (programId: string, dayId: number, exIdx: number, p: Program) => void;
  openAddEx: (programId: string, dayId: number) => void;
  saveEx: (p: Program) => void;
  removeEx: (p: Program, dayId: number, exIdx: number) => void;
  reorderEx: (p: Program, dayId: number, from: number, to: number) => void;
}

const LibraryCtx = createContext<LibCtx | null>(null);
function useLib() { return useContext(LibraryCtx)!; }

// ─── Module-level style constants ────────────────────────────────────────────
const BLANK: FormState = { name: '', type: 'Compound', sets: 3, reps: 10, weight: 0, unit: '', videoUrl: '' };

const INPUT_STYLE = {
  width: '100%', height: 40, background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
  color: '#fff', fontSize: 14, padding: '0 10px', outline: 'none',
  boxSizing: 'border-box' as const,
};
const LABEL_STYLE = {
  fontSize: 10, fontWeight: 700, letterSpacing: '0.16em',
  color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' as const,
  marginBottom: 5, display: 'block', marginTop: 10,
};

// ─── ExForm ──────────────────────────────────────────────────────────────────
function ExForm({ p }: { p: Program }) {
  const { form, setForm, activeForm, saveEx } = useLib();

  const [mwThumb, setMwThumb] = useState('');
  const [mwName,  setMwName]  = useState('');
  const [mwBusy,  setMwBusy]  = useState(false);

  useEffect(() => {
    const trimmed = form.name.trim();
    if (trimmed.length < 3) { setMwThumb(''); setMwName(''); return; }
    setMwBusy(true);
    const timer = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/musclewiki?name=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        const vids  = data.videos ?? [];
        if (vids.length > 0 && vids[0].og_image) {
          setMwThumb(vids[0].og_image);
          setMwName(trimmed);
          setForm(f => ({ ...f, videoUrl: vids[0].url ?? '' }));
        } else {
          setMwThumb(''); setMwName('');
          setForm(f => ({ ...f, videoUrl: '' }));
        }
      } catch {
        setMwThumb(''); setMwName('');
      } finally { setMwBusy(false); }
    }, 700);
    return () => { clearTimeout(timer); setMwBusy(false); };
  }, [form.name]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 14, marginTop: 4, marginBottom: 4 }}>
      <label style={{ ...LABEL_STYLE, marginTop: 0 }}>Exercise name</label>
      <input
        style={INPUT_STYLE}
        placeholder="e.g. Incline DB Press"
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        autoComplete="off" autoCorrect="off" autoCapitalize="words"
      />

      {mwBusy && (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 7 }}>Searching MuscleWiki…</div>
      )}
      {!mwBusy && mwThumb && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, padding: '8px 10px', background: 'rgba(161,240,194,0.05)', border: '1px solid rgba(161,240,194,0.2)', borderRadius: 10 }}>
          <img src={mwThumb} alt="Exercise demo" style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', background: '#111', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', color: '#a1f0c2', textTransform: 'uppercase' as const, marginBottom: 2 }}>✓ Video found</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{mwName}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>Demo video will appear during workout</div>
          </div>
        </div>
      )}
      {!mwBusy && !mwThumb && form.name.trim().length >= 3 && (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>No demo video found — exercise will be saved without one</div>
      )}

      <label style={LABEL_STYLE}>Type</label>
      <div style={{ display: 'flex', gap: 5, background: 'rgba(255,255,255,0.05)', padding: 3, borderRadius: 8 }}>
        {(['Compound', 'Isolation'] as const).map(t => (
          <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
            style={{ flex: 1, height: 32, background: form.type === t ? '#a1f0c2' : 'transparent', color: form.type === t ? '#062b18' : 'rgba(255,255,255,0.6)', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {t}
          </button>
        ))}
      </div>

      <label style={LABEL_STYLE}>Sets · Reps · Weight (lb)</label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
        <input style={INPUT_STYLE} type="number" placeholder="Sets"  value={form.sets   || ''} onChange={e => setForm(f => ({ ...f, sets:   Number(e.target.value) }))} />
        <input style={INPUT_STYLE} type="number" placeholder="Reps"  value={form.reps   || ''} onChange={e => setForm(f => ({ ...f, reps:   Number(e.target.value) }))} />
        <input style={INPUT_STYLE} type="number" placeholder="lb"    value={form.weight || ''} onChange={e => setForm(f => ({ ...f, weight: Number(e.target.value) }))} />
      </div>

      <label style={LABEL_STYLE}>Unit label (optional)</label>
      <input style={INPUT_STYLE} placeholder="e.g. lb ea." value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />

      <button
        onClick={() => saveEx(p)}
        style={{ width: '100%', padding: '10px 0', background: '#a1f0c2', border: 'none', borderRadius: 999, fontSize: 14, fontWeight: 700, color: '#062b18', cursor: 'pointer', marginTop: 12 }}>
        {activeForm?.exIdx !== null ? 'Save changes' : 'Add exercise'}
      </button>
    </div>
  );
}

// ─── ProgramCard ─────────────────────────────────────────────────────────────
function ProgramCard({ p }: { p: Program }) {
  const {
    state, dispatch, router,
    expandedId, confirmDelete, editingName, nameValue, editingDays, activeForm, form, setForm,
    setConfirmDelete, setEditingName, setNameValue, setExpandedId, setEditingDays, setActiveForm,
    toggleExpand, pct, openEditEx, openAddEx, saveEx, removeEx, reorderEx,
  } = useLib();

  const isActive           = p.id === state.activeProgramId;
  const isOpen             = expandedId === p.id;
  const progress           = pct(p);
  const isEditingThisName  = editingName === p.id;
  const isEditingThisDays  = isOpen && editingDays;

  return (
    <div style={{
      background: isActive ? 'linear-gradient(135deg, rgba(161,240,194,0.08), rgba(52,211,153,0.03))' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${isActive ? 'rgba(161,240,194,0.25)' : isOpen ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 16, marginBottom: 10, overflow: 'hidden',
    }}>
      {/* Summary row */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => toggleExpand(p.id)}>
          {isActive && <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', color: '#a1f0c2', textTransform: 'uppercase' as const, marginBottom: 4 }}>✦ ACTIVE</div>}
          <div style={{ fontSize: 16, fontWeight: 700, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{p.daysPerWeek} days/wk · {p.weeks} wks · {p.goal}</div>
          {isActive && (
            <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #a1f0c2, #34d399)', borderRadius: 2, transition: 'width 0.4s' }} />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {!isActive && (
            <button onClick={() => { dispatch({ type: 'SET_ACTIVE_PROGRAM', programId: p.id }); router.push('/home'); }}
              style={{ padding: '7px 12px', background: '#a1f0c2', border: 'none', borderRadius: 999, fontSize: 12, fontWeight: 700, color: '#062b18', cursor: 'pointer' }}>
              Switch →
            </button>
          )}
          {state.programs.length > 1 && (
            confirmDelete === p.id ? (
              <div style={{ display: 'flex', gap: 5 }}>
                <button onClick={e => { e.stopPropagation(); setConfirmDelete(null); }}
                  style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 999, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>Cancel</button>
                <button onClick={e => { e.stopPropagation(); dispatch({ type: 'DELETE_PROGRAM', programId: p.id }); setConfirmDelete(null); setExpandedId(null); }}
                  style={{ padding: '6px 10px', background: 'rgba(255,60,60,0.2)', border: '1px solid rgba(255,60,60,0.3)', borderRadius: 999, fontSize: 12, fontWeight: 700, color: '#ff6b6b', cursor: 'pointer' }}>Delete</button>
              </div>
            ) : (
              <button onClick={e => { e.stopPropagation(); setConfirmDelete(p.id); }}
                style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, fontSize: 14, color: 'rgba(255,255,255,0.35)', cursor: 'pointer' }}
                title="Delete program">🗑</button>
            )
          )}
          {isActive && confirmDelete !== p.id && (
            <div onClick={() => toggleExpand(p.id)} style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'none' }}>›</div>
          )}
        </div>
      </div>

      {/* Expanded detail */}
      {isOpen && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {/* Name edit */}
          <div style={{ marginTop: 14, marginBottom: 4 }}>
            {isEditingThisName ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  style={{ ...INPUT_STYLE, fontSize: 16, fontWeight: 700, flex: 1 }}
                  value={nameValue} autoFocus
                  onChange={e => setNameValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { dispatch({ type: 'RENAME_PROGRAM', programId: p.id, name: nameValue.trim() || p.name }); setEditingName(null); } }}
                />
                <button onClick={() => { dispatch({ type: 'RENAME_PROGRAM', programId: p.id, name: nameValue.trim() || p.name }); setEditingName(null); }}
                  style={{ padding: '8px 12px', background: '#a1f0c2', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#062b18', cursor: 'pointer' }}>Save</button>
                <button onClick={() => setEditingName(null)}
                  style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8, fontSize: 13, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>✕</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{progress}% complete · {p.daysCompleted}/{p.totalDays} sessions</div>
                <button onClick={() => { setNameValue(p.name); setEditingName(p.id); }}
                  style={{ marginLeft: 'auto', padding: '4px 8px', background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 6, fontSize: 12, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>✎ Rename</button>
              </div>
            )}
          </div>

          {/* Reasoning */}
          {p.reasoning && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 14px', marginTop: 10, marginBottom: 2 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', color: '#a1f0c2', textTransform: 'uppercase' as const, marginBottom: 5 }}>✦ Why this program</div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.7)' }}>{p.reasoning}</div>
            </div>
          )}

          {/* Days header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const }}>Program days</div>
            <button
              onClick={() => { setEditingDays(e => !e); setActiveForm(null); }}
              style={{ padding: '6px 12px', background: isEditingThisDays ? '#a1f0c2' : 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 999, fontSize: 12, fontWeight: 600, color: isEditingThisDays ? '#062b18' : '#fff', cursor: 'pointer' }}>
              {isEditingThisDays ? 'Done' : 'Edit'}
            </button>
          </div>

          {p.days.map(day => (
            <div key={day.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Day {day.id} — {day.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 10 }}>{day.focus}</div>

              {day.exercises.map((ex, i) => (
                <div key={`${i}-${ex.name}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {isEditingThisDays && (
                      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 2, flexShrink: 0 }}>
                        <button disabled={i === 0} onClick={() => reorderEx(p, day.id, i, i - 1)}
                          style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 4, fontSize: 9, color: i === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)', cursor: i === 0 ? 'default' : 'pointer' }}>↑</button>
                        <button disabled={i === day.exercises.length - 1} onClick={() => reorderEx(p, day.id, i, i + 1)}
                          style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 4, fontSize: 9, color: i === day.exercises.length - 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)', cursor: i === day.exercises.length - 1 ? 'default' : 'pointer' }}>↓</button>
                      </div>
                    )}
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', width: 16, flexShrink: 0 }}>{i + 1}</div>
                    <div
                      style={{ flex: 1, minWidth: 0, cursor: isEditingThisDays ? 'pointer' : 'default' }}
                      onClick={() => isEditingThisDays && openEditEx(p.id, day.id, i, p)}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600, color: isEditingThisDays && activeForm?.programId === p.id && activeForm.dayId === day.id && activeForm.exIdx === i ? '#a1f0c2' : '#fff' }}>{ex.name}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>{ex.sets} sets × {ex.reps} reps · {ex.type}</div>
                    </div>
                    {isEditingThisDays
                      ? <button onClick={() => removeEx(p, day.id, i)}
                          style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,80,80,0.15)', border: '1px solid rgba(255,80,80,0.25)', color: '#ff6b6b', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
                      : <div style={{ fontSize: 12, fontWeight: 700, color: '#a1f0c2', whiteSpace: 'nowrap' as const, marginLeft: 'auto' }}>
                          {ex.weight === 0 ? 'BW' : `${ex.weight} ${ex.unit ?? 'lb'}`}
                        </div>
                    }
                  </div>
                  {isEditingThisDays && activeForm?.programId === p.id && activeForm.dayId === day.id && activeForm.exIdx === i && <ExForm p={p} />}
                </div>
              ))}

              {isEditingThisDays && (
                <>
                  <button onClick={() => openAddEx(p.id, day.id)}
                    style={{ width: '100%', padding: '9px 0', background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 10, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', marginTop: 8 }}>
                    {activeForm?.programId === p.id && activeForm.dayId === day.id && activeForm.exIdx === null ? '− Cancel' : '+ Add exercise'}
                  </button>
                  {activeForm?.programId === p.id && activeForm.dayId === day.id && activeForm.exIdx === null && <ExForm p={p} />}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function LibraryPageInner() {
  const router = useRouter();
  const { state, dispatch } = useStore();
  const [mounted,      setMounted]      = useState(false);
  const [expandedId,   setExpandedId]   = useState<string | null>(null);
  const [confirmDelete,setConfirmDelete]= useState<string | null>(null);
  const [editingName,  setEditingName]  = useState<string | null>(null);
  const [nameValue,    setNameValue]    = useState('');
  const [editingDays,  setEditingDays]  = useState(false);
  const [activeForm,   setActiveForm]   = useState<ActiveFormRef>(null);
  const [form,         setForm]         = useState<FormState>(BLANK);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div style={{ minHeight: '100svh', background: '#000' }} />;

  const active  = state.programs.find(p => p.id === state.activeProgramId);
  const others  = state.programs.filter(p => p.id !== state.activeProgramId);
  const ordered = active ? [active, ...others] : others;

  function toggleExpand(id: string) {
    setExpandedId(prev => prev === id ? null : id);
    setEditingDays(false);
    setActiveForm(null);
    setConfirmDelete(null);
  }
  function pct(p: Program) {
    return p.totalDays > 0 ? Math.round((p.daysCompleted / p.totalDays) * 100) : 0;
  }
  function openEditEx(programId: string, dayId: number, exIdx: number, p: Program) {
    if (activeForm?.programId === programId && activeForm.dayId === dayId && activeForm.exIdx === exIdx) { setActiveForm(null); return; }
    const ex = p.days.find(d => d.id === dayId)!.exercises[exIdx];
    setForm({ name: ex.name, type: ex.type, sets: ex.sets, reps: ex.reps, weight: ex.weight, unit: ex.unit ?? '', videoUrl: ex.videoUrl ?? '' });
    setActiveForm({ programId, dayId, exIdx });
  }
  function openAddEx(programId: string, dayId: number) {
    if (activeForm?.programId === programId && activeForm.dayId === dayId && activeForm.exIdx === null) { setActiveForm(null); return; }
    setForm(BLANK);
    setActiveForm({ programId, dayId, exIdx: null });
  }
  function saveEx(p: Program) {
    if (!form.name.trim() || !activeForm) return;
    const exercise = {
      name: form.name.trim(), type: form.type, sets: form.sets, reps: form.reps,
      weight: form.weight, unit: form.unit.trim() || undefined,
      videoUrl: form.videoUrl.trim() || undefined,
      cue: activeForm.exIdx !== null
        ? p.days.find(d => d.id === activeForm.dayId)!.exercises[activeForm.exIdx].cue
        : 'Control the movement, focus on form and full range of motion.',
    };
    if (activeForm.exIdx !== null) {
      dispatch({ type: 'UPDATE_EXERCISE', programId: p.id, dayId: activeForm.dayId, exIdx: activeForm.exIdx, exercise });
    } else {
      dispatch({ type: 'ADD_EXERCISE', programId: p.id, dayId: activeForm.dayId, exercise });
    }
    setActiveForm(null);
  }
  function removeEx(p: Program, dayId: number, exIdx: number) {
    if (activeForm?.programId === p.id && activeForm.dayId === dayId && activeForm.exIdx === exIdx) setActiveForm(null);
    dispatch({ type: 'REMOVE_EXERCISE', programId: p.id, dayId, exIdx });
  }
  function reorderEx(p: Program, dayId: number, from: number, to: number) {
    if (activeForm?.programId === p.id && activeForm.dayId === dayId) {
      if (activeForm.exIdx === from) setActiveForm({ ...activeForm, exIdx: to });
      else if (activeForm.exIdx === to) setActiveForm({ ...activeForm, exIdx: from });
    }
    dispatch({ type: 'REORDER_EXERCISE', programId: p.id, dayId, fromIdx: from, toIdx: to });
  }

  const ctx: LibCtx = {
    state, dispatch, router,
    expandedId, confirmDelete, editingName, nameValue, editingDays, activeForm, form,
    setExpandedId, setConfirmDelete, setEditingName, setNameValue,
    setEditingDays, setActiveForm, setForm,
    toggleExpand, pct, openEditEx, openAddEx, saveEx, removeEx, reorderEx,
  };

  return (
    <LibraryCtx.Provider value={ctx}>
      <div style={{ paddingTop: 'var(--top)', paddingLeft: 16, paddingRight: 16, paddingBottom: 'calc(max(env(safe-area-inset-bottom), 20px) + 72px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em' }}>Programs</div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#a1f0c2', border: 'none', borderRadius: 999, fontSize: 13, fontWeight: 700, color: '#062b18', cursor: 'pointer' }}
            onClick={() => router.push('/onboarding/intake?new=1')}>+ New</button>
        </div>

        {ordered.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 60, color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
            No programs yet. Tap + New to build one.
          </div>
        )}

        {ordered.map(p => <ProgramCard key={p.id} p={p} />)}
      </div>
    </LibraryCtx.Provider>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<div style={{ background: '#000', minHeight: '100svh' }} />}>
      <LibraryPageInner />
    </Suspense>
  );
}
