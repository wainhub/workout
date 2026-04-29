import { NextRequest, NextResponse } from 'next/server';
import { createClient as createBrowserClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'wain@kellum.net';

export async function GET(req: NextRequest) {
  // Verify the requesting user via the Bearer token
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Verify the token with Supabase anon client
  const browserClient = createBrowserClient();
  const { data: { user }, error: userError } = await browserClient.auth.getUser(token);

  if (userError || !user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Use service role key to list all users
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await adminClient.auth.admin.listUsers();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: data.users });
}
