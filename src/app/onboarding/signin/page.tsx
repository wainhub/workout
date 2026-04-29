'use client';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

const AI_GRADIENT = 'linear-gradient(135deg, #ff7a59 0%, #e85d75 50%, #6ec3e8 100%)';

export default function SignInPage() {
  const router = useRouter();

  async function signIn(provider: 'apple' | 'google') {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error('OAuth error:', error.message);
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
    appleBtn: {
      width: '100%', height: 54, background: '#fff', color: '#000',
      border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    googleBtn: {
      width: '100%', height: 54, background: '#fff', color: '#000',
      border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 500, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10,
    },
    fine: { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 18, lineHeight: 1.5, maxWidth: 280 },
  };

  return (
    <div style={s.screen}>
      <div style={s.logo}>✦</div>
      <div style={s.title}>Sign in to continue</div>
      <div style={s.sub}>We use it to sync your programs across devices and back up your history.</div>
      <div style={s.spacer} />
      <button style={s.appleBtn} onClick={() => signIn('apple')}>
        <span style={{ fontSize: 20, lineHeight: 1, fontWeight: 700 }}></span>
        Sign in with Apple
      </button>
      <button style={s.googleBtn} onClick={() => signIn('google')}>
        <span style={{ fontSize: 18, fontWeight: 700 }}>G</span>
        Sign in with Google
      </button>
      <div style={s.fine}>By continuing you agree to our Terms of Service and Privacy Policy.</div>
    </div>
  );
}
