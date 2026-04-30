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

// Flexibility — mat + bodyweight, holds in seconds
const FLEXIBILITY_DAYS = [
  {
    id: 1, name: 'Upper Mobility', focus: 'Chest · Shoulders · Thoracic Spine · Neck',
    exercises: [
      { name: 'Cat-Cow',                      sets: 3, reps: 10, weight: 0, unit: 'BW',     type: 'Compound' as const, cue: 'Exhale to arch (cat), inhale to dip (cow). Slow and rhythmic.' },
      { name: 'Doorway Chest Stretch',        sets: 3, reps: 30, weight: 0, unit: 'sec',    type: 'Isolation' as const, cue: 'Forearms on door frame, gentle lean forward. Feel the stretch across chest.' },
      { name: 'Thoracic Rotation',            sets: 3, reps: 10, weight: 0, unit: 'ea. BW', type: 'Compound' as const, cue: 'Hands behind head, rotate open as far as possible — don\'t let hips move.' },
      { name: 'Cross-Body Shoulder Stretch',  sets: 3, reps: 30, weight: 0, unit: 'sec ea.', type: 'Isolation' as const, cue: 'Pull arm across chest, keep shoulder packed down.' },
      { name: 'Overhead Tricep Stretch',      sets: 3, reps: 30, weight: 0, unit: 'sec ea.', type: 'Isolation' as const, cue: 'Elbow bent behind head, gently pull with opposite hand.' },
      { name: 'Neck Lateral Stretch',         sets: 3, reps: 30, weight: 0, unit: 'sec ea.', type: 'Isolation' as const, cue: 'Ear toward shoulder, don\'t shrug. Breathe.' },
    ],
  },
  {
    id: 2, name: 'Lower Mobility', focus: 'Hips · Hamstrings · Quads · Calves',
    exercises: [
      { name: 'Hip Flexor Stretch',   sets: 3, reps: 45, weight: 0, unit: 'sec ea.', type: 'Isolation' as const, cue: 'Low lunge, back knee down, drive hips forward. Keep torso tall.' },
      { name: 'Pigeon Pose',          sets: 3, reps: 45, weight: 0, unit: 'sec ea.', type: 'Isolation' as const, cue: 'Front shin parallel (or near), fold forward to deepen. Breathe into the hip.' },
      { name: 'Standing Hamstring Stretch', sets: 3, reps: 30, weight: 0, unit: 'sec ea.', type: 'Isolation' as const, cue: 'Straight leg on a surface, hinge at hip — not the lower back.' },
      { name: 'Butterfly Stretch',    sets: 3, reps: 45, weight: 0, unit: 'sec',    type: 'Isolation' as const, cue: 'Feet together, elbows push knees down gently. Hinge forward from hips.' },
      { name: 'Couch Stretch',        sets: 3, reps: 45, weight: 0, unit: 'sec ea.', type: 'Isolation' as const, cue: 'Back foot on couch/wall, front foot forward. Feel quad and hip flexor stretch.' },
      { name: 'Calf Stretch',         sets: 3, reps: 30, weight: 0, unit: 'sec ea.', type: 'Isolation' as const, cue: 'Hands on wall, back heel down. Straight leg for gastrocnemius, bent for soleus.' },
    ],
  },
  {
    id: 3, name: 'Full Body Flow', focus: 'Dynamic Mobility · Full Range of Motion',
    exercises: [
      { name: 'World\'s Greatest Stretch', sets: 3, reps: 6,  weight: 0, unit: 'ea. BW', type: 'Compound' as const, cue: 'Lunge + rotate + reach. One fluid movement per rep, slow and controlled.' },
      { name: 'Inchworm',                  sets: 3, reps: 8,  weight: 0, unit: 'BW',     type: 'Compound' as const, cue: 'Walk hands out to plank, hold 1 sec, walk feet in. Keep legs straight.' },
      { name: 'Hip Circle',                sets: 3, reps: 10, weight: 0, unit: 'ea. BW', type: 'Compound' as const, cue: 'Standing, draw large circles with your knee. Full range each direction.' },
      { name: 'Thread the Needle',         sets: 3, reps: 10, weight: 0, unit: 'ea. BW', type: 'Isolation' as const, cue: 'On all fours, thread one arm under body and rotate open. Feel thoracic spine rotate.' },
      { name: '90/90 Hip Stretch',         sets: 3, reps: 45, weight: 0, unit: 'sec ea.', type: 'Isolation' as const, cue: 'Both legs at 90°, front shin and rear shin. Sit tall, lean gently forward.' },
      { name: 'Child\'s Pose',             sets: 3, reps: 30, weight: 0, unit: 'sec',    type: 'Isolation' as const, cue: 'Arms overhead, breathe into your back. Let gravity do the work.' },
    ],
  },
  {
    id: 4, name: 'Restore & Recover', focus: 'Gentle Holds · Breath Work · Deep Release',
    exercises: [
      { name: 'Lying Spinal Twist',         sets: 3, reps: 45, weight: 0, unit: 'sec ea.', type: 'Isolation' as const, cue: 'On back, knee across body, look the other way. Zero effort — just breathe.' },
      { name: 'Supine Hamstring Stretch',   sets: 3, reps: 45, weight: 0, unit: 'sec ea.', type: 'Isolation' as const, cue: 'On back, pull leg toward chest with a strap or towel. Soft knee.' },
      { name: 'Puppy Pose',                 sets: 3, reps: 45, weight: 0, unit: 'sec',    type: 'Isolation' as const, cue: 'Hips over knees, chest toward floor, arms forward. Great for lats and thoracic.' },
      { name: 'Figure-4 Stretch',           sets: 3, reps: 45, weight: 0, unit: 'sec ea.', type: 'Isolation' as const, cue: 'On back, ankle on opposite knee, gently push knee away. Deep glute/piriformis.' },
      { name: 'Diaphragmatic Breathing',    sets: 5, reps: 8,  weight: 0, unit: 'BW',     type: 'Isolation' as const, cue: 'Hand on belly, breathe into it. 4 sec in, hold 2, 6 sec out. Calms the nervous system.' },
    ],
  },
];

