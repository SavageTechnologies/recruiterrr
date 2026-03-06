# Recruiterrr — Engineering Reference

Agent intelligence platform for FMOs and insurance recruiters. Find, score, and recruit independent life, health, Medicare, and senior insurance agents anywhere in the US. Every search runs live — no stale lists, no cached data.

**Production:** recruiterrr.com | **Owner:** InsuraSafe, LLC

---

## What the Platform Does

Recruiterrr is a three-module SaaS platform built for FMO recruiting teams and independent insurance recruiters.

| Module | Input | What It Returns | Model | Required Plan |
|---|---|---|---|---|
| Agent Search | City + State + mode | Ranked agent list (HOT / WARM / COLD) | Claude Sonnet | Free (rate limited) |
| Prometheus | FMO / IMO name | Full competitive briefing + counter-script | Claude Sonnet | Pro |
| ANATHEMA | Agent name or data | Tree prediction + sub-IMO + DAVID facts | Claude Sonnet + Haiku | Pro |
| David (admin) | ANATHEMA specimens | Network visualization of scanned agents | n/a | Admin only |

---

## Tech Stack

| Layer | Technology | Version / Notes |
|---|---|---|
| Framework | Next.js (App Router, Turbopack) | 16.1.6 |
| Language | TypeScript | ^5 |
| Runtime | React | 19.2.3 |
| Auth | Clerk | @clerk/nextjs ^6.38.2 |
| Database | Supabase (PostgreSQL) | @supabase/supabase-js ^2.97.0 |
| Rate Limiting | Upstash Redis (sliding window) | @upstash/ratelimit ^2.0.8 |
| Search Data | SerpAPI (google_local, google_jobs, youtube, facebook_profile, google) | serpapi ^2.2.1 |
| AI | Anthropic Claude | @anthropic-ai/sdk ^0.78.0 |
| Deep Scraping | Apify (Facebook Posts, YouTube Channel) | REST API via APIFY_API_KEY |
| Payments | Stripe | stripe ^20.4.0, API version 2026-02-25.clover |
| Email | Resend | resend ^6.9.2 |
| Webhook Verify | Svix (Clerk webhooks) | svix ^1.86.0 |
| Geo Map (UI) | react-simple-maps | ^3.0.0 |
| Hosting | Vercel | Pro plan (300s maxDuration for david/enrich) |
| CSS | Tailwind CSS v4 | ^4 |

---

## Project Structure

The codebase uses Next.js App Router route groups to separate public site, authenticated dashboard, and subscribe/activation flows.

### app/ — Route Groups

| Path | Purpose |
|---|---|
| `app/(site)/` | Public marketing pages — home, product landing pages, pricing, roadmap, FAQ, legal |
| `app/(auth)/` | Clerk sign-in and sign-up pages |
| `app/(dashboard)/dashboard/` | All authenticated dashboard routes |
| `app/(subscribe)/dashboard/` | Stripe checkout, activation, and subscribe flow |
| `app/api/` | All API route handlers |

### app/api/ — API Routes

| Route | Method(s) | What It Does |
|---|---|---|
| `/api/search` | POST | Agent search pipeline — SERP, crawl, YouTube, job check, Claude score |
| `/api/searches` | GET | Returns search history for the current user |
| `/api/search/lookup` | GET | Fetches a single past search result by ID |
| `/api/autocomplete` | GET | City/state autocomplete for the search input |
| `/api/prometheus` | GET, POST | Prometheus scan — discovery, crawl, SERP, Claude analysis |
| `/api/anathema` | GET, POST | ANATHEMA scan + specimen save + observation log |
| `/api/david/network` | GET | Returns all specimens shaped for the David network viz (admin only) |
| `/api/david/enrich` | POST | Internal Apify enrichment worker — called fire-and-forget from ANATHEMA (secret auth) |
| `/api/database` | GET | Returns agent_profiles for the current user (database view) |
| `/api/database/export` | GET | CSV export of agent_profiles |
| `/api/specimens/public` | GET | Public specimen data for the wall page |
| `/api/specimens` | GET | User-owned specimens |
| `/api/admin` | GET | Admin dashboard data |
| `/api/activation-check` | GET | Checks if a Stripe session activated a subscription |
| `/api/verify-invite` | POST | Verifies invite codes |
| `/api/stripe/checkout` | POST | Creates a Stripe Checkout session |
| `/api/stripe/portal` | POST | Creates a Stripe Customer Portal session |
| `/api/webhook/clerk` | POST | Clerk user lifecycle webhooks (user.created, updated, deleted) |
| `/api/webhook/stripe` | POST | Stripe subscription webhooks (checkout, updated, deleted, payment_failed) |

