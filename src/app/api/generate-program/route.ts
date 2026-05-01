import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import type { IntakeAnswers, Program, Day, Exercise } from '@/lib/types';
import { getVideoEmbedUrl } from '@/lib/videos';

const client = new Anthropic();

const SYSTEM_PROMPT = `You are an expert coach covering strength training, mobility, and cardio conditioning. Given a user's intake answers, return a complete, personalized program as valid JSON.

━━ GENERAL RULES ━━
- Cap days at the user's actual number (up to 7) — do NOT cap at 4
- Day IDs must be sequential starting from 1
- Match session length: 30 min = 3-4 exercises, 45 min = 5, 60 min = 6, 75+ min = 7-8
- Respect injuries always: lower_back → no heavy deadlifts/good mornings; knees → no deep squats/lunges, use step-ups/leg press; shoulder_inj → no overhead press/upright rows
- Apply emphasis: add 1 extra exercise per focus area listed when session length allows (user may select multiple areas)

━━ EQUIPMENT RULES — HARD CONSTRAINTS, NON-NEGOTIABLE ━━
- full_gym: barbells, cables, machines, dumbbells, all OK
- garage: barbell + rack + dumbbells ONLY — no cables, no machines, no cable crossovers, no lat pulldowns, no leg press
- home_db: dumbbells + bench ONLY — no cables, no machines, no barbells. Use DB rows not cable rows. Use DB presses not bench press.
- bw (bodyweight only): NO dumbbells, NO barbells, NO cables, NO machines, NO kettlebells. Every exercise must be bodyweight only (push-ups, pull-ups, dips, lunges, squats, planks, etc.). Set weight=0 and unit="BW" for all exercises.
After writing the program, audit every exercise against the user's equipment. If any exercise requires equipment not available, replace it with an equivalent that uses only available equipment. Do not trust defaults — explicitly verify each exercise against the constraint.

━━ GOAL-SPECIFIC RULES — APPLY BASED ON USER'S STATED GOAL ━━
IF goal = "Build Muscle (hypertrophy)":
  - Rep ranges: 8-12 for isolation, 6-10 for compounds
  - Tempo cues, controlled eccentric emphasized
  - Split: Upper/Lower or PPL for 4+ days
  - Focus on progressive overload, mind-muscle connection

IF goal = "Get Stronger (strength)":
  - Rep ranges: 3-6, heavy compounds first, accessories 6-8 reps
  - RPE cues, longer rest periods (2-3 min)
  - Split: powerlifting-style or conjugate for 4+ days
  - Focus on the big lifts: squat, bench, deadlift, press variants

IF goal = "Lose Fat (fat loss)":
  - Rep ranges: 12-20, circuit pairings noted in cues
  - Short rest (45-60s), supersets where possible
  - Higher volume, metabolic emphasis

IF goal = "General Fitness":
  - 3 full-body days (for 3 days/week), or Upper/Lower split (for 4 days)
  - Mixed compound + isolation, moderate volume (3-4 sets, 10-15 reps)
  - Conditioning finisher when session time allows
  - Approachable, balanced — NOT a hypertrophy-specific program
  - Do NOT use hypertrophy terminology in cues

IF goal = "Stay in Shape":
  - Mix of strength + conditioning, low time commitment
  - Full-body workouts, 3 sets of 12-15 reps
  - Include at least one cardio finisher per session

- Match experience: beginner = simpler compounds, fewer exercises; advanced = more volume, intensifiers
- For 5+ day programs use PPL or Upper/Lower/Full hybrid splits

━━ WEIGHT CALIBRATION — ANCHOR TO BODYWEIGHT, NOT GENDER ━━
The user will provide their bodyweight in pounds. Use these bodyweight-relative starting weights:

  Barbell bench press:   beginner=0.35×BW, intermediate=0.55×BW, advanced=0.8×BW
  Barbell squat:         beginner=0.5×BW,  intermediate=0.8×BW,  advanced=1.1×BW
  Barbell deadlift:      beginner=0.6×BW,  intermediate=0.9×BW,  advanced=1.3×BW
  Barbell overhead press: beginner=0.2×BW, intermediate=0.35×BW, advanced=0.55×BW
  DB compound (ea.):     beginner=0.08×BW, intermediate=0.14×BW, advanced=0.2×BW
  DB isolation (ea.):    beginner=0.04×BW, intermediate=0.08×BW, advanced=0.12×BW

Round all calculated weights to the nearest 5 lb. If the user's bodyweight is unknown, default to 140 lb to avoid over-estimating.
ALWAYS use the lower end: it is far better to start too light than too heavy. The user will adjust from session one.

Experience level mapping: beginner = "Just starting out", intermediate = "6 months – 2 years", advanced = "2+ years"

━━ FLEXIBILITY GOAL ━━
- All exercises: weight = 0, unit = "sec" for holds (30-60 sec typical), or "ea. BW" for dynamic reps
- Structure days as: Upper Mobility, Lower Mobility, Full Body Flow, Restore & Recover (for 4 days; drop days from the end for fewer)
- Include dynamic warm-up movements (cat-cow, hip circles, inchworm) and static holds (pigeon, couch stretch, hamstring stretch)
- Injury adaptation: lower_back → avoid full forward folds, include gentle cat-cow and supine stretches; knees → avoid deep lunges, use seated or lying hip stretches; shoulder_inj → avoid behind-head stretches
- Emphasis: upper body focus = more thoracic and shoulder mobility; lower body focus = more hip flexor, hamstring, quad work; hips/glutes = add pigeon pose variants and figure-4 stretches
- Cues should be breath-focused and relaxation-oriented ("breathe into the stretch", "let gravity do the work")
- type field: use "Compound" for dynamic movements, "Isolation" for holds

━━ CARDIO GOAL ━━
- All exercises: weight = 0, unit = "sec" for intervals, "min" for sustained bouts, "BW" for rep-based
- Structure days as: HIIT (short intervals), Steady State (zone 2), Circuit (strength-cardio mix), Endurance Intervals (for 4 days)
- HIIT: 20-30 sec work / 30-60 sec rest intervals; burpees, mountain climbers, jump squats, high knees
- Steady state: 20-40 min continuous effort; run, bike, row, jump rope, incline walk
- Circuit: bodyweight exercises in rounds (push-ups, squats, planks, burpees) — note "no rest within round" in cues
- Endurance: tempo intervals 2-3 min work / 1 min recovery
- Adapt to equipment: full_gym/garage = can use rower, bike, treadmill (note in cue); home/bw = jump rope, outdoor run, bodyweight circuits
- type field: use "Compound" for everything cardiovascular

━━ OUTPUT FORMAT ━━
Return ONLY valid JSON matching this TypeScript shape — no markdown, no code fences, no text outside the object:
{
  "days": [
    {
      "id": 1,
      "name": "Upper A",
      "focus": "Push · Chest · Shoulders · Triceps",
      "exercises": [
        {
          "name": "exercise name",
          "sets": 4,
          "reps": 10,
          "weight": 135,
          "unit": "lb" | "lb ea." | "BW" | "sec" | "sec ea." | "ea. BW" | "min" | "lb KB",
          "type": "Compound" | "Isolation",
          "cue": "1-2 sentence coaching cue"
        }
      ]
    }
  ],
  "reasoning": "3-4 sentences explaining why this specific program fits this user's goal, experience, equipment, and any constraints"
}`;

