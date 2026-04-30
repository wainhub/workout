import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Optional webhook secret verification
  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (webhookSecret) {
    const headerSecret = req.headers.get('x-webhook-secret');
    if (headerSecret !== webhookSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let body: { record?: { email?: string; created_at?: string } };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = body?.record?.email ?? 'unknown';
  const signupTime = body?.record?.created_at
    ? new Date(body.record.created_at).toLocaleString('en-US', {
        timeZone: 'America/New_York',
        dateStyle: 'long',
        timeStyle: 'short',
      })
    : new Date().toLocaleString('en-US', {
        timeZone: 'America/New_York',
        dateStyle: 'long',
        timeStyle: 'short',
      });

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0a0a0a; color: #fff; border-radius: 14px;">
      <h2 style="margin: 0 0 24px; font-size: 22px; font-weight: 700; color: #a1f0c2;">New user signed up 🎉</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; color: rgba(255,255,255,0.5); font-size: 13px; width: 120px;">Email</td>
          <td style="padding: 10px 0; font-size: 14px; font-weight: 600;">${email}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: rgba(255,255,255,0.5); font-size: 13px;">Signed up</td>
          <td style="padding: 10px 0; font-size: 14px;">${signupTime} ET</td>
        </tr>
      </table>
      <p style="margin: 24px 0 0; font-size: 12px; color: rgba(255,255,255,0.3);">
        Workout App — <a href="https://workout-flax-two.vercel.app" style="color: #a1f0c2; text-decoration: none;">workout-flax-two.vercel.app</a>
      </p>
    </div>
  `;

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error('RESEND_API_KEY not set');
    return NextResponse.json({ ok: true, warn: 'RESEND_API_KEY not configured' });
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'wain@kellum.net',
      to: 'wain@kellum.net',
      subject: 'New user signed up 🎉',
      html: htmlBody,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Resend error:', err);
    return NextResponse.json({ ok: false, error: err }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