### lib/ — Shared Logic

| Path | Purpose |
|---|---|
| `lib/supabase.server.ts` | Lazy singleton Supabase service-role client (server-only) |
| `lib/auth/access.ts` | ADMIN_IDS, COMPED_IDS, isAdmin(), hasActiveSubscription() |
| `lib/networks.ts` | Legacy network data (pre-DB) — being phased out |
| `lib/anathema-types.ts` | Shared types for ANATHEMA specimens |
| `lib/db/anathema.ts` | DB helpers — saveObservation, getSpecimen, saveDavidFacts, etc. |
| `lib/domain/anathema/analyzer.ts` | gatherEvidence(), analyzeEvidence(), enrichFromDB() — the core pipeline |
| `lib/domain/anathema/signals.ts` | buildNetworkSignalIndex(), scoreSMSCarriers(), scanResultAgainstNetwork() |
| `lib/domain/anathema/david-facts.ts` | extractDavidFacts() — Claude Haiku call for personal intel |
| `lib/domain/anathema/apify.ts` | Apify Facebook + YouTube scraping actors |
| `lib/domain/anathema/facebook.ts` | Facebook handle extraction and SerpAPI profile fetcher |

### components/ — UI Components

| Component | Where Used |
|---|---|
| `components/dashboard/DashboardNav.tsx` | Sidebar nav for all dashboard routes |
| `components/dashboard/DashboardClient.tsx` | Client-side shell for the main dashboard |
| `components/dashboard/DashboardGreeting.tsx` | Greeting with user name |
| `components/dashboard/BillingButton.tsx` | Stripe portal trigger button |
| `components/dashboard/DashboardThemeToggle.tsx` | Dark/light mode toggle |
| `components/dashboard/OnboardingTour.tsx` | First-run onboarding flow |
| `components/layout/PageNav.tsx` | Public site navigation header |
| `components/layout/PageFooter.tsx` | Public site footer |
| `components/tables/PrometheusScansTable.tsx` | Prometheus scan history table |
| `components/tables/SearchesTable.tsx` | Agent search history table |
| `components/tables/SearchRow.tsx` | Individual row in search results |

---

## Authentication & Access Control

Clerk handles all authentication. Middleware enforces access tiers.

### Access Tiers

| Tier | How It Works | Has Access To |
|---|---|---|
| Admin | Hardcoded Clerk user ID in `lib/auth/access.ts` | Everything — bypasses all plan checks, can access /dashboard/david and /api/david/network |
| Comped | Hardcoded Clerk user ID in `lib/auth/access.ts` | Full dashboard access, no Stripe required |
| Pro (subscriber) | Stripe checkout → webhook sets plan=pro in Supabase | Agent Search, Prometheus, ANATHEMA |
| Bypass domain | Email domain in BYPASS_DOMAINS list in clerk webhook | Auto-provisioned as pro on user.created |
| Free | Authenticated but no Stripe subscription | Agent Search only (rate limited) |

To add an admin or comped user without redeploying, set `ADMIN_IDS` or `COMPED_IDS` as comma-separated env vars in Vercel. They merge with the hardcoded list.

