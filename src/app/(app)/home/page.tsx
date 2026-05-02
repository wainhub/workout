'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore, useActiveProgram } from '@/lib/store';
import type { SessionLog } from '@/lib/types';

const DAY_LABELS: Record<number, string> = { 1: 'Tue', 2: 'Wed', 3: 'Fri', 4: 'Sat' };

function formatDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getNextDay(program: ReturnType<typeof useActiveProgram>) {
  // Cycle through days based on how many sessions are completed in this program.
  // daysCompleted = 0 → day[0], daysCompleted = 1 → day[1], etc.
  // Works correctly when switching programs — no dependency on global weekByDay.
  if (!program.days.length) return program.days[0];
  const idx = program.daysCompleted % program.days.length;
  return program.days[idx];
}

export default function HomePage() {
  const router = useRouter();
  const { state, dispatch } = useStore();
  const program = useActiveProgram();
  const [mounted, setMounted] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div style={{ minHeight: '100dvh', background: '#000' }} />;
  const { weekByDay } = state;

  const suggestedDay = getNextDay(program);
  const todayDay = program.days.find(d => d.id === selectedDayId) ?? suggestedDay;
  const pct = Math.round((program.daysCompleted / program.totalDays) * 100);
  const currentWeek = Math.min(...Object.values(weekByDay));

  const s = {
    screen: { paddingTop: 'var(--top)', paddingLeft: 16, paddingRight: 16, minHeight: '100%' },
    kicker: { fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.5)' },
    greeting: { fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', marginTop: 4, lineHeight: 1.1 },
    subline: { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 6, fontWeight: 500 },
    heroCard: {
      marginTop: 14,
      background: 'linear-gradient(135deg, rgba(161,240,194,0.1) 0%, rgba(52,211,153,0.04) 100%)',
      border: '1px solid rgba(161,240,194,0.25)',
      borderRadius: 18, padding: 16,
    },
    heroKicker: { fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: '#a1f0c2' },
    heroTitle: { fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 4 },
    heroMeta: { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 3 },
    dayChips: { display: 'flex', gap: 6, marginTop: 12 },
    dayChipBtn: (active: boolean) => ({
      padding: '5px 12px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
      background: active ? '#a1f0c2' : 'rgba(255,255,255,0.1)',
      color: active ? '#062b18' : 'rgba(255,255,255,0.55)',
    }),
    startBtn: {
      marginTop: 12, width: '100%', padding: '14px 0',
      background: '#a1f0c2', color: '#062b18', border: 'none',
      borderRadius: 999, fontSize: 16, fontWeight: 700, cursor: 'pointer',
      letterSpacing: '0.02em', transition: 'transform 0.15s',
    },
    sectionHead: { fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.45)', marginTop: 18, marginBottom: 8 },
    dayRow: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px', background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, marginBottom: 5, cursor: 'pointer',
    },
    dayRowLeft: { display: 'flex', alignItems: 'center', gap: 12 },
    dayChip: (active: boolean) => ({
      width: 32, height: 32, borderRadius: 10,
      background: active ? '#a1f0c2' : 'rgba(255,255,255,0.08)',
      color: active ? '#062b18' : 'rgba(255,255,255,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', flexShrink: 0,
    }),
    dayName: { fontSize: 14, fontWeight: 700 },
    dayFocus: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
    weekTag: (active: boolean) => ({
      fontSize: 11, fontWeight: 700,
      color: active ? '#a1f0c2' : 'rgba(255,255,255,0.35)',
      letterSpacing: '0.08em',
    }),
  };

  return (
    <div style={s.screen}>
      <div style={s.kicker}>{formatDate()}</div>
      <div style={s.greeting}>Hey {state.user?.name?.split(' ')[0] ?? 'there'}</div>
      <div style={s.subline}>
        Week {currentWeek} · {program.daysCompleted} of {program.totalDays} sessions · {pct}% complete
      </div>

      <div style={s.heroCard}>
        <div style={s.heroKicker}>
          {todayDay.id === suggestedDay.id ? '★ SUGGESTED · DAY ' : 'DAY '}{todayDay.id}
        </div>
        <div style={s.heroTitle}>{todayDay.name}</div>
        <div style={s.heroMeta}>
          {todayDay.exercises.length} exercises · ~{Math.round(todayDay.exercises.reduce((n, e) => n + e.sets * (e.type === 'Compound' ? 135 : 120), 0) / 60)} min · Week {weekByDay[todayDay.id]}
        </div>
        {program.days.length > 1 && (
          <div style={s.dayChips}>
            {program.days.map(d => (
              <button
                key={d.id}
                style={s.dayChipBtn(d.id === todayDay.id)}
                onClick={() => setSelectedDayId(d.id === todayDay.id && selectedDayId !== null ? null : d.id)}
              >
                Day {d.id}
              </button>
            ))}
          </div>
        )}
        <button
          style={s.startBtn}
          onClick={() => {
            // If a session for this day is already active, jump straight in
            if (state.activeSession?.dayId === todayDay.id) {
              router.push(`/workout/${todayDay.id}/active`);
              return;
            }
            // Build session log and start immediately — skip the day overview
            const week = weekByDay[todayDay.id] ?? 1;
            const sessionLog: SessionLog = {};
            todayDay.exercises.forEach((ex, i) => {
              sessionLog[i] = Array.from({ length: ex.sets }, (_, j) => ({
                weight: ex.lastSetWeights?.[j] ?? ex.weight,
                reps: ex.lastSetReps?.[j] ?? ex.reps,
                status: j === 0 ? 'active' : 'upcoming',
              }));
            });
            dispatch({ type: 'START_SESSION', dayId: todayDay.id, week, sessionLog });
            router.push(`/workout/${todayDay.id}/active`);
          }}
        >
          Start workout
        </button>
      </div>

      <div style={s.sectionHead}>This week</div>
      {program.days.map(day => {
        const isSelected = day.id === todayDay.id;
        return (
          <div
            key={day.id}
            style={{ ...s.dayRow, borderColor: isSelected ? 'rgba(161,240,194,0.2)' : 'rgba(255,255,255,0.08)' }}
            onClick={() => setSelectedDayId(day.id)}
          >
            <div style={s.dayRowLeft}>
              <div style={s.dayChip(isSelected)}>D{day.id}</div>
              <div>
                <div style={s.dayName}>{day.name}</div>
                <div style={s.dayFocus}>{day.focus.split(' · ').slice(0, 2).join(' · ')}</div>
              </div>
            </div>
            <div style={s.weekTag(isSelected)}>WK {weekByDay[day.id]}</div>
          </div>
        );
      })}
    </div>
  );
}
