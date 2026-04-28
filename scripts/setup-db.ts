import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('🔌 Connected to Neon database');

    await client.query('BEGIN');

    // ── Schema ────────────────────────────────────────────────────────────────

    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key      VARCHAR(10) UNIQUE NOT NULL,
        name     VARCHAR(60) NOT NULL,
        domain   VARCHAR(100),
        logo     VARCHAR(100),
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    console.log('✅ companies table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email                VARCHAR(255) UNIQUE NOT NULL,
        real_name            VARCHAR(100) NOT NULL,
        password_hash        TEXT NOT NULL,
        must_change_password BOOLEAN NOT NULL DEFAULT true,
        role                 VARCHAR(10) NOT NULL DEFAULT 'User'
                               CHECK (role IN ('User', 'Admin')),
        is_active            BOOLEAN NOT NULL DEFAULT true,
        screen_name          VARCHAR(50),
        avatar               VARCHAR(10),
        color                VARCHAR(9),
        profile_complete     BOOLEAN NOT NULL DEFAULT false,
        created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
        last_login_at        TIMESTAMPTZ
      );
    `);
    console.log('✅ users table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS sections (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company     VARCHAR(10) NOT NULL
                      CHECK (company IN ('cbt', 'cbs', 'kic', 'ppms')),
        name        VARCHAR(40) NOT NULL,
        description TEXT,
        status      VARCHAR(10) NOT NULL DEFAULT 'proposed'
                      CHECK (status IN ('proposed', 'approved', 'rejected')),
        votes_up    INTEGER NOT NULL DEFAULT 0,
        votes_down  INTEGER NOT NULL DEFAULT 0,
        created_by  UUID NOT NULL REFERENCES users(id),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    console.log('✅ sections table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS section_votes (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
        user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        direction  VARCHAR(4) NOT NULL CHECK (direction IN ('up', 'down')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (section_id, user_id)
      );
    `);
    console.log('✅ section_votes table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS ideas (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company     VARCHAR(10) NOT NULL
                      CHECK (company IN ('cbt', 'cbs', 'kic', 'ppms')),
        category    VARCHAR(20) NOT NULL
                      CHECK (category IN ('Content', 'Design', 'Strategy', 'About')),
        section_id  UUID REFERENCES sections(id) ON DELETE SET NULL,
        title       VARCHAR(80) NOT NULL,
        description TEXT,
        status      VARCHAR(15) NOT NULL DEFAULT 'new'
                      CHECK (status IN ('new', 'discussed', 'approved', 'implemented')),
        votes_up    INTEGER NOT NULL DEFAULT 0,
        votes_down  INTEGER NOT NULL DEFAULT 0,
        created_by  UUID NOT NULL REFERENCES users(id),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    console.log('✅ ideas table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS idea_votes (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        idea_id    UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
        user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        direction  VARCHAR(4) NOT NULL CHECK (direction IN ('up', 'down')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (idea_id, user_id)
      );
    `);
    console.log('✅ idea_votes table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        idea_id    UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
        content    VARCHAR(300) NOT NULL,
        created_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    console.log('✅ notes table ready');

    // ── Seed users ────────────────────────────────────────────────────────────

    const hash = await bcrypt.hash('password123', 12);
    console.log('🔑 Password hash generated');

    const users = [
      {
        email: 'masitlaem@gmail.com',
        real_name: 'Masitla',
        role: 'Admin',
        screen_name: 'Masitla',
        avatar: '🎯',
        color: '#8E24AA',
        profile_complete: true,
        must_change_password: true,
      },
      {
        email: 'jaco.h.duplooy@gmail.com',
        real_name: 'Jaco',
        role: 'User',
        screen_name: 'Jaco',
        avatar: '🎭',
        color: '#FFB300',
        profile_complete: true,
        must_change_password: true,
      },
      {
        email: 'designer@k-i-c.co.za',
        real_name: 'Designer',
        role: 'User',
        screen_name: 'Designer',
        avatar: '🎨',
        color: '#5C6BC0',
        profile_complete: true,
        must_change_password: true,
      },
      {
        email: 'leeannfry@gmail.com',
        real_name: 'Leeann',
        role: 'User',
        screen_name: null,
        avatar: null,
        color: null,
        profile_complete: false,
        must_change_password: true,
      },
      {
        email: 'albert.duplooy05@gmail.com',
        real_name: 'Albert',
        role: 'User',
        screen_name: null,
        avatar: null,
        color: null,
        profile_complete: false,
        must_change_password: true,
      },
      // Demo accounts — pre-completed profiles, no forced password change
      {
        email: 'demo@email.com',
        real_name: 'Demo User',
        role: 'User',
        screen_name: 'Demo',
        avatar: '🚀',
        color: '#2EC4B6',
        profile_complete: true,
        must_change_password: false,
      },
      {
        email: 'demo1@email.com',
        real_name: 'Demo User 1',
        role: 'User',
        screen_name: 'Demo1',
        avatar: '💡',
        color: '#FF6B6B',
        profile_complete: true,
        must_change_password: false,
      },
      {
        email: 'demo2@email.com',
        real_name: 'Demo User 2',
        role: 'User',
        screen_name: 'Demo2',
        avatar: '🎯',
        color: '#43A047',
        profile_complete: true,
        must_change_password: false,
      },
    ];

    for (const u of users) {
      await client.query(
        `INSERT INTO users (email, real_name, password_hash, role, must_change_password,
           screen_name, avatar, color, profile_complete)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (email) DO UPDATE SET
           real_name = EXCLUDED.real_name,
           role = EXCLUDED.role,
           screen_name = COALESCE(EXCLUDED.screen_name, users.screen_name),
           avatar = COALESCE(EXCLUDED.avatar, users.avatar),
           color = COALESCE(EXCLUDED.color, users.color),
           profile_complete = EXCLUDED.profile_complete,
           updated_at = now()`,
        [u.email, u.real_name, hash, u.role, u.must_change_password,
         u.screen_name, u.avatar, u.color, u.profile_complete]
      );
      console.log(`👤 Seeded user: ${u.email}`);
    }

    // ── Seed ideas from user-details.md ───────────────────────────────────────

    const designerRow = await client.query(
      'SELECT id FROM users WHERE email = $1', ['designer@k-i-c.co.za']
    );
    const jacoRow = await client.query(
      'SELECT id FROM users WHERE email = $1', ['jaco.h.duplooy@gmail.com']
    );

    const designerId = designerRow.rows[0]?.id;
    const jacoId = jacoRow.rows[0]?.id;

    if (designerId && jacoId) {
      // Idea 1: Services (cbt, About) by designer
      const idea1 = await client.query(
        `INSERT INTO ideas (company, category, title, description, created_by)
         VALUES ('cbt', 'About', 'Services', 'build mobile apps', $1)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [designerId]
      );

      // Idea 2: Branch (cbs, Content) by jaco with 1 upvote from designer
      const idea2 = await client.query(
        `INSERT INTO ideas (company, category, title, description, votes_up, created_by)
         VALUES ('cbs', 'Content', 'Branch',
           'Add the section about how we start a branch for a company with the calculator.',
           1, $1)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [jacoId]
      );

      if (idea2.rows[0]?.id) {
        const branchId = idea2.rows[0].id;
        await client.query(
          `INSERT INTO idea_votes (idea_id, user_id, direction)
           VALUES ($1, $2, 'up')
           ON CONFLICT DO NOTHING`,
          [branchId, designerId]
        );

        // Note on Branch idea from designer
        await client.query(
          `INSERT INTO notes (idea_id, content, created_by)
           VALUES ($1, 'notes add testing. how about few more sections', $2)`,
          [branchId, designerId]
        );
        console.log('📝 Seeded Branch idea with vote and note');
      }

      if (idea1.rows[0]?.id) {
        console.log('💡 Seeded Services idea');
      }
    }

    await client.query('COMMIT');
    console.log('\n✅ Database setup complete!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Setup failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
