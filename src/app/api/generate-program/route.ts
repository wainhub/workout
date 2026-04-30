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
- Apply emphasis: add 1 extra exercise toward the focus area when session length allows

━━ STRENGTH / FAT LOSS / GENERAL GOALS ━━
- Match experience: beginner = simpler compounds, fewer exercises; advanced = more volume, intensifiers
- Respect equipment: full_gym/garage = barbells+cables+machines+DBs; home_db = DBs+bench ONLY (no cables/machines/barbells); bw = bodyweight ONLY (weight=0, unit="BW")
- Strength goal: rep ranges 3-6, heavy compounds first, RPE cues
- Hypertrophy goal: 8-12 reps isolation, 6-10 compound, tempo cues, controlled eccentric
- Fat loss goal: 12-20 reps, circuit pairings noted in cues, short rest noted
- General: balanced mix, approachable language
- For 5+ day programs use PPL or Upper/Lower/Full hybrid splits
- Weight guidelines (starting, user adjusts): Barbell compounds: 95-135 beginner, 135-185 intermediate, 185-225+ advanced. DB compounds: 20-35 ea beginner, 35-55 intermediate, 55-80+ advanced. Isolation: 10-20 beginner, 20-40 intermediate, 30-60 advanced.

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

  return `Build me a personalized program with these details:
- Goal: ${goalMap[answers.goal ?? 'general'] ?? answers.goal}
- Experience: ${expMap[answers.experience ?? 'beginner'] ?? answers.experience}
- Days per week: ${answers.days ?? 4}
- Session length: ${answers.session ?? 60} minutes
- Equipment: ${equipMap[answers.equipment ?? 'full_gym'] ?? answers.equipment}
- Emphasis: ${answers.emphasis === 'none' ? 'No specific emphasis' : answers.emphasis}
- Injuries/limitations: ${injuryMap[answers.injuries ?? 'none'] ?? answers.injuries}`;
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
