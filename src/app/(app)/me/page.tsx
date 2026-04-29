'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { createClient } from '@/lib/supabase';

const AI_GRADIENT = 'linear-gradient(135deg, #ff7a59 0%, #e85d75 50%, #6ec3e8 100%)';

export default function MePage() {
  const router = useRouter();
  const { state, dispatch } = useStore();
  const [mounted, setMounted] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div style={{ minHeight: '100svh', background: '#000' }} />;

  const user = state.user;
  const initials = user?.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';
  const totalSessions = state.history.length;
  const totalVolume = state.history.reduce((n, s) => n + s.totalVolume, 0);
  const totalSets = state.history.reduce((n, s) => n + s.totalSets, 0);

  async function signOut() {
    if (state.user?.email) {
      localStorage.setItem(`wain-workout-user-${state.user.email}`, JSON.stringify(state));
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    dispatch({ type: 'SIGN_OUT' });
    router.replace('/onboarding/signin');
  }

  const s = {
    screen: { paddingTop: 'var(--top)', paddingLeft: 16, paddingRight: 16 },
    title: { fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', marginBottom: 24 },
    profileCard: {
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 18, padding: 20, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16,
    },
    avatar: {
      width: 56, height: 56, borderRadius: '50%', background: AI_GRADIENT,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 20, fontWeight: 700, color: '#fff', flexShrink: 0,
    },
    userName: { fontSize: 18, fontWeight: 700 },
    userEmail: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
    providerBadge: {
      display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6,
      padding: '3px 9px', background: 'rgba(255,255,255,0.07)', borderRadius: 999,
      fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.55)',
    },
    statsCard: {
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16,
    },
    stat: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 10px', textAlign: 'center' as const },
    statLabel: { fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.4)', marginBottom: 4 },
    statVal: { fontSize: 20, fontWeight: 800, fontVariantNumeric: 'tabular-nums' as const },
    statUnit: { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
    section: { fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as const, marginBottom: 8, marginTop: 24 },
    row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, marginBottom: 8 },
    rowLabel: { fontSize: 14, fontWeight: 600 },
    rowValue: { fontSize: 13, color: 'rgba(255,255,255,0.45)' },
    signOutBtn: { width: '100%', padding: '16px 0', background: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: 14, fontSize: 15, fontWeight: 700, color: '#ff6b6b', cursor: 'pointer', marginTop: 8 },
    confirmCard: { background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: 14, padding: 16, marginTop: 8 },
    confirmText: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 14, lineHeight: 1.4 },
    confirmRow: { display: 'flex', gap: 10 },
    cancelBtn: { flex: 1, padding: '12px 0', background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 999, fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer' },
    confirmBtn: { flex: 1, padding: '12px 0', background: 'rgba(255,80,80,0.25)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: 999, fontSize: 14, fontWeight: 700, color: '#ff6b6b', cursor: 'pointer' },
  };

  return (
    <div style={s.screen}>
      <div style={s.title}>Account</div>

      <div style={s.profileCard}>
        <div style={s.avatar}>{initials}</div>
        <div>
          <div style={s.userName}>{user?.name ?? 'User'}</div>
          <div style={s.userEmail}>{user?.email ?? ''}</div>
          {user?.provider && user.provider !== 'email' && (
            <div style={s.providerBadge}>
              {user.provider === 'apple' ? '🍎 Apple' : 'G Google'}
            </div>
          )}
        </div>
      </div>

      <div style={s.statsCard}>
        <div style={s.stat}>
          <div style={s.statLabel}>Sessions</div>
          <div style={s.statVal}>{totalSessions}</div>
        </div>
        <div style={s.stat}>
          <div style={s.statLabel}>Sets</div>
          <div style={s.statVal}>{totalSets}</div>
        </div>
        <div style={s.stat}>
          <div style={s.statLabel}>Volume</div>
          <div style={s.statVal}>{totalVolume >= 1000 ? `${Math.round(totalVolume / 1000)}k` : totalVolume}</div>
          <div style={s.statUnit}>lb total</div>
        </div>
      </div>

      <div style={s.section}>Program</div>
      <div style={s.row}>
        <div style={s.rowLabel}>Active programs</div>
        <div style={s.rowValue}>{state.programs.length}</div>
      </div>
      <div style={s.row}>
        <div style={s.rowLabel}>Sessions logged</div>
        <div style={s.rowValue}>{totalSessions}</div>
      </div>

      <div style={s.section}>Account</div>

      {user?.email === 'wain@kellum.net' && (
        <div
          style={{ ...s.row, cursor: 'pointer' }}
          onClick={() => router.push('/admin')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>🛡</span>
            <div style={s.rowLabel}>Admin Panel</div>
          </div>
          <div style={s.rowValue}>›</div>
        </div>
      )}

      {confirmSignOut ? (
        <div style={s.confirmCard}>
          <div style={s.confirmText}>
            Sign out? Your data stays on this device — sign back in any time to continue.
          </div>
          <div style={s.confirmRow}>
            <button style={s.cancelBtn} onClick={() => setConfirmSignOut(false)}>Cancel</button>
            <button style={s.confirmBtn} onClick={signOut}>Sign out</button>
          </div>
        </div>
      ) : (
        <button style={s.signOutBtn} onClick={() => setConfirmSignOut(true)}>Sign out</button>
      )}
    </div>
  );
}
