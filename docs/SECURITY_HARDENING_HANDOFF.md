# Recruiterrr — Security Hardening Handoff
**InsuraSafe, LLC | Confidential | February 25, 2026**

---

## Executive Summary

Architecture is modern and clean. Right tools are in place. The gaps are implementation-level hardening that every founder-stage SaaS has before the security pass.

**Overall Grade: B-**

| Area | Grade |
|---|---|
| Auth | B |
| Data Layer / RLS | B- |
| API Security | C+ |
| AI Abuse Control | C |
| Cost Protection | C |
| Security Headers | D |
| Webhook Hardening | ? (needs confirmation) |
| **Overall** | **B-** |

**Current state:** Protected against casual abuse. Not yet protected against targeted abuse, AI cost exploitation, RLS bypass, or webhook spoofing.

**Target state:** B- → A. P0 alone gets you to B+. P0 + P1 gets you to A-.

---

## P0 — Fix Immediately

### 1. Server/Client Boundary — Env Leak Risk

**Risk:** Secret env vars referenced directly in API routes without a centralized guard. If any file is accidentally marked `use client` or imported into a shared utility, `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `SERPAPI_KEY` could be exposed in client bundles.

**Affected files:**
- `app/api/prometheus/route.ts`
- `app/api/search/route.ts`
- `app/api/searches/route.ts`
- `app/api/webhook/clerk/route.ts`
- `app/dashboard/page.tsx`

**Fix — create `lib/env.server.ts`:**

```ts
if (typeof window !== 'undefined') {
  throw new Error('env.server.ts imported in client bundle');
}

export const env = {
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY!,
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  SERPAPI_KEY: process.env.SERPAPI_KEY!,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY!,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL!,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN!,
};
```

Then replace all direct `process.env` references in API routes with imports from this module. Optionally add `server-only` as a dev dependency for a compile-time guard.

---

### 2. Supabase RLS — Full Audit Required

**Risk:** The `searches` and `users` tables have not been confirmed as properly secured. Any table without RLS is a direct data exfiltration vector — any authenticated user could read another user's data.

**Run this audit:**

```sql
-- Check RLS status on all tables
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname IN ('users', 'searches', 'prometheus_scans');

-- Check all policies
SELECT tablename, policyname, cmd, roles, qual
FROM pg_policies
WHERE tablename IN ('users', 'searches', 'prometheus_scans');
```

**Required policy pattern for `searches` table:**

```sql
ALTER TABLE searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own searches"
  ON searches FOR SELECT
  USING (auth.uid()::text = clerk_id);

CREATE POLICY "Users insert own searches"
  ON searches FOR INSERT
  WITH CHECK (auth.uid()::text = clerk_id);
```

Apply same pattern to `users` table. `prometheus_scans` is already secured.

---

### 3. Clerk Webhook Signature Verification

**Risk:** If `app/api/webhook/clerk/route.ts` does not verify the svix signature on every request, anyone can spoof Clerk events — creating fake users, triggering fake signups, or corrupting user records.

**Required implementation:**

```ts
import { Webhook } from 'svix';

export async function POST(req: NextRequest) {
  const payload = await req.text(); // raw body — MUST use text() not json()
  const headers = {
    'svix-id': req.headers.get('svix-id') ?? '',
    'svix-timestamp': req.headers.get('svix-timestamp') ?? '',
    'svix-signature': req.headers.get('svix-signature') ?? '',
  };

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  let event;
  try {
    event = wh.verify(payload, headers);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Process event...
}
```

---

### 4. AI Cost Abuse Protection

**Risk:** Prometheus scan and agent search routes are potential cost drains. A single script could exhaust Anthropic and SerpAPI budgets. Upstash is installed but not applied to all AI routes.

**Add to `/api/prometheus/route.ts`:**

```ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'),
});

