Reset a user's password in the KIC Collab Portal and force them to change it on next login.

Ask the user for:
1. The email address of the account to reset
2. The new temporary password (minimum 8 characters), or use `password123` as default

Then run:

```bash
cd "c:/Users/sentr/Downloads/Mzi Stuff/Jaco/kic-collab-tool" && node -e "
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function main() {
  const hash = await bcrypt.hash('TEMP_PASSWORD', 12);
  const res = await pool.query(
    'UPDATE users SET password_hash = \$1, must_change_password = true, updated_at = now() WHERE email = \$2 RETURNING email, must_change_password',
    [hash, 'USER_EMAIL']
  );
  if (res.rowCount === 0) console.log('No user found with that email');
  else console.log('Reset successful:', res.rows[0]);
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
"
```

Replace TEMP_PASSWORD and USER_EMAIL before running.

After the reset, tell the user:
- The account password has been set to the temporary password
- must_change_password is now true — they will be forced to set a new password on their next login
- Their profile and avatar are unchanged
