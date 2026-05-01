'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';

type Seg = { label: string; value: string }[];

function Segmented({ options, value, onChange }: { options: Seg; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 12 }}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            flex: 1, height: 40,
            background: value === opt.value ? '#a1f0c2' : 'transparent',
            color: value === opt.value ? '#062b18' : 'rgba(255,255,255,0.7)',
            border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { state, dispatch } = useStore();
  const [name, setName] = useState(state.user?.name ?? '');
  const [sex, setSex] = useState('');
  const [experience, setExperience] = useState('');
  const [birthday, setBirthday] = useState('');

  const canContinue = name.trim() && sex && experience;

  const s = {
    screen: { paddingTop: 'var(--top)', paddingLeft: 22, paddingRight: 22, paddingBottom: 'var(--bottom)', minHeight: '100svh', background: '#000', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column' as const },
    kicker: { fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', color: '#a1f0c2', textTransform: 'uppercase' as const, marginTop: 8 },
    title: { fontSize: 26, fontWeight: 700, letterSpacing: '-0.025em', marginTop: 4 },
    sub: { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 6 },
    scroll: { flex: 1, overflowY: 'auto' as const, marginTop: 8 },
    label: { fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' as const, marginTop: 20, marginBottom: 8, display: 'block' },
    input: {
      width: '100%', height: 50, background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
      color: '#fff', fontSize: 16, padding: '0 14px', outline: 'none',
    } as const,
    primaryBtn: {
      width: '100%', height: 54, background: canContinue ? '#a1f0c2' : 'rgba(255,255,255,0.15)',
      color: canContinue ? '#062b18' : 'rgba(255,255,255,0.4)',
      border: 'none', borderRadius: 27, fontSize: 16, fontWeight: 700,
      cursor: canContinue ? 'pointer' : 'not-allowed', marginTop: 24,
    },
  };

  function next() {
    if (!canContinue) return;
    dispatch({ type: 'SIGN_IN', user: { ...state.user!, name: name.trim() } });
    // Carry gender into intakeAnswers so the AI receives it
    dispatch({ type: 'SET_INTAKE_ANSWERS', answers: { ...(state.intakeAnswers ?? {}), gender: sex } });
    router.push('/onboarding/intake');
  }

  return (
    <div style={s.screen}>
      <div style={s.kicker}>STEP 1 OF 1</div>
      <div style={s.title}>About you</div>
      <div style={s.sub}>Helps your AI coach build a better program.</div>

      <div style={s.scroll}>
        <label style={s.label}>Name</label>
        <input
          style={s.input}
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <label style={s.label}>Gender</label>
        <Segmented
          options={[{ label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }, { label: 'Other', value: 'other' }]}
          value={sex}
          onChange={setSex}
        />

        <label style={s.label}>Experience</label>
        <Segmented
          options={[{ label: 'Beginner', value: 'beginner' }, { label: 'Intermediate', value: 'intermediate' }, { label: 'Advanced', value: 'advanced' }]}
          value={experience}
          onChange={setExperience}
        />

        <label style={s.label}>Birthday (optional)</label>
        <input
          style={{ ...s.input, colorScheme: 'dark' }}
          type="date"
          value={birthday}
          onChange={e => setBirthday(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
        />
      </div>

      <button style={s.primaryBtn} onClick={next} disabled={!canContinue}>
        Continue
      </button>
    </div>
  );
}
