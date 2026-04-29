'use client';

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type { AppState, AppAction, SessionLog, CompletedSession } from './types';
import { SEED_PROGRAMS, DEFAULT_WEEK_BY_DAY } from './data';

const STORAGE_KEY = 'wain-workout-v1';

const DEFAULT_STATE: AppState = {
  user: null,
  isOnboarded: false,
  intakeAnswers: null,
  programs: SEED_PROGRAMS,
  activeProgramId: 'p1',
  activeSession: null,
  history: [],
  weekByDay: DEFAULT_WEEK_BY_DAY,
  prefs: { units: 'lb', compoundRest: 90, isolationRest: 75, sound: true },
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SIGN_IN':
      return { ...state, user: action.user };

    case 'SET_INTAKE_ANSWERS':
      return { ...state, intakeAnswers: action.answers };

    case 'COMPLETE_ONBOARDING':
      return {
        ...state,
        isOnboarded: true,
        programs: [action.program],
        activeProgramId: action.program.id,
        weekByDay: Object.fromEntries(action.program.days.map(d => [d.id, 1])),
      };

    case 'START_SESSION':
      return {
        ...state,
        activeSession: {
          dayId: action.dayId,
          week: action.week,
          startedAt: Date.now(),
          exIdx: 0,
          sessionLog: action.sessionLog,
          restTarget: 0,
        },
      };

    case 'UPDATE_SETS':
      if (!state.activeSession) return state;
      return {
        ...state,
        activeSession: {
          ...state.activeSession,
          sessionLog: { ...state.activeSession.sessionLog, [action.exIdx]: action.sets },
        },
      };

    case 'ADVANCE_EXERCISE':
      if (!state.activeSession) return state;
      return {
        ...state,
        activeSession: { ...state.activeSession, exIdx: action.exIdx },
      };

    case 'START_REST':
      if (!state.activeSession) return state;
      return {
        ...state,
        activeSession: {
          ...state.activeSession,
          restTarget: action.target,
          restStarted: Date.now(),
        },
      };

    case 'COMPLETE_SESSION': {
      if (!state.activeSession) return state;
      const { dayId, week, sessionLog } = state.activeSession;
      const completed: CompletedSession = {
        id: String(Date.now()),
        dayId,
        dayName: action.dayName,
        week,
        completedAt: action.completedAt,
        durationMs: action.durationMs,
        sessionLog,
        totalSets: action.totalSets,
        totalVolume: action.totalVolume,
        prs: action.prs,
      };
      return {
        ...state,
        activeSession: null,
        history: [completed, ...state.history],
        weekByDay: { ...state.weekByDay, [dayId]: week + 1 },
        programs: state.programs.map(p => {
          if (p.id !== state.activeProgramId) return p;
          return {
            ...p,
            daysCompleted: p.daysCompleted + 1,
            days: p.days.map(d => {
              if (d.id !== dayId) return d;
              return {
                ...d,
                exercises: d.exercises.map((ex, i) => {
                  const sets = sessionLog[i] ?? [];
                  const done = sets.filter(s => s.status === 'done');
                  if (done.length === 0) return ex;
                  return {
                    ...ex,
                    lastSetWeights: sets.map(s => s.actualWeight ?? s.weight),
                    lastSetReps: sets.map(s => s.actualReps ?? s.reps),
                  };
                }),
              };
            }),
          };
        }),
      };
    }

    case 'DISCARD_SESSION':
      return { ...state, activeSession: null };

    case 'SIGN_OUT':
      return DEFAULT_STATE;

    case 'RESTORE_STATE':
      return { ...DEFAULT_STATE, ...action.savedState };

    case 'ADD_PROGRAM': {
      const newWeekByDay = Object.fromEntries(action.program.days.map(d => [d.id, 1]));
      return {
        ...state,
        programs: [...state.programs, action.program],
        activeProgramId: action.program.id,
        weekByDay: newWeekByDay,
      };
    }

    case 'SET_ACTIVE_PROGRAM': {
      const p = state.programs.find(p => p.id === action.programId);
      if (!p) return state;
      return {
        ...state,
        activeProgramId: action.programId,
        weekByDay: Object.fromEntries(p.days.map(d => [d.id, 1])),
      };
    }

    case 'DELETE_PROGRAM': {
      const remaining = state.programs.filter(p => p.id !== action.programId);
      if (remaining.length === 0) return state;
      const newActiveId = state.activeProgramId === action.programId ? remaining[0].id : state.activeProgramId;
      return { ...state, programs: remaining, activeProgramId: newActiveId };
    }

    case 'ADD_EXERCISE':
      return {
        ...state,
        programs: state.programs.map(p =>
          p.id !== action.programId ? p : {
            ...p,
            days: p.days.map(d =>
              d.id !== action.dayId ? d : {
                ...d,
                exercises: [...d.exercises, action.exercise],
              }
            ),
          }
        ),
      };

    case 'UPDATE_EXERCISE':
      return {
        ...state,
        programs: state.programs.map(p =>
          p.id !== action.programId ? p : {
            ...p,
            days: p.days.map(d =>
              d.id !== action.dayId ? d : {
                ...d,
                exercises: d.exercises.map((ex, i) => i === action.exIdx ? action.exercise : ex),
              }
            ),
          }
        ),
      };

    case 'REMOVE_EXERCISE':
      return {
        ...state,
        programs: state.programs.map(p =>
          p.id !== action.programId ? p : {
            ...p,
            days: p.days.map(d =>
              d.id !== action.dayId ? d : {
                ...d,
                exercises: d.exercises.filter((_, i) => i !== action.exIdx),
              }
            ),
          }
        ),
      };

    case 'REORDER_EXERCISE': {
      const { programId, dayId, fromIdx, toIdx } = action;
      return {
        ...state,
        programs: state.programs.map(p =>
          p.id !== programId ? p : {
            ...p,
            days: p.days.map(d => {
              if (d.id !== dayId) return d;
              const exs = [...d.exercises];
              const [moved] = exs.splice(fromIdx, 1);
              exs.splice(toIdx, 0, moved);
              return { ...d, exercises: exs };
            }),
          }
        ),
      };
    }

    case 'RENAME_PROGRAM':
      return {
        ...state,
        programs: state.programs.map(p =>
          p.id !== action.programId ? p : { ...p, name: action.name }
        ),
      };

    default:
      return state;
  }
}

interface StoreCtx {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE, (init) => {
    if (typeof window === 'undefined') return init;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...init, ...JSON.parse(saved) };
    } catch {}
    return init;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore must be inside StoreProvider');
  return ctx;
}

export function useActiveProgram() {
  const { state } = useStore();
  return state.programs.find(p => p.id === state.activeProgramId)!;
}
