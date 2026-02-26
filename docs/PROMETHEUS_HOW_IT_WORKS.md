# How Prometheus Works

## Overview

Prometheus is Recruiterrr's FMO competitive intelligence engine. Enter any FMO or IMO name and Prometheus automatically discovers their website, crawls up to 9 pages, runs 5 targeted SERP searches, and returns a complete competitive briefing in under 60 seconds — including their carrier stack, incentive trips, lead program, recruiting pitch, weak points, and a custom counter-script written specifically to beat them.

Every scan runs live. No cached data.

---

## The Pipeline

### Step 1 — Website Discovery

If no URL is provided, Prometheus searches Google for the FMO's official website:

- Query: `[FMO name] insurance FMO IMO official website`
- Matches domain to FMO name
- Falls back to first organic result if no clear match

If a URL is provided directly, discovery is skipped.

---

### Step 2 — Multi-Page Crawl

Prometheus attempts to crawl up to 9 page categories in parallel, trying multiple slug variations per category until one succeeds:

| Category | Slugs Tried |
|---|---|
| Homepage | `/` |
| About | `/about`, `/about-us`, `/our-story` |
| Agents / Join | `/agents`, `/for-agents`, `/join`, `/join-us`, `/become-an-agent`, `/recruit` |
| Carriers | `/carriers`, `/carrier-partners`, `/our-carriers` |
| Trips / Incentives | `/trips`, `/incentives`, `/incentive-trips`, `/rewards` |
| Leads | `/leads`, `/lead-program`, `/lead-generation` |
| Technology | `/technology`, `/tech`, `/tools`, `/platform` |
| Why Us | `/why-us`, `/why-join`, `/advantages` |
| Contact | `/contact`, `/contact-us` |

Each page is fetched with an 8-second timeout and capped at 6,000 characters of extracted text. Scripts, styles, and HTML are stripped — only visible text content is passed to analysis.

---

### Step 3 — SERP Intelligence

5 targeted Google searches run in parallel to gather intelligence that may not appear on the FMO's own website:

1. `[FMO name] incentive trip 2025 2026 destination`
2. `[FMO name] carriers contracts appointments`
3. `[FMO name] agent reviews complaints`
4. `[FMO name] recruiting pitch why join`
5. `[FMO name] news announcement`

5 results per query, 6-second timeout. Title + snippet extracted for each result and passed to analysis.

---

### Step 4 — AI Analysis (Claude Sonnet)

All crawled page text and SERP intelligence — up to 18,000 characters total — is sent to Claude Sonnet with a structured competitive intelligence prompt. The model is instructed to be specific (name actual carriers, destinations, dollar amounts) and to return "unknown" rather than fabricate when data is insufficient.

The analysis produces a structured JSON report across 6 sections:

---

## The Briefing

### Section 1 — What They Offer
- Carrier stack (array of named carriers)
- Contract highlights (street-level vs. high contracts, ownership language)
- Lead program details (cost, quality, exclusivity)
- Technology stack (CRM, quoting tools, apps)
- Training and onboarding
- Marketing support

### Section 2 — Incentive Trips
- Current trip destination (2025/2026)
- Past trip history
- Qualification thresholds (production requirements)
- Trip intel summary

### Section 3 — Their Pitch
- Headline claim (what they lead with)
- Key selling points
- Target agent type
- Claimed differentiators

### Section 4 — Weak Points
- Agent complaints and negative reviews
- Gaps in their offer
- Red flags — contract ownership issues, captive language, release problems
- Areas where they are vulnerable

### Section 5 — Competitive Intel
- Tree affiliation — Integrity / AmeriLife / SMS (if determinable)
- Recent changes or announcements
- Market position and size signal (LARGE / MID-SIZE / SMALL)

### Section 6 — Your Counter
- Opening line for recruiting calls
- 3–5 specific angles based on their weak points
- Trip angle (how to use their trip against them)
- Carrier angle (gaps in their stack you can fill)
- Close

---

## Confidence Scoring

Every briefing returns a confidence level:

| Level | Score Stored | Meaning |
|---|---|---|
| HIGH | 90 | Strong crawl + SERP data. Multiple pages retrieved, trips and carriers confirmed. |
| MEDIUM | 60 | Partial data. Some pages blocked or sparse. Key fields confirmed but gaps exist. |
| LOW | 30 | Minimal data. Website blocked, sparse content, or very small FMO with little web presence. |

A confidence note explains exactly what data was and wasn't available.

---

## Data Storage

Scans are saved to the `prometheus_scans` table in Supabase:

| Field | Value |
|---|---|
| `domain` | FMO name as entered |
| `score` | Confidence mapping (HIGH=90, MEDIUM=60, LOW=30) |
| `verdict` | Size signal (LARGE / MID-SIZE / SMALL / UNKNOWN) |
| `vendor_tier` | Tree affiliation if detected |
| `analysis_json` | Full structured briefing |

Scans are accessible from the dashboard and reloadable via `?id=[scan_id]`.

---

## Rate Limits

- 20 scans per hour per user (Upstash Redis)
- CSRF protection via origin header check

---

## Estimated Cost Per Scan

| Component | Approx. Cost |
|---|---|
| SerpAPI (5 Google searches) | ~$0.013 |
| Direct page fetches (up to 9 pages) | Free |
| Claude Sonnet (analysis) | ~$0.08–0.15 |
| **Total per scan** | **~$0.10–0.17** |

---

## What Prometheus Is Not

- **Not a guarantee.** FMOs can change their offer, trips, and carriers at any time. Treat every briefing as a starting point for your own conversation — not a final source of truth.
- **Not legal advice.** Contract language analysis is for recruiting intelligence only.
- **Not real-time.** SERP results reflect what's currently indexed. Recent announcements may take days to surface.

---

## What's Not Included Yet

- PDF export of the full briefing
- FMO watchlist (re-scan saved FMOs on a schedule)
- Scan history search and filtering
- Direct comparison view (two FMOs side by side)