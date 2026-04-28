Re-run the KIC Collab Portal database setup script.

This will:
1. Create all 6 tables (users, sections, section_votes, ideas, idea_votes, notes) using CREATE TABLE IF NOT EXISTS — safe on an existing database
2. Seed all team members and demo users with bcrypt-hashed password123
3. Seed the sample ideas and note from user-details.md

Run the setup script now:

```bash
cd "c:/Users/sentr/Downloads/Mzi Stuff/Jaco/kic-collab-tool"
npm run setup-db
```

Then confirm:
- All 8 users are listed in output
- No error lines appear
- "Database setup complete!" is shown at the end

If the script fails with a connection error, check that DATABASE_URL in .env.local is correct and that the Neon database is reachable.
