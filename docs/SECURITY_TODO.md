# Security TODO — Recruiterrr

Based on third-party audit. Fix in order of priority.

---

## P0 — Fix Immediately

### 1. Rename proxy.ts → middleware.ts

**File:** `proxy.ts` (repo root)
**Risk:** Dashboard route protection is not running at all. `/dashboard/*` is effectively public.

**Fix:** Simply rename the file.
```bash
mv proxy.ts middleware.ts
```
Then sign out and confirm `recruiterrr.com/dashboard` redirects to sign-in.

---

### 2. CSRF Protection on POST /api/search

**File:** `app/api/search/route.ts`
**Risk:** A malicious site could trigger a logged-in user's browser to POST to `/api/search`, burning SerpAPI credits, Anthropic tokens, and Supabase writes on your dime.

**Fix:** Add an Origin check at the top of the POST handler:

```typescript
export async function POST(req: NextRequest) {
  // CSRF check
  const origin = req.headers.get('origin')
  const allowed = ['https://recruiterrr.com', 'http://localhost:3000']
  if (!origin || !allowed.includes(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId } = await auth()
  // ... rest of handler unchanged
}
```

Do the same in `app/api/searches/route.ts`.

---

### 3. Move Invite Gate Server-Side

**File:** `app/sign-up/[[...sign-up]]/page.tsx`
**Risk:** `NEXT_PUBLIC_INVITE_CODE` is visible in the browser. The hardcoded fallback `'HEARTLAND2026'` means anyone who reads the source can bypass the gate entirely.

**Best fix — use Clerk's built-in controls (no code needed):**
- Go to Clerk Dashboard → User & Authentication → Restrictions
- Enable **Waitlist** mode OR set an **email domain allowlist**
- This blocks signups at the Clerk level, before your app is even involved

**Alternative — server-side code check:**
Create `app/api/verify-invite/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const { code } = await req.json()
  const valid = code?.trim().toUpperCase() === process.env.INVITE_CODE?.toUpperCase()
  if (!valid) return NextResponse.json({ error: 'Invalid code' }, { status: 403 })

  // Set a short-lived signed cookie
  const cookieStore = await cookies()
  cookieStore.set('invite_verified', 'true', {
    httpOnly: true,
    secure: true,
    maxAge: 60 * 60, // 1 hour
    sameSite: 'strict',
  })
  return NextResponse.json({ ok: true })
}
```
Change env var from `NEXT_PUBLIC_INVITE_CODE` to `INVITE_CODE` (no NEXT_PUBLIC prefix — stays server-side).
Update sign-up page to call this API route instead of comparing locally.

---

## P1 — Fix This Week

### 4. Harden fetchWebsiteText() Against SSRF

**File:** `app/api/search/route.ts` → `fetchWebsiteText()`
**Risk:** We fetch arbitrary URLs from SERP results. A crafted listing could point to internal IPs, metadata endpoints, or return enormous responses that exhaust memory.

**Fix:** Replace the current `fetchWebsiteText` function with this hardened version:

```typescript
const BLOCKED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '169.254.169.254', '::1']

async function fetchWebsiteText(rawUrl: string): Promise<string> {
  try {
    const parsed = new URL(rawUrl)

    // Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) return ''

    // Block internal/metadata hosts
    if (BLOCKED_HOSTS.some(h => parsed.hostname === h || parsed.hostname.endsWith('.local'))) return ''

    // Block private IP ranges (basic check)
    const ip = parsed.hostname
    if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(ip)) return ''

    const res = await fetch(rawUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Recruiterrr/1.0)' },
      signal: AbortSignal.timeout(5000),
      redirect: 'follow',
    })

    // Cap response size — read max 500KB
    const reader = res.body?.getReader()
    if (!reader) return ''
    let html = ''
    let bytes = 0
    const MAX = 500_000
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      bytes += value.length
      html += new TextDecoder().decode(value)
      if (bytes > MAX) { reader.cancel(); break }
    }

    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 3000)
  } catch { return '' }
}
```

---

### 5. Centralize Supabase Client Behind server-only

**Files:** `app/api/search/route.ts`, `app/api/searches/route.ts`, `app/api/webhook/clerk/route.ts`, `app/dashboard/page.tsx`
**Risk:** Service role key bypasses all RLS. If it ever leaks into a client bundle, it's game over.

**Fix:** Create `lib/supabase.ts`:
```typescript
import 'server-only'
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

Then in each route file, replace:
```typescript
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(...)
```
With:
```typescript
import { supabase } from '@/lib/supabase'
```

The `server-only` import will throw a build error if this ever gets imported into a client component — a hard safety net.

---

## P2 — Fix Before Public Launch

### 6. Webhook Replay Protection

**File:** `app/api/webhook/clerk/route.ts`
**Risk:** No deduplication — the same event could be processed twice.

**Fix:** Use your existing Upstash Redis to store processed `svix-id` values for 30 minutes:

```typescript
import { Redis } from '@upstash/redis'
const redis = Redis.fromEnv()

// Inside the POST handler, after signature verification:
const eventKey = `webhook:${svix_id}`
const already = await redis.get(eventKey)
if (already) return NextResponse.json({ received: true }) // already processed

await redis.set(eventKey, '1', { ex: 1800 }) // expire after 30 min
```

---

### 7. Handle user.deleted in Webhook

**File:** `app/api/webhook/clerk/route.ts`
**Risk:** Deleted Clerk users remain in your Supabase users table indefinitely.

**Fix:** Add a handler alongside the existing `user.created` and `user.updated`:
```typescript
if (type === 'user.deleted') {
  await supabase.from('users').delete().eq('clerk_id', data.id)
  await supabase.from('searches').delete().eq('clerk_id', data.id)
}
```

---

### 8. Add Security Headers via next.config.ts

**File:** `next.config.ts`
**Risk:** No HSTS, CSP, or clickjacking protection.

**Fix:** Add headers config:
```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ]
  },
}
export default nextConfig
```
CSP can come later once you've inventoried all external resources (Google Fonts, SerpAPI, Clerk, Supabase, CDN for maps).

---

## Low Priority / Housekeeping

- **Self-host the TopoJSON** — USMap pulls from `cdn.jsdelivr.net` at runtime. Download the file and put it in `/public` so you control it.
- **Wrap Supabase writes in try/catch** in webhook handler — currently fails silently.
- **Remove unused default SVGs** from `/public` — `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`.
- **Delete proxy.ts** after renaming to middleware.ts — don't leave both files in the repo.

---

## Fix Order Summary

| Priority | Item | Effort |
|---|---|---|
| P0 | Rename proxy.ts → middleware.ts | 1 min |
| P0 | CSRF origin check on POST /api/search | 10 min |
| P0 | Move invite gate to Clerk dashboard (waitlist mode) | 5 min |
| P1 | Harden fetchWebsiteText() | 20 min |
| P1 | Centralize Supabase client with server-only | 15 min |
| P2 | Webhook replay protection | 20 min |
| P2 | Handle user.deleted | 10 min |
| P2 | Security headers in next.config.ts | 10 min |
