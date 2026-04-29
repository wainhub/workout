import { NextRequest, NextResponse } from 'next/server';
import { createClient as createBrowserClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  // Get user from token (optional — anonymous feedback not supported)
  let userEmail = 'unknown';
  let userId: string | null = null;
  if (token) {
    const browserClient = createBrowserClient();
    const { data: { user } } = await browserClient.auth.getUser(token);
    if (user) { userEmail = user.email ?? 'unknown'; userId = user.id; }
  }

  const { message } = await req.json().catch(() => ({ message: '' }));
  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  // Insert into feedback table via service role
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: dbError } = await (adminClient.from('feedback') as any).insert({
    user_id: userId,
    email: userEmail,
    message: message.trim(),
  });

  if (dbError) {
    console.error('[feedback] DB error:', dbError);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  // Send email notification via Resend
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: 'wain@kellum.net',
        subject: '💬 New app feedback',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0a0a0a; color: #fff; border-radius: 14px;">
            <h2 style="margin: 0 0 20px; font-size: 22px; font-weight: 700; color: #a1f0c2;">New feedback 💬</h2>
            <p style="font-size: 13px; color: rgba(255,255,255,0.5); margin: 0 0 6px;">From: <strong style="color:#fff;">${userEmail}</strong></p>
            <div style="margin: 16px 0; padding: 16px; background: rgba(255,255,255,0.06); border-radius: 10px; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${message.trim()}</div>
            <p style="margin: 24px 0 0; font-size: 12px; color: rgba(255,255,255,0.3);">Workout App — <a href="https://workout-flax-two.vercel.app/admin" style="color: #a1f0c2;">View in admin panel</a></p>
          </div>
        `,
      }),
    }).catch(e => console.error('[feedback] Resend error:', e));
  }

  return NextResponse.json({ ok: true });
}
