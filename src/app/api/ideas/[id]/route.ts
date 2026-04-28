import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

const VALID_CATEGORIES = ['Content', 'Design', 'Strategy', 'About'];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const ideaId = params.id;

    // Verify ownership
    const check = await query('SELECT created_by FROM ideas WHERE id = $1', [ideaId]);
    if (!check.rows[0]) return NextResponse.json({ error: 'Idea not found' }, { status: 404 });

    if (check.rows[0].created_by !== session.sub && session.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { category, section_id, title, description } = await req.json();

    if (category && !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }
    if (title !== undefined && (!title?.trim() || title.trim().length > 80)) {
      return NextResponse.json({ error: 'Title is required (max 80 chars)' }, { status: 400 });
    }

    await query(
      `UPDATE ideas SET
        category = COALESCE($1, category),
        section_id = $2,
        title = COALESCE($3, title),
        description = $4,
        updated_at = now()
       WHERE id = $5`,
      [category ?? null, section_id ?? null, title?.trim() ?? null, description ?? null, ideaId]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Update idea error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
