'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useStore } from '@/lib/store';
import type { Session } from '@supabase/supabase-js';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { dispatch } = useStore();

  useEffect(() => {
    const supabase = createClient();

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

    // Path A: PKCE flow — Supabase puts a ?code= in the URL
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data: { session }, error }) => {
        if (session) handleSession(session);
        else {
          console.error('PKCE exchange failed', error);
          router.replace('/onboarding/signin');
        }
      });
      return;
    }

    // Path B: Implicit flow — hash tokens handled automatically by Supabase client
    // onAuthStateChange fires SIGNED_IN once the hash is processed
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        handleSession(session);
      }
    });

    // Path C: Session already exists (e.g. page refresh, token already exchanged)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) handleSession(session);
    });

    // Fallback timeout — if nothing fires after 5s, send to sign-in
    const timeout = setTimeout(() => {
      router.replace('/onboarding/signin');
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [dispatch, router]);

  return (
    <div style={{ minHeight: '100svh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Signing in…</div>
    </div>
  );
}
