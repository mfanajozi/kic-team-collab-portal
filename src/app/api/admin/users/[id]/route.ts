import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email, real_name, role, is_active } = await req.json();

    const updates: string[] = [];
    const vals: (string | boolean)[] = [];
    let idx = 1;

    if (email !== undefined) { updates.push(`email = $${idx++}`); vals.push(email.toLowerCase().trim()); }
    if (real_name !== undefined) { updates.push(`real_name = $${idx++}`); vals.push(real_name.trim()); }
    if (role !== undefined && ['User', 'Admin'].includes(role)) { updates.push(`role = $${idx++}`); vals.push(role); }
    if (is_active !== undefined) { updates.push(`is_active = $${idx++}`); vals.push(is_active); }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push(`updated_at = now()`);
    vals.push(params.id);

    await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`,
      vals
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Admin update user error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