// Cardio — bodyweight + optional equipment, reps in seconds where noted
const CARDIO_DAYS = [
  {
    id: 1, name: 'HIIT', focus: 'High Intensity Intervals · Max Output · Short Rest',
    exercises: [
      { name: 'Jumping Jack Warm-Up',  sets: 1, reps: 60, weight: 0, unit: 'sec',    type: 'Compound' as const, cue: 'Easy pace to raise heart rate. Don\'t skip this.' },
      { name: 'Burpee',                sets: 5, reps: 30, weight: 0, unit: 'sec',    type: 'Compound' as const, cue: '30 sec max effort, 30 sec rest between rounds. Full lockout at top.' },
      { name: 'Mountain Climber',      sets: 4, reps: 30, weight: 0, unit: 'sec',    type: 'Compound' as const, cue: 'Hips level, fast feet. Drive knees toward chest alternately.' },
      { name: 'Jump Squat',            sets: 4, reps: 30, weight: 0, unit: 'sec',    type: 'Compound' as const, cue: 'Squat to parallel, explode up, land soft. 30 on / 30 off.' },
      { name: 'High Knees',            sets: 4, reps: 30, weight: 0, unit: 'sec',    type: 'Compound' as const, cue: 'Pump arms, drive knees to hip height. Fast cadence.' },
      { name: 'Plank Hold Finisher',   sets: 3, reps: 30, weight: 0, unit: 'sec',    type: 'Isolation' as const, cue: 'Max effort plank. Core braced, breathe.' },
    ],
  },
  {
    id: 2, name: 'Steady State', focus: 'Aerobic Base · Zone 2 · Sustained Effort',
    exercises: [
      { name: 'Light Jog / Walk Warm-Up',  sets: 1, reps: 5,  weight: 0, unit: 'min',    type: 'Compound' as const, cue: 'Easy effort. Can hold a conversation.' },
      { name: 'Moderate Pace Run / Bike',  sets: 1, reps: 20, weight: 0, unit: 'min',    type: 'Compound' as const, cue: 'Zone 2 — you can speak in full sentences but feel the effort. Consistent pace.' },
      { name: 'Incline Walk',              sets: 3, reps: 5,  weight: 0, unit: 'min',    type: 'Compound' as const, cue: 'Treadmill 8–10% grade at 3–4 mph, or walk uphill outside. Hands off rails.' },
      { name: 'Jump Rope',                 sets: 4, reps: 60, weight: 0, unit: 'sec',    type: 'Compound' as const, cue: 'Light bouncing, consistent tempo. If you trip, restart.' },
      { name: 'Bear Crawl',                sets: 3, reps: 30, weight: 0, unit: 'sec',    type: 'Compound' as const, cue: 'Knees 2 inches off floor, opposite arm/leg. Slow and controlled.' },
    ],
  },
  {
    id: 3, name: 'Cardio Circuit', focus: 'Strength-Cardio Mix · Full Body · No Rest',
    exercises: [
      { name: 'Push-Up',            sets: 4, reps: 15, weight: 0, unit: 'BW',  type: 'Compound' as const, cue: 'Full range. Move straight to the next exercise — this is a circuit, no rest.' },
      { name: 'Squat Jump',         sets: 4, reps: 15, weight: 0, unit: 'BW',  type: 'Compound' as const, cue: 'Explode up every rep. Land soft, absorb with the legs.' },
      { name: 'Mountain Climber',   sets: 4, reps: 20, weight: 0, unit: 'BW',  type: 'Compound' as const, cue: 'Fast alternating knees. Keep hips level.' },
      { name: 'Plank',              sets: 4, reps: 45, weight: 0, unit: 'sec', type: 'Isolation' as const, cue: 'Max tension — squeeze glutes and abs simultaneously.' },
      { name: 'Burpee',             sets: 4, reps: 10, weight: 0, unit: 'BW',  type: 'Compound' as const, cue: 'Full extension at top. Each rep counts. Rest 90 sec after each round.' },
    ],
  },
  {
    id: 4, name: 'Endurance Intervals', focus: 'Longer Work Bouts · Aerobic Capacity · Tempo',
    exercises: [
      { name: 'Dynamic Warm-Up',       sets: 1, reps: 5,  weight: 0, unit: 'min',    type: 'Compound' as const, cue: 'Leg swings, arm circles, light jog. Get the joints moving.' },
      { name: 'Tempo Run / Row / Bike', sets: 6, reps: 2,  weight: 0, unit: 'min',   type: 'Compound' as const, cue: '2 min hard (7/10 effort), 1 min easy recovery. Stay consistent across all 6 rounds.' },
      { name: 'Lateral Shuffle',        sets: 4, reps: 30, weight: 0, unit: 'sec',   type: 'Compound' as const, cue: 'Stay low, quick feet side to side. Good for agility and glute medius.' },
      { name: 'Skater Jump',            sets: 4, reps: 30, weight: 0, unit: 'sec',   type: 'Compound' as const, cue: 'Single-leg landing, push off laterally. Soft landing, hold briefly each side.' },
      { name: 'Cool-Down Walk',         sets: 1, reps: 5,  weight: 0, unit: 'min',   type: 'Isolation' as const, cue: 'Drop the pace. Heart rate should come down to near-resting before you stop.' },
    ],
  },
];

