import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession, signSession, COOKIE_NAME } from '@/lib/auth';

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { screen_name, avatar, color } = await req.json();

    if (!screen_name?.trim() || screen_name.trim().length > 20) {
      return NextResponse.json({ error: 'Screen name is required (max 20 chars)' }, { status: 400 });
    }
    if (!avatar) {
      return NextResponse.json({ error: 'Avatar is required' }, { status: 400 });
    }

    const validColors = ['#FF6B6B', '#2EC4B6', '#5C6BC0', '#FFB300', '#43A047', '#E91E63', '#039BE5', '#8E24AA'];
    const selectedColor = validColors.includes(color) ? color : '#5C6BC0';

    await query(
      `UPDATE users SET screen_name = $1, avatar = $2, color = $3, profile_complete = true, updated_at = now()
       WHERE id = $4`,
      [screen_name.trim(), avatar, selectedColor, session.sub]
    );

    // Re-issue JWT with profile_complete = true
    const token = await signSession({
      sub: session.sub,
      email: session.email,
      role: session.role,
      must_change_password: false,
      profile_complete: true,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Profile update error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
