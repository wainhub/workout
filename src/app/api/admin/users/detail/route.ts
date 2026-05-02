import { NextRequest, NextResponse } from 'next/server';
import { createClient as createBrowserClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAILS = ['wain@kellum.net', 'wain_kellum@hotmail.com'];

async function getAdminClient(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return { error: 'Unauthorized', status: 403, adminClient: null };

  const browserClient = createBrowserClient();
  const { data: { user }, error: userError } = await browserClient.auth.getUser(token);
  if (userError || !user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    return { error: 'Forbidden', status: 403, adminClient: null };
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || !supabaseUrl) {
    return { error: 'Server configuration error', status: 500, adminClient: null };
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return { error: null, status: 200, adminClient, supabaseUrl, serviceRoleKey };
}

export async function GET(req: NextRequest) {
  const { error, status, adminClient, supabaseUrl, serviceRoleKey } = await getAdminClient(req);
  if (!adminClient) return NextResponse.json({ error }, { status });

  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  // Fetch auth user record
  const { data: authUser, error: authErr } = await adminClient.auth.admin.getUserById(userId);
  if (authErr || !authUser.user) {
    return NextResponse.json({ error: authErr?.message ?? 'User not found' }, { status: 404 });
  }

  // Fetch app state from user_state table
  const dataClient = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: stateRow } = await (dataClient.from('user_state') as any)
    .select('state, updated_at')
    .eq('user_id', userId)
    .single();

  return NextResponse.json({
    user: authUser.user,
    appState: stateRow?.state ?? null,
    stateUpdatedAt: stateRow?.updated_at ?? null,
  });
}
