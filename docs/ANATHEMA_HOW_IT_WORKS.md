# ANATHEMA — How It Works

ANATHEMA is the distribution tree analysis engine in Recruiterrr. Given any insurance agent — their name, a website URL, Google listing data, or all of the above — it predicts which of three major consolidation trees they belong to, identifies the immediate upline organization, and extracts personal intelligence for recruiting outreach.

*The metaphor is intentional. Consolidation in the Medicare distribution industry is biological — agents are absorbed into trees through FMO acquisitions and upline relationships, often without fully understanding the implications. ANATHEMA reads the pathogen and names the strain.*

---

## The Three Trees

| Tree | Brand Signals | Notes |
|---|---|---|
| Integrity Marketing Group | "Integrity Marketing Group", "IntegrityCONNECT", "MedicareCENTER", "FFL agent", "integrity.com" | Largest acquirer. Dozens of FMOs absorbed. Agents often unaware of acquisition. |
| AmeriLife | "AmeriLife", "USABG", "United Senior Benefits Group", "amerilife.com" | Regional FMO acquisitions, strong Southeast presence. |
| Senior Market Sales (SMS) | "Senior Market Sales", "SMS partner", "Rethinking Retirement", "seniormarketsales.com" | Deep carrier relationships. Exclusive carrier combo: Mutual of Omaha + Medico. |

ANATHEMA also returns `unknown` when confidence is below 40%. A wrong prediction is worse than no prediction.

---

## The Pipeline — Three Steps

### Step 1: gatherEvidence()

**File:** `lib/domain/anathema/analyzer.ts`

Fires 4 parallel SerpAPI Google searches:

- **q1 — Broad:** `"[name]" insurance [city] [state]`
- **q2 — FMO context:** `"[name]" FMO OR IMO OR appointed OR contracted OR upline`
- **q3 — Tree brand:** `"[name]" Integrity OR AmeriLife OR "Senior Market Sales" OR "Family First Life" OR USABG`
- **q4 — Facebook:** `"[name]" site:facebook.com`

Each query returns up to 8 organic results. All title + snippet + link text is assembled into a single `evidenceBlob` string passed to Step 2.

**Facebook enrichment (also in Step 1):** If a Facebook profile URL is found in q4 results, a fifth SerpAPI call hits the `facebook_profile` engine to pull the About section and up to 10 recent posts. This text is appended to the evidence blob.

---

### Step 2: analyzeEvidence()

**File:** `lib/domain/anathema/analyzer.ts`

One Claude Sonnet call. The prompt answers both questions simultaneously — tree prediction and sub-IMO inference share the same evidence read, which means they inform each other and produce more accurate results than two separate systems.

**Question 1 — Which tree?**
- Requires explicit brand language from one of the three trees, or the SMS carrier combo (Mutual of Omaha + Medico)
- Generic insurance language, location, or common carriers do NOT qualify
- Returns `tree`, `tree_confidence` (0–100), `signals_used` (2–4 phrases), `reasoning`
- If confidence < 40, returns `tree: "unknown"`

**Question 2 — Who is the sub-IMO?**

The sub-IMO is the named partner agency sitting directly between this agent and the parent tree — their immediate upline, not the tree itself.

- **HIGH confidence:** Explicit contracting language ("appointed through X", "contracted with X"), agent on their leaderboard or award list
- **MED confidence:** Co-mentioned in association context (trip, conference, award), domain co-appears with agent
- **LOW confidence:** Name appears near agent but relationship unclear — only reported if fairly confident
- Does NOT name the parent tree itself or generic carriers (Humana, Aetna, etc.)
- Returns `null` if no sub-IMO found with at least LOW confidence

---

### Step 3: enrichFromDB()

**File:** `lib/domain/anathema/analyzer.ts`

Pure lookup — the AI already made the call. This step attaches metadata by checking:

1. Exact name match in `network_partners` table (active status)
2. Fuzzy match on `aliases` array
3. Check `discovered_fmos` table for previously seen FMOs
4. If none found: writes new row to `discovered_fmos` via `upsert_discovered_fmo` RPC → flags as `isNewDiscovery: true`

This is the learning loop. Every new sub-IMO the AI finds gets recorded. When `times_seen` reaches 3+, it enters the signal index. Admins can promote discovered FMOs to `network_partners`.

---

## Apify Enrichment — When and Why

**File:** `lib/domain/anathema/apify.ts`

Apify runs only when confidence from Step 2 is **below 55%** AND a Facebook or YouTube handle was found. This is deliberately conditional — Apify adds latency and cost, so it only runs when the standard pass was inconclusive.

| Actor | Input | Returns | Max Wait | Cost Per Run |
|---|---|---|---|---|
| `KoJrdxJCTtpon81KY` (Facebook Posts) | Confirmed Facebook profile URL | Up to 25 recent posts with text, timestamp, likes, OCR text from images, external links | 120s | ~$0.006/post (~$0.15 for 25) |
| `streamers~youtube-scraper` (YouTube) | Confirmed YouTube channel URL | Up to 20 videos with title, description, views, date | 120s | ~$0.008/video (~$0.16 for 20) |

Both actors run in parallel. If Apify returns content, the evidence blob is enriched and `analyzeEvidence()` runs a second time with the richer input.

### Fire-and-Forget Enrichment Worker