function getDays(equipment: string, goal?: string) {
  if (goal === 'flexibility') return FLEXIBILITY_DAYS;
  if (goal === 'cardio') return CARDIO_DAYS;
  if (equipment === 'bw') return BODYWEIGHT_DAYS;
  if (equipment === 'home_db') return HOME_DB_DAYS;
  return FULL_GYM_DAYS; // full_gym, garage, or anything else
}

function buildReasoning(goal: string, equipment: string, days: number): string {
  const goalText: Record<string, string> = {
    hypertrophy:  `An upper/lower split hitting each muscle group twice per week is the gold standard for building muscle. At ${days} days/week you're in the optimal volume range — enough stimulus to drive growth, enough rest to recover.`,
    strength:     `This program prioritizes progressive overload on compound movements. Lower rep ranges (6–8) and heavier loads build the neuromuscular efficiency and raw strength you're after. Add weight whenever you hit the top of the range.`,
    fat_loss:     `Resistance training preserves muscle while in a calorie deficit — the only way to lose fat and still look athletic. This program's compound-heavy structure burns more calories and keeps your metabolism elevated long after the session ends.`,
    general:      `A balanced push/pull structure that builds strength, improves body composition, and stays sustainable. At ${days} days/week you'll make consistent progress without burning out — the best program is one you actually do.`,
    flexibility:  `This program uses a mix of dynamic mobility work and longer static holds to systematically improve your range of motion. At ${days} days/week you'll see meaningful change in 4–6 weeks — consistency matters more than intensity here.`,
    cardio:       `This program builds your aerobic engine through a mix of HIIT, steady-state, and circuit sessions. At ${days} days/week you'll improve VO2 max, burn fat efficiently, and build the kind of fitness that carries over to everything else.`,
  };
  const equipText: Record<string, string> = {
    full_gym:    `Full gym access gives you the best tool for each movement — cables for constant tension, machines for stable loading, free weights for strength.`,
    garage:      `Barbell and rack training is the most effective strength setup available. Heavy compounds are the backbone.`,
    home_db:     `Every exercise uses only dumbbells and a bench — no cables, no machines. You can get 90% of gym results with this setup.`,
    bw:          `Every exercise is bodyweight only — no equipment needed beyond a chair and ideally a pull-up bar.`,
    flexibility: '',
    cardio:      '',
  };
  const gr = goalText[goal] ?? goalText.general;
  const er = (goal === 'flexibility' || goal === 'cardio') ? '' : (equipText[equipment] ?? equipText.full_gym);
  return `${gr}${er ? ' ' + er : ''}`;
}

export { getDays, buildReasoning };

export const SEED_PROGRAMS: Program[] = [
  {
    id: 'p1',
    name: 'Build Muscle',
    goal: 'Build Muscle',
    weeks: 12,
    daysPerWeek: 4,
    weeksCompleted: 2,
    daysCompleted: 9,
    totalDays: 48,
    createdAt: 'Apr 8, 2026',
    reasoning: 'An upper/lower split hitting each muscle group twice per week is the gold standard for building muscle — enough stimulus to drive growth, enough rest to recover. Full gym access gives you the best tool for each movement.',
    days: FULL_GYM_DAYS,
  },
];

export const DEFAULT_WEEK_BY_DAY: Record<number, number> = { 1: 3, 2: 3, 3: 2, 4: 2 };
