'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { createClient } from '@/lib/supabase';

export default function Root() {
  const router = useRouter();
  const { state, dispatch } = useStore();

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        // Live session exists — ensure app state is loaded
        if (state.isOnboarded) {
          // localStorage has their state — go straight in
          router.replace('/home');
          return;
        }

        // localStorage was cleared or this is a new device — restore from Supabase
        const u = session.user;
        const email = u.email ?? '';
        const name = u.user_metadata?.full_name ?? u.user_metadata?.name ?? email.split('@')[0] ?? 'User';
        const raw = u.app_metadata?.provider ?? 'email';
        const provider = (raw === 'apple' ? 'apple' : raw === 'google' ? 'google' : 'email') as 'apple' | 'google' | 'email';

        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data } = await (supabase.from('user_state') as any)
            .select('state').eq('user_id', u.id).single();

          if (data?.state) {
            dispatch({ type: 'RESTORE_STATE', savedState: { ...data.state, user: { provider, email, name } } });
            router.replace('/home');
            return;
          }
        } catch {}

        // Session exists but no saved state — they're mid-onboarding or brand new
        dispatch({ type: 'SIGN_IN', user: { provider, email, name } });
        router.replace('/onboarding/profile');

      } else {
        // No active session
        if (state.isOnboarded) {
          // They have local state but session expired — send to sign-in to re-auth
          // (state will be preserved in localStorage, restored after they sign in)
          router.replace('/onboarding/signin');
        } else {
          router.replace('/onboarding/signin');
        }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
