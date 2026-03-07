// ─── lib/domain/anathema/serp.ts ─────────────────────────────────────────────
// SERP intelligence for Anathema agent scans.
// Mirrors Prometheus's pattern exactly:
//   - 8 parallel targeted queries, all quoted with entity name
//   - isResultRelevant() filter applied BEFORE anything touches the AI
//   - Returns structured intel + debug trail
//
// This is the primary fix for false attachments — noisy unfiltered SERP was
// the root cause. Every result must mention the agent name or owner name
// before it's passed downstream.

export const AGENT_SERP_STOPWORDS = new Set([
  'insurance', 'agency', 'group', 'financial', 'services', 'associates',
  'advisors', 'advisor', 'partners', 'health', 'life', 'medicare', 'benefits',
  'solutions', 'general', 'national', 'american', 'united', 'independent',
  'brokerage', 'broker', 'planning', 'management', 'consulting', 'and', 'the',
  'agent', 'agents', 'senior', 'family', 'care', 'protect', 'secure',
])

export type AgentSerpDebugEntry = {
  query: string
  key: string
  results: Array<{ title: string; snippet: string; link: string }>
  signals_fired: string[]
}

export function buildAgentMatchTokens(
  agentName: string,
  ownerName: string | null,
  website: string | null,
): string[] {
  const nameTokens = agentName
    .toLowerCase()
    .split(/\s+/)
    .filter(t => t.length > 2 && !AGENT_SERP_STOPWORDS.has(t))

  const ownerTokens = ownerName
    ? ownerName.toLowerCase().split(/\s+/).filter(t => t.length > 2 && !AGENT_SERP_STOPWORDS.has(t))
    : []

  const domainToken = website
    ? [website.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0]]
    : []

  return [...new Set([...nameTokens, ...ownerTokens, ...domainToken])].filter(t => t.length > 2)
}

export function isAgentResultRelevant(
  r: { title: string; snippet: string; link: string },
  tokens: string[],
): boolean {
  if (tokens.length === 0) return true
  const hay = `${r.title} ${r.snippet} ${r.link}`.toLowerCase()
  const required = tokens.length <= 2 ? 1 : 2
  const matched = tokens.filter(t => hay.includes(t)).length
  return matched >= required
}

export async function fetchAgentSerpIntel(
  agentName: string,
  agentCity: string,
  agentState: string,
  ownerName: string | null,
  website: string | null,
  serpKey: string,
): Promise<{ intel: Record<string, string>; serpDebug: AgentSerpDebugEntry[] }> {
  // Quote the subject for all queries — prevents identity bleed
  const q  = `"${agentName}"`
  const qo = ownerName ? `"${ownerName}" OR "${agentName}"` : q
  const loc = [agentCity, agentState].filter(Boolean).join(' ')

  const matchTokens = buildAgentMatchTokens(agentName, ownerName, website)

  const queries: Array<{ key: string; q: string }> = [
    {
      key: 'reputation',
      q:   `${q} ${loc} review OR rating OR complaint OR BBB OR "Better Business Bureau"`,
    },
    {
      key: 'community',
      q:   `${qo} sponsor OR charity OR donation OR "community" OR award OR recognition OR "${agentCity}"`,
    },
    {
      key: 'professional',
      q:   `${qo} credential OR certification OR designation OR NAIFA OR AHIP OR association OR "licensed"`,
    },
    {
      key: 'social',
      q:   `${qo} site:facebook.com OR site:youtube.com OR site:instagram.com`,
    },
    {
      key: 'career',
      q:   `${qo} "previously" OR "formerly" OR "before" OR "career" OR "background" OR "started" OR "founded"`,
    },
    {
      key: 'production',
      q:   `${qo} award OR "top producer" OR leaderboard OR ranking OR "million dollar" OR recognition`,
    },
    {
      key: 'press',
      q:   `${qo} "${loc}" news OR feature OR spotlight OR announcement OR "local" OR press`,
    },
    {
      key: 'recruiting',
      q:   `${qo} hiring OR "join my team" OR "build your business" OR "looking for agents" OR "downline"`,
    },
  ]

  const intel: Record<string, string>     = {}
  const serpDebug: AgentSerpDebugEntry[]  = []

  await Promise.all(
    queries.map(async ({ key, q: query }) => {
      const debugEntry: AgentSerpDebugEntry = {
        query,
        key,
        results: [],
        signals_fired: [],
      }

      try {
        const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&num=8&api_key=${serpKey}`
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) })

        if (!res.ok) {
          debugEntry.signals_fired.push(`SERP failed: HTTP ${res.status}`)
          serpDebug.push(debugEntry)
          return
        }

        const data       = await res.json()
        const allResults = (data.organic_results || []).slice(0, 8)

        const relevantResults = allResults.filter((r: any) =>
          isAgentResultRelevant(
            { title: r.title || '', snippet: r.snippet || '', link: r.link || '' },
            matchTokens,
          ),
        )

        const noiseCount = allResults.length - relevantResults.length

        debugEntry.results = relevantResults.map((r: any) => ({
          title:   r.title   || '',
          snippet: r.snippet || '',
          link:    r.link    || '',
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
          debugEntry.signals_fired.push('No relevant results after filtering')
        }
      } catch (e: any) {
        debugEntry.signals_fired.push(`Error: ${e.message}`)
      }

      serpDebug.push(debugEntry)
    }),
  )

  return { intel, serpDebug }
}
