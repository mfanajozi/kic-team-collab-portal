import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { direction } = await req.json();
    if (direction !== 'up' && direction !== 'down') {
      return NextResponse.json({ error: 'direction must be "up" or "down"' }, { status: 400 });
    }

    const sectionId = params.id;
    const existing = await query<{ id: string; direction: string }>(
      'SELECT id, direction FROM section_votes WHERE section_id = $1 AND user_id = $2',
      [sectionId, session.sub]
    );

    if (existing.rows[0]) {
      const prev = existing.rows[0].direction;
      const voteId = existing.rows[0].id;
      if (prev === direction) {
        await query('DELETE FROM section_votes WHERE id = $1', [voteId]);
        const col = direction === 'up' ? 'votes_up' : 'votes_down';
        await query(`UPDATE sections SET ${col} = GREATEST(${col} - 1, 0) WHERE id = $1`, [sectionId]);
      } else {
        await query('UPDATE section_votes SET direction = $1 WHERE id = $2', [direction, voteId]);
        const add = direction === 'up' ? 'votes_up' : 'votes_down';
        const sub = direction === 'up' ? 'votes_down' : 'votes_up';
        await query(
          `UPDATE sections SET ${add} = ${add} + 1, ${sub} = GREATEST(${sub} - 1, 0) WHERE id = $1`,
          [sectionId]
        );
      }
    } else {
      await query(
        'INSERT INTO section_votes (section_id, user_id, direction) VALUES ($1, $2, $3)',
        [sectionId, session.sub, direction]
      );
      const col = direction === 'up' ? 'votes_up' : 'votes_down';
      await query(`UPDATE sections SET ${col} = ${col} + 1 WHERE id = $1`, [sectionId]);
    }

    // Auto-approve if 3+ up-votes
    const section = await query<{ votes_up: number; status: string }>(
      "SELECT votes_up, status FROM sections WHERE id = $1",
      [sectionId]
    );
    if (section.rows[0]?.votes_up >= 3 && section.rows[0]?.status === 'proposed') {
      await query("UPDATE sections SET status = 'approved' WHERE id = $1", [sectionId]);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Section vote error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
