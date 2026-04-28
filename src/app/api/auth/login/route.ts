import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { signSession, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const result = await query<{
      id: string;
      email: string;
      password_hash: string;
      role: 'User' | 'Admin';
      is_active: boolean;
      must_change_password: boolean;
      profile_complete: boolean;
    }>(
      'SELECT id, email, password_hash, role, is_active, must_change_password, profile_complete FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    const user = result.rows[0];

    if (!user || !user.is_active) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Update last login
    await query('UPDATE users SET last_login_at = now() WHERE id = $1', [user.id]);

    const token = await signSession({
      sub: user.id,
      email: user.email,
      role: user.role,
      must_change_password: user.must_change_password,
      profile_complete: user.profile_complete,
    });

    const response = NextResponse.json({
      ok: true,
      must_change_password: user.must_change_password,
      profile_complete: user.profile_complete,
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
