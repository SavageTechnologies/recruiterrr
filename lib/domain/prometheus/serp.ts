// ─── lib/domain/prometheus/serp.ts ───────────────────────────────────────────
// SERP intelligence fetcher for Prometheus scans.
// Runs 8 parallel queries and filters noise before passing to Claude.

import type { SerpDebugEntry } from './types'

// Generic insurance industry words that appear in almost every SERP result.
// Stripping these before token-matching prevents false positives.
export const SERP_STOPWORDS = new Set([
  'insurance', 'agency', 'group', 'financial', 'services', 'associates',
  'advisors', 'advisor', 'partners', 'health', 'life', 'medicare', 'benefits',
  'solutions', 'general', 'national', 'american', 'united', 'independent',
  'brokerage', 'broker', 'planning', 'management', 'consulting', 'and', 'the',
])

export function buildMatchTokens(fmoName: string, domain: string | null): string[] {
  const nameTokens = fmoName.toLowerCase()
    .split(/\s+/)
    .filter(t => t.length > 2 && !SERP_STOPWORDS.has(t))
  const domainToken = domain
    ? [domain.toLowerCase().replace(/^www\./, '').split('.')[0]]
    : []
  return [...new Set([...nameTokens, ...domainToken])].filter(t => t.length > 2)
}

export function isResultRelevant(
  r: { title: string; snippet: string; link: string },
  tokens: string[]
): boolean {
  if (tokens.length === 0) return true
  const hay = `${r.title} ${r.snippet} ${r.link}`.toLowerCase()
  const required = tokens.length <= 2 ? tokens.length : 2
  const matched = tokens.filter(t => hay.includes(t)).length
  return matched >= required
}

export async function fetchSerpIntel(fmoName: string, domain?: string | null): Promise<{ intel: Record<string, string>; serpDebug: SerpDebugEntry[] }> {
  const q = `"${fmoName}"`
  const matchTokens = buildMatchTokens(fmoName, domain || null)

  const queries = [
    { key: 'carriers',    q: `${q} carrier contracts agents appointed` },
    { key: 'complaints',  q: `${q} agent complaint problem experience` },
    { key: 'trips',       q: `${q} incentive trip 2025 2026 destination` },
    { key: 'news',        q: `${q} insurance acquisition partnership announcement 2024 2025` },
    { key: 'agent_voice', q: `${q} agent review site:reddit.com OR site:insuranceforums.net OR site:glassdoor.com` },
    { key: 'recruiting',  q: `${q} recruiting agents hiring grow downline join now` },
    { key: 'leadership',  q: `${q} CEO president founder owner director leadership team` },
    { key: 'technology',  q: `${q} CRM quoting platform technology tools software agents` },
  ]

  const intel: Record<string, string> = {}
  const serpDebug: SerpDebugEntry[] = []

  await Promise.all(queries.map(async ({ key, q }) => {
    const debugEntry: SerpDebugEntry = { query: q, key, results: [], signals_fired: [] }
    try {
      const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(q)}&num=8&api_key=${process.env.SERPAPI_KEY}`
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
      if (!res.ok) {
        debugEntry.signals_fired.push(`SERP failed: HTTP ${res.status}`)
        serpDebug.push(debugEntry)
        return
      }
      const data = await res.json()
      const allResults = (data.organic_results || []).slice(0, 8)

      const relevantResults = allResults.filter((r: any) => isResultRelevant(
        { title: r.title || '', snippet: r.snippet || '', link: r.link || '' },
        matchTokens
      ))
      const noiseCount = allResults.length - relevantResults.length

      debugEntry.results = relevantResults.map((r: any) => ({
        title: r.title || '',
        snippet: r.snippet || '',
        link: r.link || '',
      }))

      if (noiseCount > 0) {
        debugEntry.signals_fired.push(`Filtered ${noiseCount} irrelevant results`)
      }

      const snippets = relevantResults
        .map((r: any) => `${r.title}: ${r.snippet}`)
        .join('\n')

      if (snippets) {
        intel[key] = snippets
        debugEntry.signals_fired.push(`${relevantResults.length} relevant results passed to analysis`)
      } else {
        debugEntry.signals_fired.push('No relevant results found')
      }
    } catch (e: any) {
      debugEntry.signals_fired.push(`Error: ${e.message}`)
    }
    serpDebug.push(debugEntry)
  }))

  return { intel, serpDebug }
}
