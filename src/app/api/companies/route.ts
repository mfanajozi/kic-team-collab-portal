import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { unlink } from 'fs/promises';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await query(`
      SELECT key, name, domain, logo, is_active, created_at
      FROM companies
      WHERE is_active = true
      ORDER BY created_at ASC
    `);

    const statsResult = await query(`
      SELECT
        company,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'approved')::int AS approved,
        MAX(created_at) AS last_activity
      FROM ideas
      GROUP BY company
    `);

    const stats = result.rows.map((co) => {
      const row = statsResult.rows.find((r) => r.company === co.key);
      return {
        key: co.key,
        name: co.name,
        domain: co.domain,
        logo: co.logo,
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

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.role !== 'Admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { key, name, domain, logo } = body;

    if (!key || !name) {
      return NextResponse.json({ error: 'Key and name are required' }, { status: 400 });
    }

    if (key.length > 10) {
      return NextResponse.json({ error: 'Key must be 10 characters or less' }, { status: 400 });
    }

    const existing = await query('SELECT id FROM companies WHERE key = $1', [key.toLowerCase()]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Company with this key already exists' }, { status: 409 });
    }

    const result = await query(
      `INSERT INTO companies (key, name, domain, logo)
       VALUES ($1, $2, $3, $4)
       RETURNING key, name, domain, logo`,
      [key.toLowerCase(), name, domain || null, logo || null]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error('Create company error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.role !== 'Admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Company key is required' }, { status: 400 });
    }

    const company = await query('SELECT key, logo FROM companies WHERE key = $1', [key]);
    if (company.rows.length === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (company.rows[0].logo && company.rows[0].logo.startsWith('images/company-logos/')) {
      try {
        await unlink(`public/${company.rows[0].logo}`);
      } catch {}
    }

    await query('DELETE FROM companies WHERE key = $1', [key]);

    return NextResponse.json({ message: 'Company deleted' });
  } catch (err) {
    console.error('Delete company error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
