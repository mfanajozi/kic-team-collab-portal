# KIC Team Collab Portal — Claude Project Skills

> Loaded automatically by Claude Code every session. Contains project context, commands, and working rules.

---

## Project at a Glance

Internal idea-management portal for **Kingdom International Consulting** and its 4 portfolio companies. A fixed team of 5 users (+ 3 demo accounts) submit, vote on, and discuss website improvement ideas.

| | |
|---|---|
| **Framework** | Next.js 14.2.x — App Router, `'use client'` for interactive pages |
| **Database** | Neon.tech — serverless PostgreSQL via `pg` pool |
| **Auth** | `jose` JWT in httpOnly cookie (`kic_session`) · `bcryptjs` for passwords |
| **Styling** | Tailwind CSS · DM Sans (Google Fonts via `@import` in globals.css) |
| **Config** | `next.config.mjs` — NOT `.ts` (Next.js 14 does not support TS config files) |

---

## Environment Variables (`.env.local`)

```
DATABASE_URL     Neon.tech pooled connection string
JWT_SECRET       64-char secret for signing JWTs
JWT_URL          Neon Auth JWKS endpoint (available but not yet used by app)
JWT_AUTH         Neon Auth base URL (available but not yet used by app)
NODE_ENV         development | production
```

**Do not commit `.env.local`** — it is gitignored.

---

## Key Dev Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server (clears stale cache automatically) |
| `npm run build` | Production build — run this before `npm run start` |
| `npm run start` | Serve production build |
| `npm run setup-db` | Create schema + seed all users + sample data (idempotent) |

> **Never mix build and dev without clearing `.next/`.**
> Running `npm run build` then `npm run dev` causes "Cannot find module chunk" errors.
> Fix: `rm -rf .next` then `npm run dev`.

---

## Project Structure

```
src/
├── middleware.ts              Route guard — reads JWT flags, enforces redirects
├── lib/
│   ├── auth.ts               signSession / verifySession / getSession helpers
│   └── db.ts                 pg Pool singleton; query<T extends QueryResultRow>()
└── app/
    ├── login/                Public — no auth required
    ├── change-password/      Requires valid JWT with must_change_password=true
    ├── profile-setup/        Requires JWT with profile_complete=false
    ├── companies/            Main landing after full login
    ├── portal/[company]/     Idea board (Content·Design·Strategy·About)
    │   └── sections/         Section proposals and voting
    ├── admin/                Admin-only (role='Admin' in JWT)
    │   └── users/[id]/       Edit user / reset password
    └── api/                  All API route handlers (Node.js runtime)
scripts/
└── setup-db.ts               Schema DDL + seed (run via npm run setup-db)
```

---

## Auth Flow — Important Details

JWT payload carries `must_change_password` and `profile_complete` so **middleware can redirect without a DB hit** (middleware runs on Edge runtime — no `pg` available there).

```
Login → must_change_password=true  → /change-password  (re-issues JWT)
      → profile_complete=false     → /profile-setup    (re-issues JWT)
      → both false                 → /companies
```

After password change or profile update, always **re-issue the JWT** (done in `/api/auth/change-password` and `/api/profile`) or the middleware will keep redirecting.

---

## Database Tables & Creation Order

```
1. users          (no deps)
2. sections       (→ users)
3. section_votes  (→ sections, users)
4. ideas          (→ sections, users)
5. idea_votes     (→ ideas, users)
6. notes          (→ ideas, users)
```

Auto-status escalation (handled in `/api/ideas/[id]/vote/route.ts`):
- 3+ total votes while `status='new'` → `'discussed'`
- 4+ up-votes → `'approved'`

Sections: 3+ up-votes → `'approved'` (handled in `/api/sections/[id]/vote/route.ts`).

---

## Seeded Users

| Email | Role | Screen Name | Password | Notes |
|---|---|---|---|---|
| `masitlaem@gmail.com` | Admin | Masitla 🎯 | `password123` | Must change on login |
| `jaco.h.duplooy@gmail.com` | User | Jaco 🎭 | `password123` | Must change on login |
| `designer@k-i-c.co.za` | User | Designer 🎨 | `password123` | Must change on login |
| `leeannfry@gmail.com` | User | _(not set)_ | `password123` | Must change + set profile |
| `albert.duplooy05@gmail.com` | User | _(not set)_ | `password123` | Must change + set profile |
| `demo@email.com` | User | Demo 🚀 | `password123` | Ready to use immediately |
| `demo1@email.com` | User | Demo1 💡 | `password123` | Ready to use immediately |
| `demo2@email.com` | User | Demo2 🎯 | `password123` | Ready to use immediately |

---

## Company Keys

| Key | Company |
|---|---|
| `cbt` | Code Bridge Technologies |
| `cbs` | Cornerstone Business Consulting |
| `kic` | K-I-C Global Group |
| `ppms` | Pulse Point Marketing Services |

---

## Known Gotchas

1. **`next.config.mjs` not `.ts`** — Next.js 14 rejects TypeScript config files.
2. **`query<T>` must extend `QueryResultRow`** — the generic is constrained; always type result rows explicitly.
3. **Stale `.next/` cache** — after editing `.env.local`, always `rm -rf .next` before restarting the server.
4. **Edge runtime in middleware** — `pg`, `bcryptjs`, and `jose` signing can only run in API routes (Node.js runtime). Middleware uses only `jwtVerify` from `jose` (Edge-compatible).
5. **Build-time "Dynamic server usage" warnings** — expected on all API routes that call `cookies()`. These are not errors; the routes work correctly at runtime.
6. **`setup-db.ts` is idempotent** — safe to re-run; uses `ON CONFLICT DO UPDATE` / `ON CONFLICT DO NOTHING`.

---

## Slash Commands Available (`/kic-*`)

| Command | Purpose |
|---|---|
| `/kic-setup` | Re-run database schema + seed |
| `/kic-add-user` | Add a new user to the database |
| `/kic-reset-user` | Reset a user's password and force change on next login |
| `/kic-deploy` | Vercel deployment checklist and steps |
| `/kic-debug` | Diagnose common runtime errors |
