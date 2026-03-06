# Recruiterrr

**Agent intelligence platform for FMOs and insurance recruiters.**

Find, score, and recruit independent life, health, Medicare, and senior insurance agents in any US market. Every search runs live — no stale lists, no cached data.

**Production:** [recruiterrr.com](https://recruiterrr.com)
**Owner:** InsuraSafe, LLC

---

## What It Does

### Agent Search
Enter a city and state. The platform fires parallel Google local queries, crawls agent websites, checks job postings, scans YouTube, and runs every agent through an AI scoring model. Results come back ranked HOT / WARM / COLD within 30–90 seconds. Every agent gets a 0–100 recruitability score based on independence signals, review count, carrier mix, hiring activity, and content presence.

### Prometheus — FMO Competitive Intelligence
Enter any FMO or IMO name. Prometheus auto-discovers their website, crawls up to 10 pages using sitemap and nav link discovery, runs 8 SERP intelligence queries, and returns a full competitive briefing in under 60–90 seconds: carrier stack, incentive trips, lead program, agent sentiment, named contacts, recruiting activity, tech stack gaps, and sales angles. The tool that turns every recruiting call into a prepared conversation.

### ANATHEMA — Distribution Tree Analysis
Enter any agent's name or data. ANATHEMA fires 4 parallel SERP queries, optionally scrapes Facebook and YouTube via Apify, and runs a Claude Sonnet analysis to predict which of the three major consolidation trees — Integrity Marketing Group, AmeriLife, or Senior Market Sales — the agent belongs to. Returns a predicted tree, sub-IMO (immediate upline), confidence score, and DAVID personal intelligence facts for recruiting outreach.

### David — Recruiting Intelligence (Admin Preview)
Runs automatically on every ANATHEMA scan. Extracts personal, specific, recent facts from public agent data — awards, community events, hiring activity, niche content — that give recruiters a genuine conversation opener. Visualized as a network map of all scanned agents and their upline relationships. Not yet launched to subscribers.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router, Turbopack) | 16.1.6 |
| Language | TypeScript | ^5 |
| Runtime | React | 19.2.3 |
| Auth | Clerk | @clerk/nextjs ^6.38.2 |
| Database | Supabase (PostgreSQL) | @supabase/supabase-js ^2.97.0 |
| Rate Limiting | Upstash Redis | @upstash/ratelimit ^2.0.8 |
| Search Data | SerpAPI (google_local, google_jobs, youtube, facebook_profile, google) | serpapi ^2.2.1 |
| AI | Anthropic Claude Sonnet + Haiku | @anthropic-ai/sdk ^0.78.0 |
| Deep Scraping | Apify (Facebook Posts, YouTube Channel) | REST API |
| Payments | Stripe | stripe ^20.4.0 |
| Email | Resend | resend ^6.9.2 |
| Hosting | Vercel | Pro plan |

---

## Environment Variables

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SERPAPI_KEY=
ANTHROPIC_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
STRIPE_SECRET_KEY=
STRIPE_PRICE_ID=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
APIFY_API_KEY=
ENRICHMENT_SECRET=
```

> Note: the SerpAPI key is `SERPAPI_KEY`, not `SERP_API_KEY`. `APIFY_API_KEY` and `ENRICHMENT_SECRET` are optional — ANATHEMA degrades gracefully without them.

---

## Project Structure

```
app/
  (site)/                     — Public marketing pages (home, pricing, roadmap, FAQ, legal)
    (products)/
      anathema/page.tsx       — ANATHEMA product landing page
      prometheus/page.tsx     — Prometheus product landing page
      david/page.tsx          — David product landing page
  (auth)/
    sign-in/                  — Clerk sign-in
    sign-up/                  — Clerk sign-up
  (dashboard)/dashboard/
    page.tsx                  — Main dashboard
    prometheus/page.tsx       — Prometheus tool
    anathema/page.tsx         — ANATHEMA tool
    david/page.tsx            — David network viz (admin only)
    database/page.tsx         — Agent profiles database view
    search/page.tsx           — Agent search
    admin/page.tsx            — Admin dashboard
  (subscribe)/dashboard/
    subscribe/page.tsx        — Stripe checkout flow
    activate/page.tsx         — Post-checkout activation
  api/
    search/route.ts           — Agent search pipeline
    prometheus/route.ts       — Prometheus intel pipeline
    anathema/route.ts         — ANATHEMA analysis pipeline
    david/
      network/route.ts        — David network data (admin only)
      enrich/route.ts         — Apify enrichment worker (internal)
    database/route.ts         — Agent profiles
    database/export/route.ts  — CSV export
    stripe/
      checkout/route.ts       — Create Stripe checkout session
      portal/route.ts         — Create Stripe portal session
    webhook/
      clerk/route.ts          — Clerk user lifecycle webhooks
      stripe/route.ts         — Stripe subscription webhooks

components/
  dashboard/                  — DashboardNav, DashboardClient, BillingButton, OnboardingTour
  layout/                     — PageNav, PageFooter
  tables/                     — PrometheusScansTable, SearchesTable, SearchRow

lib/
  supabase.server.ts          — Lazy singleton Supabase service-role client
  auth/access.ts              — isAdmin(), hasActiveSubscription(), ADMIN_IDS, COMPED_IDS
  db/anathema.ts              — DB helpers for specimens and David facts
  domain/anathema/
    analyzer.ts               — gatherEvidence(), analyzeEvidence(), enrichFromDB()
    signals.ts                — buildNetworkSignalIndex(), scoreSMSCarriers()
    david-facts.ts            — extractDavidFacts() via Claude Haiku
    apify.ts                  — Apify Facebook + YouTube actors
    facebook.ts               — Facebook handle extraction + SerpAPI profile fetch

docs/
  README_Engineering.md       — Full engineering reference (stack, routes, env vars, DB, security)
  ANATHEMA_How_It_Works.md    — ANATHEMA pipeline deep dive
  PROMETHEUS_How_It_Works.md  — Prometheus pipeline deep dive
  DAVID_How_It_Works.md       — David architecture and philosophy
```

---

## Intelligence Module Summary

| Module | Input | Output | Model | Cost/Scan |
|---|---|---|---|---|
| Agent Search | City + State | Ranked agent list (HOT/WARM/COLD) | Claude Sonnet | ~$0.15–1.00 |
| Prometheus | FMO/IMO name | Competitive briefing + sales angles | Claude Sonnet | ~$0.10–0.17 |
| ANATHEMA | Agent name / data | Tree + sub-IMO + David facts | Claude Sonnet + Haiku | ~$0.05–0.40 |

---

## Docs

- [Engineering Reference](docs/README_Engineering.md)
- [How Prometheus Works](docs/PROMETHEUS_How_It_Works.md)
- [How ANATHEMA Works](docs/ANATHEMA_How_It_Works.md)
- [How David Works](docs/DAVID_How_It_Works.md)

---

## Roadmap Highlights

**Live:**
- Agent search with AI scoring (Medicare, life, annuities, financial modes)
- Prometheus FMO competitive intelligence
- ANATHEMA distribution tree prediction + sub-IMO identification
- David personal intelligence facts (admin preview)
- Stripe subscription billing
- Dashboard with search and scan history
- Agent profiles database with CSV export

**Coming:**
- David subscriber launch
- Prometheus PDF export
- FMO watchlist (scheduled re-scans)
- ANATHEMA accuracy reporting
- Predictive recruiting score (search score + ANATHEMA combined)
- CRM sync (HubSpot, Salesforce)
- NIPR license database integration
