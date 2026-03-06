# David — How It Works

*"Apify gives you data. David gives you judgment."*

David is the recruiting intelligence layer that sits on top of ANATHEMA. While ANATHEMA answers "which tree is this agent in?", David answers "what would make a recruiter sound like they genuinely did their homework on this specific person — not like a bot that scraped their page?"

**Current status:** Admin-only, not yet launched to subscribers. The infrastructure is fully built and running on every ANATHEMA scan.

---

## The Problem David Solves

Most recruiting outreach fails not because recruiters lack contacts — it fails because it sounds generic. An agent who gets a cold call opening with "I saw you're a Medicare agent in [City]" hangs up. An agent who gets a call opening with "Saw you just got the Best Insurance Agency recognition from the Moore Chamber of Commerce — congrats" has a very different reaction.

David extracts the specific, personal, recent facts that turn a cold call into a warm one. It reads the same public data ANATHEMA already gathered and asks: which of these facts would make this agent stop and wonder how you found it?

---

## What David Extracts

| Category | Examples | Usability |
|---|---|---|
| Awards & Recognition | Best of [City] award, chamber recognition, local press mention, Top Agent credential | HIGH |
| Recent Community Events | Charity event they hosted or sponsored in the last 90 days, golf tournament, school sponsorship, YMCA partnership | HIGH |
| Hiring / Growth | Recently hired a new agent, opened a second location, earned a new designation | HIGH |
| Personal Bio Detail | Military background, specific community tie, bilingual, unusual career path into insurance | MED |
| Niche YouTube Content | Videos on veterans benefits, specific compliance topics — NOT generic Medicare explainers | MED |
| Notable Client Review | Specific memorable language — not generic "great service" | MED |
| General Community Presence | Active Facebook presence, posts about local involvement | LOW |

---

## What David Throws Away

David is ruthlessly selective. It discards:

- **Generic insurance education content** — Medicare Advantage explainers, ACA enrollment reminders, "5 reasons you need life insurance." This is their job. Everyone posts this. It says nothing personal.
- **Regulatory boilerplate** — disclaimers, HIPAA notices, government affiliation footnotes
- **Seasonal posts with no personal hook** — generic "Happy New Year" with a stock photo
- **Re-shares of others' content** with no original commentary
- **Generic business claims** — "I provide personalized service," "I work with multiple carriers," "call me for a free quote"
- **Anything that could describe any insurance agent in any market**
- **Content older than 12 months** (unless it's a permanent fact like a bio detail or award they still display)

---

## Where David Gets Its Data

David reads from the same evidence ANATHEMA already gathered — zero additional SERP queries.

| Source | What It Contains | When Available |
|---|---|---|
| SERP snippets | Title, URL, snippet from all 4 ANATHEMA Google searches | Every scan |
| Facebook About | Profile About section from SerpAPI `facebook_profile` engine | When FB profile found |
| Facebook Posts (SerpAPI) | Up to 10 recent post snippets | When FB profile found |
| Facebook Posts (Apify) | Up to 25 full posts with timestamps, OCR from images, external links | When Apify runs |
| YouTube Videos (Apify) | Up to 20 video titles + descriptions with publish dates | When YouTube channel found and Apify runs |
| Agent website notes | Homepage and about page text from the agent search result | When agent has a website |

### OCR from Images — High Value

When Apify scrapes Facebook photos, it extracts OCR text from attached images. This is where award plaques, event banners, recognition certificates, and conference badges live. A photo of an agent holding a "Best Agency 2025" plaque is more compelling than any text post. David treats OCR content as high-signal when it reveals an award, event, or recognition.

---

## The Claude Call

**File:** `lib/domain/anathema/david-facts.ts — extractDavidFacts()`

Uses **Claude Haiku** (not Sonnet). This is a fast extraction pass — the filtering rules are clear enough that a smaller model handles it well, and the call is cheap enough to run on every ANATHEMA scan.

The prompt includes:
- Today's date — for relative recency judgment
- All assembled content organized by source section (FACEBOOK, SERP / APIFY CONTENT, AGENT WEBSITE / PROFILE)
- Detailed keep/discard rules
- Recency classification rules (RECENT / DATED / UNKNOWN)
- OCR-specific guidance — how to identify high-signal image text vs. generic marketing graphics

Returns a JSON array of `DavidFact` objects, or `[]` if nothing passes the filter.

---

## DavidFact Schema

| Field | Type | Values |
|---|---|---|
| `source` | string | FACEBOOK \| YOUTUBE \| GOOGLE_REVIEW \| SERP \| WEBSITE \| LINKEDIN \| OTHER |
| `fact` | string | Plain English — what a recruiter would actually say: "Saw you just got the Best Agency recognition in Moore" |
| `raw_quote` | string | Exact text or OCR from the source — under 200 chars |
| `usability` | string | HIGH \| MED \| LOW |
| `recency` | string | RECENT \| DATED \| UNKNOWN |

---

## The Enrichment Worker — /api/david/enrich

**File:** `app/api/david/enrich/route.ts`

Vercel serverless functions die the moment a response is sent. The ANATHEMA route cannot fire Apify as a background `.then()` — Vercel tears down the function mid-run. Nothing gets saved. No error. Just silence.

The solution is a dedicated enrichment worker:

- ANATHEMA calls `/api/david/enrich` via `fetch()` with no `await` — fire and forget
- The worker runs as its own Vercel function with `maxDuration = 300` (5 minutes)
- Runs Apify Facebook + YouTube in parallel (~120s total wall time)
- Calls Claude Haiku to extract David facts from the enriched content
- Saves updated facts to `anathema_specimens` via `saveDavidFacts()`

**Security:** Requires `x-enrichment-secret` header matching `ENRICHMENT_SECRET` env var. No Clerk auth — internal server-to-server only. Never exposed to the client.

**Timeout budget (must stay under 280s with margin):**
- Apify Facebook actor: 120s max
- Apify YouTube actor: 120s max (parallel with FB)
- Claude Haiku call: 15s max
- DB write: 5s max
- Parallel total: ~145s — well within 300s

---

## David Network Visualization

**Files:** `app/api/david/network/route.ts`, `app/(dashboard)/dashboard/david/page.tsx`

The `/dashboard/david` page (admin only) visualizes all ANATHEMA specimens as a network. Each node is an agent. The map shows:

- Agent name, city, state, predicted tree
- Confidence score
- Upline organization (predicted_sub_imo)
- Number of David facts (total + HIGH usability count)
- Whether Apify enrichment ran
- Whether a Facebook profile was found

The network route returns lightweight data — no `serp_debug`, no full fact text — to keep the visualization payload small.

---

## Access Control

- `/dashboard/david` — admin only (middleware hard block, redirects non-admins to /dashboard)
- `/api/david/network` — admin only (middleware + `isAdmin()` check in handler)
- `/api/david/enrich` — internal only, `x-enrichment-secret` header, no Clerk auth

---

## Why David Is Architecturally Separate from ANATHEMA

This is a critical design decision. **David facts must never influence ANATHEMA's tree prediction, confidence score, or signals.**

The two subsystems read from the same data but write to completely separate fields. If David facts were folded into the prediction loop, a recruiter's community award or personal bio detail would contaminate the affiliation signal. ANATHEMA stays clean. David stays personal. They are siblings, not a single system.

---

## Launch Status

David is built and running on every ANATHEMA scan. Facts are being collected in the database. The network visualization is admin-accessible at `/dashboard/david`. Subscriber-facing David features (recruiting suggestions, outreach drafts) are the next phase.
