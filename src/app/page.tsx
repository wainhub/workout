'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';

export default function Root() {
  const router = useRouter();
  const { state } = useStore();

  useEffect(() => {
    router.replace(state.isOnboarded ? '/home' : '/onboarding');
  }, [state.isOnboarded, router]);

  return null;
}
