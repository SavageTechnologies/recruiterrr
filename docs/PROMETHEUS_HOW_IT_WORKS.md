# Prometheus — How It Works

Prometheus is the FMO competitive intelligence engine in Recruiterrr. Enter any FMO or IMO name and Prometheus auto-discovers their website, crawls up to 10 pages using sitemap + nav link discovery, runs 8 targeted SERP intelligence queries, and returns a full structured competitive briefing — including carrier stack, incentive trips, agent sentiment, contacts, recruiting activity, tech stack gaps, and a sales angles summary — in under 60–90 seconds.

*Every scan runs live. No cached data. All scans are stored and re-accessible by scan ID.*

---

## Who Uses This

Prometheus is for recruiters preparing to compete against or recruit away from a specific FMO. Before picking up the phone, a recruiter runs a Prometheus scan to walk in already knowing:

- What the FMO offers agents (carriers, leads, trips, contracts)
- What agents are saying about them in public (complaints, praise)
- Who the named leaders and contacts are
- Whether they are actively recruiting right now
- What their visible tech stack gaps are
- Which tree they belong to (Integrity / AmeriLife / SMS / Independent)

---

## The Pipeline

### Step 1: Website Discovery

**File:** `app/api/prometheus/route.ts — discoverWebsite()`

If the user did not provide a URL, Prometheus searches Google for the FMO's official website:

- Query: `[FMO name] insurance FMO IMO official website`
- Fetches 8 organic results
- Tokenizes the FMO name and scores each result based on how many name tokens appear in the domain root
- Exact match (all tokens in domain) = 100 points, 2+ tokens = 70, 1 token in a short name = 40, 1 token in a long name = 20
- First result bonus: +10 points
- Rejects known non-FMO domains: LinkedIn, Facebook, Wikipedia, Yelp, BBB, Bloomberg, Reuters, insurance news sites
- Returns the highest-scoring domain if score ≥ 40. Otherwise: no site found, scan relies on SERP only

If the user provides a URL directly, discovery is skipped entirely.

---

### Step 2: Smart Site Crawl

**File:** `app/api/prometheus/route.ts — crawlFMOSite()`

Uses a discovery-first approach rather than blindly guessing slugs:

| Step | What It Does |
|---|---|
| 1 — Homepage | Always fetches homepage first. Keeps raw HTML for nav link extraction. |
| 2 — Sitemap | Checks `/sitemap.xml`, `/sitemap_index.xml`, `/sitemap`. Extracts all `<loc>` URLs. |
| 3 — Nav links | Extracts hrefs from `<nav>`, `<header>`, `<footer>` tags in the homepage HTML. Converts to slugs. |
| 4 — Merge + score | Sitemap slugs + nav slugs merged and deduplicated. Sorted by relevance keyword match count. |
| 5 — Fallback | If fewer than 3 slugs discovered, adds hardcoded `SLUG_FALLBACK` list as additional candidates. |
| 6 — Crawl in batches | Parallel batches of 4. Skips WP-admin, CDN, sitemaps, auth pages. Stops at `MAX_PAGES = 10`. |

Relevance keywords used for scoring: `agent, join, partner, carrier, product, trip, incentive, lead, tech, tool, platform, crm, why, benefit, about, resource, wholesal, advisor, recruit`

Each page: 8-second fetch timeout, capped at 6,000 characters of extracted text. Scripts, styles, and HTML stripped before passing to analysis.

---

### Step 3: SERP Intelligence

**File:** `app/api/prometheus/route.ts — fetchSerpIntel()`

8 targeted Google searches run in parallel. All queries use the quoted FMO name for precision:

| Key | Query Pattern | Extracts |
|---|---|---|
| `carriers` | `"[FMO]" carrier contracts agents appointed` | Carrier stack, appointment details |
| `complaints` | `"[FMO]" agent complaint problem experience` | Agent pain points, negative experiences |
| `trips` | `"[FMO]" incentive trip 2025 2026 destination` | Trip destinations, qualification thresholds |
| `news` | `"[FMO]" insurance acquisition partnership announcement 2024 2025` | Acquisitions, rebrands, recent announcements |
| `agent_voice` | `"[FMO]" agent review site:reddit.com OR site:insuranceforums.net OR site:glassdoor.com` | Unfiltered agent opinions |
| `recruiting` | `"[FMO]" recruiting agents hiring grow downline join now` | Active recruiting signals |
| `leadership` | `"[FMO]" CEO president founder owner director leadership team` | Named contacts with titles |
| `technology` | `"[FMO]" CRM quoting platform technology tools software agents` | Tech stack details |

