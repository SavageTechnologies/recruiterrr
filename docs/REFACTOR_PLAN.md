# Recruiterrr Refactor Plan
> **Goal:** Zero behavior change. Tighten the codebase, organize for a second engineer, establish conventions.  
> **Method:** Work in sprints. Each sprint is independently shippable. Test after each one.

---

## My Audit (confirming + adding to the third-party review)

### What's genuinely good
- Clean App Router structure, easy to reason about
- Clerk + Supabase server-only pattern is solid — no leaking service keys to client
- Rate limiting via Upstash is already in place on the heavy routes
- Security headers in `next.config.ts` are thoughtful
- `docs/` actually explains the business logic — rare and valuable
- `lib/networks.ts` signal-index pattern (auto-built at startup) is clever and worth keeping

### What I actually found in the files

| Issue | Where | Severity |
|---|---|---|
| `ADMIN_IDS` defined twice, separately | `middleware.ts` + `app/api/admin/route.ts` | High |
| `app/api/search/route.ts` is **628 lines** — auth, SerpAPI, scraping, YouTube, AI scoring, deduplication, and DB writes all in one file | `route.ts` | High |
| `app/api/anathema/route.ts` is **1,003 lines** | `route.ts` | High |
| `app/api/prometheus/route.ts` is **500 lines** | `route.ts` | High |
| `ALLOWED_ORIGINS` and `BLOCKED_HOSTS` defined separately in search and should be shared | `search/route.ts` | Medium |
| 5 map components are `.jsx` with no prop types | `components/` | Medium |
| `package.json` says `next@16.1.6`, README says Next 15 | root | Low |
| README shows `SERP_API_KEY`, code uses `SERPAPI_KEY` everywhere | scattered | Low |
| No `.env.example` — Stripe vars undocumented (`STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`) | missing | Low |
| No formatter, no CI, no pre-commit | missing | Low |

---

## Sprint 1 — Project Hygiene (1–2 days)
*No logic changes. Just wiring and docs.*

### 1a. Fix README drift
- Change "Next 15" → "Next 16" in README
- Add a complete env var reference table (see 1c)

### 1b. Add Prettier
```
npm install --save-dev prettier
```
Create `prettier.config.js`:
```js
module.exports = {
  semi: false,
  singleQuote: true,
  trailingComma: 'es5',
  printWidth: 100,
}
```
Add scripts to `package.json`:
```json
"format": "prettier --write .",
"format:check": "prettier --check .",
"typecheck": "tsc --noEmit"
```
Add `.editorconfig`:
```ini
root = true
[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```

**Run `npm run format` once on the whole repo** — commit that as its own PR/commit so future diffs aren't polluted.

### 1c. Create `.env.example`
Document every env var the app actually uses:
```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
CLERK_WEBHOOK_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# SerpAPI (code uses SERPAPI_KEY — README had SERP_API_KEY, that was wrong)
SERPAPI_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PRICE_ID=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Upstash (rate limiting)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## Sprint 2 — Centralize Auth & Shared Constants (half day)
*No behavior change. Pure consolidation.*

### 2a. Create `lib/auth/access.ts`
Move both `ADMIN_IDS` and `COMPED_IDS` here. Delete them from `middleware.ts` and `app/api/admin/route.ts`, import from this single source.

```ts
// lib/auth/access.ts

export const ADMIN_IDS = new Set([
  'user_3A96smOMHMC9L7fO8cGG6OmpHkV', // Aaron
])

export const COMPED_IDS = new Set([
  'user_3AAZKXJCBWeaThUCwKpX6MPzz7I', // Drew
])

