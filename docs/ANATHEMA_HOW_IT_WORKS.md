# How ANATHEMA Works

## Overview

ANATHEMA is Recruiterrr's distribution tree analysis system. It takes any insurance agent's website, name, or online presence and predicts which of the three major consolidation trees — Integrity Marketing Group, AmeriLife, or Senior Market Sales (SMS) — the agent is affiliated with, and how deeply embedded they are on a four-stage infection scale.

The metaphor is intentional. In the modern Medicare distribution landscape, consolidation is biological — agents are absorbed into trees through FMO acquisitions and upline relationships, often without fully understanding the implications. ANATHEMA reads the pathogen and names the strain.

---

## Why This Matters

The three major consolidation trees control a significant and growing share of Medicare distribution:

- **Integrity Marketing Group** — Acquired dozens of FMOs. Agents are often unaware their upline was purchased.
- **AmeriLife** — Regional FMO acquisitions throughout the Southeast and expanding nationally.
- **Senior Market Sales (SMS)** — Long-established tree with deep carrier relationships and strong agent loyalty programs.

An agent inside one of these trees has different contract dynamics, different release terms, and different receptivity to recruiting conversations than a truly independent agent. Knowing the strain before you call changes your entire approach.

---

## The Signal Stack

ANATHEMA analyzes four layers of signals, weighted by reliability:

### Signal Layer 1 — Website Content (Highest Weight)
Direct page crawl of the agent's website:
- Carrier logos and named carriers (some carriers skew heavily toward specific trees)
- FMO/upline name mentions — explicit references to Integrity, AmeriLife, SMS, or known subsidiaries
- Brand language and taglines associated with specific trees
- Technology tools referenced (some CRMs and quoting platforms are tree-specific)
- "Powered by" or "in partnership with" disclosures

### Signal Layer 2 — SERP Intelligence
Google searches for the agent name + market:
- Press releases announcing FMO partnerships or acquisitions
- LinkedIn mentions of upline relationships
- Event appearances (Integrity Summit, AmeriLife conferences, SMS annual meetings)
- News coverage of the agent's agency or parent FMO

### Signal Layer 3 — Social and Content Signals
- YouTube channel content — hashtags, sponsor mentions, FMO branding in videos
- Facebook group memberships and page associations
- Instagram account followers and following patterns (FMO accounts)

### Signal Layer 4 — Carrier Fingerprinting
Certain carrier appointment combinations are statistically associated with specific trees. When a website lists a specific mix of carriers, this provides a probabilistic signal even without explicit FMO mention.

---

## Infection Staging

ANATHEMA classifies every agent on a four-stage scale:

| Stage | Label | Meaning |
|---|---|---|
| **Stage I** | EXPOSED | Weak signal. One or two indicators. May be independent but with a shared carrier or tool. Recruitability: HIGH. |
| **Stage II** | CARRIER | Moderate signal. Clear FMO relationship confirmed but likely still has contract portability. Recruitability: MEDIUM-HIGH. |
| **Stage III** | EMBEDDED | Strong signal. Multiple indicators confirm deep tree affiliation. Release may be complex. Recruitability: MEDIUM. |
| **Stage IV** | ASSIMILATED | Overwhelming signal. Agent appears fully absorbed — captive contract language, exclusive technology, FMO branding on their own site. Recruitability: LOW. |

Stage IV is not disqualifying — it's intelligence. An agent who knows they're locked in and is frustrated about it is often more recruitable than a Stage II agent who is comfortable.

---

## Predicted Trees

ANATHEMA returns one of four predictions:

| Prediction | Meaning |
|---|---|
| `INTEGRITY` | Signals point to Integrity Marketing Group or known subsidiary |
| `AMERILIFE` | Signals point to AmeriLife or regional affiliate |
| `SMS` | Signals point to Senior Market Sales |
| `UNKNOWN` | Confidence below threshold — insufficient data to classify |

ANATHEMA never forces a prediction. If confidence is below 35%, the result is `UNKNOWN` and displayed as `UNCLASSIFIED / INDETERMINATE`. A wrong prediction is worse than no prediction.

---

## Confidence Scoring

Every prediction returns a confidence percentage (0–100):

- **≥ 75%** — CONFIRMED MATCH. Multiple independent signals align.
- **35–74%** — PROBABLE. Meaningful signals present but not definitive.
- **< 35%** — UNCLASSIFIED. Returned as UNKNOWN. Do not act on tree affiliation.

The confidence score is displayed as both a number and a visual stage indicator on the dashboard.

---

## The Dashboard

The ANATHEMA dashboard (`/dashboard/anathema`) displays:

- **Specimen identifier** — Agent name or URL
- **Predicted strain** — Tree affiliation (INTEGRITY / AMERILIFE / SMS / UNKNOWN)
- **Stage indicator** — I through IV with visual severity display
- **Confidence score** — Percentage with HIGH / MEDIUM / LOW badge
- **Signal breakdown** — Which signals contributed to the prediction
- **Match confirmation** — MATCH / PROBABLE / INDETERMINATE / NO MATCH
- **Intel notes** — Specific findings that informed the prediction

Recent specimens are listed on the main dashboard with strain, stage, and date.

---

## Data Storage

Specimens are saved to the `anathema_scans` table in Supabase:

| Field | Value |
|---|---|
| `url` | Agent website or identifier as entered |
| `predicted_tree` | INTEGRITY / AMERILIFE / SMS / UNKNOWN |
| `stage` | 1–4 |
| `confidence` | 0–100 |
| `signals` | JSON array of contributing signals |
| `analysis_json` | Full structured output |

---

## Estimated Cost Per Scan

| Component | Approx. Cost |
|---|---|
| SerpAPI (3–4 Google searches) | ~$0.008–0.010 |
| Direct page fetch | Free |
| Claude Sonnet (analysis) | ~$0.04–0.08 |
| **Total per scan** | **~$0.05–0.09** |

---

## What ANATHEMA Is Not

- **Not a definitive org chart.** Consolidation moves fast. An FMO acquired last quarter may not show signals yet.
- **Not legal evidence.** Predictions are intelligence, not contract verification.
- **Not a reason not to call.** Even Stage IV agents leave trees. Use the prediction to shape the conversation, not to skip the call.

---

## What's Not Included Yet

- Accuracy reporting dashboard (confirmed vs. predicted)
- Predictive recruiting score (combines ANATHEMA stage with search score)
- Scan history search and filtering
- INDEPENDENT/OTHER fourth tree bucket (for agents outside the big three)
- Direct scan tool from the agent search results page