### How hasActiveSubscription() Works

Called in every Prometheus and ANATHEMA route handler. Checks in order:
1. Is admin → return true
2. Is comped → return true
3. Query Supabase `users` table where `clerk_id` matches and `plan='pro'` and `subscription_status='active'`

### Middleware

`middleware.ts` uses Clerk's `clerkMiddleware`. Protected routes:

- `/dashboard(.*)` — must be logged in
- `/dashboard/david(.*)` and `/api/david/network(.*)` — admin only, non-admins get 403/redirect
- `/dashboard/anathema(.*)`, `/dashboard/prometheus(.*)`, `/api/anathema(.*)`, `/api/prometheus(.*)` — logged in (plan check is inside the route handler, not middleware, to avoid a DB call on every request)
- `/api/david/enrich(.*)` — internal only, no Clerk check, requires `x-enrichment-secret` header

---

## Database — Supabase Tables

| Table | Purpose | Key Fields |
|---|---|---|
| `users` | One row per registered user | clerk_id, email, plan (free/pro), subscription_status, stripe_customer_id, stripe_subscription_id, current_period_end |
| `searches` | One row per agent search run | clerk_id, city, state, results_count, hot_count, warm_count, cold_count, agents_json |
| `agent_profiles` | Enriched agent data upserted after every search | clerk_id, name, city, state, website, carriers, score, flag, hiring, youtube_channel — ANATHEMA fields are never overwritten by search |
| `prometheus_scans` | One row per Prometheus scan | clerk_id, domain (FMO name as entered), score, verdict, fmo_size, vendor_tier, contacts, analysis_json, serp_debug |
| `anathema_specimens` | One row per ANATHEMA scan logged | clerk_id, agent_name, predicted_tree, predicted_confidence, confirmed_tree, predicted_sub_imo, david_facts, facebook_profile_url, serp_debug |
| `network_partners` | Known sub-IMO partners (admin-managed) | id, name, aliases, tree, website, status, source |
| `discovered_fmos` | FMOs found by AI but not yet confirmed | name, name_variants, tree, times_seen, status (active/dismissed/promoted) |

### Important: No Generated Types Yet

