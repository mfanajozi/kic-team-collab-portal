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

    const ideaId = params.id;

    // Get existing vote
    const existing = await query<{ id: string; direction: string }>(
      'SELECT id, direction FROM idea_votes WHERE idea_id = $1 AND user_id = $2',
      [ideaId, session.sub]
    );

    if (existing.rows[0]) {
      const prev = existing.rows[0].direction;
      const voteId = existing.rows[0].id;

      if (prev === direction) {
        // Toggle off (retract vote)
        await query('DELETE FROM idea_votes WHERE id = $1', [voteId]);
        const col = direction === 'up' ? 'votes_up' : 'votes_down';
        await query(`UPDATE ideas SET ${col} = GREATEST(${col} - 1, 0), updated_at = now() WHERE id = $1`, [ideaId]);
      } else {
        // Switch direction
        await query('UPDATE idea_votes SET direction = $1 WHERE id = $2', [direction, voteId]);
        const add = direction === 'up' ? 'votes_up' : 'votes_down';
        const sub = direction === 'up' ? 'votes_down' : 'votes_up';
        await query(
          `UPDATE ideas SET ${add} = ${add} + 1, ${sub} = GREATEST(${sub} - 1, 0), updated_at = now() WHERE id = $1`,
          [ideaId]
        );
      }
    } else {
      // New vote
      await query(
        'INSERT INTO idea_votes (idea_id, user_id, direction) VALUES ($1, $2, $3)',
        [ideaId, session.sub, direction]
      );
      const col = direction === 'up' ? 'votes_up' : 'votes_down';
      await query(`UPDATE ideas SET ${col} = ${col} + 1, updated_at = now() WHERE id = $1`, [ideaId]);
    }

    // Check auto status escalation
    const idea = await query<{ votes_up: number; status: string }>(
      'SELECT votes_up, status FROM ideas WHERE id = $1',
      [ideaId]
    );
    if (idea.rows[0]) {
      const { votes_up, status } = idea.rows[0];
      // Check total votes for 'discussed'
      const totalVotes = await query<{ cnt: string }>(
        'SELECT COUNT(*) AS cnt FROM idea_votes WHERE idea_id = $1',
        [ideaId]
      );
      const total = parseInt(totalVotes.rows[0]?.cnt ?? '0', 10);

      if (votes_up >= 4 && status !== 'approved' && status !== 'implemented') {
        await query("UPDATE ideas SET status = 'approved', updated_at = now() WHERE id = $1", [ideaId]);
      } else if (total >= 3 && status === 'new') {
        await query("UPDATE ideas SET status = 'discussed', updated_at = now() WHERE id = $1", [ideaId]);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Vote error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
