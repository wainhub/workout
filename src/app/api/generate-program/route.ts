import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import type { IntakeAnswers, Program, Day, Exercise } from '@/lib/types';
import { getVideoEmbedUrl } from '@/lib/videos';

const client = new Anthropic();

const SYSTEM_PROMPT = `You are an expert strength and conditioning coach. Given a user's intake answers, you will return a complete, personalized workout program as valid JSON.

RULES:
- Match volume and complexity to the experience level (beginner = fewer exercises, simpler movements; advanced = more volume, intensifiers)
- Match session length: 30 min = 4 exercises, 45 min = 5 exercises, 60 min = 6 exercises, 75+ min = 7-8 exercises
- Respect equipment: never include cable/machine exercises for home_db or bodyweight users
- Respect injuries: lower_back → avoid heavy deadlifts, good mornings; knees → avoid deep squats, lunges, substitute leg press/step-ups; shoulder_inj → avoid overhead press, upright rows
- Apply emphasis: add 1-2 extra exercises for the emphasized muscle group within the session length
- Fat loss goal: slightly higher rep ranges (12-20), more supersets noted in cues, shorter rest cues
- Strength goal: lower rep ranges (3-6), heavier compounds first, RPE-based cues
- Hypertrophy goal: moderate reps (8-12 isolation, 6-10 compound), controlled tempo cues
- General fitness goal: balanced mix, approachable language
- Cap days at the user's actual number (up to 7) — do NOT cap at 4
- For 5+ day programs use Push/Pull/Legs rotation or hybrid splits
- Day IDs must be sequential starting from 1

EQUIPMENT constraints:
- full_gym or garage: may use barbells, cables, machines, dumbbells, bodyweight
- home_db: dumbbells and bench only — NO cables, NO machines, NO barbells
- bw: bodyweight movements only — NO weights at all (weight field = 0, unit = "BW")

WEIGHT guidelines (starting weights, user adjusts):
- Barbell compounds: 95-135 lb for beginner, 135-185 for intermediate, 185-225+ for advanced
- DB compounds: 20-35 lb ea for beginner, 35-55 lb ea for intermediate, 55-80 lb ea for advanced
- Isolation: 10-20 lb for beginner, 20-40 lb for intermediate, 30-60 lb for advanced

Return ONLY valid JSON matching this TypeScript shape exactly:
{
  "days": [
    {
      "id": 1,
      "name": "Upper A",
      "focus": "Push · Chest · Shoulders · Triceps",
      "exercises": [
        {
          "name": "string — exercise name",
          "sets": 4,
          "reps": 10,
          "weight": 135,
          "unit": "lb" or "lb ea." or "BW" or "sec BW" or "lb KB",
          "type": "Compound" or "Isolation",
          "cue": "1-2 sentence coaching cue"
        }
      ]
    }
  ],
  "reasoning": "3-4 sentence personal explanation of why this specific program fits this user's goal, equipment, experience, and constraints"
}

Do not include markdown, code fences, or any text outside the JSON object.`;

function buildUserPrompt(answers: IntakeAnswers): string {
  const goalMap: Record<string, string> = {
    hypertrophy: 'Build Muscle (hypertrophy)',
    strength: 'Get Stronger (strength)',
    fat_loss: 'Lose Fat (fat loss)',
    general: 'General Fitness',
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
      hypertrophy: 'Build Muscle',
      strength: 'Get Stronger',
      fat_loss: 'Fat Loss',
      general: 'General Fitness',
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
