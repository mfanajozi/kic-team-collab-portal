# KIC Team Collab Portal

An internal web-based collaboration tool for **Kingdom International Consulting (KIC)** and its portfolio of companies. Team members submit, vote on, and discuss website improvement ideas across four company brands.

## Overview

| | |
|---|---|
| **Platform** | Vercel (Next.js 14 App Router) |
| **Database** | Neon.tech — serverless PostgreSQL |
| **Auth** | JWT (httpOnly cookie, 7-day expiry) + bcrypt passwords |
| **Styling** | Tailwind CSS · DM Sans font |

## Companies Covered

| Key | Company | Domain |
|---|---|---|
| `cbt` | Code Bridge Technologies | cbtech.co.za |
| `cbs` | Cornerstone Business Consulting | csbs.co.za |
| `kic` | K-I-C Global Group | k-i-c.co.za |
| `ppms` | Pulse Point Marketing Services | ppms.co.za |

## Features

- **Authentication** — Secure login with forced password reset on first login and 3-step profile setup wizard (screen name · avatar · colour theme)
- **Idea Board** — Submit, search, and filter ideas by category (Content · Design · Strategy · About Business) per company
- **Voting** — Up/down vote ideas; auto-escalates status: 3 votes → *Discussed*, 4 up-votes → *Approved*
- **Notes & Comments** — Threaded notes on any idea (max 300 chars each)
- **Website Sections** — Propose and vote on website sections; auto-approved at 3 up-votes
- **Admin Panel** — User management (create, edit, reset password, activate/deactivate), manual idea status overrides, section approve/reject

## Getting Started

### Prerequisites

- Node.js 18+
- A [Neon.tech](https://neon.tech) PostgreSQL database
- A [Vercel](https://vercel.com) account (for deployment)

### Local Development

1. **Clone the repository**

   ```bash
   git clone <repo-url>
   cd kic-collab-tool
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env.local` file in the project root:

   ```env
   DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
   JWT_SECRET=<random-64-char-string>
   NODE_ENV=development
   ```

4. **Set up the database**

   Runs schema DDL and seeds all team members:

   ```bash
   npm run setup-db
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment (Vercel + Neon.tech)

1. Push this repository to GitHub
2. Import the project in the [Vercel dashboard](https://vercel.com/new)
3. Add environment variables in Vercel project settings:
   - `DATABASE_URL` — your Neon connection string
   - `JWT_SECRET` — a random 64-character secret
4. Deploy — Vercel auto-detects Next.js
5. Run `npm run setup-db` once against the production database to initialise the schema

## Project Structure

```
src/
├── app/
│   ├── api/               # API route handlers
│   │   ├── auth/          # login · logout · change-password
│   │   ├── ideas/         # CRUD · voting · notes
│   │   ├── sections/      # proposal · voting
│   │   ├── admin/         # user management · idea/section admin
│   │   ├── companies/     # company stats
│   │   ├── me/            # current user profile
│   │   └── profile/       # profile update
│   ├── login/
│   ├── change-password/
│   ├── profile-setup/
│   ├── companies/
│   ├── portal/[company]/  # idea board + sections
│   └── admin/             # admin panel + user management
├── lib/
│   ├── auth.ts            # JWT helpers
│   └── db.ts              # pg pool
└── middleware.ts           # route protection
scripts/
└── setup-db.ts            # schema + seed script
```

## User Roles

| Permission | User | Admin |
|---|:---:|:---:|
| Submit & edit own ideas | ✅ | ✅ |
| Vote on ideas & sections | ✅ | ✅ |
| Add notes/comments | ✅ | ✅ |
| Propose sections | ✅ | ✅ |
| Admin Panel | ❌ | ✅ |
| Create / manage users | ❌ | ✅ |
| Change any idea status | ❌ | ✅ |
| Delete any idea | ❌ | ✅ |

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Neon.tech — serverless PostgreSQL |
| ORM / Query | node-postgres (`pg`) |
| Auth | `jose` (JWT) · `bcryptjs` |
| Hosting | Vercel |
| Font | DM Sans (Google Fonts) |

---

*KIC Team Collab Portal — Kingdom International Consulting*
