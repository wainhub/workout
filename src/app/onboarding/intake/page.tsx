'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import type { IntakeAnswers } from '@/lib/types';

const AI_GRADIENT = 'linear-gradient(135deg, #ff7a59 0%, #e85d75 50%, #6ec3e8 100%)';

const DAYS_CONTEXT: Record<number, string> = {
  1: 'Once-a-week full body — for tight schedules. Slower progress but real.',
  2: 'Two full-body days. Surprisingly effective for general fitness.',
  3: 'Full-body 3× — the classic. Strong recovery, steady gains.',
  4: 'Upper/Lower split — the most balanced choice for most people.',
  5: 'Push/Pull/Legs + Upper/Lower. More volume per muscle group.',
  6: 'PPL ×2 or Upper/Lower ×3. Serious volume — needs nutrition + sleep dialed in.',
  7: "Daily training. We'll add 2–3 light recovery days so you don't burn out.",
};

const FLOW = [
  { id: 'greet', bot: "Hi! I'm your AI coach. I'll ask a few quick questions, then build a program shaped to you. Ready?", chips: [{ label: "Let's go", value: 'go' }] },
  { id: 'goal', bot: "What's your primary goal right now?", chips: [
    { label: 'Build muscle', value: 'hypertrophy' },
    { label: 'Get stronger', value: 'strength' },
    { label: 'Lose fat', value: 'fat_loss' },
    { label: 'General fitness', value: 'general' },
    { label: 'Improve flexibility', value: 'flexibility' },
    { label: 'Build cardio / endurance', value: 'cardio' },
  ]},
  { id: 'experience', bot: "How long have you been training consistently?", chips: [
    { label: 'Just starting out', value: 'beginner' },
    { label: '6 months – 2 years', value: 'intermediate' },
    { label: '2+ years', value: 'advanced' },
  ]},
  { id: 'bodyweight', bot: "What's your bodyweight? (We use this to set your starting weights — a 130 lb person and a 200 lb person should not start with the same bench press.)", chips: [] },
  { id: 'days', bot: "How many days per week can you commit to?", chips: [] },
  { id: 'session', bot: "How long is each session, realistically?", chips: [
    { label: '30 min', value: 30 }, { label: '45 min', value: 45 }, { label: '60 min', value: 60 }, { label: '75+ min', value: 75 },
  ]},
  { id: 'equipment', bot: "What do you have access to?", chips: [
    { label: 'Full commercial gym', value: 'full_gym' },
    { label: 'Home dumbbells + bench', value: 'home_db' },
    { label: 'Garage gym (barbell + rack)', value: 'garage' },
    { label: 'Bodyweight only', value: 'bw' },
  ]},
  { id: 'emphasis', bot: "Any area to focus on? Pick one or skip.", chips: [
    { label: 'Upper body', value: 'upper' }, { label: 'Lower body', value: 'lower' },
    { label: 'Core', value: 'core' }, { label: 'Arms', value: 'arms' },
    { label: 'Hips & glutes', value: 'hips' }, { label: 'No preference', value: 'none' },
  ]},
  { id: 'injuries', bot: "Any injuries or areas to avoid?", chips: [
    { label: 'None', value: 'none' }, { label: 'Lower back', value: 'lower_back' },
    { label: 'Knees', value: 'knees' }, { label: 'Shoulders', value: 'shoulder_inj' },
  ]},
];

interface Message { role: 'bot' | 'user'; text: string }

function BodyweightPicker({ onPick }: { onPick: (bw: number, unit: 'lb' | 'kg') => void }) {
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState<'lb' | 'kg'>('lb');
  const num = Number(value);
  const valid = num > 60 && num < 500;

  return (
    <div style={{ padding: '14px 16px', paddingBottom: 'calc(max(env(safe-area-inset-bottom), 20px) + 60px)', borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0a0a0a', flexShrink: 0 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          type="number"
          inputMode="decimal"
          placeholder={unit === 'lb' ? '150' : '68'}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && valid && onPick(num, unit)}
          autoFocus
          style={{
            flex: 1, height: 54, background: 'rgba(255,255,255,0.07)',
            border: `1px solid ${valid ? 'rgba(161,240,194,0.4)' : 'rgba(255,255,255,0.15)'}`,
            borderRadius: 12, color: '#fff', fontSize: 22, fontWeight: 700,
            padding: '0 16px', outline: 'none', boxSizing: 'border-box',
            fontVariantNumeric: 'tabular-nums',
          }}
        />
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, gap: 4 }}>
          {(['lb', 'kg'] as const).map(u => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              style={{
                height: 46, width: 48, border: 'none', borderRadius: 9,
                background: unit === u ? '#a1f0c2' : 'transparent',
                color: unit === u ? '#062b18' : 'rgba(255,255,255,0.5)',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}
            >{u}</button>
          ))}
        </div>
      </div>
      <button
        disabled={!valid}
        onClick={() => onPick(num, unit)}
        style={{
          width: '100%', height: 48, background: valid ? '#a1f0c2' : 'rgba(255,255,255,0.08)',
          color: valid ? '#062b18' : 'rgba(255,255,255,0.3)',
          border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
          cursor: valid ? 'pointer' : 'default',
        }}
      >
        {valid ? `${num} ${unit} — continue →` : 'Enter your bodyweight'}
      </button>
    </div>
  );
}

