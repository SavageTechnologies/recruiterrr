// ─── lib/domain/prometheus/discovery.ts ──────────────────────────────────────
// Website discovery for Prometheus scans.
// Given an FMO name, finds their official website via SERP with domain scoring.

import type { SerpDebugEntry } from './types'

export const REJECT_DOMAINS = [
  'linkedin.com', 'facebook.com', 'twitter.com', 'instagram.com',
  'wikipedia.org', 'investopedia.com', 'indeed.com', 'glassdoor.com',
  'yelp.com', 'bbb.org', 'bloomberg.com', 'reuters.com', 'wsj.com',
  'businesswire.com', 'prnewswire.com', 'businessinsider.com',
  'insurancenewsnet.com', 'insurancejournal.com', 'lifehealthpro.com',
]

export function normalizeUrl(url: string): string {
  let u = url.trim().toLowerCase()
  if (!u.startsWith('http')) u = `https://${u}`
  try {
    const parsed = new URL(u)
    return `${parsed.protocol}//${parsed.hostname}`
  } catch {
    return `https://${u.replace(/^https?:\/\//, '').split('/')[0]}`
  }
}

export async function discoverWebsite(fmoName: string): Promise<{ url: string | null; debug: SerpDebugEntry }> {
  const query = `${fmoName} insurance FMO IMO official website`
  const debugEntry: SerpDebugEntry = { query, key: 'website_discovery', results: [], signals_fired: [] }

  try {
    const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&num=8&api_key=${process.env.SERPAPI_KEY}`
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
    if (!res.ok) return { url: null, debug: debugEntry }

    const data = await res.json()
    const results = data.organic_results || []

    debugEntry.results = results.slice(0, 8).map((r: any) => ({
      title: r.title || '',
      snippet: r.snippet || '',
      link: r.link || '',
    }))

    const nameTokens = fmoName.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(t => t.length > 2 && !['fmo', 'imo', 'the', 'and', 'for', 'insurance', 'group', 'inc', 'llc'].includes(t))

    type Scored = { link: string; domain: string; score: number; reason: string }
    const scored: Scored[] = []

    for (const r of results) {
      if (!r.link) continue
      try {
        const parsed = new URL(r.link)
        const hostname = parsed.hostname.replace('www.', '')
        if (REJECT_DOMAINS.some(d => hostname.includes(d))) continue

        const domainRoot = hostname.split('.')[0]
        const domainClean = domainRoot.replace(/[^a-z0-9]/g, '')

        let score = 0
        let reason = ''

        const matchedTokens = nameTokens.filter(t => domainClean.includes(t))
        if (matchedTokens.length === nameTokens.length) {
          score = 100
          reason = `Exact match: all tokens [${matchedTokens.join(', ')}] in domain`
        } else if (matchedTokens.length >= 2) {
          score = 70
          reason = `Strong match: [${matchedTokens.join(', ')}] in domain`
        } else if (matchedTokens.length === 1 && nameTokens.length <= 2) {
          score = 40
          reason = `Partial match: [${matchedTokens[0]}] in domain`
        } else if (matchedTokens.length === 1) {
          score = 20
          reason = `Weak match: only [${matchedTokens[0]}] in domain`
        }

        if (score > 0 && results.indexOf(r) === 0) score += 10

        if (score > 0) {
          scored.push({ link: r.link, domain: hostname, score, reason })
        }
      } catch {}
    }

    scored.sort((a, b) => b.score - a.score)

    if (scored.length > 0 && scored[0].score >= 40) {
      debugEntry.signals_fired.push(`Selected domain: ${scored[0].domain} (score ${scored[0].score} — ${scored[0].reason})`)
      return { url: normalizeUrl(scored[0].domain), debug: debugEntry }
    }

    debugEntry.signals_fired.push('No confident domain match found — scan will rely on SERP intel only')
    return { url: null, debug: debugEntry }

  } catch {
    debugEntry.signals_fired.push('Website discovery failed — SERP error')
    return { url: null, debug: debugEntry }
  }
}
