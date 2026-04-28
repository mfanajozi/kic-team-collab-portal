import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ideas = await query(`
      SELECT 
        i.id, i.company, i.category, i.title, i.description, i.status,
        i.votes_up, i.votes_down, i.created_at,
        u.screen_name as author_name, u.avatar as author_avatar
      FROM ideas i
      JOIN users u ON i.created_by = u.id
      ORDER BY i.company, i.category, i.created_at DESC
    `);

    return NextResponse.json(ideas);
  } catch (err) {
    console.error('Admin export error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}