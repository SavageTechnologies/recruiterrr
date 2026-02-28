# ANATHEMA Refactor + DAVID Facts Layer

## File Structure

```
lib/
  domain/
    anathema/
      signals.ts          ← Network signal index, SMS carrier scoring, scanner, aggregator
      chain-resolver.ts   ← Finds named partner agencies co-mentioned with agent
      upline-hunter.ts    ← Finds FMOs not in the 289-partner map (Claude-powered)
      facebook.ts         ← Facebook handle extraction + profile fetch via SerpAPI
      david-facts.ts      ← NEW: Personal facts extractor — parallel Haiku call on same data
  db/
    anathema.ts           ← All Supabase reads/writes (saveObservation, checkExisting, get*)

app/
  api/
    anathema/
      route.ts            ← Orchestration only (~200 lines vs 1,003 before)
```

## What Changed

**Nothing in ANATHEMA's behavior.** Every scan produces identical tree predictions,
confidence scores, and signals as before. The refactor is purely structural.

## What Was Added: DAVID Facts

Every scan now runs a parallel Claude Haiku call (`extractDavidFacts`) against the
same raw data ANATHEMA already collected — SERP snippets, Facebook posts, agent
profile text. It asks a completely different question:

> "What personal facts about this agent would make a recruiter's outreach feel
> like they actually did their homework?"

The results are stored in a new `david_facts` jsonb column on `anathema_specimens`.

**CRITICAL: david_facts has zero influence on ANATHEMA's scoring.**
It reads the same data. It runs after all scoring is complete. It writes to a
separate column. ANATHEMA's predicted_tree, confidence, and signals are
identical whether david_facts extracts 4 facts or 0.

## How the Data Flow Works

```
ONE SCAN
  ↓
SERP Pass 1 + 2 + Facebook fetch
  ↓
  ├── ANATHEMA scoring → predicted_tree, confidence, signals (unchanged)
  │
  └── DAVID facts extraction → david_facts column (parallel, non-blocking)
        ↓
        Sits in DB. Does nothing. Costs nothing extra to query later.
```

## When DAVID Launches

Query `david_facts` across all specimens:

```sql
select
  agent_name, city, state,
  david_facts->'facts' as personal_facts,
  predicted_tree,
  predicted_confidence
from anathema_specimens
where david_facts is not null
  and jsonb_array_length(david_facts->'facts') > 0
order by created_at desc;
```

Filter for high-usability facts only:
```sql
select agent_name, fact->>'fact', fact->>'source', fact->>'raw_quote'
from anathema_specimens,
  jsonb_array_elements(david_facts->'facts') as fact
where fact->>'usability' = 'HIGH';
```

Every scan you run from today forward builds this dataset automatically.
No re-scanning required when DAVID launches.

## Deployment Steps

1. Run `migration.sql` in Supabase SQL editor
2. Copy files to their target paths (see structure above)
3. Update `log_observation` client call to pass `david_facts` from scan response back in body
4. Deploy — no other changes required

## log_observation Update

The route now returns `david_facts` in the scan response. Pass it back when
calling `log_observation` so it gets written to the specimen:

```typescript
// In your client-side scan handler, after receiving scan results:
await fetch('/api/anathema', {
  method: 'POST',
  body: JSON.stringify({
    action: 'log_observation',
    // ... existing fields ...
    david_facts: scanResult.david_facts,  // ← add this
  })
})
```
