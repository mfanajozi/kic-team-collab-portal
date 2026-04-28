import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await query('DELETE FROM ideas WHERE id = $1', [params.id]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Admin delete idea error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
