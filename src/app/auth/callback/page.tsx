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

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        const provider = (u.app_metadata?.provider ?? 'google') as 'apple' | 'google';
        const email = u.email ?? '';
        const name = u.user_metadata?.full_name ?? u.user_metadata?.name ?? email.split('@')[0] ?? 'User';

        // Check for saved state for this user
        const saved = localStorage.getItem(`wain-workout-user-${email}`);
        if (saved) {
          try {
            const savedState = JSON.parse(saved);
            dispatch({ type: 'RESTORE_STATE', savedState: { ...savedState, user: { provider, email, name } } });
            router.replace('/home');
            return;
          } catch {}
        }

        dispatch({ type: 'SIGN_IN', user: { provider, email, name } });
        router.replace('/onboarding/profile');
      } else {
        router.replace('/onboarding/signin');
      }
    });
  }, [dispatch, router]);

  return (
    <div style={{ minHeight: '100svh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Signing in…</div>
    </div>
  );
}
