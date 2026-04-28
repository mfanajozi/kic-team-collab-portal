import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await query(
      `SELECT id, email, real_name, role, is_active, screen_name, avatar, color,
              profile_complete, last_login_at, created_at
       FROM users ORDER BY created_at ASC`
    );

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error('Admin get users error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email, real_name, role, password } = await req.json();

    if (!email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    if (!real_name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (!['User', 'Admin'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    if (!password || password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 chars' }, { status: 400 });

    const hash = await bcrypt.hash(password, 12);

    const result = await query(
      `INSERT INTO users (email, real_name, password_hash, role, must_change_password)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, email, real_name, role`,
      [email.toLowerCase().trim(), real_name.trim(), hash, role]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'code' in err && (err as {code:string}).code === '23505') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }
    console.error('Admin create user error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