function buildUserPrompt(answers: IntakeAnswers): string {
  const goalMap: Record<string, string> = {
    hypertrophy:  'Build Muscle (hypertrophy)',
    strength:     'Get Stronger (strength)',
    fat_loss:     'Lose Fat (fat loss)',
    general:      'General Fitness',
    flexibility:  'Improve Flexibility & Mobility',
    cardio:       'Build Cardio / Endurance',
  };
  const expMap: Record<string, string> = {
    beginner: 'New to lifting (beginner)',
    intermediate: '6 months – 2 years (intermediate)',
    advanced: '2+ years (advanced)',
  };
  const equipMap: Record<string, string> = {
    full_gym: 'Full commercial gym (cables, machines, free weights)',
    home_db: 'Home dumbbells + bench only',
    garage: 'Garage gym (barbell + rack + dumbbells)',
    bw: 'Bodyweight only (no equipment)',
  };
  const injuryMap: Record<string, string> = {
    none: 'No injuries',
    lower_back: 'Lower back issues',
    knees: 'Knee issues',
    shoulder_inj: 'Shoulder issues',
  };

  const equip = answers.equipment ?? 'full_gym';
  const equipWhitelist: Record<string, string> = {
    full_gym: 'barbells, dumbbells, cables, machines, pull-up bar, kettlebells',
    home_db:  'dumbbells, bench — NOTHING ELSE. No barbells, no cables, no machines.',
    garage:   'barbell, rack, dumbbells — NOTHING ELSE. No cables, no machines.',
    bw:       'bodyweight only — NO equipment at all. No dumbbells, no barbells, no cables, no kettlebells.',
  };

  const genderMap: Record<string, string> = {
    male: 'Male',
    female: 'Female',
    other: 'Non-binary / other',
  };

  const gender = answers.gender ?? 'unspecified';
  const bodyweightLb = answers.bodyweight ? Number(answers.bodyweight) : null;

  return `Build me a personalized program with these details:
- Goal: ${goalMap[answers.goal ?? 'general'] ?? answers.goal}
- Gender: ${genderMap[gender] ?? gender}
- Experience: ${expMap[answers.experience ?? 'beginner'] ?? answers.experience}
- Bodyweight: ${bodyweightLb ? `${bodyweightLb} lb` : 'not provided — use 140 lb as default'}
- Days per week: ${answers.days ?? 4}
- Session length: ${answers.session ?? 60} minutes
- Equipment available: ${equipMap[equip] ?? equip}
- EQUIPMENT WHITELIST (only these are allowed): ${equipWhitelist[equip] ?? equipWhitelist.full_gym}
- Emphasis: ${(!answers.emphasis || answers.emphasis === 'none') ? 'No specific emphasis' : answers.emphasis.split(',').map((e: string) => ({ upper: 'Upper body', lower: 'Lower body', core: 'Core', arms: 'Arms', hips: 'Hips & glutes' } as Record<string, string>)[e.trim()] ?? e).join(' + ')}
- Injuries/limitations: ${injuryMap[answers.injuries ?? 'none'] ?? answers.injuries}

CRITICAL: Use the WEIGHT CALIBRATION table (bodyweight × multiplier for this experience level) to calculate all starting weights. Bodyweight = ${bodyweightLb ?? 140} lb. Do NOT use hardcoded defaults — calculate each weight from the formula and round to nearest 5 lb.
Every exercise must use ONLY the equipment whitelist above. After writing, verify each exercise and replace any violations.
The "reasoning" field must reference this user's actual goal, experience, bodyweight, and starting weights — no generic boilerplate.`;
}

