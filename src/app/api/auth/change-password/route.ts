import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { getSession, signSession, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { password } = await req.json();

    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 12);

    await query(
      'UPDATE users SET password_hash = $1, must_change_password = false, updated_at = now() WHERE id = $2',
      [hash, session.sub]
    );

    // Fetch updated profile_complete
    const result = await query('SELECT profile_complete FROM users WHERE id = $1', [session.sub]);
    const profileComplete = result.rows[0]?.profile_complete ?? false;

    // Re-issue JWT with updated flags
    const token = await signSession({
      sub: session.sub,
      email: session.email,
      role: session.role,
      must_change_password: false,
      profile_complete: profileComplete,
    });

    const response = NextResponse.json({ ok: true, profile_complete: profileComplete });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Change password error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
