'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useStore } from '@/lib/store';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { dispatch } = useStore();

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        router.replace('/onboarding/signin');
        return;
      }

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
    });
  }, [dispatch, router]);

  return (
    <div style={{ minHeight: '100svh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Signing in…</div>
    </div>
  );
}
