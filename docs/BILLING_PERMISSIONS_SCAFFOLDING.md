# Recruiterrr — Billing, Permissions & Sub-Accounts
**InsuraSafe, LLC | Build Scaffolding | Draft**

---

## Overview

This document is the handoff spec for implementing tiered billing, per-user permissions enforcement, and sub-account (team seat) support. It is intentionally scoped to architecture and decisions — not implementation detail — so the next session can pick up without re-deriving the plan.

**What this build covers:**
- Stripe integration for subscription management
- Clerk metadata for plan/role storage
- Middleware-level permission enforcement per tier
- Sub-account model (Enterprise seats under a parent org)
- Supabase schema changes to support all of the above

**What this build does NOT cover:**
- UI for billing management (Stripe Customer Portal handles this)
- Dunning / failed payment flows (Stripe handles this)
- CSV export, CRM sync, or other feature builds (separate tickets)

---

## Tier Definitions

| Tier | Price | Stripe Product |
|---|---|---|
| FREE | $0 | `prod_free` (no Stripe subscription needed) |
| OPERATOR | $499.95/month | `prod_operator` |
| ENTERPRISE | $10,000/month | `prod_enterprise` |

### Entitlements

| Feature | FREE | OPERATOR | ENTERPRISE |
|---|---|---|---|
| Agent search | ✓ | ✓ | ✓ |
| Searches per month | 10 | 200 | Unlimited |
| Agents per search (max) | 10 | 50 | 50 |
| Full enrichment (YouTube, hiring) | ✗ | ✓ | ✓ |
| Search history retention | 30 days | Full | Full |
| Prometheus TCPA scanner | ✗ | ✓ | ✓ |
| Prometheus scans per month | 0 | 50 | Unlimited |
| Sub-accounts (team seats) | ✗ | ✗ | ✓ (up to 10) |
| White-label / data reuse rights | ✗ | ✗ | ✓ |
| Early feature access | ✗ | ✗ | ✓ |
| Priority support | ✗ | ✗ | ✓ |

---

## Architecture Decisions

### Where plan state lives

**Clerk `publicMetadata`** is the source of truth for the active session. Middleware reads this on every request — no database round-trip needed.

```ts
// Shape of clerk publicMetadata
{
  plan: 'free' | 'operator' | 'enterprise',
  role: 'owner' | 'member',           // for sub-accounts
  org_id: string | null,              // parent org clerk_id (Enterprise only)
  stripe_customer_id: string | null,
  stripe_subscription_id: string | null,
  subscription_status: 'active' | 'past_due' | 'canceled' | null,
}
```

Clerk metadata is set by the Clerk webhook handler when Stripe subscription events fire. The UI never writes directly to Clerk metadata.

### Why not Clerk Organizations

Clerk Organizations is the "correct" Clerk primitive for teams, but it adds significant complexity (org switching UI, org-scoped sessions, org JWT claims). For up to 10 seats at Enterprise, a simpler custom `org_id` field on each member's metadata is sufficient and avoids that overhead. Revisit if seat counts grow.

### Stripe webhook → Clerk metadata flow

```
Stripe event fires
  → /api/webhook/stripe (new route)
    → verify Stripe signature
    → identify clerk_id from stripe customer metadata
    → update Clerk user publicMetadata (plan, status)
    → update Supabase users table (denormalized for query use)
```

### Rate limiting integration

Current Upstash rate limiting uses a flat 10/hr window for all users. This needs to change to plan-aware limits. The rate limit key and window will be set based on `publicMetadata.plan` read at the start of each route handler.

---

## New Files to Create

```
app/
  api/
    webhook/
      stripe/
        route.ts          ← Stripe webhook handler (signature verify + metadata sync)
    billing/
      portal/
        route.ts          ← Creates Stripe Customer Portal session, redirects user
      checkout/
        route.ts          ← Creates Stripe Checkout session for plan upgrade
lib/
  plans.ts                ← Single source of truth for plan entitlements
  stripe.server.ts        ← Centralized Stripe client (server-only, mirrors supabase.server.ts)
  permissions.ts          ← Helper: getCurrentPlan(), assertPlan(), canAccessPrometheus(), etc.
```

