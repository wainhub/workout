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
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [editingBW, setEditingBW] = useState(false);
  const [bwInput, setBwInput] = useState('');
  const [bwUnit, setBwUnit] = useState<'lb' | 'kg'>('lb');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackState, setFeedbackState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div style={{ minHeight: '100svh', background: '#000' }} />;

  const user = state.user;
  const initials = user?.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';
  const totalSessions = state.history.length;
  const totalVolume = state.history.reduce((n, s) => n + s.totalVolume, 0);
  const totalSets = state.history.reduce((n, s) => n + s.totalSets, 0);

  async function submitFeedback() {
    if (!feedbackText.trim()) return;
    setFeedbackState('sending');
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({ message: feedbackText.trim() }),
      });
      if (res.ok) { setFeedbackState('sent'); setFeedbackText(''); }
      else setFeedbackState('error');
    } catch { setFeedbackState('error'); }
  }

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
        <div style={{ flex: 1, minWidth: 0 }}>
          {editingName ? (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                autoFocus
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const trimmed = nameInput.trim();
                    if (trimmed && user) dispatch({ type: 'SIGN_IN', user: { ...user, name: trimmed } });
                    setEditingName(false);
                  }
                  if (e.key === 'Escape') setEditingName(false);
                }}
                style={{ flex: 1, minWidth: 0, height: 36, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(161,240,194,0.4)', borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 700, padding: '0 10px', outline: 'none' }}
              />
              <button
                onClick={() => { const t = nameInput.trim(); if (t && user) dispatch({ type: 'SIGN_IN', user: { ...user, name: t } }); setEditingName(false); }}
                style={{ padding: '6px 10px', background: '#a1f0c2', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#062b18', cursor: 'pointer', flexShrink: 0 }}
              >Save</button>
              <button
                onClick={() => setEditingName(false)}
                style={{ padding: '6px 8px', background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8, fontSize: 12, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', flexShrink: 0 }}
              >✕</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={s.userName}>{user?.name ?? 'User'}</div>
              <button
                onClick={() => { setNameInput(user?.name ?? ''); setEditingName(true); }}
                style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 6, padding: '3px 7px', fontSize: 11, color: 'rgba(255,255,255,0.45)', cursor: 'pointer' }}
              >✎</button>
            </div>
          )}
          <div style={s.userEmail}>{user?.email ?? ''}</div>

          {/* Bodyweight */}
          {editingBW ? (
            <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginTop: 8 }}>
              <input
                autoFocus
                type="number"
                inputMode="decimal"
                value={bwInput}
                onChange={e => setBwInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const n = Number(bwInput);
                    if (n > 60 && n < 500 && user) {
                      const lb = bwUnit === 'kg' ? Math.round(n * 2.205) : n;
                      dispatch({ type: 'SIGN_IN', user: { ...user, bodyweight: lb } });
                    }
                    setEditingBW(false);
                  }
                  if (e.key === 'Escape') setEditingBW(false);
                }}
                placeholder={bwUnit === 'lb' ? '150' : '68'}
                style={{ width: 70, height: 32, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(161,240,194,0.4)', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700, padding: '0 8px', outline: 'none', fontVariantNumeric: 'tabular-nums' as const }}
              />
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 7, padding: 2, gap: 2 }}>
                {(['lb', 'kg'] as const).map(u => (
                  <button key={u} onClick={() => setBwUnit(u)} style={{ height: 26, width: 32, border: 'none', borderRadius: 6, background: bwUnit === u ? '#a1f0c2' : 'transparent', color: bwUnit === u ? '#062b18' : 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{u}</button>
                ))}
              </div>
              <button
                onClick={() => {
                  const n = Number(bwInput);
                  if (n > 60 && n < 500 && user) {
                    const lb = bwUnit === 'kg' ? Math.round(n * 2.205) : n;
                    dispatch({ type: 'SIGN_IN', user: { ...user, bodyweight: lb } });
                  }
                  setEditingBW(false);
                }}
                style={{ padding: '4px 8px', background: '#a1f0c2', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 700, color: '#062b18', cursor: 'pointer' }}
              >Save</button>
              <button onClick={() => setEditingBW(false)} style={{ padding: '4px 6px', background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 7, fontSize: 11, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>✕</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                {user?.bodyweight ? `${user.bodyweight} lb` : 'Bodyweight not set'}
              </span>
              <button
                onClick={() => { setBwInput(user?.bodyweight ? String(user.bodyweight) : ''); setBwUnit('lb'); setEditingBW(true); }}
                style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 6, padding: '2px 6px', fontSize: 10, color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
              >✎</button>
            </div>
          )}

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

      <div style={s.section}>Feedback</div>
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 16 }}>
        {feedbackState === 'sent' ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🙏</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Thanks for the feedback!</div>
            <button onClick={() => setFeedbackState('idle')} style={{ marginTop: 10, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer' }}>Send more</button>
          </div>
        ) : (
          <>
            <textarea
              value={feedbackText}
              onChange={e => { setFeedbackText(e.target.value); setFeedbackState('idle'); }}
              placeholder="Bug report, feature idea, or anything on your mind…"
              rows={3}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 14, padding: 12, resize: 'none', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.5 }}
            />
            {feedbackState === 'error' && <div style={{ fontSize: 12, color: '#ff6b6b', marginTop: 6 }}>Failed to send — try again.</div>}
            <button
              onClick={submitFeedback}
              disabled={feedbackState === 'sending' || !feedbackText.trim()}
              style={{ marginTop: 10, width: '100%', height: 42, background: feedbackText.trim() ? 'rgba(161,240,194,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${feedbackText.trim() ? 'rgba(161,240,194,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10, color: feedbackText.trim() ? '#a1f0c2' : 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 600, cursor: feedbackText.trim() ? 'pointer' : 'default' }}
            >
              {feedbackState === 'sending' ? 'Sending…' : 'Send feedback'}
            </button>
          </>
        )}
      </div>

      <div style={s.section}>Account</div>

      {['wain@kellum.net', 'wain_kellum@hotmail.com'].includes(user?.email ?? '') && (
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
            Sign out? Your data is saved to the cloud — sign back in any time to pick up where you left off.
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
