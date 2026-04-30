import type { Program } from './types';

// Full gym / garage — cables, machines, free weights
const FULL_GYM_DAYS = [
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

// Home dumbbells + bench — no cables, no machines
const HOME_DB_DAYS = [
  {
    id: 1, name: 'Upper A', focus: 'Push · Chest · Shoulders · Triceps',
    exercises: [
      { name: 'DB Bench Press',            sets: 4, reps: 10, weight: 55, unit: 'lb ea.', type: 'Compound' as const, cue: 'Lower 2 seconds, slight arch, press to full extension.' },
      { name: 'DB Shoulder Press',         sets: 4, reps: 10, weight: 25, unit: 'lb ea.', type: 'Compound' as const, cue: 'Press from ear height, stop just before lockout.' },
      { name: 'DB Lateral Raise',          sets: 4, reps: 15, weight: 10, unit: 'lb ea.', type: 'Isolation' as const, cue: 'Lead with elbows, not wrists.' },
      { name: 'DB Front Raise',            sets: 3, reps: 12, weight: 15, unit: 'lb ea.', type: 'Isolation' as const, cue: '2-second lower every rep.' },
      { name: 'Overhead Tricep Extension', sets: 3, reps: 12, weight: 25, unit: 'lb',     type: 'Isolation' as const, cue: 'Elbows pinned to head, full extension.' },
      { name: 'Bent-over Rear Delt Fly',   sets: 3, reps: 15, weight: 10, unit: 'lb ea.', type: 'Isolation' as const, cue: 'Chest parallel to floor, arc wide.' },
    ],
  },
  {
    id: 2, name: 'Lower A', focus: 'Quad Focus · Quads · Glutes · Calves · Core',
    exercises: [
      { name: 'DB Goblet Squat',      sets: 4, reps: 12, weight: 70, type: 'Compound' as const, cue: 'Squat to depth, knees track toes.' },
      { name: 'DB Romanian Deadlift', sets: 4, reps: 10, weight: 65, unit: 'lb ea.', type: 'Compound' as const, cue: 'Hip hinge, soft knee, feel the stretch.' },
      { name: 'DB Reverse Lunge',     sets: 3, reps: 12, weight: 40, unit: 'lb ea.', type: 'Compound' as const, cue: 'Front shin stays vertical.' },
      { name: 'DB Hip Thrust',        sets: 3, reps: 15, weight: 45, unit: 'lb ea.', type: 'Compound' as const, cue: 'Back on bench, drive hips to ceiling, squeeze at top.' },
      { name: 'DB Calf Raise',        sets: 4, reps: 20, weight: 65, unit: 'lb ea.', type: 'Isolation' as const, cue: 'Full range: deep stretch to contraction.' },
      { name: 'Plank',                sets: 3, reps: 45, weight: 0,  unit: 'sec BW', type: 'Isolation' as const, cue: 'Neutral spine, brace like you\'re about to get hit.' },
    ],
  },
  {
    id: 3, name: 'Upper B', focus: 'Pull · Back · Biceps · Rear Delts',
    exercises: [
      { name: 'DB Chest-Supported Row', sets: 4, reps: 10, weight: 50, unit: 'lb ea.', type: 'Compound' as const, cue: 'Chest on incline bench, pull elbows behind torso.' },
      { name: 'DB Bent-over Row',       sets: 4, reps: 10, weight: 55, unit: 'lb ea.', type: 'Compound' as const, cue: 'Flat back, drive elbows back — not up.' },
      { name: 'DB Incline Curl',        sets: 3, reps: 10, weight: 25, unit: 'lb ea.', type: 'Isolation' as const, cue: 'Full stretch at bottom.' },
      { name: 'DB Hammer Curl',         sets: 3, reps: 10, weight: 30, unit: 'lb ea.', type: 'Isolation' as const, cue: 'Neutral grip, 2-second lower.' },
      { name: 'DB Chest Fly',           sets: 3, reps: 12, weight: 25, unit: 'lb ea.', type: 'Isolation' as const, cue: 'Slight bend in elbows, wide arc, squeeze at top.' },
      { name: 'Bent-over Rear Delt Fly',sets: 3, reps: 15, weight: 10, unit: 'lb ea.', type: 'Isolation' as const, cue: 'Lead with elbows, feel rear delts.' },
    ],
  },
  {
    id: 4, name: 'Lower B', focus: 'Posterior Chain · Hamstrings · Glutes · Calves',
    exercises: [
      { name: 'DB Bulgarian Split Squat', sets: 4, reps: 10, weight: 40, unit: 'lb ea.', type: 'Compound' as const, cue: 'Rear foot on bench, descend straight.' },
      { name: 'DB Stiff-Leg Deadlift',   sets: 4, reps: 10, weight: 70, unit: 'lb ea.', type: 'Compound' as const, cue: 'Deep hamstring stretch each rep.' },
      { name: 'DB Hip Thrust',           sets: 3, reps: 15, weight: 45, unit: 'lb ea.', type: 'Compound' as const, cue: 'Back on bench, drive hips to ceiling.' },
      { name: 'DB Step-Up',              sets: 3, reps: 12, weight: 40, unit: 'lb ea.', type: 'Compound' as const, cue: '~18" box, drive through heel.' },
      { name: 'DB Calf Raise (seated)',  sets: 4, reps: 15, weight: 65, unit: 'lb ea.', type: 'Isolation' as const, cue: 'Soleus focus; stack DBs on knees.' },
      { name: 'Side Plank',              sets: 3, reps: 30, weight: 0,  unit: 'sec BW', type: 'Isolation' as const, cue: 'Hips stacked, don\'t let them drop.' },
    ],
  },
];

// Bodyweight only — no equipment required (Pull-up bar helpful for Day 3)
const BODYWEIGHT_DAYS = [
  {
    id: 1, name: 'Upper A', focus: 'Push · Chest · Shoulders · Triceps',
    exercises: [
      { name: 'Push-Up',            sets: 4, reps: 15, weight: 0, unit: 'BW', type: 'Compound' as const, cue: 'Full range — chest to floor, elbows 45° from torso.' },
      { name: 'Pike Push-Up',       sets: 4, reps: 10, weight: 0, unit: 'BW', type: 'Compound' as const, cue: 'Hips high, lower head to floor — shoulder focus.' },
      { name: 'Tricep Dip',         sets: 3, reps: 12, weight: 0, unit: 'BW', type: 'Isolation' as const, cue: 'Hands on chair/bench, elbows straight back.' },
      { name: 'Diamond Push-Up',    sets: 3, reps: 10, weight: 0, unit: 'BW', type: 'Isolation' as const, cue: 'Thumbs touching, elbows graze ribs.' },
      { name: 'Plank Shoulder Tap', sets: 3, reps: 20, weight: 0, unit: 'BW', type: 'Isolation' as const, cue: 'Hips stable — don\'t rotate.' },
      { name: 'Prone Y-Raise',      sets: 3, reps: 15, weight: 0, unit: 'BW', type: 'Isolation' as const, cue: 'Lie face down, raise arms in Y, squeeze shoulder blades.' },
    ],
  },
  {
    id: 2, name: 'Lower A', focus: 'Quad Focus · Quads · Glutes · Calves · Core',
    exercises: [
      { name: 'Squat',              sets: 4, reps: 20, weight: 0, unit: 'BW', type: 'Compound' as const, cue: 'Full depth, knees track toes.' },
      { name: 'Single-Leg Deadlift',sets: 4, reps: 10, weight: 0, unit: 'BW', type: 'Compound' as const, cue: 'Hinge at hip, standing leg soft, feel hamstring load.' },
      { name: 'Reverse Lunge',      sets: 3, reps: 12, weight: 0, unit: 'BW', type: 'Compound' as const, cue: 'Front shin stays vertical, back knee nearly touches.' },
      { name: 'Glute Bridge',       sets: 3, reps: 20, weight: 0, unit: 'BW', type: 'Compound' as const, cue: 'Drive through heels, hard squeeze at top.' },
      { name: 'Calf Raise',         sets: 4, reps: 25, weight: 0, unit: 'BW', type: 'Isolation' as const, cue: 'Use a step — full range, slow lower.' },
      { name: 'Plank',              sets: 3, reps: 45, weight: 0, unit: 'sec BW', type: 'Isolation' as const, cue: 'Neutral spine, abs braced.' },
    ],
  },
  {
    id: 3, name: 'Upper B', focus: 'Pull · Back · Biceps · Rear Delts',
    exercises: [
      { name: 'Pull-Up',         sets: 4, reps: 6,  weight: 0, unit: 'BW', type: 'Compound' as const, cue: 'Dead hang start, pull chest to bar.' },
      { name: 'Inverted Row',    sets: 4, reps: 10, weight: 0, unit: 'BW', type: 'Compound' as const, cue: 'Under a table/bar — body straight, pull chest up.' },
      { name: 'Chin-Up',         sets: 3, reps: 8,  weight: 0, unit: 'BW', type: 'Isolation' as const, cue: 'Underhand grip, squeeze biceps at top.' },
      { name: 'Archer Push-Up',  sets: 3, reps: 8,  weight: 0, unit: 'BW', type: 'Isolation' as const, cue: 'Wide stance, shift weight to one arm each rep.' },
      { name: 'Superman Hold',   sets: 3, reps: 15, weight: 0, unit: 'BW', type: 'Isolation' as const, cue: 'Face down, lift arms and legs, hold 2 sec.' },
      { name: 'Prone Snow Angel',sets: 3, reps: 15, weight: 0, unit: 'BW', type: 'Isolation' as const, cue: 'Lie face down, arc arms overhead and back — rear delts.' },
    ],
  },
  {
    id: 4, name: 'Lower B', focus: 'Posterior Chain · Hamstrings · Glutes · Calves',
    exercises: [
      { name: 'Bulgarian Split Squat', sets: 4, reps: 12, weight: 0, unit: 'BW', type: 'Compound' as const, cue: 'Rear foot elevated, descend straight down.' },
      { name: 'Single-Leg Hip Thrust', sets: 4, reps: 12, weight: 0, unit: 'BW', type: 'Compound' as const, cue: 'Back on couch/bench, one leg, drive hips up hard.' },
      { name: 'Nordic Curl',           sets: 3, reps: 6,  weight: 0, unit: 'BW', type: 'Compound' as const, cue: 'Anchor feet, lower slowly — hamstrings work eccentrically.' },
      { name: 'Step-Up',               sets: 3, reps: 12, weight: 0, unit: 'BW', type: 'Compound' as const, cue: 'Use stairs or a sturdy box, drive through heel.' },
      { name: 'Single-Leg Calf Raise', sets: 4, reps: 20, weight: 0, unit: 'BW', type: 'Isolation' as const, cue: 'On a step, full range — deep stretch then full contraction.' },
      { name: 'Side Plank',            sets: 3, reps: 30, weight: 0, unit: 'sec BW', type: 'Isolation' as const, cue: 'Hips stacked and lifted — don\'t sag.' },
    ],
  },
];

function getDays(equipment: string) {
  if (equipment === 'bw') return BODYWEIGHT_DAYS;
  if (equipment === 'home_db') return HOME_DB_DAYS;
  return FULL_GYM_DAYS; // full_gym, garage, or anything else
}

function buildReasoning(goal: string, equipment: string, days: number): string {
  const goalText: Record<string, string> = {
    hypertrophy: `An upper/lower split hitting each muscle group twice per week is the gold standard for building muscle. At ${days} days/week you're in the optimal volume range — enough stimulus to drive growth, enough rest to recover.`,
    strength:    `This program prioritizes progressive overload on compound movements. Lower rep ranges (6–8) and heavier loads build the neuromuscular efficiency and raw strength you're after. Add weight whenever you hit the top of the range.`,
    fat_loss:    `Resistance training preserves muscle while in a calorie deficit — the only way to lose fat and still look athletic. This program's compound-heavy structure burns more calories and keeps your metabolism elevated long after the session ends.`,
    general:     `A balanced push/pull structure that builds strength, improves body composition, and stays sustainable. At ${days} days/week you'll make consistent progress without burning out — the best program is one you actually do.`,
  };
  const equipText: Record<string, string> = {
    full_gym: `Full gym access gives you the best tool for each movement — cables for constant tension isolation, machines for stable loading, free weights for strength.`,
    garage:   `Barbell and rack training is the most effective strength setup available. Heavy compounds are the backbone.`,
    home_db:  `Every exercise uses only dumbbells and a bench — no cables, no machines. You can get 90% of gym results with this setup.`,
    bw:       `Every exercise is bodyweight only — no equipment needed beyond a chair and ideally a pull-up bar. Progressive overload comes from reps, tempo, and harder variations.`,
  };
  const gr = goalText[goal] ?? goalText.general;
  const er = equipText[equipment] ?? equipText.full_gym;
  return `${gr} ${er}`;
}

export { getDays, buildReasoning };

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
    days: FULL_GYM_DAYS,
  },
];

export const DEFAULT_WEEK_BY_DAY: Record<number, number> = { 1: 3, 2: 3, 3: 2, 4: 2 };
