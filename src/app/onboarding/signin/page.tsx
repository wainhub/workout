'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useStore } from '@/lib/store';

const AI_GRADIENT = 'linear-gradient(135deg, #ff7a59 0%, #e85d75 50%, #6ec3e8 100%)';

export default function SignInPage() {
  const router = useRouter();
  const { dispatch } = useStore();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendCode() {
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true },
      });
      if (error) setError(error.message);
      else setStep('code');
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const { data: { session }, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: 'email',
      });
      if (error || !session) {
        setError(error?.message ?? 'Invalid code. Please try again.');
        setLoading(false);
        return;
      }

      // Signed in — restore state or onboard
      const u = session.user;
      const emailVal = u.email ?? '';
      const name = u.user_metadata?.full_name ?? u.user_metadata?.name ?? emailVal.split('@')[0] ?? 'User';
      const user = { provider: 'email' as const, email: emailVal, name };

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase.from('user_state') as any)
          .select('state').eq('user_id', u.id).single();
        if (data?.state) {
          dispatch({ type: 'RESTORE_STATE', savedState: { ...data.state, user } });
          router.replace('/home');
          return;
        }
      } catch {}

      const saved = localStorage.getItem(`wain-workout-user-${emailVal}`);
      if (saved) {
        try {
          dispatch({ type: 'RESTORE_STATE', savedState: { ...JSON.parse(saved), user } });
          router.replace('/home');
          return;
        } catch {}
      }

      dispatch({ type: 'SIGN_IN', user });
      router.replace('/onboarding/profile');
    } catch {
      setError('Something went wrong. Try again.');
      setLoading(false);
    }
  }

  const s = {
    screen: {
      display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
      textAlign: 'center' as const,
      paddingTop: 'var(--top)', paddingLeft: 22, paddingRight: 22, paddingBottom: 'var(--bottom)',
      minHeight: '100svh', background: '#000', maxWidth: 480, margin: '0 auto',
    },
    logo: {
      width: 64, height: 64, borderRadius: 18, background: AI_GRADIENT,
      display: 'grid', placeItems: 'center' as const, fontSize: 28, color: '#fff', marginTop: 30,
    },
    title: { fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', marginTop: 28 },
    sub: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 8, lineHeight: 1.5, maxWidth: 280 },
    spacer: { flex: 1 },
    input: {
      width: '100%', height: 54, background: 'rgba(255,255,255,0.07)',
      border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12,
      fontSize: 16, color: '#fff', paddingLeft: 16, paddingRight: 16,
      outline: 'none', boxSizing: 'border-box' as const,
    },
    codeInput: {
      width: '100%', height: 64, background: 'rgba(255,255,255,0.07)',
      border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12,
      fontSize: 32, fontWeight: 700, color: '#fff', textAlign: 'center' as const,
      letterSpacing: '0.25em', outline: 'none', boxSizing: 'border-box' as const,
    },
    btn: {
      width: '100%', height: 54, background: '#a1f0c2', color: '#062b18',
      border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700,
      cursor: 'pointer', marginTop: 10,
    },
    error: { fontSize: 13, color: '#ff6b6b', marginTop: 8 },
    fine: { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 18, lineHeight: 1.5, maxWidth: 280 },
    backBtn: {
      background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)',
      fontSize: 13, cursor: 'pointer', marginTop: 16, padding: '8px 0',
    },
  };

  return (
    <div style={s.screen}>
      <div style={s.logo}>✦</div>
      <div style={s.title}>Sign in to continue</div>
      <div style={s.sub}>
        {step === 'email'
          ? "Enter your email and we'll send you a 6-digit code."
          : `Enter the code we sent to ${email}`}
      </div>
      <div style={s.spacer} />

      {step === 'email' ? (
        <>
          <input
            style={s.input}
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendCode()}
            autoComplete="email"
          />
          {error && <div style={s.error}>{error}</div>}
          <button style={s.btn} onClick={sendCode} disabled={loading}>
            {loading ? 'Sending…' : 'Send code →'}
          </button>
        </>
      ) : (
        <>
          <input
            style={s.codeInput}
            type="text"
            inputMode="numeric"
            placeholder="000000"
            maxLength={8}
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            onKeyDown={e => e.key === 'Enter' && verifyCode()}
            autoFocus
            autoComplete="one-time-code"
          />
          {error && <div style={s.error}>{error}</div>}
          <button style={s.btn} onClick={verifyCode} disabled={loading}>
            {loading ? 'Verifying…' : 'Sign in →'}
          </button>
          <button style={s.backBtn} onClick={() => { setStep('email'); setCode(''); setError(''); }}>
            ← Use a different email
          </button>
        </>
      )}

      <div style={s.fine}>By continuing you agree to our Terms of Service and Privacy Policy.</div>
    </div>
  );
}
