export interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight: number;
  unit?: string;
  type: 'Compound' | 'Isolation';
  cue: string;
  lastSetWeights?: number[];
  lastSetReps?: number[];
}

export interface Day {
  id: number;
  name: string;
  focus: string;
  exercises: Exercise[];
}

export interface Program {
  id: string;
  name: string;
  goal: string;
  weeks: number;
  daysPerWeek: number;
  weeksCompleted: number;
  daysCompleted: number;
  totalDays: number;
  createdAt: string;
  reasoning: string;
  days: Day[];
}

export type SetStatus = 'active' | 'upcoming' | 'done' | 'skipped';

export interface SetEntry {
  weight: number;
  reps: number;
  status: SetStatus;
  actualWeight?: number;
  actualReps?: number;
}

export type SessionLog = Record<number, SetEntry[]>;

export interface ActiveSession {
  dayId: number;
  week: number;
  startedAt: number;
  exIdx: number;
  sessionLog: SessionLog;
  restTarget: number;
  restStarted?: number;
}

export interface CompletedSession {
  id: string;
  dayId: number;
  dayName: string;
  week: number;
  completedAt: number;
  durationMs: number;
  sessionLog: SessionLog;
  totalSets: number;
  totalVolume: number;
  prs: number;
}

export interface Prefs {
  units: 'lb' | 'kg';
  compoundRest: number;
  isolationRest: number;
  sound: boolean;
}

export interface User {
  name: string;
  email: string;
  provider: 'apple' | 'google' | 'email';
}

export interface IntakeAnswers {
  goal?: string;
  experience?: string;
  days?: number;
  session?: number;
  equipment?: string;
  emphasis?: string;
  injuries?: string;
  [key: string]: string | number | undefined;
}

export interface AppState {
  user: User | null;
  isOnboarded: boolean;
  intakeAnswers: IntakeAnswers | null;
  programs: Program[];
  activeProgramId: string;
  activeSession: ActiveSession | null;
  history: CompletedSession[];
  weekByDay: Record<number, number>;
  prefs: Prefs;
}

export type AppAction =
  | { type: 'SIGN_IN'; user: User }
  | { type: 'SET_INTAKE_ANSWERS'; answers: IntakeAnswers }
  | { type: 'COMPLETE_ONBOARDING'; program: Program }
  | { type: 'ADD_PROGRAM'; program: Program }
  | { type: 'SET_ACTIVE_PROGRAM'; programId: string }
  | { type: 'DELETE_PROGRAM'; programId: string }
  | { type: 'ADD_EXERCISE'; programId: string; dayId: number; exercise: Exercise }
  | { type: 'UPDATE_EXERCISE'; programId: string; dayId: number; exIdx: number; exercise: Exercise }
  | { type: 'REMOVE_EXERCISE'; programId: string; dayId: number; exIdx: number }
  | { type: 'REORDER_EXERCISE'; programId: string; dayId: number; fromIdx: number; toIdx: number }
  | { type: 'RENAME_PROGRAM'; programId: string; name: string }
  | { type: 'START_SESSION'; dayId: number; week: number; sessionLog: SessionLog }
  | { type: 'UPDATE_SETS'; exIdx: number; sets: SetEntry[] }
  | { type: 'ADVANCE_EXERCISE'; exIdx: number }
  | { type: 'START_REST'; target: number }
  | { type: 'COMPLETE_SESSION'; completedAt: number; durationMs: number; dayName: string; totalSets: number; totalVolume: number; prs: number }
  | { type: 'DISCARD_SESSION' }
  | { type: 'SIGN_OUT' }
  | { type: 'RESTORE_STATE'; savedState: Partial<AppState> };
