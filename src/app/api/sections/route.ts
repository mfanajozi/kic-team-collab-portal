import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

const VALID_COMPANIES = ['cbt', 'cbs', 'kic', 'ppms'];

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const company = searchParams.get('company');

    const params: string[] = [];
    let where = '';
    if (company) { where = 'WHERE s.company = $1'; params.push(company); }

    const userIdx = params.length + 1;

    const result = await query(`
      SELECT
        s.*,
        COALESCE(u.screen_name, u.real_name) AS author_name,
        COALESCE(u.avatar, '👤') AS author_avatar,
        sv.direction AS user_vote
      FROM sections s
      JOIN users u ON u.id = s.created_by
      LEFT JOIN section_votes sv ON sv.section_id = s.id AND sv.user_id = $${userIdx}
      ${where}
      ORDER BY s.created_at DESC
    `, [...params, session.sub]);

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error('Get sections error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { company, name, description } = await req.json();

    if (!company || !VALID_COMPANIES.includes(company)) {
      return NextResponse.json({ error: 'Invalid company' }, { status: 400 });
    }
    if (!name?.trim() || name.trim().length > 40) {
      return NextResponse.json({ error: 'Section name is required (max 40 chars)' }, { status: 400 });
    }

    const result = await query(
      'INSERT INTO sections (company, name, description, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [company, name.trim(), description ?? null, session.sub]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error('Create section error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