function attachVideos(days: Day[]): Day[] {
  return days.map(day => ({
    ...day,
    exercises: day.exercises.map(ex => ({
      ...ex,
      videoUrl: getVideoEmbedUrl(ex.name),
    })),
  }));
}

export async function POST(req: NextRequest) {
  try {
    const { answers }: { answers: IntakeAnswers } = await req.json();

    if (!answers) {
      return NextResponse.json({ error: 'Missing answers' }, { status: 400 });
    }

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(answers) }],
    });

    const rawText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Strip any accidental markdown fences
    const jsonText = rawText.replace(/```(?:json)?/g, '').trim();
    const parsed = JSON.parse(jsonText) as { days: Day[]; reasoning: string };

    const goalLabel: Record<string, string> = {
      hypertrophy:  'Build Muscle',
      strength:     'Get Stronger',
      fat_loss:     'Fat Loss',
      general:      'General Fitness',
      flexibility:  'Flexibility & Mobility',
      cardio:       'Cardio & Endurance',
    };
    const goal = answers.goal ?? 'general';
    const daysCount = Number(answers.days ?? 4);

    const program: Program = {
      id: `p-${Date.now()}`,
      name: goalLabel[goal] ?? 'General Fitness',
      goal: goalLabel[goal] ?? 'General Fitness',
      weeks: 12,
      daysPerWeek: daysCount,
      days: attachVideos(parsed.days),
      daysCompleted: 0,
      totalDays: daysCount * 12,
      weeksCompleted: 0,
      reasoning: parsed.reasoning,
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      }),
    };

    return NextResponse.json({ program });
  } catch (err) {
    console.error('[generate-program]', err);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
