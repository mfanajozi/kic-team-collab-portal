import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await query(`
      SELECT
        n.id, n.content, n.created_at,
        COALESCE(u.screen_name, u.real_name) AS author_name,
        COALESCE(u.avatar, '👤') AS author_avatar
      FROM notes n
      JOIN users u ON u.id = n.created_by
      WHERE n.idea_id = $1
      ORDER BY n.created_at ASC
    `, [params.id]);

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error('Get notes error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { content } = await req.json();

    if (!content?.trim() || content.trim().length > 300) {
      return NextResponse.json({ error: 'Note content is required (max 300 chars)' }, { status: 400 });
    }

    const result = await query(
      'INSERT INTO notes (idea_id, content, created_by) VALUES ($1, $2, $3) RETURNING id',
      [params.id, content.trim(), session.sub]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error('Add note error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
