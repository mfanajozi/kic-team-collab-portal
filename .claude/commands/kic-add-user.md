Add a new user to the KIC Collab Portal database.

Ask the user for:
1. Email address
2. Real name (displayed in admin panel)
3. Role — User or Admin
4. Whether to pre-complete their profile (if yes, ask for screen name, avatar emoji, and hex colour)

Then run a Node.js one-liner via tsx to insert the user. Use this template (fill in the values):

```bash
cd "c:/Users/sentr/Downloads/Mzi Stuff/Jaco/kic-collab-tool" && node -e "
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function main() {
  const hash = await bcrypt.hash('password123', 12);
  const res = await pool.query(
    \`INSERT INTO users (email, real_name, password_hash, role, must_change_password, screen_name, avatar, color, profile_complete)
     VALUES (\$1, \$2, \$3, \$4, true, \$5, \$6, \$7, \$8)
     ON CONFLICT (email) DO NOTHING RETURNING id, email\`,
    ['EMAIL', 'REAL_NAME', hash, 'ROLE', 'SCREEN_NAME_OR_NULL', 'AVATAR_OR_NULL', 'COLOR_OR_NULL', false]
  );
  console.log('Created:', res.rows[0]);
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
"
```

Replace EMAIL, REAL_NAME, ROLE (User or Admin), and profile fields before running.

After inserting, confirm the user was created and remind the human that the default password is `password123` — the user will be forced to change it on first login.

Valid avatar emojis: 🎨 🖌️ ✏️ 🎭 📐 🔮 💡 🌈 💼 📊 🏆 🎯 🌐 📱 🤝 🚀
Valid colour hex values: #FF6B6B #2EC4B6 #5C6BC0 #FFB300 #43A047 #E91E63 #039BE5 #8E24AA
