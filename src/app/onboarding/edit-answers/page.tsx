'use client';
import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import type { IntakeAnswers } from '@/lib/types';

// ── Label maps ────────────────────────────────────────────────────────────────

const GOAL_OPTIONS = [
  { label: 'Build muscle',           value: 'hypertrophy' },
  { label: 'Get stronger',           value: 'strength' },
  { label: 'Lose fat',               value: 'fat_loss' },
  { label: 'General fitness',        value: 'general' },
  { label: 'Improve flexibility',    value: 'flexibility' },
  { label: 'Build cardio / endurance', value: 'cardio' },
];
const EXPERIENCE_OPTIONS = [
  { label: 'Just starting out',  value: 'beginner' },
  { label: '6 months – 2 years', value: 'intermediate' },
  { label: '2+ years',           value: 'advanced' },
];
const SESSION_OPTIONS = [
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
  { label: '75+ min', value: 75 },
];
const EQUIPMENT_OPTIONS = [
  { label: 'Full commercial gym',          value: 'full_gym' },
  { label: 'Home dumbbells + bench',       value: 'home_db' },
  { label: 'Garage gym (barbell + rack)',  value: 'garage' },
  { label: 'Bodyweight only',              value: 'bw' },
];
const EMPHASIS_OPTIONS = [
  { label: 'Upper body', value: 'upper' },
  { label: 'Lower body', value: 'lower' },
  { label: 'Core',        value: 'core' },
  { label: 'Arms',        value: 'arms' },
  { label: 'Hips & glutes', value: 'hips' },
  { label: 'No preference', value: 'none' },
];
const INJURY_OPTIONS = [
  { label: 'None',          value: 'none' },
  { label: 'Lower back',    value: 'lower_back' },
  { label: 'Knees',         value: 'knees' },
  { label: 'Shoulders',     value: 'shoulder_inj' },
];

function displayLabel(opts: { label: string; value: string | number }[], val: string | number | undefined): string {
  if (val === undefined || val === null || val === '') return '—';
  // Support comma-separated multi-values (emphasis)
  const vals = String(val).split(',').map(v => v.trim());
  return vals.map(v => opts.find(o => String(o.value) === v)?.label ?? v).join(' + ');
}