export const isAdmin = (userId: string) => ADMIN_IDS.has(userId)
export const isComped = (userId: string) => COMPED_IDS.has(userId)
export const hasFullAccess = (userId: string) => isAdmin(userId) || isComped(userId)
```

**Optional upgrade:** Read IDs from `process.env.ADMIN_IDS` (comma-separated) so you can add people without a deploy.

### 2b. Create `lib/config/origins.ts`
Both `search/route.ts` and any future route that needs CORS should import from here:
```ts
export const ALLOWED_ORIGINS = ['https://recruiterrr.com', 'http://localhost:3000']
export const BLOCKED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '169.254.169.254', '::1']
```

---

## Sprint 3 — Extract Service Modules from Route Files (3–5 days)
*This is the biggest win. The route handlers become thin coordinators.*

The rule: **route files only do auth → validate input → call service → return JSON.**

### Target file structure after this sprint:

```
lib/
  services/
    serpapi.ts          ← all SerpAPI HTTP calls (local, jobs, youtube, google, autocomplete)
    anthropic.ts        ← all Claude/Anthropic prompting logic
    scrape.ts           ← URL fetch + HTML extraction helpers
    stripe.ts           ← Stripe session/portal creation
  db/
    searches.ts         ← Supabase queries for searches table
    scans.ts            ← Supabase queries for anathema/prometheus scans
    users.ts            ← Supabase queries for users table
  domain/
    search/
      scoring.ts        ← agent scoring, flag assignment (hot/warm/cold)
      dedupe.ts         ← deduplication logic
      normalize.ts      ← name/address normalization helpers
    anathema/
      signals.ts        ← network signal index builder (currently inline in anathema route)
      scoring.ts        ← anathema scoring logic
    prometheus/
      scoring.ts        ← prometheus scoring logic
```

### How to do it safely (per file)

**For each big route, extract in this order:**

1. **DB layer first** — pull out the Supabase read/write calls into `lib/db/`. These have no dependencies on business logic so they're safe to move. Test: behavior identical.

2. **External API calls second** — pull raw SerpAPI fetch functions into `lib/services/serpapi.ts`. They're pure HTTP — easy to isolate. Test: same results.

3. **Pure domain logic third** — scoring functions, dedupe, normalization. These are pure functions (input → output, no side effects). Move to `lib/domain/`. Test: same scores.

4. **AI prompts last** — move Claude calls into `lib/services/anthropic.ts`. Keep prompts as exported constants so they're easy to find and tweak.

#### Example before/after for `search/route.ts`

**Before (628-line route):**
```ts
export async function POST(req: NextRequest) {
  // 600+ lines of auth, fetching, scoring, deduping, AI, DB...
}
```

**After (thin route):**
```ts
import { fetchAgentsFromSerp } from '@/lib/services/serpapi'
import { scoreAndFlagAgents } from '@/lib/domain/search/scoring'
import { dedupeAgents } from '@/lib/domain/search/dedupe'
import { enrichAgentWithAI } from '@/lib/services/anthropic'
import { saveSearch } from '@/lib/db/searches'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  // ...validate input...
  const raw = await fetchAgentsFromSerp(city, state, limit, mode, query)
  const scored = scoreAndFlagAgents(raw)
  const deduped = dedupeAgents(scored)
  const enriched = await enrichAgentWithAI(deduped)
  await saveSearch(userId, { city, state, results: enriched })
  return NextResponse.json({ results: enriched })
}
```

### Priority order for Sprint 3:
1. `app/api/anathema/route.ts` (1,003 lines — biggest pain point)
2. `app/api/search/route.ts` (628 lines)
3. `app/api/prometheus/route.ts` (500 lines)
4. `app/api/admin/route.ts` (158 lines — smaller, mostly fine after Sprint 2)

---

## Sprint 4 — Convert JSX Components to TSX (1–2 days)
*No logic changes. Add types, rename files.*

### Files to convert:
| Current | → | Target |
|---|---|---|
| `components/SMSPartnerMap.jsx` | → | `components/SMSPartnerMap.tsx` |
| `components/AnathemaPublicMap.jsx` | → | `components/AnathemaPublicMap.tsx` |
| `components/AmeriLifePartnerMap.jsx` | → | `components/AmeriLifePartnerMap.tsx` |
| `components/AnathemaInfectionMap.jsx` | → | `components/AnathemaInfectionMap.tsx` |
| `components/IntegrityPartnerMap.jsx` | → | `components/IntegrityPartnerMap.tsx` |

### For each file:
1. Rename `.jsx` → `.tsx`
2. Add a `Props` interface at the top
3. Type the component: `export default function XMap({ ... }: Props)`
4. Fix any type errors (usually just `any` annotations on map data)
5. Update the import in whatever page uses it (Next should resolve automatically but double-check)

---

## Sprint 5 — Split `lib/networks.ts` (half day)
*Currently 488 lines. Fine to split, zero logic change.*

```
lib/
  networks/
    integrity.ts    ← INTEGRITY_PARTNERS array
    amerilife.ts    ← AMERILIFE_PARTNERS array  
    sms.ts          ← SMS_PARTNERS array
    helpers.ts      ← getCandidatePartners(), matchPartnerByName()
    types.ts        ← NetworkPartner type
    index.ts        ← re-exports everything (so existing imports don't break)
```

`index.ts` should just be:
```ts
export * from './integrity'
export * from './amerilife'
export * from './sms'
export * from './helpers'
export * from './types'
```

Existing code that imports from `@/lib/networks` will keep working without any changes.

---

## Sprint 6 — App Router Group Cleanup (half day)
*Optional but makes the tree read as "enterprise clean." Zero URL changes.*

```
app/
  (marketing)/
    page.tsx          ← home
    about/
    faq/
    pricing/
    roadmap/
    philosophy/
    contact/
    terms/
    privacy/
    network/
    prometheus/
    anathema/
    socials/
  (app)/
    dashboard/
    sign-in/
    sign-up/
  api/              ← stays at root level (keep API routes simple)
```

Route groups (folders in parentheses) don't affect URLs in Next App Router. They're purely organizational. Verify each page still loads after moving.

---

## Sprint 7 — CI Pipeline (half day)
*Prevents "works on my machine" when an engineer joins.*

Create `.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run format:check
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run build
    env:
      # CI needs these to not crash build — use dummy values
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY }}
      CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}
      # ... add all required envs as GitHub secrets
