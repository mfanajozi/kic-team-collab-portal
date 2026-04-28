Walk through the Vercel + Neon.tech deployment process for the KIC Collab Portal.

## Pre-flight checks

Run these locally before deploying:

```bash
cd "c:/Users/sentr/Downloads/Mzi Stuff/Jaco/kic-collab-tool"

# 1. Confirm the build passes cleanly
rm -rf .next
npm run build

# 2. Confirm database is seeded (production Neon DB)
npm run setup-db
```

## Environment variables to set in Vercel

Go to Vercel project → Settings → Environment Variables and add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon pooled connection string from .env.local |
| `JWT_SECRET` | The JWT_SECRET value from .env.local |

Do NOT add `NODE_ENV` — Vercel sets this automatically.

## Deployment steps

1. **Push to GitHub** — make sure .env.local and the-tool/ are NOT committed (check .gitignore)
2. **Import in Vercel** — vercel.com/new → import GitHub repo → Next.js detected automatically
3. **Add env vars** — paste DATABASE_URL and JWT_SECRET in Vercel dashboard
4. **Deploy** — Vercel builds and deploys; check the build log for any errors

## Post-deploy verification checklist

Walk through each item and confirm ✅:

- [ ] Navigate to the deployed URL → redirects to /login
- [ ] Login as `masitlaem@gmail.com` with `password123` → forced password change screen appears
- [ ] Set new password → profile already complete → lands on /companies
- [ ] 4 company cards visible with correct idea counts
- [ ] Enter portal for any company → idea board loads, sidebar works
- [ ] Submit a new idea → appears in list
- [ ] Vote on an idea → vote count updates, status escalates at thresholds
- [ ] Add a note → appears in View Details modal
- [ ] Login as `demo@email.com` with `password123` → lands directly on /companies (no forced change)
- [ ] Navigate to /admin → redirected to /companies for non-admin user
- [ ] Login as admin → /admin shows all 8 users in table
- [ ] Admin: reset a password → forced change flag is set
- [ ] Mobile layout: sidebar collapses, tap targets are usable

## Troubleshooting common deploy issues

**502 / Function timeout** — check DATABASE_URL is correct in Vercel env vars; Neon may need a moment to wake up on first request.

**Blank page after deploy** — verify JWT_SECRET is set in Vercel; without it the middleware silently fails.

**Admin routes returning 403** — make sure the admin user's `role` column is `'Admin'` in the database (case-sensitive check in the schema).