// ── Chip selector (single or multi) ──────────────────────────────────────────
function ChipSelector({
  options,
  value,
  multi = false,
  onChange,
}: {
  options: { label: string; value: string | number }[];
  value: string | number | undefined;
  multi?: boolean;
  onChange: (v: string | number) => void;
}) {
  const selected = value !== undefined && value !== null && value !== ''
    ? String(value).split(',').map(v => v.trim())
    : [];

  function toggle(v: string) {
    if (!multi) { onChange(v); return; }
    // "none" clears everything else; selecting anything else clears "none"
    if (v === 'none') { onChange('none'); return; }
    const without = selected.filter(s => s !== 'none');
    const next = without.includes(v)
      ? without.filter(s => s !== v)
      : [...without, v];
    onChange(next.length === 0 ? '' : next.join(','));
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
      {options.map(opt => {
        const isActive = selected.includes(String(opt.value));
        return (
          <button
            key={opt.value}
            onClick={() => toggle(String(opt.value))}
            style={{
              padding: '9px 16px',
              background: isActive ? '#a1f0c2' : 'rgba(255,255,255,0.07)',
              border: isActive ? 'none' : '1px solid rgba(255,255,255,0.15)',
              borderRadius: 999,
              color: isActive ? '#062b18' : '#fff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {isActive && multi && opt.value !== 'none' ? '✓ ' : ''}{opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Bodyweight editor ─────────────────────────────────────────────────────────
function BwEditor({ value, onChange }: { value: number | undefined; onChange: (v: number) => void }) {
  const [txt, setTxt] = useState(value ? String(value) : '');
  const [unit, setUnit] = useState<'lb' | 'kg'>('lb');
  const num = Number(txt);
  const valid = num > 60 && num < 500;

  function commit() {
    if (!valid) return;
    const lb = unit === 'kg' ? Math.round(num * 2.205) : num;
    onChange(lb);
  }

  return (
    <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
      <input
        type="number"
        inputMode="decimal"
        placeholder={unit === 'lb' ? '150' : '68'}
        value={txt}
        onChange={e => setTxt(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && commit()}
        autoFocus
        style={{
          flex: 1, height: 48, background: 'rgba(255,255,255,0.07)',
          border: `1px solid ${valid ? 'rgba(161,240,194,0.4)' : 'rgba(255,255,255,0.15)'}`,
          borderRadius: 10, color: '#fff', fontSize: 18, fontWeight: 700,
          padding: '0 14px', outline: 'none', boxSizing: 'border-box',
          fontVariantNumeric: 'tabular-nums',
        }}
      />
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 3, gap: 3 }}>
        {(['lb', 'kg'] as const).map(u => (
          <button key={u} onClick={() => setUnit(u)} style={{
            height: 40, width: 42, border: 'none', borderRadius: 8,
            background: unit === u ? '#a1f0c2' : 'transparent',
            color: unit === u ? '#062b18' : 'rgba(255,255,255,0.5)',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>{u}</button>
        ))}
      </div>
      <button
        onClick={commit}
        disabled={!valid}
        style={{
          height: 48, padding: '0 14px', background: valid ? '#a1f0c2' : 'rgba(255,255,255,0.08)',
          border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700,
          color: valid ? '#062b18' : 'rgba(255,255,255,0.3)', cursor: valid ? 'pointer' : 'default',
        }}
      >Set</button>
    </div>
  );
}

// ── Days picker ───────────────────────────────────────────────────────────────
function DaysPicker({ value, onChange }: { value: number | undefined; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
      {[1,2,3,4,5,6,7].map(d => (
        <button key={d} onClick={() => onChange(d)} style={{
          flex: 1, height: 44, border: value === d ? 'none' : '1px solid rgba(255,255,255,0.15)',
          borderRadius: 10, background: value === d ? '#a1f0c2' : 'rgba(255,255,255,0.06)',
          color: value === d ? '#062b18' : '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
        }}>{d}</button>
      ))}
    </div>
  );
}

// ── Answer row ────────────────────────────────────────────────────────────────
function AnswerRow({
  label,
  display,
  isOpen,
  onToggle,
  children,
}: {
  label: string;
  display: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      background: isOpen ? 'rgba(161,240,194,0.05)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${isOpen ? 'rgba(161,240,194,0.2)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 14, marginBottom: 8, overflow: 'hidden',
    }}>
      <div
        onClick={onToggle}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer' }}
      >
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 3 }}>
            {label}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: isOpen ? '#a1f0c2' : '#fff' }}>
            {display}
          </div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: isOpen ? '#a1f0c2' : 'rgba(255,255,255,0.4)' }}>
          {isOpen ? 'Done ↑' : 'Edit'}
        </div>
      </div>
      {isOpen && (
        <div style={{ padding: '0 16px 16px' }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function EditAnswersInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNew = searchParams.get('new') === '1';
  const { state, dispatch } = useStore();

  const [local, setLocal] = useState<IntakeAnswers>(state.intakeAnswers ?? {});
  const [openRow, setOpenRow] = useState<string | null>(null);

  const isDirty = JSON.stringify(local) !== JSON.stringify(state.intakeAnswers);

  function set(key: string, val: string | number) {
    setLocal(prev => ({ ...prev, [key]: val }));
    // Auto-close row after selection for non-multi fields
    if (key !== 'emphasis' && key !== 'bodyweight') setOpenRow(null);
  }

  function regenerate() {
    dispatch({ type: 'SET_INTAKE_ANSWERS', answers: local });
    router.push(`/onboarding/generating${isNew ? '?new=1' : ''}`);
  }

  function toggle(id: string) {
    setOpenRow(prev => prev === id ? null : id);
  }

  const s = {
    screen: { paddingTop: 'var(--top)', paddingLeft: 16, paddingRight: 16, paddingBottom: 'calc(max(env(safe-area-inset-bottom), 20px) + 24px)', minHeight: '100svh', background: '#000', maxWidth: 480, margin: '0 auto' },
    backBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 999, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', marginBottom: 20 },
    title: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 },
    sub: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20, lineHeight: 1.5 },
    regenBtn: {
      width: '100%', padding: '18px 0', background: '#a1f0c2', color: '#062b18',
      border: 'none', borderRadius: 999, fontSize: 17, fontWeight: 700, cursor: 'pointer', marginTop: 8,
    },
    backToReviewBtn: {
      width: '100%', padding: '14px 0', background: 'transparent', color: 'rgba(255,255,255,0.4)',
      border: 'none', fontSize: 14, cursor: 'pointer', marginTop: 8,
    },
  };

  return (
    <div style={s.screen}>
      <button style={s.backBtn} onClick={() => router.back()}>← Back</button>
      <div style={s.title}>Edit your answers</div>
      <div style={s.sub}>Tap any answer to change it. Hit "Regenerate" when ready.</div>

      <AnswerRow label="Goal" display={displayLabel(GOAL_OPTIONS, local.goal)} isOpen={openRow === 'goal'} onToggle={() => toggle('goal')}>
        <ChipSelector options={GOAL_OPTIONS} value={local.goal} onChange={v => set('goal', v)} />
      </AnswerRow>

      <AnswerRow label="Experience" display={displayLabel(EXPERIENCE_OPTIONS, local.experience)} isOpen={openRow === 'experience'} onToggle={() => toggle('experience')}>
        <ChipSelector options={EXPERIENCE_OPTIONS} value={local.experience} onChange={v => set('experience', v)} />
      </AnswerRow>

      <AnswerRow
        label="Bodyweight"
        display={local.bodyweight ? `${local.bodyweight} lb` : '—'}
        isOpen={openRow === 'bodyweight'}
        onToggle={() => toggle('bodyweight')}
      >
        <BwEditor value={local.bodyweight} onChange={v => set('bodyweight', v)} />
      </AnswerRow>

      <AnswerRow label="Days per week" display={local.days ? `${local.days} ${local.days === 1 ? 'day' : 'days'}/week` : '—'} isOpen={openRow === 'days'} onToggle={() => toggle('days')}>
        <DaysPicker value={local.days} onChange={v => set('days', v)} />
      </AnswerRow>

      <AnswerRow label="Session length" display={displayLabel(SESSION_OPTIONS, local.session)} isOpen={openRow === 'session'} onToggle={() => toggle('session')}>
        <ChipSelector options={SESSION_OPTIONS} value={local.session} onChange={v => set('session', v)} />
      </AnswerRow>

      <AnswerRow label="Equipment" display={displayLabel(EQUIPMENT_OPTIONS, local.equipment)} isOpen={openRow === 'equipment'} onToggle={() => toggle('equipment')}>
        <ChipSelector options={EQUIPMENT_OPTIONS} value={local.equipment} onChange={v => set('equipment', v)} />
      </AnswerRow>

      <AnswerRow
        label="Focus areas"
        display={local.emphasis ? displayLabel(EMPHASIS_OPTIONS, local.emphasis) : '—'}
        isOpen={openRow === 'emphasis'}
        onToggle={() => toggle('emphasis')}
      >
        <ChipSelector options={EMPHASIS_OPTIONS} value={local.emphasis} multi onChange={v => setLocal(prev => ({ ...prev, emphasis: String(v) }))} />
        {openRow === 'emphasis' && (
          <button
            onClick={() => setOpenRow(null)}
            style={{ marginTop: 12, width: '100%', height: 42, background: 'rgba(161,240,194,0.12)', border: '1px solid rgba(161,240,194,0.25)', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#a1f0c2', cursor: 'pointer' }}
          >
            Done ✓
          </button>
        )}
      </AnswerRow>

      <AnswerRow label="Injuries / avoid" display={displayLabel(INJURY_OPTIONS, local.injuries)} isOpen={openRow === 'injuries'} onToggle={() => toggle('injuries')}>
        <ChipSelector options={INJURY_OPTIONS} value={local.injuries} onChange={v => set('injuries', v)} />
      </AnswerRow>

      <button style={s.regenBtn} onClick={regenerate}>
        {isDirty ? 'Regenerate program →' : 'Regenerate program →'}
      </button>
      <button style={s.backToReviewBtn} onClick={() => router.back()}>
        Cancel — keep current program
      </button>
    </div>
  );
}

export default function EditAnswersPage() {
  return (
    <Suspense fallback={<div style={{ background: '#000', minHeight: '100svh' }} />}>
      <EditAnswersInner />
    </Suspense>
  );
}