When Apify was NOT used in the main prediction pass (confidence was already high), the ANATHEMA route fires a background call to `/api/david/enrich` with `fetch()` and no `await`. This lets Apify run in its own Vercel function lifetime (`maxDuration = 300s`) without blocking the user response. The enriched David facts are saved to the DB and appear on next page load.

---

## David Facts — What They Are

**File:** `lib/domain/anathema/david-facts.ts`

David facts are personal intelligence facts extracted from the same evidence ANATHEMA gathered — but for a completely different purpose. While ANATHEMA answers "which tree?", David answers "what would make a recruiter sound like they actually did their homework on this specific person?"

| Usability | Meaning | Examples |
|---|---|---|
| HIGH | Would make a producer stop and wonder how you found it | Won Best Agency award in their city last month, just sponsored a local school event, recently hired staff |
| MED | Good context, supports a message but not a lead | Active Facebook presence, posts about local community, has YouTube channel on niche topic |
| LOW | Logged for completeness, not worth using in outreach | Generic Medicare explainer videos, standard holiday posts, boilerplate bio language |

**What David discards:**
- Generic insurance education content — Medicare explainers, ACA enrollment reminders, "5 reasons you need health insurance." This is their job. Everyone posts this.
- Regulatory boilerplate — disclaimers, HIPAA notices, government affiliation footnotes
- Seasonal posts with no personal hook
- Re-shares of others' content with no original commentary
- Anything that could describe any insurance agent in any market
- Content older than 12 months (unless it's a permanent fact like a bio detail or award they still display)

**Recency rules:**
- `RECENT` — within last 90 days of scan date
- `DATED` — 90 days to 12 months old
- `UNKNOWN` — no timestamp available

David uses **Claude Haiku** (not Sonnet) — fast, cheap extraction pass, not a reasoning task.

---

## Pre-Scored Signals Injected Before AI

The ANATHEMA route builds two types of pre-scored signals before calling `analyzeEvidence()`:

### SMS Carrier Fingerprint

`scoreSMSCarriers()` in `lib/domain/anathema/signals.ts` checks the agent's carrier list against SMS-exclusive carriers: Mutual of Omaha, Medico, GPM Life. Two matches = strong SMS signal (35 points) injected into `extraSignals[]`. One match = weak signal (15 points).

### Prometheus Cross-Reference

After gathering evidence, the route queries `prometheus_scans` for all FMOs the user has previously scanned. If any FMO name appears in the evidence blob for this agent, that FMO's tree affiliation, agent complaints, and recruiting pain are injected as a signal. This connects the two tools — an agent who works under an FMO you've already profiled automatically gets enriched context.

---

## The Network Signal Index

**File:** `lib/domain/anathema/signals.ts — buildNetworkSignalIndex()`

Built fresh on each ANATHEMA scan. Queries two tables:

- `network_partners` — all active confirmed sub-IMO partners with aliases and domain
- `discovered_fmos` — FMOs seen 3+ times with a confirmed tree (not yet promoted)

Also includes hardcoded `PARENT_BRAND_SIGNALS` — unambiguous brand phrases for each tree that are exempt from the co-mention requirement (explicit brand language doesn't need the agent's name in the same result to be meaningful).

**Signal weights:** parent brand = 40, partner domain = 45, partner name = 38, alias = 25–35, discovered FMO = 30.

---

## Data Storage

Results saved to `anathema_specimens` table.

| Column | Value |
|---|---|
| `clerk_id` | User who ran the scan |
| `agent_name` | Name as passed in |
| `predicted_tree` | integrity / amerilife / sms / unknown |
| `predicted_confidence` | 0–100 numeric |
| `prediction_signals` | JSON array of signal strings |
| `prediction_reasoning` | AI reasoning text |
| `confirmed_tree` | Set by recruiter if manually confirmed (null until then) |
| `confirmed_sub_imo` | Manually confirmed sub-IMO name |
| `predicted_sub_imo` | AI-predicted sub-IMO name |
| `predicted_sub_imo_confidence` | Numeric — 45/65/85 base + type bonus + known bonus |
| `predicted_sub_imo_partner_id` | UUID from network_partners if matched |
| `unresolved_upline` | Set if sub-IMO was a new discovery — triggers admin review |
| `facebook_profile_url` | Confirmed FB URL found during scan |
| `david_facts` | JSON — facts[], extracted_at, scan_sources_used |
| `serp_debug` | Full audit trail of every SERP query and result |

---

## Access Control

- ANATHEMA requires `plan='pro'` — checked in route handler via `hasActiveSubscription()`
- `/dashboard/david` and `/api/david/network` — admin only (middleware hard block)
- `/api/david/enrich` — internal only, `x-enrichment-secret` header, no Clerk auth

---

## Estimated Cost Per Scan

| Component | Approx. Cost | Notes |
|---|---|---|
| SerpAPI (4 Google + 1 FB profile) | ~$0.010–0.013 | Per scan |
| Claude Sonnet (analyzeEvidence) | ~$0.04–0.08 | Can run twice if Apify enriches |
| Claude Haiku (extractDavidFacts) | ~$0.001–0.003 | Fast extraction pass |
| Apify Facebook (25 posts) | ~$0.15 | Optional — low-confidence scans only |
| Apify YouTube (20 videos) | ~$0.16 | Optional — low-confidence scans only |
| **Total (no Apify)** | **~$0.05–0.09** | Standard scan |
| **Total (with Apify)** | **~$0.32–0.40** | Low-confidence scan with enrichment |
