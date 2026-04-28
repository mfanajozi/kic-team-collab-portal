import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

const VALID_COMPANIES = ['cbt', 'cbs', 'kic', 'ppms'];
const VALID_CATEGORIES = ['Content', 'Design', 'Strategy', 'About'];

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const company = searchParams.get('company');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let idx = 1;

    if (company) { conditions.push(`i.company = $${idx++}`); params.push(company); }
    if (category) { conditions.push(`i.category = $${idx++}`); params.push(category); }
    if (search) {
      conditions.push(`(i.title ILIKE $${idx} OR i.description ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(`
      SELECT
        i.*,
        COALESCE(u.screen_name, u.real_name) AS author_name,
        COALESCE(u.avatar, '👤') AS author_avatar,
        iv.direction AS user_vote,
        COUNT(n.id)::int AS note_count
      FROM ideas i
      JOIN users u ON u.id = i.created_by
      LEFT JOIN idea_votes iv ON iv.idea_id = i.id AND iv.user_id = $${idx}
      LEFT JOIN notes n ON n.idea_id = i.id
      ${where}
      GROUP BY i.id, u.screen_name, u.real_name, u.avatar, iv.direction
      ORDER BY i.created_at DESC
    `, [...params, session.sub]);

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error('Get ideas error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { company, category, section_id, title, description } = await req.json();

    if (!company || !VALID_COMPANIES.includes(company)) {
      return NextResponse.json({ error: 'Invalid company' }, { status: 400 });
    }
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }
    if (!title?.trim() || title.trim().length > 80) {
      return NextResponse.json({ error: 'Title is required (max 80 chars)' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO ideas (company, category, section_id, title, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [company, category, section_id ?? null, title.trim(), description ?? null, session.sub]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error('Create idea error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
