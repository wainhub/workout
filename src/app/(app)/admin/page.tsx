'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { createClient } from '@/lib/supabase';
import { apiUrl } from '@/lib/api';

const ADMIN_EMAILS = ['wain@kellum.net', 'wain_kellum@hotmail.com'];
const GREEN = '#a1f0c2';

interface SupabaseUser {
  id: string;
  email?: string;
  created_at: string;
  last_sign_in_at?: string;
}

interface FeedbackItem {
  id: string;
  email: string;
  message: string;
  created_at: string;
}

interface UserDetail {
  user: SupabaseUser;
  appState: {
    user?: { name?: string; bodyweight?: number };
    intakeAnswers?: {
      goal?: string; experience?: string; gender?: string;
      bodyweight?: number; days?: number; session?: number;
      equipment?: string; emphasis?: string; injuries?: string;
    };
    programs?: { id: string; name: string; goal: string; weeksCompleted?: number; daysCompleted?: number; createdAt?: string }[];
    history?: { id: string }[];
  } | null;
  stateUpdatedAt: string | null;
}

function fmtDate(iso: string | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function fmtDateShort(iso: string | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function isThisWeek(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

function DetailRow({ label, value }: { label: string; value: string | number | undefined }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div style={{ display: 'flex', gap: 10, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', width: 110, flexShrink: 0, paddingTop: 1 }}>{label}</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.78)', wordBreak: 'break-word' as const }}>{String(value)}</div>
    </div>
  );
}

function UserDetailPanel({ detail }: { detail: UserDetail }) {
  const { user, appState, stateUpdatedAt } = detail;
  const intake = appState?.intakeAnswers;
  const programs = appState?.programs ?? [];
  const activeProgram = programs[0];
  const sessionCount = appState?.history?.length ?? 0;
  const bw = appState?.user?.bodyweight ?? intake?.bodyweight;

  return (
    <div style={{ padding: '14px 16px', background: 'rgba(161,240,194,0.04)', borderTop: '1px solid rgba(161,240,194,0.1)' }}>
      {/* Account info */}
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const, marginBottom: 8 }}>Account</div>
      <DetailRow label="User ID" value={user.id} />
      <DetailRow label="Created" value={fmtDate(user.created_at)} />
      <DetailRow label="Last login" value={fmtDate(user.last_sign_in_at)} />
      <DetailRow label="State updated" value={stateUpdatedAt ? fmtDate(stateUpdatedAt) : undefined} />

      {/* Profile */}
      {appState?.user?.name && (
        <>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const, marginTop: 14, marginBottom: 8 }}>Profile</div>
          <DetailRow label="Name" value={appState.user.name} />
          {bw && <DetailRow label="Bodyweight" value={`${bw} lb`} />}
          {intake?.gender && <DetailRow label="Gender" value={intake.gender} />}
        </>
      )}

      {/* Intake */}
      {intake && (
        <>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const, marginTop: 14, marginBottom: 8 }}>Intake</div>
          <DetailRow label="Goal" value={intake.goal} />
          <DetailRow label="Experience" value={intake.experience} />
          <DetailRow label="Equipment" value={intake.equipment} />
          <DetailRow label="Days / week" value={intake.days} />
          <DetailRow label="Session length" value={intake.session ? `${intake.session} min` : undefined} />
          <DetailRow label="Emphasis" value={intake.emphasis} />
          <DetailRow label="Injuries" value={intake.injuries} />
        </>
      )}

      {/* Program */}
      {activeProgram && (
        <>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const, marginTop: 14, marginBottom: 8 }}>
            Program{programs.length > 1 ? ` (${programs.length} total)` : ''}
          </div>
          <DetailRow label="Name" value={activeProgram.name} />
          <DetailRow label="Goal" value={activeProgram.goal} />
          <DetailRow label="Created" value={activeProgram.createdAt ? fmtDateShort(activeProgram.createdAt) : undefined} />
          <DetailRow label="Weeks done" value={activeProgram.weeksCompleted} />
          <DetailRow label="Days done" value={activeProgram.daysCompleted} />
        </>
      )}

      {/* History */}
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const, marginTop: 14, marginBottom: 8 }}>Activity</div>
      <DetailRow label="Sessions logged" value={sessionCount} />

      {!appState && (
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', marginTop: 4 }}>No app state saved yet.</div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { state } = useStore();
  const user = state.user;
  const [tab, setTab] = useState<'users' | 'feedback'>('users');
  const [users, setUsers] = useState<SupabaseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, UserDetail>>({});
  const [detailLoading, setDetailLoading] = useState<string | null>(null);

  async function getToken() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }

  async function fetchUsers() {
    try {
      const token = await getToken();
      if (!token) { setError('No active session — please sign in again.'); setLoading(false); return; }
      const res = await fetch(apiUrl('/api/admin/users'), { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const b = await res.json().catch(() => ({})); setError(b.error ?? `Request failed (${res.status})`); setLoading(false); return; }
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function fetchDetail(userId: string) {
    if (detailCache[userId]) return;
    setDetailLoading(userId);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(apiUrl(`/api/admin/users/detail?userId=${userId}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setDetailCache(prev => ({ ...prev, [userId]: d }));
      }
    } finally {
      setDetailLoading(null);
    }
  }

  async function toggleUser(userId: string) {
    if (expandedId === userId) {
      setExpandedId(null);
    } else {
      setExpandedId(userId);
      fetchDetail(userId);
    }
  }

  async function deleteUser(userId: string) {
    setDeleting(true);
    try {
      const token = await getToken();
      if (!token) { setError('No active session.'); return; }
      const res = await fetch(apiUrl('/api/admin/users'), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); setError(b.error ?? 'Delete failed'); return; }
      setUsers(prev => prev.filter(u => u.id !== userId));
      setConfirmDeleteId(null);
      if (expandedId === userId) setExpandedId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  async function fetchFeedback() {
    setFeedbackLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(apiUrl('/api/admin/feedback'), { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setFeedback(d.feedback ?? []); }
    } finally { setFeedbackLoading(false); }
  }

  async function deleteFeedback(id: string) {
    const token = await getToken();
    if (!token) return;
    await fetch(apiUrl('/api/admin/feedback'), {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setFeedback(prev => prev.filter(f => f.id !== id));
  }

  useEffect(() => {
    if (!ADMIN_EMAILS.includes(user?.email ?? '')) return;
    fetchUsers();
    fetchFeedback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  const s = {
    screen: { paddingTop: 'var(--top, 20px)', paddingLeft: 16, paddingRight: 16, paddingBottom: 32 },
    title: { fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', marginBottom: 8 },
    subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 },
    statsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 },
    card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 12px', textAlign: 'center' as const },
    cardLabel: { fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.4)', marginBottom: 6 },
    cardVal: { fontSize: 26, fontWeight: 800, color: GREEN },
    tabRow: { display: 'flex', gap: 8, marginBottom: 20 },
    tabBtn: (active: boolean) => ({ padding: '8px 18px', borderRadius: 999, border: 'none', background: active ? GREEN : 'rgba(255,255,255,0.08)', color: active ? '#062b18' : 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }),
    sectionLabel: { fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as const, marginBottom: 10 },
    tableCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' },
    denied: { textAlign: 'center' as const, paddingTop: 80, fontSize: 16, color: 'rgba(255,255,255,0.5)' },
    loadingBox: { textAlign: 'center' as const, paddingTop: 60, color: 'rgba(255,255,255,0.4)', fontSize: 14 },
    errorBox: { background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: 14, padding: 16, fontSize: 13, color: '#ff8a8a' },
  };

  if (!ADMIN_EMAILS.includes(user?.email ?? '')) {
    return <div style={s.screen}><div style={s.denied}>Access denied.</div></div>;
  }

  const totalUsers = users.length;
  const signupsThisWeek = users.filter(u => isThisWeek(u.created_at)).length;
  const signupsToday = users.filter(u => isToday(u.created_at)).length;

  return (
    <div style={s.screen}>
      <div style={s.title}>Admin</div>
      <div style={s.subtitle}>User overview</div>

      <div style={s.tabRow}>
        <button style={s.tabBtn(tab === 'users')} onClick={() => setTab('users')}>Users</button>
        <button style={s.tabBtn(tab === 'feedback')} onClick={() => setTab('feedback')}>
          Feedback {feedback.length > 0 ? `(${feedback.length})` : ''}
        </button>
      </div>

      {tab === 'feedback' ? (
        feedbackLoading ? <div style={s.loadingBox}>Loading…</div> : feedback.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14, padding: '40px 0' }}>No feedback yet.</div>
        ) : (
          <div style={s.tableCard}>
            {feedback.map((f, i) => (
              <div key={f.id} style={{ padding: '14px 16px', borderBottom: i === feedback.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: GREEN }}>{f.email}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{fmtDate(f.created_at)}</div>
                  </div>
                  <button onClick={() => deleteFeedback(f.id)} style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: 6, padding: '4px 9px', color: '#ff6b6b', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>Delete</button>
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.55, color: 'rgba(255,255,255,0.85)', whiteSpace: 'pre-wrap' }}>{f.message}</div>
              </div>
            ))}
          </div>
        )
      ) : loading ? (
        <div style={s.loadingBox}>Loading...</div>
      ) : error ? (
        <div style={s.errorBox}>{error}</div>
      ) : (
        <>
          <div style={s.statsRow}>
            <div style={s.card}>
              <div style={s.cardLabel}>Total</div>
              <div style={s.cardVal}>{totalUsers}</div>
            </div>
            <div style={s.card}>
              <div style={s.cardLabel}>This week</div>
              <div style={s.cardVal}>{signupsThisWeek}</div>
            </div>
            <div style={s.card}>
              <div style={s.cardLabel}>Today</div>
              <div style={s.cardVal}>{signupsToday}</div>
            </div>
          </div>

          <div style={s.sectionLabel}>All users</div>
          <div style={s.tableCard}>
            {users.length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>No users yet.</div>
            )}
            {users.map((u, i) => {
              const isExpanded = expandedId === u.id;
              const isLast = i === users.length - 1;
              const detail = detailCache[u.id];
              const isLoadingDetail = detailLoading === u.id;

              return (
                <div key={u.id} style={{ borderBottom: isLast && !isExpanded ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
                  {/* Main row — clickable to expand */}
                  <div
                    onClick={() => toggleUser(u.id)}
                    style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10, padding: '12px 14px', cursor: 'pointer', userSelect: 'none' as const }}
                  >
                    {/* Chevron */}
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0, width: 14 }}>▶</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{u.email ?? '(no email)'}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                        Signed up {fmtDate(u.created_at)}
                        {u.last_sign_in_at ? ` · Last seen ${fmtDate(u.last_sign_in_at)}` : ''}
                      </div>
                    </div>
                    {!ADMIN_EMAILS.includes(u.email ?? '') && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(confirmDeleteId === u.id ? null : u.id); }}
                        style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: 8, padding: '5px 10px', color: '#ff6b6b', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
                      >
                        Delete
                      </button>
                    )}
                  </div>

                  {/* Delete confirm */}
                  {confirmDeleteId === u.id && (
                    <div style={{ padding: '10px 14px', background: 'rgba(255,80,80,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderTop: '1px solid rgba(255,80,80,0.12)' }}>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Delete {u.email} and all their data?</div>
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button onClick={() => setConfirmDeleteId(null)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 6, padding: '5px 10px', color: '#fff', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                        <button onClick={() => deleteUser(u.id)} disabled={deleting} style={{ background: 'rgba(255,80,80,0.3)', border: '1px solid rgba(255,80,80,0.4)', borderRadius: 6, padding: '5px 10px', color: '#ff6b6b', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          {deleting ? '…' : 'Confirm'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Expanded detail panel */}
                  {isExpanded && (
                    isLoadingDetail ? (
                      <div style={{ padding: '16px 14px', fontSize: 12, color: 'rgba(255,255,255,0.35)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>Loading…</div>
                    ) : detail ? (
                      <UserDetailPanel detail={detail} />
                    ) : (
                      <div style={{ padding: '14px 16px', fontSize: 12, color: 'rgba(255,255,255,0.35)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>Could not load detail.</div>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
