import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await query(
      'SELECT id, email, real_name, screen_name, avatar, color, role, profile_complete FROM users WHERE id = $1',
      [session.sub]
    );

    const user = result.rows[0];
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json(user);
  } catch (err) {
    console.error('Get me error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
