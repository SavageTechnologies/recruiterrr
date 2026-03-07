// ─── serp.ts ──────────────────────────────────────────────────────────────────
// Fetches raw agent listings from SerpAPI google_local.
// Deduplicates across queries and filters to the correct state.

import { MODE_CONFIG } from './config'

const STATE_FULL: Record<string, string> = {
  'AL':'Alabama','AK':'Alaska','AZ':'Arizona','AR':'Arkansas','CA':'California',
  'CO':'Colorado','CT':'Connecticut','DE':'Delaware','FL':'Florida','GA':'Georgia',
  'HI':'Hawaii','ID':'Idaho','IL':'Illinois','IN':'Indiana','IA':'Iowa',
  'KS':'Kansas','KY':'Kentucky','LA':'Louisiana','ME':'Maine','MD':'Maryland',
  'MA':'Massachusetts','MI':'Michigan','MN':'Minnesota','MS':'Mississippi','MO':'Missouri',
  'MT':'Montana','NE':'Nebraska','NV':'Nevada','NH':'New Hampshire','NJ':'New Jersey',
  'NM':'New Mexico','NY':'New York','NC':'North Carolina','ND':'North Dakota','OH':'Ohio',
  'OK':'Oklahoma','OR':'Oregon','PA':'Pennsylvania','RI':'Rhode Island','SC':'South Carolina',
  'SD':'South Dakota','TN':'Tennessee','TX':'Texas','UT':'Utah','VT':'Vermont',
  'VA':'Virginia','WA':'Washington','WV':'West Virginia','WI':'Wisconsin','WY':'Wyoming',
  'DC':'District of Columbia',
}

export async function fetchAgentsFromSerp(
  city: string,
  state: string,
  limit: number,
  mode: string,
  query: string = '',
): Promise<any[]> {
  const cfg = MODE_CONFIG[mode] || MODE_CONFIG.medicare
  const cityPrefix = city.trim()

  const baseQueries = query.trim()
    ? [
      `${query.trim()} ${cityPrefix}`,
      `${query.trim()} insurance agent ${cityPrefix}`,
      `${query.trim()} broker ${cityPrefix}`,
      `${query.trim()} independent agent ${cityPrefix}`,
    ]
    : cfg.queries.map(q => `${q} ${cityPrefix}`)

  const stateAbbr = state.trim().toUpperCase()
  const stateFull = STATE_FULL[stateAbbr] || state
  const locationParam = encodeURIComponent(`${city}, ${stateFull}, United States`)

  const seen = new Set<string>()
  const results: { item: any; queryRank: number }[] = []

  await Promise.all(baseQueries.map(async (q, queryIndex) => {
    try {
      const url = `https://serpapi.com/search.json?engine=google_local&q=${encodeURIComponent(q)}&location=${locationParam}&hl=en&gl=us&api_key=${process.env.SERPAPI_KEY}`
      const res = await fetch(url)
      if (!res.ok) return
      const data = await res.json()
      for (const [resultIndex, item] of (data.local_results || []).entries()) {
        const addr = (item.address || '').toLowerCase()
        const stateLower = state.toLowerCase()
        const stateMatch =
          addr.includes(`, ${stateLower}`) || addr.includes(` ${stateLower}`) ||
          addr.endsWith(stateLower) || addr.includes(`, ${stateAbbr.toLowerCase()}`) ||
          addr.match(new RegExp(`\\b${stateAbbr.toLowerCase()}\\b`)) ||
          addr.match(new RegExp(`,\\s*${stateAbbr.toLowerCase()}\\s*(\\d{5})?$`))
        if (!item.address || item.address.length <= 5) continue
        if (!stateMatch) continue
        const key = item.title + item.address
        if (!seen.has(key)) {
          seen.add(key)
          item.website = item.links?.website || null
          // Rank: primary query (index 0) results lead; within a query,
          // Google's own order is preserved. Caller applies limit after scoring.
          results.push({ item, queryRank: queryIndex * 1000 + resultIndex })
        }
      }
    } catch {}
  }))

  // Sort by query rank so result set is deterministic across runs,
  // regardless of which parallel fetch finished first.
  results.sort((a, b) => a.queryRank - b.queryRank)
  return results.map(r => r.item)
}