function DaysPicker({ onPick }: { onPick: (days: number) => void }) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div style={{ padding: '14px 16px', paddingBottom: 'calc(max(env(safe-area-inset-bottom), 20px) + 60px)', borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0a0a0a', flexShrink: 0 }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 12, lineHeight: 1.5 }}>
        Pick your most realistic — not your aspirational. We adapt if life changes.
      </div>

      {/* 1–7 row */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[1, 2, 3, 4, 5, 6, 7].map(d => (
          <button
            key={d}
            onClick={() => setSelected(d)}
            style={{
              flex: 1, height: 44, border: selected === d ? 'none' : '1px solid rgba(255,255,255,0.15)',
              borderRadius: 10,
              background: selected === d ? '#a1f0c2' : 'rgba(255,255,255,0.06)',
              color: selected === d ? '#062b18' : '#fff',
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Context card */}
      {selected && (
        <div style={{ background: 'rgba(161,240,194,0.07)', border: '1px solid rgba(161,240,194,0.2)', borderRadius: 12, padding: '11px 14px', marginBottom: 12, fontSize: 13, lineHeight: 1.5, color: 'rgba(255,255,255,0.8)' }}>
          <span style={{ fontWeight: 700, color: '#a1f0c2' }}>{selected} {selected === 1 ? 'day' : 'days'}/week — </span>
          {DAYS_CONTEXT[selected]}
        </div>
      )}

      {/* Honest tradeoff */}
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5, marginBottom: selected ? 12 : 0 }}>
        Why not always 7? Most people grow more from 4–5 quality sessions than 7 rushed ones.
      </div>

      {selected && (
        <button
          onClick={() => onPick(selected)}
          style={{ width: '100%', height: 48, background: '#a1f0c2', color: '#062b18', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}
        >
          {selected} {selected === 1 ? 'day' : 'days'} — let's build it →
        </button>
      )}
    </div>
  );
}

function IntakePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNew = searchParams.get('new') === '1';
  const { state, dispatch } = useStore();
  const [step, setStep] = useState(0);
  // Seed from store so gender (set in profile) carries forward
  const [answers, setAnswers] = useState<IntakeAnswers>(state.intakeAnswers ?? {});
  const [messages, setMessages] = useState<Message[]>([{ role: 'bot', text: FLOW[0].bot }]);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing]);

  function pick(chip: { label: string; value: string | number }) {
    const current = FLOW[step];
    const newAnswers = { ...answers, [current.id]: chip.value };
    setMessages(m => [...m, { role: 'user', text: chip.label }]);
    setAnswers(newAnswers);
    const next = step + 1;
    if (next >= FLOW.length) {
      setTyping(true);
      setTimeout(() => {
        dispatch({ type: 'SET_INTAKE_ANSWERS', answers: newAnswers });
        router.push(`/onboarding/generating${isNew ? '?new=1' : ''}`);
      }, 600);
      return;
    }
    setTyping(true);
    setTimeout(() => {
      setMessages(m => [...m, { role: 'bot', text: FLOW[next].bot }]);
      setTyping(false);
      setStep(next);
    }, 700);
  }

  function pickDays(days: number) {
    pick({ label: `${days} ${days === 1 ? 'day' : 'days'} per week`, value: days });
  }

  function pickBodyweight(bw: number, unit: 'lb' | 'kg') {
    const bwLb = unit === 'kg' ? Math.round(bw * 2.205) : bw;
    pick({ label: `${bw} ${unit}`, value: bwLb });
  }

  // Multi-select state for emphasis step
  const [emphasisSelected, setEmphasisSelected] = useState<string[]>([]);
  function toggleEmphasis(val: string) {
    if (val === 'none') { setEmphasisSelected(['none']); return; }
    setEmphasisSelected(prev => {
      const without = prev.filter(v => v !== 'none');
      return without.includes(val) ? without.filter(v => v !== val) : [...without, val];
    });
  }
  function commitEmphasis() {
    const val = emphasisSelected.length === 0 ? 'none' : emphasisSelected.join(',');
    const EMPHASIS_LABELS: Record<string, string> = {
      upper: 'Upper body', lower: 'Lower body', core: 'Core',
      arms: 'Arms', hips: 'Hips & glutes', none: 'No preference',
    };
    const label = emphasisSelected.length === 0 || emphasisSelected[0] === 'none'
      ? 'No preference'
      : emphasisSelected.map(v => EMPHASIS_LABELS[v] ?? v).join(' + ');
    pick({ label, value: val });
  }

  const currentStep = FLOW[step];
  const isDaysStep = !typing && currentStep?.id === 'days';
  const isBodyweightStep = !typing && currentStep?.id === 'bodyweight';
  const isEmphasisStep = !typing && currentStep?.id === 'emphasis';
  const chips = !typing && !isDaysStep && !isBodyweightStep && !isEmphasisStep && step < FLOW.length ? currentStep.chips : [];
  const progress = (step / (FLOW.length - 1)) * 100;

  const s = {
    screen: { display: 'flex', flexDirection: 'column' as const, minHeight: '100svh', background: '#000', maxWidth: 480, margin: '0 auto' },
    header: { paddingTop: 'var(--top)', paddingLeft: 16, paddingRight: 16, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 },
    backBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 999, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' },
    avatarRow: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 },
    avatar: { width: 32, height: 32, borderRadius: '50%', background: AI_GRADIENT, display: 'grid', placeItems: 'center' as const, fontSize: 14, color: '#fff', fontWeight: 700, flexShrink: 0 },
    avatarName: { fontSize: 14, fontWeight: 700 },
    avatarSub: { fontSize: 11, color: '#a1f0c2', fontWeight: 600 },
    progressBar: { height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginTop: 12, overflow: 'hidden' },
    progressFill: { height: '100%', background: 'linear-gradient(90deg, #ff7a59, #6ec3e8)', borderRadius: 2, width: `${progress}%`, transition: 'width 0.3s' },
    chat: { flex: 1, overflowY: 'auto' as const, padding: '14px 16px', display: 'flex', flexDirection: 'column' as const, gap: 8 },
    botBubble: { alignSelf: 'flex-start' as const, maxWidth: '82%', padding: '11px 14px', background: 'rgba(255,255,255,0.07)', borderRadius: 18, borderTopLeftRadius: 6, fontSize: 14, lineHeight: 1.4 },
    userBubble: { alignSelf: 'flex-end' as const, maxWidth: '82%', padding: '11px 14px', background: '#a1f0c2', color: '#062b18', borderRadius: 18, borderTopRightRadius: 6, fontSize: 14, lineHeight: 1.4, fontWeight: 600 },
    typingRow: { alignSelf: 'flex-start' as const, display: 'flex', gap: 4, alignItems: 'center', padding: '14px', background: 'rgba(255,255,255,0.07)', borderRadius: 18, borderTopLeftRadius: 6 },
    chipBar: { padding: '12px 16px', paddingBottom: 'calc(max(env(safe-area-inset-bottom), 20px) + 60px)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexWrap: 'wrap' as const, gap: 6, background: '#0a0a0a', flexShrink: 0 },
    chip: { padding: '10px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  };

  return (
    <div style={s.screen}>
      <style>{`@keyframes bounce { 0%, 80%, 100% { transform: translateY(0); opacity: 0.4; } 40% { transform: translateY(-4px); opacity: 1; } }`}</style>
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => router.push(isNew ? '/library' : '/onboarding/profile')}>← Cancel</button>
        <div style={s.avatarRow}>
          <div style={s.avatar}>✦</div>
          <div>
            <div style={s.avatarName}>AI Coach</div>
            <div style={s.avatarSub}>Setting up your program · {step + 1}/{FLOW.length}</div>
          </div>
        </div>
        <div style={s.progressBar}><div style={s.progressFill} /></div>
      </div>

      <div style={s.chat} ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} style={m.role === 'bot' ? s.botBubble : s.userBubble}>{m.text}</div>
        ))}
        {typing && (
          <div style={s.typingRow}>
            {[0, 0.2, 0.4].map((delay, i) => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.6)', animation: `bounce 1.2s ${delay}s infinite` }} />
            ))}
          </div>
        )}
      </div>

      {isDaysStep ? (
        <DaysPicker onPick={pickDays} />
      ) : isBodyweightStep ? (
        <BodyweightPicker onPick={pickBodyweight} />
      ) : isEmphasisStep ? (
        <div style={{ ...s.chipBar, flexDirection: 'column' as const }}>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
            {FLOW.find(f => f.id === 'emphasis')!.chips.map((c, i) => {
              const isActive = emphasisSelected.includes(String(c.value));
              return (
                <button
                  key={i}
                  onClick={() => toggleEmphasis(String(c.value))}
                  style={{
                    padding: '10px 14px',
                    background: isActive ? '#a1f0c2' : 'rgba(255,255,255,0.07)',
                    border: isActive ? 'none' : '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 999,
                    color: isActive ? '#062b18' : '#fff',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {isActive && c.value !== 'none' ? '✓ ' : ''}{c.label}
                </button>
              );
            })}
          </div>
          {emphasisSelected.length > 0 && (
            <button
              onClick={commitEmphasis}
              style={{ marginTop: 8, height: 46, background: '#a1f0c2', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, color: '#062b18', cursor: 'pointer' }}
            >
              {emphasisSelected[0] === 'none' ? 'No preference — continue →' : `${emphasisSelected.length} area${emphasisSelected.length > 1 ? 's' : ''} selected — continue →`}
            </button>
          )}
        </div>
      ) : (
        <div style={s.chipBar}>
          {chips.map((c, i) => (
            <button key={i} style={s.chip} onClick={() => pick(c)}>{c.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function IntakePage() {
  return (
    <Suspense fallback={<div style={{ background: '#000', minHeight: '100svh' }} />}>
      <IntakePageInner />
    </Suspense>
  );
}