```

---

## Sprint 8 — Supabase Type Generation (optional but valuable)
*Removes `SupabaseClient<any>`. You even noted this in your own docs.*

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
```

Then update `lib/supabase.server.ts`:
```ts
import { Database } from '@/types/supabase'
// createClient<Database>(...)
```

This gives you autocomplete on every table query and catches column name typos at compile time. Worth doing after the route refactor is stable.

---

## Execution Order (recommended)

| Sprint | What | When | Risk |
|---|---|---|---|
| 1 | Hygiene (prettier, .env.example, README) | Day 1 | Zero |
| 2 | Centralize auth + constants | Day 1–2 | Zero |
| 3 | Extract services from route files | Days 2–6 | Low (test after each file) |
| 4 | JSX → TSX components | Days 4–5 (parallel with 3) | Zero |
| 5 | Split networks.ts | Day 5 | Zero |
| 6 | App Router groups | Day 6 | Low (verify URLs) |
| 7 | CI pipeline | Day 6–7 | Zero |
| 8 | Supabase types | After all above | Low |

---

## "Is it still working?" Checklist (after each sprint)

- [ ] `npm run build` passes cleanly
- [ ] `npm run typecheck` passes
- [ ] Search flow works end-to-end (run a real search)
- [ ] Anathema scan runs and saves
- [ ] Prometheus scan runs and saves
- [ ] Admin route still returns 403 for non-admins
- [ ] Stripe checkout redirect works
- [ ] Dashboard loads for comped user without Stripe

---

## What to Hand an Engineer

When onboarding, give them:
1. This doc
2. The `docs/` folder (already solid)
3. `.env.example` (Sprint 1)
4. Sprint 3 as their first real task — extract one service module at a time, test after each

Tell them: **match the existing pattern before inventing a new one.** The patterns that are already there (server-only Supabase, Clerk auth at the top of every route, Upstash rate limiting) are intentional and should be extended, not replaced.
