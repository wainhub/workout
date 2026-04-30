'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useStore } from '@/lib/store';

const AI_GRADIENT = 'linear-gradient(135deg, #ff7a59 0%, #e85d75 50%, #6ec3e8 100%)';

export default function SignInPage() {
  const router = useRouter();
  const { dispatch } = useStore();
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState('');

  async function signInWithGoogle() {
    setGoogleLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) { setError(error.message); setGoogleLoading(false); }
    } catch {
      setError('Something went wrong. Try again.');
      setGoogleLoading(false);
    }
  }

  async function signInWithApple() {
    setAppleLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) { setError(error.message); setAppleLoading(false); }
    } catch {
      setError('Something went wrong. Try again.');
      setAppleLoading(false);
    }
  }

  async function sendCode() {
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
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
    googleBtn: {
      width: '100%', height: 54, background: '#fff', color: '#1f1f1f',
      border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600,
      cursor: googleLoading ? 'default' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      opacity: googleLoading ? 0.7 : 1,
    },
    appleBtn: {
      width: '100%', height: 54, background: '#000', color: '#fff',
      border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, fontSize: 15, fontWeight: 600,
      cursor: appleLoading ? 'default' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      opacity: appleLoading ? 0.7 : 1, marginTop: 10,
    },
    divider: {
      display: 'flex', alignItems: 'center', gap: 12, width: '100%', margin: '18px 0',
    },
    dividerLine: { flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' },
    dividerText: { fontSize: 12, color: 'rgba(255,255,255,0.3)', flexShrink: 0 },
    emailToggle: {
      background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: 12, color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 500,
      cursor: 'pointer', width: '100%', height: 48, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
    },
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
        {!showEmail
          ? 'Sign in to track your workouts and sync across devices.'
          : step === 'email'
            ? "Enter your email — we'll send a sign-in link."
            : `We sent a sign-in link to ${email}. Or enter the code below.`}
      </div>
      <div style={s.spacer} />

      {!showEmail ? (
        <>
          {/* Apple sign-in */}
          <button style={s.appleBtn} onClick={signInWithApple} disabled={appleLoading}>
            <svg width="18" height="20" viewBox="0 0 814 1000" fill="#fff">
              <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-155.5-127.4C46.7 790.7 0 663 0 541.8c0-207.1 134.3-316.7 266.1-316.7 103.9 0 174.6 55.1 220.2 55.1 43.5 0 124.4-60.4 211.4-60.4zm-127.4-161.2c26.1-31.3 44.6-74.7 44.6-118.1 0-6.1-.5-12.2-1.6-17.2-42.3 1.6-92.4 28.3-122.8 62.9-21.8 24.4-43.8 67.7-43.8 111.8 0 6.7 1.1 13.4 1.6 15.5 2.7.6 7.2 1.6 11.8 1.6 37.9 0 86.2-25.4 110.2-56.5z"/>
            </svg>
            {appleLoading ? 'Redirecting…' : 'Continue with Apple'}
          </button>

          {/* Google sign-in */}
          <button style={s.googleBtn} onClick={signInWithGoogle} disabled={googleLoading}>
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            {googleLoading ? 'Redirecting…' : 'Continue with Google'}
          </button>

          <div style={s.divider}>
            <div style={s.dividerLine} />
            <div style={s.dividerText}>or</div>
            <div style={s.dividerLine} />
          </div>

          <button style={s.emailToggle} onClick={() => setShowEmail(true)}>
            Continue with email
          </button>

          {error && <div style={s.error}>{error}</div>}
        </>
      ) : step === 'email' ? (
        <>
          <input
            style={s.input}
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendCode()}
            autoComplete="email"
            autoFocus
          />
          {error && <div style={s.error}>{error}</div>}
          <button style={s.btn} onClick={sendCode} disabled={loading}>
            {loading ? 'Sending…' : 'Send code →'}
          </button>
          <button style={s.backBtn} onClick={() => { setShowEmail(false); setError(''); }}>
            ← Back
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
