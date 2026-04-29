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
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOW = ['Su','Mo','Tu','We','Th','Fr','Sa'];

export default function HistoryPage() {
  const { state } = useStore();
  const program = useActiveProgram();
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div style={{ minHeight: '100svh', background: '#000' }} />;

  // Always show most recent first
  const history = [...state.history].sort((a, b) => b.completedAt - a.completedAt);

  function getExerciseName(session: CompletedSession, exIdx: number) {
    const day = program.days.find(d => d.id === session.dayId);
    return day?.exercises[exIdx]?.name ?? `Exercise ${exIdx + 1}`;
  }

  const GREEN = '#a1f0c2';

  const s = {
    screen: { paddingTop: 'var(--top)', paddingLeft: 16, paddingRight: 16, paddingBottom: 32 },
    topRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    title: { fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em' },
    toggle: { display: 'flex', background: 'rgba(255,255,255,0.07)', borderRadius: 10, padding: 3, gap: 2 },
    toggleBtn: (active: boolean) => ({ padding: '6px 14px', borderRadius: 8, border: 'none', background: active ? 'rgba(255,255,255,0.15)' : 'transparent', color: active ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }),
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
    setPill: { padding: '4px 10px', background: 'rgba(161,240,194,0.1)', border: '1px solid rgba(161,240,194,0.2)', borderRadius: 999, fontSize: 12, fontWeight: 600, color: GREEN, fontVariantNumeric: 'tabular-nums' as const },
    skippedPill: { padding: '4px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, fontSize: 12, color: 'rgba(255,255,255,0.3)' },
    volumeRow: { display: 'flex', gap: 16, marginBottom: 12 },
    volStat: { fontSize: 11, color: 'rgba(255,255,255,0.45)' },
    volVal: { fontWeight: 700, color: '#fff' },
  };

  function SessionDetail({ session }: { session: CompletedSession }) {
    const exEntries = Object.entries(session.sessionLog).sort(([a], [b]) => Number(a) - Number(b));
    return (
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
    );
  }

  function SessionCard({ session }: { session: CompletedSession }) {
    const isOpen = expandedId === session.id;
    return (
      <div style={s.card}>
        <div style={s.cardHeader} onClick={() => setExpandedId(isOpen ? null : session.id)}>
          <div>
            <div style={s.date}>{fmt(session.completedAt)} · Week {session.week}</div>
            <div style={s.name}>Day {session.dayId} · {session.dayName}</div>
            <div style={s.meta}>{session.totalSets} sets · {fmtDuration(session.durationMs)} · {Math.round(session.totalVolume / 1000)}k lb</div>
          </div>
          <div style={s.chevron(isOpen)}>▼</div>
        </div>
        {isOpen && <SessionDetail session={session} />}
      </div>
    );
  }

  // ── Calendar view ──────────────────────────────────────────
  function CalendarView() {
    const { year, month } = calMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    // Map of date-string → sessions
    const sessionsByDay: Record<string, CompletedSession[]> = {};
    for (const s of history) {
      const d = new Date(s.completedAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!sessionsByDay[key]) sessionsByDay[key] = [];
      sessionsByDay[key].push(s);
    }

    const selectedSessions = selectedDay
      ? history.filter(s => isSameDay(new Date(s.completedAt), selectedDay))
      : [];

    const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
    // pad to full weeks
    while (cells.length % 7 !== 0) cells.push(null);

    return (
      <>
        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button
            onClick={() => setCalMonth(m => { const d = new Date(m.year, m.month - 1); return { year: d.getFullYear(), month: d.getMonth() }; })}
            style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8, width: 36, height: 36, color: '#fff', fontSize: 16, cursor: 'pointer' }}
          >‹</button>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{MONTHS[month]} {year}</div>
          <button
            onClick={() => setCalMonth(m => { const d = new Date(m.year, m.month + 1); return { year: d.getFullYear(), month: d.getMonth() }; })}
            style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8, width: 36, height: 36, color: '#fff', fontSize: 16, cursor: 'pointer' }}
          >›</button>
        </div>

        {/* Day-of-week headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 6 }}>
          {DOW.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', paddingBottom: 6 }}>{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 20 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const cellDate = new Date(year, month, day);
            const key = `${year}-${month}-${day}`;
            const sessions = sessionsByDay[key] ?? [];
            const hasWorkout = sessions.length > 0;
            const isToday = isSameDay(cellDate, today);
            const isSelected = selectedDay ? isSameDay(cellDate, selectedDay) : false;

            return (
              <button
                key={i}
                onClick={() => setSelectedDay(isSelected ? null : cellDate)}
                style={{
                  aspectRatio: '1', borderRadius: 10,
                  background: isSelected ? GREEN : hasWorkout ? 'rgba(161,240,194,0.15)' : 'rgba(255,255,255,0.04)',
                  border: isToday ? `1px solid ${GREEN}` : isSelected ? 'none' : '1px solid transparent',
                  color: isSelected ? '#062b18' : hasWorkout ? GREEN : 'rgba(255,255,255,0.5)',
                  fontSize: 13, fontWeight: hasWorkout ? 700 : 400, cursor: hasWorkout ? 'pointer' : 'default',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                  position: 'relative',
                }}
              >
                {day}
                {hasWorkout && !isSelected && (
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: GREEN }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected day sessions */}
        {selectedDay && selectedSessions.length > 0 && (
          <>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 10 }}>
              {selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            {selectedSessions.map(s => <SessionCard key={s.id} session={s} />)}
          </>
        )}
        {selectedDay && selectedSessions.length === 0 && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13, padding: '20px 0' }}>No workout on this day.</div>
        )}
        {!selectedDay && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13, padding: '8px 0' }}>Tap a highlighted day to see your workout.</div>
        )}
      </>
    );
  }

  return (
    <div style={s.screen}>
      <div style={s.topRow}>
        <div style={s.title}>History</div>
        <div style={s.toggle}>
          <button style={s.toggleBtn(view === 'list')} onClick={() => setView('list')}>List</button>
          <button style={s.toggleBtn(view === 'calendar')} onClick={() => setView('calendar')}>Calendar</button>
        </div>
      </div>

      {history.length === 0 ? (
        <div style={s.empty}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>↻</div>
          <div>No workouts yet.</div>
          <div style={{ marginTop: 6, color: 'rgba(255,255,255,0.3)' }}>Complete a session to see it here.</div>
        </div>
      ) : view === 'list' ? (
        history.map(session => <SessionCard key={session.id} session={session} />)
      ) : (
        <CalendarView />
      )}
    </div>
  );
}
