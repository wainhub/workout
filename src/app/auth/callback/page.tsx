'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useStore } from '@/lib/store';
import type { Session } from '@supabase/supabase-js';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { dispatch } = useStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Check for error in URL hash (e.g. expired link)
    const hash = window.location.hash;
    const hashParams = new URLSearchParams(hash.slice(1));
    const errorCode = hashParams.get('error_code');
    if (errorCode) {
      if (errorCode === 'otp_expired') {
        setError('This link has expired. Please request a new one.');
      } else {
        setError(`Sign-in failed: ${hashParams.get('error_description')?.replace(/\+/g, ' ') ?? errorCode}`);
      }
      return;
    }

    async function handleSession(session: Session) {
      const u = session.user;
      const rawProvider = u.app_metadata?.provider ?? 'email';
      const provider = (rawProvider === 'apple' ? 'apple' : rawProvider === 'google' ? 'google' : 'email') as 'apple' | 'google' | 'email';
      const email = u.email ?? '';
      const name = u.user_metadata?.full_name ?? u.user_metadata?.name ?? email.split('@')[0] ?? 'User';

      // 1. Try Supabase cloud state first (works on any device)
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase.from('user_state') as any)
          .select('state')
          .eq('user_id', u.id)
          .single();

        if (data?.state) {
          dispatch({ type: 'RESTORE_STATE', savedState: { ...data.state, user: { provider, email, name } } });
          router.replace('/home');
          return;
        }
      } catch {}

      // 2. Fall back to localStorage snapshot (same device, legacy)
      const saved = localStorage.getItem(`wain-workout-user-${email}`);
      if (saved) {
        try {
          const savedState = JSON.parse(saved);
          dispatch({ type: 'RESTORE_STATE', savedState: { ...savedState, user: { provider, email, name } } });
          router.replace('/home');
          return;
        } catch {}
      }

      // 3. Brand new user — go to onboarding
      dispatch({ type: 'SIGN_IN', user: { provider, email, name } });
      router.replace('/onboarding/profile');
    }

    // Path A: PKCE flow — ?code= in URL
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data: { session }, error }) => {
        if (session) handleSession(session);
        else setError(error?.message ?? 'Sign-in failed. Please try again.');
      });
      return;
    }

    // Path B: onAuthStateChange — implicit flow hash tokens
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) handleSession(session);
    });

    // Path C: Session already exists
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) handleSession(session);
    });

    // Fallback timeout
    const timeout = setTimeout(() => {
      router.replace('/onboarding/signin');
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [dispatch, router]);

  if (error) {
    return (
      <div style={{ minHeight: '100svh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⚠️</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8, textAlign: 'center' }}>Link expired</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 32, textAlign: 'center', maxWidth: 300 }}>{error}</div>
        <button
          onClick={() => router.replace('/onboarding/signin')}
          style={{ padding: '14px 28px', background: '#a1f0c2', color: '#062b18', border: 'none', borderRadius: 999, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
        >
          Send a new link
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100svh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Signing in…</div>
    </div>
  );
}