---

## lib/plans.ts

Central entitlements config. Every permission check imports from here — no magic numbers scattered across routes.

```ts
export const PLANS = {
  free: {
    searchesPerMonth: 10,
    agentsPerSearch: 10,
    enrichmentEnabled: false,
    prometheusEnabled: false,
    prometheusScansPerMonth: 0,
    historyRetentionDays: 30,
    subAccountsEnabled: false,
    maxSeats: 1,
  },
  operator: {
    searchesPerMonth: 200,
    agentsPerSearch: 50,
    enrichmentEnabled: true,
    prometheusEnabled: true,
    prometheusScansPerMonth: 50,
    historyRetentionDays: null,     // null = unlimited
    subAccountsEnabled: false,
    maxSeats: 1,
  },
  enterprise: {
    searchesPerMonth: null,         // null = unlimited
    agentsPerSearch: 50,
    enrichmentEnabled: true,
    prometheusEnabled: true,
    prometheusScansPerMonth: null,  // null = unlimited
    historyRetentionDays: null,
    subAccountsEnabled: true,
    maxSeats: 10,
  },
} as const

export type Plan = keyof typeof PLANS
```

---

## Supabase Schema Changes

### Modify `users` table

```sql
ALTER TABLE users
  ADD COLUMN plan TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN stripe_customer_id TEXT,
  ADD COLUMN stripe_subscription_id TEXT,
  ADD COLUMN subscription_status TEXT,
  ADD COLUMN org_id TEXT,           -- clerk_id of the Enterprise owner (sub-accounts only)
  ADD COLUMN role TEXT NOT NULL DEFAULT 'owner';  -- 'owner' | 'member'
```

### Add `usage_monthly` table

Tracks per-user monthly usage for enforcement. Resets on billing cycle (handled by Stripe webhook on `invoice.paid`).

```sql
CREATE TABLE usage_monthly (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_id TEXT NOT NULL,
  period TEXT NOT NULL,             -- 'YYYY-MM' format
  search_count INTEGER DEFAULT 0,
  prometheus_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clerk_id, period)
);

-- RLS
ALTER TABLE usage_monthly ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own usage"
  ON usage_monthly FOR SELECT
  USING (auth.uid()::text = clerk_id);
```

### Add `org_members` table (Enterprise sub-accounts)

```sql
CREATE TABLE org_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id TEXT NOT NULL,             -- clerk_id of Enterprise owner
  member_clerk_id TEXT NOT NULL,
  invited_email TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, member_clerk_id)
);

ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org owners manage members"
  ON org_members FOR ALL
  USING (auth.uid()::text = org_id);

CREATE POLICY "Members read own record"
  ON org_members FOR SELECT
  USING (auth.uid()::text = member_clerk_id);
```

---

## Permission Enforcement Points

Every API route that gates on plan needs the same pattern:

```ts
// Inside any protected route handler
import { getPlan, assertFeature, checkMonthlyUsage } from '@/lib/permissions'

const plan = await getPlan(userId)                        // reads Clerk publicMetadata
assertFeature(plan, 'prometheusEnabled')                  // throws 403 if not entitled
await checkMonthlyUsage(userId, 'prometheus', plan)       // throws 429 if over limit
```

### Routes that need enforcement added

| Route | Check needed |
|---|---|
| `POST /api/search` | Plan-aware rate limit, agentsPerSearch cap, enrichment gate |
| `POST /api/prometheus` | prometheusEnabled gate, plan-aware rate limit |
| `GET /api/searches` | historyRetentionDays filter |
| `GET /api/prometheus` | historyRetentionDays filter |

---

## Stripe Setup Checklist

