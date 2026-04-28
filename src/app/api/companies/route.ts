import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

const COMPANIES = ['cbt', 'cbs', 'kic', 'ppms'];

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await query(`
      SELECT
        company,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'approved')::int AS approved,
        MAX(created_at) AS last_activity
      FROM ideas
      GROUP BY company
    `);

    const stats = COMPANIES.map((co) => {
      const row = result.rows.find((r) => r.company === co);
      return {
        company: co,
        total: row?.total ?? 0,
        approved: row?.approved ?? 0,
        last_activity: row?.last_activity ?? null,
      };
    });

    return NextResponse.json(stats);
  } catch (err) {
    console.error('Companies error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
