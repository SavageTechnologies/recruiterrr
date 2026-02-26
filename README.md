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
Enter any FMO or IMO name. Prometheus auto-discovers their website, crawls up to 9 pages in parallel, runs 5 SERP intelligence queries, and returns a full competitive briefing in under 60 seconds: carrier stack, incentive trips, lead program, recruiting pitch, weak points, and a custom counter-script written specifically to beat them. The tool that turns every recruiting call into a prepared conversation.

### ANATHEMA — Distribution Tree Analysis
Enter any agent's website or name. ANATHEMA analyzes behavioral signals, carrier language, social footprint, and SERP data to predict which of the three major consolidation trees — Integrity Marketing Group, AmeriLife, or Senior Market Sales — the agent belongs to. Returns a predicted strain (tree), infection stage (I–IV), and confidence score. Changes how you approach every recruiting conversation.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript |
| Auth | Clerk v6 |
| Database | Supabase (PostgreSQL) |
| Rate limiting | Upstash Redis |
| Search data | SerpAPI (google_local, google_jobs, youtube, google engines) |
| AI scoring | Anthropic Claude Haiku (agent search), Claude Sonnet (Prometheus + ANATHEMA) |
| Email | Resend |
| Hosting | Vercel |
| Fonts | Bebas Neue, DM Mono, DM Sans (Google Fonts) |

---

## Environment Variables

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SERP_API_KEY=
ANTHROPIC_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
RESEND_API_KEY=
```

---

## Project Structure

```
app/
  page.tsx                    — Home / marketing page
  dashboard/
    page.tsx                  — Main dashboard (agent search history + module overview)
    prometheus/page.tsx       — Prometheus FMO intel tool
    anathema/page.tsx         — ANATHEMA distribution tree tool
  api/
    search/route.ts           — Agent search pipeline
    prometheus/route.ts       — Prometheus intel pipeline
    anathema/route.ts         — ANATHEMA analysis pipeline
  prometheus/page.tsx         — Prometheus marketing/landing page
  anathema/page.tsx           — ANATHEMA marketing/landing page
  pricing/page.tsx            — Pricing tiers
  roadmap/page.tsx            — Public roadmap

components/
  HomeNav.tsx                 — Public navigation
  DashNav.tsx                 — Dashboard navigation
  AgentCard.tsx               — Search result agent card
  PrometheusScansTable.tsx    — Dashboard Prometheus scan history
  AnathemaScansTable.tsx      — Dashboard ANATHEMA specimen history
  XenoEgg.tsx                 — Easter egg (you'll know it when you find it)
  PageFooter.tsx              — Site footer

docs/
  HOW_IT_WORKS.md             — Agent search pipeline documentation
  PROMETHEUS_HOW_IT_WORKS.md  — Prometheus pipeline documentation
  ANATHEMA_HOW_IT_WORKS.md    — ANATHEMA pipeline documentation
  BILLING_PERMISSIONS_SCAFFOLDING.md
```

---

## Intelligence Module Summary

| Module | Input | Output | Model | Cost/Scan |
|---|---|---|---|---|
| Agent Search | City + State | Ranked agent list (HOT/WARM/COLD) | Claude Haiku | ~$0.15–1.00 |
| Prometheus | FMO/IMO name | Competitive briefing + counter-script | Claude Sonnet | ~$0.10–0.17 |
| ANATHEMA | Agent URL/name | Tree prediction + stage (I–IV) | Claude Sonnet | ~$0.05–0.09 |

---

## Docs

- [How Agent Search Works](docs/HOW_IT_WORKS.md)
- [How Prometheus Works](docs/PROMETHEUS_HOW_IT_WORKS.md)
- [How ANATHEMA Works](docs/ANATHEMA_HOW_IT_WORKS.md)

---

## Roadmap Highlights

**Live:**
- Agent search with AI scoring
- Prometheus FMO competitive intelligence
- ANATHEMA distribution tree prediction
- Dashboard with scan history for both modules
- Pricing tiers (Free / Operator / Enterprise)

**Coming:**
- Prometheus PDF export
- FMO watchlist (scheduled re-scans)
- ANATHEMA accuracy reporting
- Predictive recruiting score (search score + ANATHEMA stage combined)
- CSV export
- CRM sync (HubSpot, Salesforce)
- NIPR license database integration