`lib/supabase.server.ts` uses `createClient<any>()` — Supabase TypeScript types have not been generated. Column name typos will not be caught at compile time. To fix:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > types/database.types.ts
```

Then update `lib/supabase.server.ts` to use `createClient<Database>()`.

---

## Third-Party Services — API Keys Required

| Service | Env Var(s) | Used For | Notes |
|---|---|---|---|
| Anthropic | `ANTHROPIC_API_KEY` | Claude Sonnet (search scoring, Prometheus, ANATHEMA) and Claude Haiku (David facts) | Current models: `claude-sonnet-4-6`, `claude-haiku-4-5-20251001` |
| SerpAPI | `SERPAPI_KEY` | Google local, Google search, YouTube, Google Jobs, Facebook profile | Heavy usage — every search and scan. Note: variable is `SERPAPI_KEY`, not `SERP_API_KEY` |
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Database (PostgreSQL) for all persistence | Service role key is server-side only. Anon key is public but RLS-restricted |
| Clerk | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET` | Authentication, user management, JWT verification | Webhook secret used to verify svix signatures on /api/webhook/clerk |
| Upstash Redis | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Rate limiting (sliding window) and Clerk webhook deduplication | 15/hr agent search, 20/hr Prometheus, 20/hr ANATHEMA |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` | Subscription billing | API version: `2026-02-25.clover`. Note: `current_period_end` lives on the subscription item, not the subscription root (Stripe API change 2025-03-31) |
| Apify | `APIFY_API_KEY`, `ENRICHMENT_SECRET` | Deep Facebook post + YouTube channel scraping for ANATHEMA enrichment | Optional — ANATHEMA degrades gracefully without it. Actor IDs: `KoJrdxJCTtpon81KY` (FB), `streamers~youtube-scraper` (YT) |
| Resend | `RESEND_API_KEY` | Transactional email | Set up and available, not heavily used yet |

---

## Environment Variables — Complete List

| Variable | Required | Where Used |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk client-side init |
| `CLERK_SECRET_KEY` | Yes | Clerk server-side auth() |
| `CLERK_WEBHOOK_SECRET` | Yes | /api/webhook/clerk signature verification |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase client (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase client (public, RLS-restricted) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase server client (bypasses RLS) |
| `SERPAPI_KEY` | Yes | All search intelligence |
| `ANTHROPIC_API_KEY` | Yes | All Claude AI calls |
| `UPSTASH_REDIS_REST_URL` | Yes | Rate limiting + webhook dedup |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Rate limiting + webhook dedup |
| `STRIPE_SECRET_KEY` | Yes | Stripe checkout, portal, webhook verification |
| `STRIPE_PRICE_ID` | Yes | Subscription price ID used in checkout sessions |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signature verification |
| `RESEND_API_KEY` | Yes | Transactional email |
| `APIFY_API_KEY` | No (optional) | Apify Facebook + YouTube scraping |
| `ENRICHMENT_SECRET` | No (optional) | Internal auth for /api/david/enrich |
| `ADMIN_IDS` | No | Comma-separated Clerk user IDs — merged with hardcoded admin list |
| `COMPED_IDS` | No | Comma-separated Clerk user IDs — merged with hardcoded comped list |

---

## Rate Limits

| Endpoint | Limit | Window |
|---|---|---|
| `/api/search` | 15 requests | Per hour per user |
| `/api/prometheus` | 20 requests | Per hour per user |
| `/api/anathema` | 20 requests | Per hour per user |

All implemented via Upstash Redis sliding window.

---

## Security

- **CSRF:** All POST routes check the `Origin` header against `ALLOWED_ORIGINS` (`recruiterrr.com`, `localhost:3000`)
- **SSRF prevention:** `fetchPageText()` blocks private IPs (10.x, 172.16–31.x, 192.168.x), localhost, 0.0.0.0, 169.254.169.254, and any `*.local` hostname
- **Internal route:** `/api/david/enrich` is protected by `x-enrichment-secret` header, not Clerk — never exposed to the client
- **Stripe webhooks:** Verified via `stripe.webhooks.constructEvent()` with `STRIPE_WEBHOOK_SECRET`
- **Clerk webhooks:** Verified via `svix Webhook.verify()` with `CLERK_WEBHOOK_SECRET`, deduplicated via Redis (30-minute TTL on svix-id)

---

## Deployment

- **Hosting:** Vercel
- **Standard routes:** Default 60s Vercel timeout
- **`/api/prometheus`:** `maxDuration = 120` (crawl + SERP + Sonnet)
- **`/api/anathema`:** `maxDuration = 180` (evidence gather + AI + DB enrich)
- **`/api/david/enrich`:** `maxDuration = 300` (Apify cold start ~120s per actor, run in parallel)
- **Dev:** `npm run dev` (Next.js with Turbopack)
- **Build:** `npm run build`

---

## Known Tech Debt

- No Supabase TypeScript types generated — `createClient<any>()` means zero type safety on DB calls
- `lib/networks.ts` is legacy hardcoded network data — being replaced by `network_partners` table in Supabase
- Old ANATHEMA docs reference "infection stage I–IV" — that model is no longer in the codebase, replaced by tree + confidence + sub-IMO + David facts
- Old ANATHEMA docs reference `anathema_scans` table — current table is `anathema_specimens`
- Old Prometheus docs describe a 9-page parallel slug crawl — current crawler is smarter (sitemap → nav link extraction → slug fallback, up to 10 pages)
- The `score` field in `prometheus_scans` is ground-truth (pages crawled count), not Claude's self-assessed confidence