// Inside handler:
const { success } = await ratelimit.limit(userId);
if (!success) {
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
}
```

**Also add input length validation before any API call:**

```ts
const { domain } = await req.json();
if (!domain || typeof domain !== 'string' || domain.length > 253) {
  return NextResponse.json({ error: 'Invalid domain' }, { status: 400 });
}
```

---

## P1 — Important Improvements

### 5. Security Headers

No security headers are currently configured. Add to `next.config.mjs`:

```js
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://clerk.com;" },
];

export default {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  }
}
```

---

### 6. API Input Validation with Zod

API routes currently trust request body shape without validation. Install Zod and add schema validation to every route:

```ts
import { z } from 'zod';

const SearchSchema = z.object({
  city: z.string().min(1).max(100),
  state: z.string().length(2),
  mode: z.enum(['all', 'medicare', 'life', 'aca']),
  limit: z.number().int().min(10).max(50),
});

const body = await req.json();
const parsed = SearchSchema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
}
```

---

### 7. Error Response Hardening

Never return raw error messages, stack traces, or DB errors to the client:

```ts
// ❌ WRONG
return NextResponse.json({ error: err.message }, { status: 500 });

// ✅ CORRECT
console.error('Route error:', err); // log internally only
return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
```

---

### 8. Logging Hygiene

Audit all `console.log` and `console.error` calls in API routes:

- Never log full request bodies
- Never log API keys or tokens (even partially)
- Never log raw Supabase errors that may contain SQL
- Never log user PII
- Prefix logs with route identifier for traceability

---

## P2 — Strong Improvements

### 9. Dependency Audit

```bash
npm audit
npm audit fix
```

Enable Dependabot in GitHub Settings → Security to automatically flag new vulnerabilities. Ensure `package-lock.json` is committed.

---

### 10. Rate Limiting Scope

Confirm Upstash rate limiting covers every write and AI route:

| Route | Limit |
|---|---|
| `POST /api/search` | 10/hr per user (existing) |
| `POST /api/prometheus` | 10/hr per user (add) |
| `POST /api/webhook/clerk` | 100/hr per IP (add) |
| Any future email routes | 5/hr per user |

---

### 11. Usage Monitoring & Cost Guardrails

```sql
CREATE TABLE usage_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'search' | 'prometheus_scan'
  cost_estimate DECIMAL(8,4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

As an immediate stopgap: set $50/month spend alerts in both the Anthropic dashboard and SerpAPI dashboard today, before any code changes.

---

## Threat Model

| Attack Vector | Method | Current Risk |
|---|---|---|
| AI Token Drain | Script AI endpoints in a loop | HIGH |
| RLS Bypass | Crafted Supabase requests | MEDIUM |
| Webhook Spoofing | Fake Clerk events without sig check | HIGH |
| Service Role Key Leak | Client bundle exposure | MEDIUM |
| Rate Limit Bypass | IP rotation across Upstash window | MEDIUM |
| Input Injection | Malformed JSON to Supabase queries | LOW |

---

## Hardening Checklist

### P0
- [ ] Create `lib/env.server.ts` with runtime guard
- [ ] Replace all direct `process.env` references in API routes
- [ ] Run RLS audit SQL on `searches` and `users` tables
- [ ] Add RLS policies to `searches` table
- [ ] Confirm Clerk webhook svix signature verification is implemented
- [ ] Add Upstash rate limiting to `/api/prometheus`
- [ ] Add input length + type validation to all routes

### P1
- [ ] Add security headers to `next.config.mjs`
- [ ] Install Zod, add schema validation to every API route
- [ ] Harden all error responses to return generic messages only
- [ ] Audit and clean all `console.log` statements in API routes

### P2
- [ ] Run `npm audit` and resolve high/critical findings
- [ ] Enable Dependabot on GitHub repo
- [ ] Expand Upstash rate limiting to webhook and all AI routes
- [ ] Create `usage_events` table in Supabase
- [ ] Set $50/mo spend alerts in Anthropic and SerpAPI dashboards today
