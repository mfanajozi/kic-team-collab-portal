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

    const { status } = await req.json();

    if (!['approved', 'rejected', 'proposed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await query('UPDATE sections SET status = $1 WHERE id = $2', [status, params.id]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Admin section status error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
