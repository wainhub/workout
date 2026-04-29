'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase';

const AI_GRADIENT = 'linear-gradient(135deg, #ff7a59 0%, #e85d75 50%, #6ec3e8 100%)';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendMagicLink() {
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
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
    btn: {
      width: '100%', height: 54, background: '#a1f0c2', color: '#062b18',
      border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700,
      cursor: 'pointer', marginTop: 10,
    },
    sentBox: {
      width: '100%', padding: '20px 16px', background: 'rgba(161,240,194,0.08)',
      border: '1px solid rgba(161,240,194,0.2)', borderRadius: 14,
      textAlign: 'center' as const,
    },
    error: { fontSize: 13, color: '#ff6b6b', marginTop: 8 },
    fine: { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 18, lineHeight: 1.5, maxWidth: 280 },
  };

  return (
    <div style={s.screen}>
      <div style={s.logo}>✦</div>
      <div style={s.title}>Sign in to continue</div>
      <div style={s.sub}>Enter your email and we'll send you a magic link — no password needed.</div>
      <div style={s.spacer} />

      {sent ? (
        <div style={s.sentBox}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📬</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Check your email</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
            We sent a magic link to <strong>{email}</strong>. Tap it to sign in.
          </div>
          <button
            style={{ ...s.btn, background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', marginTop: 16, fontSize: 13 }}
            onClick={() => setSent(false)}
          >
            Use a different email
          </button>
        </div>
      ) : (
        <>
          <input
            style={s.input}
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMagicLink()}
            autoComplete="email"
          />
          {error && <div style={s.error}>{error}</div>}
          <button style={s.btn} onClick={sendMagicLink} disabled={loading}>
            {loading ? 'Sending…' : 'Send magic link →'}
          </button>
        </>
      )}

      <div style={s.fine}>By continuing you agree to our Terms of Service and Privacy Policy.</div>
    </div>
  );
}
