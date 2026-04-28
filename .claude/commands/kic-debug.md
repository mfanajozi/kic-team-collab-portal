Diagnose and fix common runtime errors in the KIC Collab Portal.

Read the error the user has provided and match it to the known issues below, then apply the fix.

---

## "Cannot find module './XXX.js'" (webpack chunk error)

**Cause:** Dev server started while a stale production build exists in `.next/`.

**Fix:**
```bash
cd "c:/Users/sentr/Downloads/Mzi Stuff/Jaco/kic-collab-tool"
rm -rf .next
npm run dev
```

---

## Blank white login page

**Cause:** Same as above — stale `.next/` cache after `npm run build`.

**Fix:** Same — `rm -rf .next` then `npm run dev`.

---

## "JWT_SECRET not set" error in API routes

**Cause:** `.env.local` is missing `JWT_SECRET`, or the dev server was started before the file was saved.

**Fix:**
1. Confirm `.env.local` contains `JWT_SECRET=...`
2. Restart the dev server: stop it, then `npm run dev`

---

## Middleware keeps redirecting to /change-password even after changing password

**Cause:** The API route at `/api/auth/change-password` did not re-issue a new JWT with `must_change_password: false`. The cookie still holds the old token.

**Fix:** Check that `src/app/api/auth/change-password/route.ts` calls `signSession(...)` and sets the new cookie before returning. If it was recently edited, confirm the re-issue logic is present.

---

## "Dynamic server usage" errors in build output

**Cause:** Next.js tries to statically prerender API routes, but they use `cookies()` which requires dynamic rendering.

**This is expected and not an error.** The routes work correctly at runtime. The build still succeeds.

---

## Admin user gets 403 on /admin routes

**Cause:** The `role` value in the database is not exactly `'Admin'` (capital A). The JWT carries whatever is in the DB.

**Fix:** Check the user's role in the database:
```bash
node -e "
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
pool.query('SELECT email, role FROM users').then(r => { console.table(r.rows); pool.end(); });
"
```
If the role is wrong, update it via the admin panel or directly in SQL.

---

## Database connection timeout / ECONNREFUSED

**Cause:** Neon free tier databases pause after inactivity. First request after a cold start can time out.

**Fix:** The connection will succeed on retry. For production, consider using Neon's connection pooler endpoint (the URL already contains `-pooler` — confirm this is in `DATABASE_URL`).

---

## TypeScript error: "Type 'unknown' is not assignable to parameter of type 'string'"

**Cause:** A `query()` call result row is typed as `Record<string, unknown>` (the default) instead of a typed interface.

**Fix:** Add a generic type to the query call:
```typescript
const result = await query<{ id: string; email: string }>('SELECT id, email FROM users WHERE ...');
```
The generic must extend `QueryResultRow` (imported from `pg`).
