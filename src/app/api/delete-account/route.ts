import { NextRequest, NextResponse } from 'next/server';
import { createClient as createBrowserClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(req: NextRequest) {
  // 1. Verify the caller is authenticated
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const browserClient = createBrowserClient();
  const { data: { user }, error: userError } = await browserClient.auth.getUser(token);
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Use service role key to delete user data and auth record
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 3. Delete user_state row first
  await adminClient.from('user_state').delete().eq('user_id', user.id);

  // 4. Delete the auth user (cascades anything else tied to auth.uid())
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error('Delete user error:', deleteError);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
