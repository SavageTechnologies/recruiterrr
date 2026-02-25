# How Prometheus Works

## Overview

Prometheus is Recruiterrr's TCPA intelligence tool. It scans any lead vendor domain or website and produces a scored compliance report — giving independent insurance agents documented due diligence before they purchase or use a single lead.

Every scan runs live. No cached data. The tool fetches current page content, queries external intelligence sources, and runs a full AI analysis in under 30 seconds.

---

## The Pipeline

### Step 1 — Domain Resolution

The submitted domain is normalized (strips `https://`, `www.`, trailing paths) and validated as reachable. The base URL is used for all subsequent fetches.

---

### Step 2 — Page Fetching

We attempt to retrieve three categories of pages directly:

**Homepage** (`/`)
The primary page. We strip all scripts, styles, and HTML tags to extract visible text — what a consumer would actually read. Scanned for opt-in forms, consent language, disclaimer copy, and seller identification.

**Privacy Policy**
We probe in order: `/privacy-policy`, `/privacy`, `/legal`, `/terms-of-service`, `/terms`. First successful fetch (200+ characters of text) is used. Scanned for telephone contact disclosures, data sharing language, and TCPA-specific provisions.

**Lead Capture / Contact Pages**
We probe in order: `/contact`, `/get-quote`, `/free-quote`, `/leads`, `/quote`, `/signup`, `/sign-up`, `/start`, `/apply`. First successful fetch is used. This is the most important page — where the actual opt-in form and consent language should live.

> **Note on inaccessible pages:** Large enterprise sites (eHealth, GoHealth, SelectQuote, etc.) frequently block automated fetches via bot protection. This is NOT treated as a compliance failure. The vendor classification system (Step 4) accounts for this.

---

### Step 3 — SERP Intelligence

We run two targeted searches via SerpAPI to gather external reputation signals:

- `"[domain]" TCPA complaint lawsuit`
- `"[company name]" lead generation complaint BBB`

Results surface lawsuit history, class action filings, regulatory actions, BBB complaints, and any press coverage of TCPA-related issues. Snippets are compiled and passed directly to the AI analysis engine.

This step catches risks that are invisible on the website itself — a vendor can have a clean homepage and a documented lawsuit history simultaneously.

---

### Step 4 — Vendor Classification

Before scoring, Claude classifies the vendor into one of four tiers based on all available signals — domain name, SERP results, company reputation, age, and page content:

| Tier | Description | Page Inaccessibility Treatment |
|---|---|---|
| **ENTERPRISE** | Publicly traded, nationally recognized, 10+ years, dedicated compliance teams. Examples: eHealth, GoHealth, SelectQuote, EverQuote, MediaAlpha | Bot protection assumed — NOT a penalty. Score business model risk only. |
| **ESTABLISHED** | Known regional or niche brand, 3+ years operating, clear web presence, no significant complaint history | Neutral — not penalized |
| **UNKNOWN** | Little reputation data, newer or unrecognizable domain, limited SERP presence | Moderate penalty applied |
| **SUSPICIOUS** | Active recent complaints, very new domain, multiple BBB issues, pages inaccessible with no reputation data | Significant penalty applied |

This classification prevents a legitimate enterprise vendor from being scored identically to an unknown fly-by-night operation just because both blocked the scraper.

---

### Step 5 — TCPA Analysis (Claude Sonnet)

All collected data — page text, SERP intelligence, and vendor tier — is sent to Claude Sonnet for analysis against 7 TCPA compliance criteria:

| # | Check | Max Points | Notes |
|---|---|---|---|
| 1 | Prior Express Written Consent (PEWC) | +30 | The single most critical requirement. Explicit consent language near the submit button. |
| 2 | Seller Identification | +15 | The specific company or agent who will call must be named. "A licensed agent" is not sufficient. |
| 3 | Contact Method Disclosure | +15 | Calls, texts, autodialer, prerecorded messages must be explicitly stated. |
| 4 | Clear & Conspicuous Placement | +15 | Disclaimer must be visible near the submit button — not buried in a footer. |
| 5 | Privacy Policy Present | +10 | Must exist, be accessible, and address telephone contact and data sharing. |
| 6 | Shared Lead Warning | -15 | PENALTY if confirmed. Multi-buyer model violates 2024 FCC one-to-one consent ruling. |
| 7 | Opt-Out Language | +5 | Clear STOP/unsubscribe instructions. |

