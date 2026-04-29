'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useStore } from '@/lib/store';
import type { Session } from '@supabase/supabase-js';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { dispatch } = useStore();
  const [debug, setDebug] = useState('Loading…');

  useEffect(() => {
    const supabase = createClient();

    // Show debug info immediately
    const hash = window.location.hash;
    const search = window.location.search;
    setDebug(`hash: ${hash.slice(0, 80) || '(none)'} | search: ${search.slice(0, 80) || '(none)'}`);

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
    const code = new URLSearchParams(search).get('code');
    if (code) {
      setDebug(`PKCE code found, exchanging…`);
      supabase.auth.exchangeCodeForSession(code).then(({ data: { session }, error }) => {
        if (session) {
          setDebug(`PKCE exchange OK — routing…`);
          handleSession(session);
        } else {
          setDebug(`PKCE exchange FAILED: ${error?.message}`);
          setTimeout(() => router.replace('/onboarding/signin'), 3000);
        }
      });
      return;
    }

    // Path B: onAuthStateChange — implicit flow hash tokens
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setDebug(prev => prev + ` | event: ${event}`);
      if (event === 'SIGNED_IN' && session) {
        setDebug(`SIGNED_IN — routing…`);
        handleSession(session);
      }
    });

    // Path C: Session already exists
    supabase.auth.getSession().then(({ data: { session } }) => {
      setDebug(prev => prev + ` | getSession: ${session ? 'HAS SESSION' : 'null'}`);
      if (session) {
        handleSession(session);
      }
    });

    // Fallback timeout
    const timeout = setTimeout(() => {
      setDebug(prev => prev + ' | TIMEOUT — no session found');
      // Don't auto-redirect — show debug info instead
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [dispatch, router]);

  return (
    <div style={{ minHeight: '100svh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>Signing in…</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', wordBreak: 'break-all', maxWidth: 500, textAlign: 'center', lineHeight: 1.6 }}>{debug}</div>
    </div>
  );
}
