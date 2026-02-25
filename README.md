# Recruiterrr

**Agent intelligence platform for FMOs and insurance recruiters.**

Find, score, and recruit independent life, health, Medicare, and senior insurance agents in any US market. Every search runs live — no stale lists, no cached data.

**Production:** [recruiterrr.com](https://recruiterrr.com)
**Owner:** InsuraSafe, LLC

---

## What It Does

Enter a city and state. The platform fires parallel Google local queries, crawls agent websites, checks job postings, scans YouTube, and runs every agent through an AI scoring model. Results come back ranked HOT / WARM / COLD within 30–90 seconds.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.1.6 (App Router, Turbopack) |
| Language | TypeScript |
| Auth | Clerk v6 |
| Database | Supabase (PostgreSQL) |
| Rate limiting | Upstash Redis — 10 searches/hour per user |
| Search data | SerpAPI (google_local, google_jobs, youtube engines) |
| AI scoring | Anthropic Claude Haiku |
| Email | Resend (installed, not yet wired) |
| Hosting | Vercel |
| Fonts | Bebas Neue, DM Mono, DM Sans (Google Fonts) |

---

## Project Structure

```
recruiterrr/
├── app/
│   ├── page.tsx                          # Homepage (public)
│   ├── layout.tsx                        # Root layout — ClerkProvider, favicon, metadata
│   ├── globals.css                       # CSS variables, base styles
│   ├── about/page.tsx
│   ├── faq/page.tsx
│   ├── wall/page.tsx
│   ├── socials/page.tsx
│   ├── roadmap/page.tsx
│   ├── contact/page.tsx
│   ├── team/page.tsx
│   ├── privacy/page.tsx
│   ├── terms/page.tsx
│   ├── sign-in/[[...sign-in]]/page.tsx  # Custom Clerk sign-in page
│   ├── sign-up/[[...sign-up]]/page.tsx  # Custom Clerk sign-up — invite code gated
│   ├── dashboard/
│   │   ├── layout.tsx                   # Dashboard shell with sidebar nav
│   │   ├── page.tsx                     # Stats, US coverage map, search history
│   │   └── search/page.tsx             # Main search UI with agent cards
│   └── api/
│       ├── search/route.ts              # POST — full agent search + enrichment pipeline
│       ├── searches/route.ts            # GET — fetch saved search by ID
│       └── webhook/clerk/route.ts       # Clerk webhook → syncs users to Supabase
├── components/
│   ├── PageNav.tsx                      # Shared nav for all public pages
│   ├── PageFooter.tsx                   # Shared footer with all page links
│   ├── SearchRow.tsx                    # Client component for search history rows
│   └── USMap.tsx                        # US coverage map (react-simple-maps)
├── public/
│   └── favicon.svg                      # Custom R. favicon (dark bg, orange dot)
├── types/
│   └── react-simple-maps.d.ts
└── proxy.ts                             # Clerk middleware — RENAME TO middleware.ts (see security)
```

---

## Environment Variables

Create `.env.local` at the project root. All of these are required:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# SerpAPI
SERPAPI_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Invite gate (controls who can sign up)
NEXT_PUBLIC_INVITE_CODE=HEARTLAND2026
```

---

## Supabase Schema

```sql
-- Users table (synced from Clerk via webhook)
create table users (
  id uuid primary key default gen_random_uuid(),
  clerk_id text unique not null,
  email text,
  first_name text,
  last_name text,
  created_at timestamptz default now()
);

-- Searches table (saved on every search run)
create table searches (
  id uuid primary key default gen_random_uuid(),
  clerk_id text not null,
  city text not null,
  state text not null,
  results_count integer default 0,
  hot_count integer default 0,
  warm_count integer default 0,
  cold_count integer default 0,
  agents_json jsonb default '[]',
  created_at timestamptz default now()
);
```

---

## Search Pipeline (Brief)

1. **Google Local** — 3–8 parallel queries via SerpAPI, deduplicated
2. **Website crawl** — direct fetch, stripped to text, carrier/independence detection
3. **Google Jobs** — checks for active hiring (HIRING badge + score boost)
4. **YouTube** — detects agent channels with insurance content (YOUTUBE badge)
5. **Claude Haiku** — scores every agent 0–100, returns HOT/WARM/COLD + notes
6. **Save** — results stored in Supabase, accessible from dashboard history

See `HOW_IT_WORKS.md` for full pipeline details.

---

## Rate Limiting

- 10 searches per user per hour (sliding window via Upstash)
- Enforced in `/api/search/route.ts` before any external calls

---

## Auth & Access Control

- All `/dashboard/*` routes protected by Clerk middleware (`proxy.ts` — needs rename to `middleware.ts`)
- Sign-up is invite-code gated (client-side — see security notes below)
- Clerk custom pages at `/sign-in` and `/sign-up` with full site branding

---

## Known Security Issues (Fix Before Scaling)

See `SECURITY_TODO.md` for prioritized list. Summary:

- **P0** — `proxy.ts` must be renamed `middleware.ts` for route protection to work
- **P0** — No CSRF protection on `/api/search` POST endpoint
- **P0** — Invite code is client-side (NEXT_PUBLIC) — not real security
- **P1** — `fetchWebsiteText()` needs URL validation to prevent SSRF
- **P1** — Supabase service role key should be centralized behind `server-only`
- **P2** — Webhook needs replay protection and `user.deleted` handling

---

## Local Development

```bash
npm install
cp .env.local.example .env.local   # fill in your keys
npm run dev
```

App runs at `http://localhost:3000`.

---

## Deployment

Deployed on Vercel. Push to `main` triggers production deploy automatically.
All env vars must be set in Vercel → Settings → Environment Variables.
