import { NextRequest, NextResponse } from 'next/server';
import { createClient as createBrowserClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAILS = ['wain@kellum.net', 'wain_kellum@hotmail.com'];

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const browserClient = createBrowserClient();
  const { data: { user }, error } = await browserClient.auth.getUser(token);
  if (error || !user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error: dbError } = await (adminClient.from('feedback') as any)
    .select('*')
    .order('created_at', { ascending: false });

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ feedback: data });
}

export async function DELETE(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const browserClient = createBrowserClient();
  const { data: { user }, error } = await browserClient.auth.getUser(token);
  if (error || !user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: dbError } = await (adminClient.from('feedback') as any).delete().eq('id', id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
