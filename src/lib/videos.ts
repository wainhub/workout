/**
 * Exercise name → YouTube video ID map.
 * Used to populate videoUrl on exercises at runtime.
 * Embed format: https://www.youtube.com/embed/<ID>?rel=0&modestbranding=1
 */
export const EXERCISE_VIDEOS: Record<string, string> = {
  // Upper A — Push
  'Smith Machine Bench Press':    'z_r6hDOYtO0',
  'Seated DB Shoulder Press':     'fuQpuu--bMI',
  'DB Shoulder Press':            'fuQpuu--bMI',
  'Cable Lateral Raise':          'zpbm-xRHB6k',
  'DB Lateral Raise':             'zpbm-xRHB6k',
  'Cable Front Raise':            'KjqHI59JizY',
  'DB Front Raise':               'KjqHI59JizY',
  'Triceps Pushdown':             '_w-HpW70nSQ',
  'Tricep Pushdown':              '_w-HpW70nSQ',
  'Face Pull':                    '0Po47vvj9g4',
  // Push — Home DB / Bodyweight
  'DB Bench Press':               'VmB1G1K7v94',
  'Overhead Tricep Extension':    'nRiJVZDpdL0',
  'Bent-over Rear Delt Fly':      'VuLz9OL1aqM',
  'Push-Up':                      'IODxDxX7oi4',
  'Pike Push-Up':                 'x7_I5SUAd00',
  'Tricep Dip':                   '0326dy_-CzM',
  'Diamond Push-Up':              'J0DXGHy1bU0',
  'Plank Shoulder Tap':           'LEZq_ZGR4rk',
  'Prone Y-Raise':                'rE4v5xS7-Vo',

  // Lower A — Quad Focus
  'DB Goblet Squat':              'Fd6nDkgAn0w',
  'DB Romanian Deadlift':         'aa57T45iFSE',
  'DB Reverse Lunge':             'GcYirgCLhnI',
  'Reverse Lunge':                'GcYirgCLhnI',
  'Kettlebell Swing':             'pA6o-a3y1Vo',
  'DB Calf Raise':                'SRUtMJ0tE2A',
  'DB Hip Thrust':                'xDmFkJxPzeM',
  'Hanging Knee Raise':           'l7OroezzX9k',
  'Plank':                        'B296mZDhrP4',
  'Squat':                        'aclHkVaku9U',
  'Single-Leg Deadlift':          'fFTmFnFhGco',
  'Glute Bridge':                 'OUgsJ8-Vi0E',
  'Calf Raise':                   'SRUtMJ0tE2A',

  // Upper B — Pull
  'Lat Pulldown':                 '83Y3CFcgnkQ',
  'Seated Cable Row':             '7BkgqzC6WsM',
  'DB Incline Curl':              'rAx_tf13V5k',
  'DB Hammer Curl':               'FNvndC4Ov04',
  'Cable Crossover':              '4Y8QgiT2-OA',
  'DB Chest-Supported Row':       'pxWHSpzpUww',
  'DB Bent-over Row':             'roCP3ARkGKQ',
  'DB Chest Fly':                 'eozdVDA78K0',
  'Pull-Up':                      'eGo4IYlbE5g',
  'Inverted Row':                 'BPRaFprpJFs',
  'DB Concentration Curl':        'VMbDQ8PZazY',
  'Superman Hold':                'z6PJMT2y8GQ',

  // Lower B — Posterior Chain
  'DB Bulgarian Split Squat':     'hiLF_pF3EJM',
  'DB Stiff-Leg Deadlift':        'KE2A7G_nDc8',
  'Cable Pull-Through':           'yXopOhzEoeo',
  'DB Step-Up':                   'DxUNi119Qzs',
  'DB Calf Raise (seated)':       'ORY-ke6vcgk',
  'Cable Pallof Press':           'dBAmQ9bx3JA',
  'Single-Leg Glute Bridge':      'OSa78SRdkag',
  'Nordic Curl':                  'd5v3qiQCWbk',
  'Side Plank':                   '_rdfjFSFKMY',
};

/** Returns a YouTube embed URL for a given exercise name, or undefined. */
export function getVideoEmbedUrl(exerciseName: string): string | undefined {
  const id = EXERCISE_VIDEOS[exerciseName];
  if (!id) return undefined;
  return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`;
}

/** Returns a YouTube watch URL for a given exercise name, or undefined. */
export function getVideoWatchUrl(exerciseName: string): string | undefined {
  const id = EXERCISE_VIDEOS[exerciseName];
  if (!id) return undefined;
  return `https://www.youtube.com/watch?v=${id}`;
}
