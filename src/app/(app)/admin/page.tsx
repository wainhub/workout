'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { createClient } from '@/lib/supabase';

const ADMIN_EMAIL = 'wain@kellum.net';
const GREEN = '#a1f0c2';

interface SupabaseUser {
  id: string;
  email?: string;
  created_at: string;
  last_sign_in_at?: string;
}

function fmtDate(iso: string | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function isThisWeek(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return d >= weekAgo;
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

export default function AdminPage() {
  const { state } = useStore();
  const user = state.user;
  const [users, setUsers] = useState<SupabaseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email !== ADMIN_EMAIL) return;

    (async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) {
          setError('No active session — please sign in again.');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error ?? `Request failed (${res.status})`);
          setLoading(false);
          return;
        }

        const data = await res.json();
        setUsers(data.users ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.email]);

  const s = {
    screen: { paddingTop: 'var(--top, 20px)', paddingLeft: 16, paddingRight: 16, paddingBottom: 32 },
    title: { fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', marginBottom: 8 },
    subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 },
    statsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 },
    card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 12px', textAlign: 'center' as const },
    cardLabel: { fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.4)', marginBottom: 6 },
    cardVal: { fontSize: 26, fontWeight: 800, color: GREEN },
    sectionLabel: { fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as const, marginBottom: 10 },
    tableCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' },
    row: { display: 'flex', flexDirection: 'column' as const, padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
    rowEmail: { fontSize: 13, fontWeight: 600, marginBottom: 3 },
    rowMeta: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
    denied: { textAlign: 'center' as const, paddingTop: 80, fontSize: 16, color: 'rgba(255,255,255,0.5)' },
    loadingBox: { textAlign: 'center' as const, paddingTop: 60, color: 'rgba(255,255,255,0.4)', fontSize: 14 },
    errorBox: { background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: 14, padding: 16, fontSize: 13, color: '#ff8a8a' },
  };

  if (user?.email !== ADMIN_EMAIL) {
    return (
      <div style={s.screen}>
        <div style={s.denied}>Access denied.</div>
      </div>
    );
  }

  const totalUsers = users.length;
  const signupsThisWeek = users.filter(u => isThisWeek(u.created_at)).length;
  const signupsToday = users.filter(u => isToday(u.created_at)).length;

  return (
    <div style={s.screen}>
      <div style={s.title}>Admin</div>
      <div style={s.subtitle}>User overview</div>

      {loading ? (
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
              <div style={{ padding: 20, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                No users yet.
              </div>
            )}
            {users.map((u, i) => (
              <div
                key={u.id}
                style={{
                  ...s.row,
                  ...(i === users.length - 1 ? { borderBottom: 'none' } : {}),
                }}
              >
                <div style={s.rowEmail}>{u.email ?? '(no email)'}</div>
                <div style={s.rowMeta}>
                  Signed up {fmtDate(u.created_at)}
                  {u.last_sign_in_at ? ` · Last seen ${fmtDate(u.last_sign_in_at)}` : ''}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
