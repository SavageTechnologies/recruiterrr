// ─── lib/fetch.ts ─────────────────────────────────────────────────────────────
// Shared safe fetch utilities.
//
// - validateExternalUrl: blocks SSRF targets (private IPs, localhost, metadata endpoints)
// - safeFetch: drop-in fetch() replacement with timeout, user-agent, and SSRF protection
// - extractPageText: strips HTML and truncates — use instead of inline regex chains

// ─── SSRF BLOCKLIST ───────────────────────────────────────────────────────────

const BLOCKED_HOSTS = new Set([
  'localhost',
  '0.0.0.0',
  '169.254.169.254', // AWS/GCP/Azure metadata
  'metadata.google.internal',
  '100.100.100.200', // Alibaba Cloud metadata
])

// Matches private IPv4 ranges: 10.x, 172.16-31.x, 192.168.x
const PRIVATE_IP_RE = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/

/**
 * Returns true if the URL is safe to fetch externally.
 * Blocks: private IPs, localhost, link-local, .local domains, metadata endpoints.
 */
export function validateExternalUrl(url: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) return false

  const host = parsed.hostname.toLowerCase()

  if (BLOCKED_HOSTS.has(host)) return false
  if (host.endsWith('.local')) return false
  if (PRIVATE_IP_RE.test(host)) return false

  // IPv6 loopback / link-local
  if (host === '[::1]' || host.startsWith('[fe80:')) return false

  return true
}

// ─── SAFE FETCH ───────────────────────────────────────────────────────────────

interface SafeFetchOptions extends RequestInit {
  timeoutMs?: number
}

/**
 * Fetch wrapper that:
 * - Validates the URL against SSRF targets before sending
 * - Applies a configurable timeout (default 8s)
 * - Sets a consistent User-Agent header
 * - Follows redirects by default
 *
 * Throws if the URL fails validation. Returns the Response on success.
 */
export async function safeFetch(url: string, options: SafeFetchOptions = {}): Promise<Response> {
  if (!validateExternalUrl(url)) {
    throw new Error(`[safeFetch] URL blocked by SSRF policy: ${url}`)
  }

  const { timeoutMs = 8000, ...rest } = options

  return fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Recruiterrr/1.0)',
      ...(rest.headers ?? {}),
    },
    signal: AbortSignal.timeout(timeoutMs),
    redirect: 'follow',
    ...rest,
  })
}

// ─── HTML → PLAIN TEXT ────────────────────────────────────────────────────────

/**
 * Strips scripts, styles, and HTML tags from a raw HTML string.
 * Collapses whitespace and truncates to maxChars.
 */
export function extractPageText(html: string, maxChars = 6000): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxChars)
}

// ─── CONVENIENCE: FETCH + EXTRACT ─────────────────────────────────────────────

/**
 * Fetches a URL with safeFetch and returns extracted plain text.
 * Returns '' on any error (network, timeout, SSRF block, non-2xx).
 * Streams up to 400KB before stopping to avoid memory blowout.
 */
export async function fetchPageText(url: string, maxChars = 6000, timeoutMs = 8000): Promise<string> {
  try {
    const res = await safeFetch(url, { timeoutMs })
    if (!res.ok) return ''

    const reader = res.body?.getReader()
    if (!reader) return ''

    let html = ''; let bytes = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      bytes += value.length
      html += new TextDecoder().decode(value)
      if (bytes > 400_000) { reader.cancel(); break }
    }

    return extractPageText(html, maxChars)
  } catch {
    return ''
  }
}
