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

  return { error: null, status: 200, adminClient };
}

export async function GET(req: NextRequest) {
  const { error, status, adminClient } = await getAdminClient(req);
  if (!adminClient) return NextResponse.json({ error }, { status });

  const { data, error: listError } = await adminClient.auth.admin.listUsers();
  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });

  return NextResponse.json({ users: data.users });
}

export async function DELETE(req: NextRequest) {
  const { error, status, adminClient } = await getAdminClient(req);
  if (!adminClient) return NextResponse.json({ error }, { status });

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  // Delete user_state first (belt-and-suspenders; cascade should handle it)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const adminClient2 = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (adminClient2.from('user_state') as any).delete().eq('user_id', userId);

  // Delete the auth user
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