- [ ] Create Stripe products and prices for OPERATOR and ENTERPRISE
- [ ] Store price IDs in env: `STRIPE_OPERATOR_PRICE_ID`, `STRIPE_ENTERPRISE_PRICE_ID`
- [ ] Add Stripe env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- [ ] Register webhook endpoint in Stripe dashboard: `https://recruiterrr.com/api/webhook/stripe`
- [ ] Subscribe to events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`

---

## Stripe Webhook Events to Handle

| Event | Action |
|---|---|
| `customer.subscription.created` | Set plan in Clerk metadata + Supabase |
| `customer.subscription.updated` | Update plan (handles upgrades/downgrades) |
| `customer.subscription.deleted` | Revert user to `free` plan |
| `invoice.paid` | Reset monthly usage counters in `usage_monthly` |
| `invoice.payment_failed` | Set `subscription_status: 'past_due'` — block access on next request |

---

## Sub-Account Flow (Enterprise)

### Inviting a member

1. Enterprise owner hits new UI (to be built): "Invite team member"
2. Frontend calls new route: `POST /api/org/invite` with `{ email }`
3. Route checks: caller is Enterprise owner, seat count < 10
4. Creates record in `org_members` with `invited_email`
5. Sends invite email via Resend (already installed) with magic link or sign-up link
6. On new user sign-up: webhook detects `org_id` in invite, sets `publicMetadata.org_id` and `role: 'member'`, sets `plan: 'enterprise'`

### Member entitlements

Sub-account members inherit the parent org's plan entitlements. Usage counts against the **parent org's** monthly limits (not individual). This requires `checkMonthlyUsage` to look up `org_id` when present and aggregate.

### Removing a member

1. Owner calls `DELETE /api/org/members/:memberId`
2. Route deletes `org_members` record
3. Clerk metadata on member updated: `plan → 'free'`, `org_id → null`, `role → 'owner'`

---

## New Environment Variables Required

```env
# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_OPERATOR_PRICE_ID=
STRIPE_ENTERPRISE_PRICE_ID=

# Clerk (for server-side metadata writes via Clerk Backend API)
CLERK_SECRET_KEY=   # already exists — used for metadata writes too
```

---

## Pages to Build (UI — separate ticket)

- `/dashboard/billing` — Current plan, usage meters, upgrade/downgrade CTA, Stripe portal link
- `/dashboard/team` — Enterprise only: seat list, invite form, remove member (links to `org_members`)
- Upgrade prompts inline on Prometheus and search pages when feature is gated

---

## Open Decisions

| Decision | Options | Notes |
|---|---|---|
| Free tier — credit card required? | Yes / No | No friction = more signups. Yes = less abuse. |
| Operator overage handling | Hard cutoff vs. overage billing | Hard cutoff is simpler for v1 |
| Enterprise seat billing | Flat $10k regardless of seats vs. per-seat add-on | Flat is simpler, confirm with sales |
| Usage reset timing | Calendar month vs. billing anniversary | Billing anniversary (Stripe `invoice.paid`) is more correct |
| Sub-account usage pooling | Pool against parent org OR per-member limits | Pooled is simpler and better UX for small teams |

---

## Build Order (Suggested)

1. `lib/plans.ts` and `lib/stripe.server.ts` — foundation, no side effects
2. `lib/permissions.ts` — builds on plans.ts
3. Supabase schema migrations — `usage_monthly`, `org_members`, alter `users`
4. `POST /api/webhook/stripe` — core plumbing, testable with Stripe CLI
5. Enforcement in existing routes (`/api/search`, `/api/prometheus`)
6. `POST /api/billing/checkout` and `GET /api/billing/portal` — upgrade flow
7. `/dashboard/billing` page — basic usage meters + portal link
8. Sub-account routes (`/api/org/invite`, `/api/org/members`) — Enterprise only
9. `/dashboard/team` page — Enterprise seat management UI
