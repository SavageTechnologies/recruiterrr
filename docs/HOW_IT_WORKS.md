# How Recruiterrr Works

## Overview

Recruiterrr is a real-time agent intelligence platform for FMOs, IMOs, and insurance recruiters. Every search runs live — no stale databases, no cached lists. Enter a city and state and the platform fires a full research pipeline, returning a ranked list of insurance agents scored by recruitability within 30–90 seconds.

The platform also includes two intelligence modules — **Prometheus** and **ANATHEMA** — that give recruiters competitive and strategic intelligence beyond raw agent lists.

---

## The Agent Search Pipeline

### Step 1 — Google Local Queries

We fire 3–8 parallel search queries against Google's local business listings for your target market. The number scales automatically with your selected result limit:

- `Medicare insurance agent {city} {state}` — always
- `health insurance agent {city} {state}` — always
- `Medicare supplement agent {city} {state}` — always
- `independent insurance agent {city} {state}` — 20+ results
- `life health insurance agent {city} {state}` — 30+ results
- `senior health insurance {city} {state}` — 30+ results
- `ACA health insurance broker {city} {state}` — 40+ results
- `Medicare advantage broker {city} {state}` — 40+ results

Results are deduplicated by name + address before anything else runs.

---

### Step 2 — Website Crawl

For every agent with a listed website, we fetch the page directly and strip it to plain text. We scan for:

- Carrier names and logos (Aetna, Humana, UHC, Cigna, BCBS, etc.)
- Independence signals — "independent," "broker," "we shop multiple carriers"
- Product focus — Medicare, ACA, life, senior, supplement
- Years in business

Agents without a website are not penalized. High-review agents with no site are often the strongest referral-based independents.

---

### Step 3 — Job Posting Check

We query Google Jobs for each agent to detect active hiring. A posting for "Medicare Sales Agent," "Insurance Producer," or similar in the past 90 days signals:

- The agency is growing and has budget
- The owner is already thinking about adding producers
- Higher-than-average receptivity to FMO conversations

Agents with confirmed active postings receive a HIRING badge and a score boost of +5 to +10 points.

---

### Step 4 — YouTube Detection

We search YouTube for each agent by name and market. A channel with Medicare or insurance content signals:

- They are independent — captive agents don't build personal Medicare brands
- They are tech-forward and comfortable with modern distribution
- They have an active audience and established book of business

Agents with a detected channel receive a YOUTUBE badge. YouTube detection only runs for agents with 50+ reviews or a website — low-signal leads are skipped to conserve API credits.

---

### Step 5 — AI Scoring

Every agent is scored 0–100 by Claude Haiku (Anthropic), analyzing all collected signals in a single pass:

| Signal | Impact |
|---|---|
| "Medicare," "Senior," or "Health" in name | High positive |
| Review count — 50+, 100+, 200+ | High positive |
| Multiple carriers identified on website | High positive |
| "Independent" or "broker" language | Positive |
| Actively hiring producers | +5 to +10 |
| YouTube channel with insurance content | +5 |
| Has a website | Small positive |
| Captive branding (State Farm, Bankers Life, Allstate, etc.) | Strong negative |

Score thresholds:
- **HOT (75–100)** — Independent, established, multi-carrier. Call first.
- **WARM (50–74)** — Worth a conversation, less certain on independence.
- **COLD (0–49)** — Likely captive, inactive, or not a fit. Skip.

---

### Step 6 — Sort, Display, Save

Results are sorted by score (highest first). Every search is saved to dashboard history. Past searches reload instantly without re-running the pipeline.

---

## Data Sources

| Source | What We Pull |
|---|---|
| Google Local (SerpAPI) | Name, type, rating, review count, phone, address, website |
| Agent website (direct fetch) | Carrier mix, independence language, product focus |
| Google Jobs (SerpAPI) | Active job postings, role titles, recency |
| YouTube (SerpAPI) | Channel presence, subscriber count, video count |
| Claude Haiku (Anthropic) | Score 0–100, HOT/WARM/COLD, carrier list, analyst notes |

---

## Estimated Cost Per Search

| Result Limit | Approx. Cost |
|---|---|
| 10 agents | ~$0.15–0.25 |
| 20 agents | ~$0.25–0.45 |
| 30 agents | ~$0.40–0.65 |
| 50 agents | ~$0.60–1.00 |

---

## Intelligence Modules

**Prometheus — FMO Competitive Intelligence**
Enter any FMO or IMO name. Prometheus crawls their website, runs SERP intelligence, extracts carrier stack, trip destinations, lead program, and recruiting pitch — then generates a custom counter-script. See `PROMETHEUS_HOW_IT_WORKS.md`.

**ANATHEMA — Distribution Tree Analysis**
Enter any agent website or name. ANATHEMA predicts which major consolidation tree (Integrity, AmeriLife, SMS) the agent belongs to, and how deeply embedded they are (Stage I–IV). See `ANATHEMA_HOW_IT_WORKS.md`.

---

## What's Not Included Yet

- NIPR license database — planned Phase 2
- CSV export — coming soon
- CRM sync (HubSpot, Salesforce) — roadmap
- Email / direct dial enrichment — not currently included
FORCE VERCEL BUILD