Before passing to Claude, a relevance filter drops results where the FMO name tokens and domain don't appear. This prevents cross-contamination from generic industry articles that happen to contain a word from the FMO name.

---

### Step 4: Claude Sonnet Analysis

**File:** `app/api/prometheus/route.ts — runClaudeAnalysis()`

All crawled page text + SERP snippets (up to 18,000 chars combined) sent to Claude Sonnet. The AI is instructed to:

- Only extract facts explicitly about this FMO — ignore content about other companies
- Return "Not found in scan" rather than fabricate
- Be specific — name actual carriers, destinations, dollar amounts
- Identify named contacts with titles from any source in the data

### Analysis Output Structure

| Section | Fields |
|---|---|
| Identity | `fmo_name`, `website`, `tree_affiliation`, `size_signal` (LARGE/MID-SIZE/SMALL/UNKNOWN), `overview` |
| Contacts | Array of `{name, title, email, phone, linkedin, source}` — any named person found in data |
| Recruiting Activity | `actively_recruiting` bool, `signals[]`, `target_agent_profile`, `recruiting_pitch_headline` |
| What They Offer | `carriers[]`, `products[]`, `contract_terms`, `lead_program`, `technology[]`, `training`, `trip_current`, `trip_threshold`, `trip_past[]`, `events[]` |
| Agent Sentiment | `agent_quotes[]` with sentiment/topic/source, `common_praise[]`, `common_complaints[]`, `contract_flags[]` |
| Sales Angles | `tech_gap`, `retention_problem`, `recruiting_pain`, `size_and_budget_read` |
| Metadata | `pages_found[]`, `data_confidence` (HIGH/MEDIUM/LOW), `confidence_note` |

---

## Confidence Scoring

Prometheus uses ground-truth scoring based on pages actually crawled — not Claude's self-assessment:

| Score | Pages Crawled | Meaning |
|---|---|---|
| 90 | 5 or more | Strong crawl — multiple key pages retrieved |
| 65 | 3–4 | Partial crawl — solid SERP data compensates |
| 40 | 1–2 | Minimal crawl — relying heavily on SERP intel |
| 15 | 0 (site not found) | No site — SERP only |

---

## Data Storage

All scans saved to `prometheus_scans` table in Supabase.

| Column | Value |
|---|---|
| `clerk_id` | User who ran the scan |
| `domain` | FMO name as entered (not the domain — the original input) |
| `score` | Ground-truth score: 15, 40, 65, or 90 |
| `verdict` | Kept for backwards compat — stores `size_signal` (LARGE/MID-SIZE/SMALL/UNKNOWN) |
| `fmo_size` | LARGE / MID-SIZE / SMALL / UNKNOWN |
| `vendor_tier` | Tree affiliation (Integrity / AmeriLife / SMS / Independent / Unknown) |
| `contacts` | JSON array of named contacts found |
| `actively_recruiting` | Boolean extracted from analysis |
| `has_contacts` | Boolean — contacts.length > 0 |
| `pages_scanned` | Array of slugs that returned content |
| `analysis_json` | Full structured Claude output |
| `serp_debug` | Every SERP query, filtered/unfiltered count, results used — full audit trail |

---

## Access Control

- Prometheus requires `plan='pro'` — checked in both GET and POST handlers via `hasActiveSubscription()`
- Rate limit: 20 scans per hour per user (Upstash Redis sliding window)
- CSRF: Origin header checked against allowed list

---

## Estimated Cost Per Scan

| Component | Approx. Cost |
|---|---|
| SerpAPI (8 intel queries + 1 discovery query) | ~$0.020–0.025 |
| Direct page fetches (up to 10 pages) | Free |
| Claude Sonnet (18k chars in, 5k tokens out) | ~$0.08–0.15 |
| **Total per scan** | **~$0.10–0.17** |

---

## What Prometheus Is Not

- **Not a guarantee.** FMOs can change their offer, trips, and carriers at any time. Every briefing is a starting point.
- **Not real-time.** SERP results reflect what's currently indexed — recent announcements may take days to surface.
- **Not legal analysis.** Contract language is for recruiting intelligence only.

---

## Roadmap

- PDF export of full briefing
- FMO watchlist — scheduled re-scans with change detection
- Scan history search and filtering
- Side-by-side FMO comparison view