Each check returns `true` (PASS), `false` (FAIL), or `null` (UNCLEAR — used when pages are inaccessible and no external signal confirms a result). Only marks FAIL when there is actual evidence of failure.

---

### Step 6 — Scoring

The raw point total from the 7 checks is combined with vendor tier and SERP intelligence to produce a final confidence score (0–100):

| Score | Verdict | Meaning |
|---|---|---|
| 75–100 | **COMPLIANT** | Solid disclaimer language, PEWC present, seller named, clean reputation. Safe to use with standard diligence. |
| 45–74 | **REVIEW NEEDED** | Some elements present but gaps exist. Request compliance documentation before scaling. |
| 0–44 | **HIGH RISK** | Critical elements missing or confirmed red flags. Do not use until issues are resolved. |

**Scoring by vendor tier when pages are inaccessible:**
- ENTERPRISE shared marketplace → 45–60 (REVIEW NEEDED — structural risk, not rogue)
- ENTERPRISE with exclusive lead product → 65–80
- ENTERPRISE with active recent litigation → -15 to -20 points
- ESTABLISHED, no complaints → 40–60
- UNKNOWN, inaccessible → 20–40
- SUSPICIOUS → 5–25 regardless of accessibility

A score of 0 is reserved for zero available data of any kind. SERP intel alone is sufficient to produce a meaningful score.

---

### Step 7 — Report Generation

Claude generates three components alongside the scored findings:

**Recommendations** — Prioritized CRITICAL / HIGH / MEDIUM actions tailored to the specific vendor and findings. Not generic advice — specific to what was found or missing.

**Ready-To-Use Language** — Three pieces of copy the agent can use immediately:
- A complete TCPA-compliant disclaimer they can send to their vendor or use on their own lead form
- A vendor demand paragraph — professional language requesting specific compliance fixes before continuing to purchase leads
- A single opt-out disclosure line for outbound communications

---

### Step 8 — Save & History

Every completed scan is saved to the `prometheus_scans` table in Supabase, linked to the user's Clerk ID. Scans are accessible from the main dashboard and can be reloaded at any time via `?id=[scan_id]` on the Prometheus tool page.

---

## Data Sources

| Source | What We Pull |
|---|---|
| Target website (direct fetch) | Homepage, privacy policy, lead capture page text |
| Google Search (SerpAPI) | TCPA complaints, lawsuits, BBB issues, reputation signals |
| Claude Sonnet (Anthropic) | Vendor classification, 7-check analysis, score, recommendations, generated language |

---

## Estimated Cost Per Scan

| Component | Approx. Cost |
|---|---|
| SerpAPI (2 Google searches) | ~$0.005 |
| Direct page fetches (3 pages) | Free |
| Claude Sonnet (analysis + report generation) | ~$0.03–0.06 |
| **Total per scan** | **~$0.04–0.07** |

---

## What Prometheus Is Not

- **Not a legal opinion.** Scores and findings are informational due diligence tools. They do not constitute legal advice and do not guarantee protection from TCPA liability.
- **Not a complete compliance solution.** True TCPA compliance requires reviewing actual consent records, lead capture flow, and data chain — not just the public website. Consult a qualified telecommunications attorney for legal decisions.
- **Not real-time consent verification.** We analyze what is publicly visible today. A vendor can change their forms at any time.

The value is documented due diligence — evidence that you made a reasonable, informed effort to vet your vendor before the first dial.

---

## What's Not Included Yet

- **PDF report export** — Downloadable, branded compliance report. Planned for the paid tier.
- **Scan history search and filtering** — Search past scans by domain, verdict, or date range.
- **Vendor watchlist** — Re-scan saved vendors automatically on a schedule.
- **Consent record verification** — Direct integration with lead vendor APIs to verify individual consent records.
