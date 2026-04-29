import type { Program } from './types';

const HYPERTROPHY_DAYS = [
  {
    id: 1, name: 'Upper A', focus: 'Push · Chest · Shoulders · Triceps',
    exercises: [
      { name: 'Smith Machine Bench Press', sets: 4, reps: 8,  weight: 130, type: 'Compound' as const, cue: 'Lower 2 seconds, pause briefly, press up.' },
      { name: 'Seated DB Shoulder Press',  sets: 4, reps: 10, weight: 25,  unit: 'lb ea.', type: 'Compound' as const, cue: 'Press from ear height, stop just before lockout.' },
      { name: 'Cable Lateral Raise',       sets: 4, reps: 15, weight: 15,  unit: 'lb ea.', type: 'Isolation' as const, cue: 'Lead with elbows, not wrists.' },
      { name: 'Cable Front Raise',         sets: 3, reps: 15, weight: 45,  type: 'Isolation' as const, cue: '2-second lower every rep.' },
      { name: 'Triceps Pushdown',          sets: 3, reps: 12, weight: 60,  type: 'Isolation' as const, cue: 'Elbows pinned, full lockout.' },
      { name: 'Face Pull',                 sets: 3, reps: 20, weight: 60,  type: 'Isolation' as const, cue: 'High anchor, pull to forehead.' },
    ],
  },
  {
    id: 2, name: 'Lower A', focus: 'Quad Focus · Quads · Glutes · Calves · Core',
    exercises: [
      { name: 'DB Goblet Squat',      sets: 4, reps: 10, weight: 70, type: 'Compound' as const, cue: 'Squat to depth, knees track toes.' },
      { name: 'DB Romanian Deadlift', sets: 4, reps: 10, weight: 65, unit: 'lb ea.', type: 'Compound' as const, cue: 'Hip hinge, soft knee, feel the stretch.' },
      { name: 'DB Reverse Lunge',     sets: 3, reps: 12, weight: 40, unit: 'lb ea.', type: 'Compound' as const, cue: 'Front shin stays vertical.' },
      { name: 'Kettlebell Swing',     sets: 3, reps: 15, weight: 55, unit: 'lb KB',  type: 'Compound' as const, cue: 'Hip snap — not a squat.' },
      { name: 'DB Calf Raise',        sets: 4, reps: 15, weight: 65, unit: 'lb ea.', type: 'Isolation' as const, cue: 'Full range: deep stretch to contraction.' },
      { name: 'Hanging Knee Raise',   sets: 3, reps: 15, weight: 0,  unit: 'BW',     type: 'Isolation' as const, cue: 'Posterior tilt at top, dead hang start.' },
    ],
  },
  {
    id: 3, name: 'Upper B', focus: 'Pull · Back · Biceps · Rear Delts',
    exercises: [
      { name: 'Lat Pulldown',      sets: 4, reps: 8,  weight: 160, type: 'Compound' as const, cue: 'Wide grip, lean back, pull to upper chest.' },
      { name: 'Seated Cable Row', sets: 4, reps: 8,  weight: 155, type: 'Compound' as const, cue: 'Chest tall, 1-second squeeze at peak.' },
      { name: 'DB Incline Curl',  sets: 3, reps: 10, weight: 35,  unit: 'lb ea.', type: 'Isolation' as const, cue: 'Full stretch at bottom.' },
      { name: 'DB Hammer Curl',   sets: 3, reps: 10, weight: 50,  unit: 'lb ea.', type: 'Isolation' as const, cue: 'Neutral grip, 2-second lower.' },
      { name: 'Cable Crossover',  sets: 3, reps: 12, weight: 35,  unit: 'lb ea.', type: 'Isolation' as const, cue: 'Squeeze hard at center.' },
      { name: 'Face Pull',        sets: 3, reps: 15, weight: 65,  type: 'Isolation' as const, cue: 'Rear delts need the volume.' },
    ],
  },
  {
    id: 4, name: 'Lower B', focus: 'Posterior Chain · Hamstrings · Glutes · Calves',
    exercises: [
      { name: 'DB Bulgarian Split Squat', sets: 4, reps: 10, weight: 40, unit: 'lb ea.', type: 'Compound' as const, cue: 'Rear foot on bench, descend straight.' },
      { name: 'DB Stiff-Leg Deadlift',   sets: 4, reps: 10, weight: 70, unit: 'lb ea.', type: 'Compound' as const, cue: 'Deep hamstring stretch each rep.' },
      { name: 'Cable Pull-Through',      sets: 3, reps: 15, weight: 90, type: 'Compound' as const, cue: 'Face away, hinge then drive hips.' },
      { name: 'DB Step-Up',              sets: 3, reps: 12, weight: 40, unit: 'lb ea.', type: 'Compound' as const, cue: '~18" box, drive through heel.' },
      { name: 'DB Calf Raise (seated)',  sets: 4, reps: 15, weight: 65, unit: 'lb ea.', type: 'Isolation' as const, cue: 'Soleus focus; stack DBs on knees.' },
      { name: 'Cable Pallof Press',      sets: 3, reps: 15, weight: 35, unit: 'lb',     type: 'Isolation' as const, cue: 'Anti-rotation — resist the cable.' },
    ],
  },
];

export const SEED_PROGRAMS: Program[] = [
  {
    id: 'p1',
    name: 'Hypertrophy',
    goal: 'Hypertrophy',
    weeks: 12,
    daysPerWeek: 4,
    weeksCompleted: 2,
    daysCompleted: 9,
    totalDays: 48,
    createdAt: 'Apr 8, 2026',
    reasoning: 'A 4-day upper/lower split is the gold standard for hypertrophy at the intermediate level — each muscle group is trained twice per week, hitting the 10–20 sets per muscle per week range that the literature consistently shows drives growth.',
    days: HYPERTROPHY_DAYS,
  },
];

export const DEFAULT_WEEK_BY_DAY: Record<number, number> = { 1: 3, 2: 3, 3: 2, 4: 2 };
