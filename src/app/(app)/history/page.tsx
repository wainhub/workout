'use client';
import { useState, useEffect } from 'react';
import { useStore, useActiveProgram } from '@/lib/store';
import type { CompletedSession } from '@/lib/types';

function fmt(ms: number) {
  return new Date(ms).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function fmtDuration(ms: number) {
  return `${Math.round(ms / 60000)} min`;
}

export default function HistoryPage() {
  const { state } = useStore();
  const program = useActiveProgram();
  const { history } = state;
  const [mounted, setMounted] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div style={{ minHeight: '100svh', background: '#000' }} />;

  function getExerciseName(session: CompletedSession, exIdx: number) {
    const day = program.days.find(d => d.id === session.dayId);
    return day?.exercises[exIdx]?.name ?? `Exercise ${exIdx + 1}`;
  }

  const s = {
    screen: { paddingTop: 'var(--top)', paddingLeft: 16, paddingRight: 16 },
    title: { fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', marginBottom: 20 },
    empty: { textAlign: 'center' as const, padding: '60px 16px', color: 'rgba(255,255,255,0.4)', fontSize: 14 },
    card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, marginBottom: 8, overflow: 'hidden' },
    cardHeader: { padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
    date: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const },
    name: { fontSize: 16, fontWeight: 700, marginTop: 3 },
    meta: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 3 },
    chevron: (open: boolean) => ({ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }),
    detail: { borderTop: '1px solid rgba(255,255,255,0.07)', padding: '12px 16px 16px' },
    exBlock: { paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' },
    exName: { fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'rgba(255,255,255,0.9)' },
    setRow: { display: 'flex', flexWrap: 'wrap' as const, gap: 5 },
    setPill: { padding: '4px 10px', background: 'rgba(161,240,194,0.1)', border: '1px solid rgba(161,240,194,0.2)', borderRadius: 999, fontSize: 12, fontWeight: 600, color: '#a1f0c2', fontVariantNumeric: 'tabular-nums' as const },
    skippedPill: { padding: '4px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, fontSize: 12, color: 'rgba(255,255,255,0.3)' },
    volumeRow: { display: 'flex', gap: 16, marginBottom: 12 },
    volStat: { fontSize: 11, color: 'rgba(255,255,255,0.45)' },
    volVal: { fontWeight: 700, color: '#fff' },
  };

  return (
    <div style={s.screen}>
      <div style={s.title}>History</div>
      {history.length === 0 ? (
        <div style={s.empty}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>↻</div>
          <div>No workouts yet.</div>
          <div style={{ marginTop: 6, color: 'rgba(255,255,255,0.3)' }}>Complete a session to see it here.</div>
        </div>
      ) : (
        history.map(session => {
          const isOpen = expandedId === session.id;
          const exEntries = Object.entries(session.sessionLog).sort(([a], [b]) => Number(a) - Number(b));
          return (
            <div key={session.id} style={s.card}>
              <div style={s.cardHeader} onClick={() => setExpandedId(isOpen ? null : session.id)}>
                <div>
                  <div style={s.date}>{fmt(session.completedAt)} · Week {session.week}</div>
                  <div style={s.name}>Day {session.dayId} · {session.dayName}</div>
                  <div style={s.meta}>{session.totalSets} sets · {fmtDuration(session.durationMs)} · {Math.round(session.totalVolume / 1000)}k lb</div>
                </div>
                <div style={s.chevron(isOpen)}>▼</div>
              </div>

              {isOpen && (
                <div style={s.detail}>
                  <div style={s.volumeRow}>
                    <div style={s.volStat}>Sets <span style={s.volVal}>{session.totalSets}</span></div>
                    <div style={s.volStat}>Volume <span style={s.volVal}>{Math.round(session.totalVolume / 1000)}k lb</span></div>
                    <div style={s.volStat}>Time <span style={s.volVal}>{fmtDuration(session.durationMs)}</span></div>
                  </div>

                  {exEntries.map(([idxStr, sets]) => {
                    const exIdx = Number(idxStr);
                    const exName = getExerciseName(session, exIdx);
                    const doneSets = sets.filter(s => s.status === 'done');
                    return (
                      <div key={exIdx} style={{ ...s.exBlock, ...(exIdx === exEntries.length - 1 ? { borderBottom: 'none', paddingBottom: 0, marginBottom: 0 } : {}) }}>
                        <div style={s.exName}>{exName}</div>
                        <div style={s.setRow}>
                          {doneSets.length === 0 ? (
                            <span style={s.skippedPill}>Skipped</span>
                          ) : (
                            doneSets.map((set, j) => (
                              <span key={j} style={s.setPill}>
                                {set.actualWeight === 0 ? 'BW' : `${set.actualWeight} lb`} × {set.actualReps}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
