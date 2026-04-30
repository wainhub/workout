import { NextResponse } from 'next/server';

/**
 * GET /api/test-notification
 * Sends a test "new user" email via Resend.
 * Open this URL in a browser to verify the full email pipeline works.
 * Remove or protect this route before going public.
 */
export async function GET() {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ ok: false, error: 'RESEND_API_KEY env var is not set in Vercel' }, { status: 500 });
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Workout Coach <wain@kellum.net>',
      to: 'wain@kellum.net',
      subject: '✅ Test notification — email pipeline working',
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0a0a0a; color: #fff; border-radius: 14px;">
          <h2 style="margin: 0 0 16px; color: #a1f0c2;">✅ Test notification</h2>
          <p style="color: rgba(255,255,255,0.7);">
            The Resend API key is valid and email sending works.<br><br>
            Sent at: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'long', timeStyle: 'short' })} ET
          </p>
        </div>
      `,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ ok: false, resendStatus: res.status, error: data }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: 'Test email sent to wain@kellum.net', resendId: data.id });
}
